import { json, text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import {
	getWorkspaceIdFromCookie,
	validateWorkspaceMembership,
	hasOwnerOrAdminRole
} from '$lib/supabase/workspace';

// Known RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'yi', 'ji'];

/**
 * Parse CSV line (handles quoted fields)
 */
function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let currentField = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				currentField += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			// Field separator
			fields.push(currentField);
			currentField = '';
		} else {
			currentField += char;
		}
	}
	fields.push(currentField); // Add last field

	return fields;
}

/**
 * Parse CSV content
 */
function parseCsv(content: string): string[][] {
	const lines = content.split(/\r?\n/).filter((line) => line.trim());
	return lines.map(parseCsvLine);
}

interface ImportResult {
	keys_to_create: number;
	keys_to_update: number;
	translations_to_upsert: number;
	rows_skipped: number;
	skipped_reasons: Array<{ row: number; reason: string }>;
}

export const POST: RequestHandler = async (event) => {
	const supabase = createClient(event);

	if (!supabase) {
		return text('Supabase not configured', { status: 503 });
	}

	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) {
		return text('Unauthorized', { status: 401 });
	}

	// Get workspace from cookie and validate
	const workspaceId = getWorkspaceIdFromCookie(event);
	const validation = await validateWorkspaceMembership(supabase, workspaceId, session.user.id);

	if (!validation.valid || !validation.workspaceId) {
		return text(validation.error || 'No workspace selected', { status: validation.error?.includes('selected') ? 400 : 403 });
	}
	const validatedWorkspaceId = validation.workspaceId;

	// Check if user is owner/admin (required for import)
	const isOwnerOrAdmin = await hasOwnerOrAdminRole(supabase, workspaceId, session.user.id);
	if (!isOwnerOrAdmin) {
		return text('Only workspace owners and admins can import translations', { status: 403 });
	}

	const formData = await event.request.formData();
	const file = formData.get('file') as File;
	const policy = (formData.get('policy') as string) || 'fill-missing';
	const isPreview = formData.get('preview') === 'true';
	const columnMappingJson = formData.get('columnMapping') as string | null;

	if (!file) {
		return text('No file provided', { status: 400 });
	}

	if (policy !== 'overwrite' && policy !== 'fill-missing') {
		return text('Invalid conflict policy', { status: 400 });
	}

	// Parse column mapping if provided
	let columnMapping: {
		key: number | null;
		module: number | null;
		type: number | null;
		screen: number | null;
		context: number | null;
		screenshot_ref: number | null;
		max_chars: number | null;
		languages: Record<string, number>;
	} | null = null;

	if (columnMappingJson) {
		try {
			const parsed = JSON.parse(columnMappingJson);
			// Validate mapping
			if (parsed.key === null || parsed.key === undefined) {
				return text('Key column mapping is required', { status: 400 });
			}
			if (!parsed.languages || Object.keys(parsed.languages).length === 0) {
				return text('At least one language column must be mapped', { status: 400 });
			}
			columnMapping = parsed;
		} catch (error) {
			return text('Invalid column mapping JSON', { status: 400 });
		}
	}

	try {
		const fileContent = await file.text();
		const rows = parseCsv(fileContent);

		if (rows.length === 0) {
			return text('CSV file is empty', { status: 400 });
		}

		const headerRow = rows[0];
		const dataRows = rows.slice(1);

		let languageColumns: string[] = [];

		// If column mapping is provided, use it; otherwise use fixed format (backward compatibility)
		if (columnMapping) {
			// Extract language codes from mapping
			languageColumns = Object.keys(columnMapping.languages);
		} else {
			// Legacy fixed format: key, module, type, screen, context, screenshot_ref, max_chars, ...language codes
			const expectedColumns = ['key', 'module', 'type', 'screen', 'context', 'screenshot_ref', 'max_chars'];
			languageColumns = headerRow.slice(expectedColumns.length);

			// Validate header for legacy format
			for (let i = 0; i < expectedColumns.length; i++) {
				if (headerRow[i]?.toLowerCase() !== expectedColumns[i]) {
					return text(`Invalid CSV header. Expected "${expectedColumns[i]}" at column ${i + 1}`, { status: 400 });
				}
			}
		}

		// Get or create languages
		const languageMap = new Map<string, string>(); // code -> id
		for (const rawCode of languageColumns) {
			const langCode = (rawCode || '').toString().trim();
			if (!langCode) continue;

			// Check if language exists
			const { data: existingLang } = await supabase
				.from('i18n_languages')
				.select('id')
				.eq('workspace_id', validatedWorkspaceId)
				.eq('code', langCode)
				.single();

			if (existingLang) {
				languageMap.set(langCode, existingLang.id);
			} else {
				// Create language
				const isRtl = RTL_LANGUAGES.includes(langCode.toLowerCase());
				const { data: newLang, error: createError } = await supabase
					.from('i18n_languages')
					.insert({
						workspace_id: validatedWorkspaceId,
						code: langCode,
						name: langCode.toUpperCase(),
						is_rtl: isRtl
					})
					.select()
					.single();

				if (createError) {
					console.error('Error creating language:', createError);
					return text(`Failed to create language: ${langCode}`, { status: 500 });
				}

				languageMap.set(langCode, newLang.id);
			}
		}

		// Get existing keys for workspace
		const { data: existingKeys } = await supabase
			.from('i18n_keys')
			.select('id, key')
			.eq('workspace_id', validatedWorkspaceId);

		const existingKeyMap = new Map<string, string>(); // key -> id
		for (const key of existingKeys || []) {
			existingKeyMap.set(key.key, key.id);
		}

		// Get existing translations (for fill-missing policy)
		const existingTranslations = new Map<string, Map<string, string>>(); // key_id -> language_id -> value
		if (policy === 'fill-missing' && existingKeys) {
			const keyIds = existingKeys.map((k) => k.id);
			const { data: translations } = await supabase
				.from('i18n_translations')
				.select('key_id, language_id, value')
				.in('key_id', keyIds);

			for (const trans of translations || []) {
				if (!existingTranslations.has(trans.key_id)) {
					existingTranslations.set(trans.key_id, new Map());
				}
				existingTranslations.get(trans.key_id)!.set(trans.language_id, trans.value || '');
			}
		}

		const result: ImportResult = {
			keys_to_create: 0,
			keys_to_update: 0,
			translations_to_upsert: 0,
			rows_skipped: 0,
			skipped_reasons: []
		};

		const keysToCreate: any[] = [];
		const keysToUpdate: Array<{ id: string; data: any }> = [];
		const translationsToUpsert: any[] = [];

		// Helper function to get value from row using mapping
		function getValue(row: string[], columnIndex: number | null): string | null {
			if (columnIndex === null || columnIndex === undefined) return null;
			if (columnIndex < 0 || columnIndex >= row.length) return null;
			const value = row[columnIndex]?.trim();
			return value || null;
		}

		// Process data rows
		for (let i = 0; i < dataRows.length; i++) {
			const row = dataRows[i];
			const rowNum = i + 2; // +2 because header is row 1, and we're 0-indexed

			// Extract values using mapping or fixed positions
			let keyValue: string;
			let moduleValue: string | null = null;
			let typeValue: string | null = null;
			let screenValue: string | null = null;
			let contextValue: string | null = null;
			let screenshotRefValue: string | null = null;
			let maxCharsValue: number | null = null;

			if (columnMapping) {
				// Use column mapping
				const keyVal = getValue(row, columnMapping.key);
				if (!keyVal) {
					result.rows_skipped++;
					result.skipped_reasons.push({
						row: rowNum,
						reason: 'Key field is empty or missing'
					});
					continue;
				}
				keyValue = keyVal;
				moduleValue = getValue(row, columnMapping.module);
				typeValue = getValue(row, columnMapping.type);
				screenValue = getValue(row, columnMapping.screen);
				contextValue = getValue(row, columnMapping.context);
				screenshotRefValue = getValue(row, columnMapping.screenshot_ref);
				const maxCharsStr = getValue(row, columnMapping.max_chars);
				if (maxCharsStr) {
					const parsed = parseInt(maxCharsStr);
					if (!isNaN(parsed)) maxCharsValue = parsed;
				}
			} else {
				// Legacy fixed format
				if (row.length < 3 || !row[0] || !row[1] || !row[2]) {
					result.rows_skipped++;
					result.skipped_reasons.push({
						row: rowNum,
						reason: 'Missing required fields (key, module, or type)'
					});
					continue;
				}
				keyValue = row[0].trim();
				moduleValue = row[1].trim() || null;
				typeValue = row[2].trim() || null;
				screenValue = row[3]?.trim() || null;
				contextValue = row[4]?.trim() || null;
				screenshotRefValue = row[5]?.trim() || null;
				const maxCharsStr = row[6]?.trim();
				if (maxCharsStr) {
					const parsed = parseInt(maxCharsStr);
					if (!isNaN(parsed)) maxCharsValue = parsed;
				}
			}

			if (!keyValue) {
				result.rows_skipped++;
				result.skipped_reasons.push({
					row: rowNum,
					reason: 'Key field is empty'
				});
				continue;
			}

			// Handle key creation/update
			const existingKeyId = existingKeyMap.get(keyValue);
			const keyData: any = {
				workspace_id: validatedWorkspaceId,
				key: keyValue
			};

			// Set required fields (module and type are NOT NULL in DB, so use defaults if not mapped)
			keyData.module = moduleValue || 'common';
			keyData.type = typeValue || 'text';
			
			// Set optional fields
			if (screenValue) keyData.screen = screenValue;
			if (contextValue) keyData.context = contextValue;
			if (screenshotRefValue) keyData.screenshot_ref = screenshotRefValue;
			if (maxCharsValue !== null && !isNaN(maxCharsValue)) keyData.max_chars = maxCharsValue;

			if (existingKeyId) {
				keysToUpdate.push({ id: existingKeyId, data: keyData });
				result.keys_to_update++;
			} else {
				keysToCreate.push(keyData);
				result.keys_to_create++;
			}

			// Process translations
			if (columnMapping) {
				// Use mapping for language columns
				for (const [langCode, columnIndex] of Object.entries(columnMapping.languages)) {
					const langId = languageMap.get(langCode);
					if (!langId) continue;

					const translationValue = getValue(row, columnIndex);
					if (!translationValue) continue; // Skip empty translations

					// For fill-missing policy, check if translation already exists
					if (policy === 'fill-missing') {
						if (existingKeyId) {
							const existingTrans = existingTranslations.get(existingKeyId);
							if (existingTrans && existingTrans.get(langId)) {
								continue; // Skip if translation already exists
							}
						}
					}

					translationsToUpsert.push({
						key_value: keyValue,
						language_id: langId,
						value: translationValue,
						workspace_id: validatedWorkspaceId
					});
					result.translations_to_upsert++;
				}
			} else {
				// Legacy fixed format
				for (let langIdx = 0; langIdx < languageColumns.length; langIdx++) {
					const langCode = languageColumns[langIdx];
					if (!langCode) continue;

					const langId = languageMap.get(langCode);
					if (!langId) continue;

					const translationValue = row[7 + langIdx]?.trim() || '';
					if (!translationValue) continue; // Skip empty translations

					// For fill-missing policy, check if translation already exists
					if (policy === 'fill-missing') {
						if (existingKeyId) {
							const existingTrans = existingTranslations.get(existingKeyId);
							if (existingTrans && existingTrans.get(langId)) {
								continue; // Skip if translation already exists
							}
						}
					}

					translationsToUpsert.push({
						key_value: keyValue,
						language_id: langId,
						value: translationValue,
						workspace_id: validatedWorkspaceId
					});
					result.translations_to_upsert++;
				}
			}
		}

		// If preview, return results without applying
		if (isPreview) {
			return json(result);
		}

		// Apply changes
		// 1. Create new keys
		if (keysToCreate.length > 0) {
			const { data: createdKeys, error: createError } = await supabase
				.from('i18n_keys')
				.insert(keysToCreate)
				.select('id, key');

			if (createError) {
				console.error('Error creating keys:', createError);
				return text('Failed to create keys', { status: 500 });
			}

			// Update existingKeyMap with newly created keys
			for (const key of createdKeys || []) {
				existingKeyMap.set(key.key, key.id);
			}
		}

		// 2. Update existing keys
		for (const update of keysToUpdate) {
			const { error: updateError } = await supabase
				.from('i18n_keys')
				.update(update.data)
				.eq('id', update.id);

			if (updateError) {
				console.error('Error updating key:', updateError);
				// Continue with other updates
			}
		}

		// 3. Upsert translations
		// Group by key_id for batch operations
		const translationsByKey = new Map<string, any[]>();
		for (const trans of translationsToUpsert) {
			const keyId = existingKeyMap.get(trans.key_value);
			if (!keyId) {
				console.warn(`Key not found: ${trans.key_value}`);
				continue;
			}

			if (!translationsByKey.has(keyId)) {
				translationsByKey.set(keyId, []);
			}
			translationsByKey.get(keyId)!.push({
				workspace_id: workspaceId,
				key_id: keyId,
				language_id: trans.language_id,
				value: trans.value,
				status: 'draft'
			});
		}

		// Upsert translations in batches
		for (const [keyId, translations] of translationsByKey) {
			for (const trans of translations) {
				const { error: upsertError } = await supabase.from('i18n_translations').upsert(
					trans,
					{
						onConflict: 'key_id,language_id'
					}
				);

				if (upsertError) {
					console.error('Error upserting translation:', upsertError);
					// Continue with other translations
				}
			}
		}

		return json(result);
	} catch (error) {
		console.error('Import error:', error);
		return text('Internal server error: ' + (error as Error).message, { status: 500 });
	}
};
