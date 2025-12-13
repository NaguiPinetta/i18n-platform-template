import { text } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { getWorkspaceIdFromCookie, validateWorkspaceMembership } from '$lib/supabase/workspace';

/**
 * Escape CSV field value
 */
function escapeCsvField(value: string | null | undefined): string {
	if (value === null || value === undefined) return '';
	const str = String(value);
	// If contains comma, quote, or newline, wrap in quotes and escape quotes
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Format CSV row
 */
function formatCsvRow(fields: (string | number | null | undefined)[]): string {
	return fields.map((field) => escapeCsvField(field?.toString())).join(',');
}

export const GET: RequestHandler = async (event) => {
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

	// At this point, workspaceId is guaranteed to be non-null
	const validatedWorkspaceId = validation.workspaceId;

	try {
		// Get all languages for workspace, sorted by code
		const { data: languages, error: languagesError } = await supabase
			.from('i18n_languages')
			.select('id, code')
			.eq('workspace_id', validatedWorkspaceId)
			.order('code');

		if (languagesError) {
			console.error('Error fetching languages:', languagesError);
			return text('Error fetching languages', { status: 500 });
		}

		// Get all keys for workspace, sorted by module then key
		const { data: keys, error: keysError } = await supabase
			.from('i18n_keys')
			.select('*')
			.eq('workspace_id', validatedWorkspaceId)
			.order('module')
			.order('key');

		if (keysError) {
			console.error('Error fetching keys:', keysError);
			return text('Error fetching keys', { status: 500 });
		}

		// Get all translations for these keys
		const keyIds = keys.map((k) => k.id);
		const { data: translations, error: translationsError } = await supabase
			.from('i18n_translations')
			.select('key_id, language_id, value')
			.in('key_id', keyIds);

		if (translationsError) {
			console.error('Error fetching translations:', translationsError);
			return text('Error fetching translations', { status: 500 });
		}

		// Build translation map: key_id -> language_id -> value
		const translationMap = new Map<string, Map<string, string>>();
		for (const trans of translations || []) {
			if (!translationMap.has(trans.key_id)) {
				translationMap.set(trans.key_id, new Map());
			}
			translationMap.get(trans.key_id)!.set(trans.language_id, trans.value || '');
		}

		// Build CSV header
		const headerFields = [
			'key',
			'module',
			'type',
			'screen',
			'context',
			'screenshot_ref',
			'max_chars',
			...(languages || []).map((lang) => lang.code)
		];
		const csvRows = [formatCsvRow(headerFields)];

		// Build CSV rows
		for (const key of keys || []) {
			const keyTranslations = translationMap.get(key.id) || new Map();
			const rowFields = [
				key.key,
				key.module,
				key.type,
				key.screen || '',
				key.context || '',
				key.screenshot_ref || '',
				key.max_chars?.toString() || '',
				...(languages || []).map((lang) => keyTranslations.get(lang.id) || '')
			];
			csvRows.push(formatCsvRow(rowFields));
		}

		const csvContent = csvRows.join('\n');

		// Generate filename
		const workspaceName = validatedWorkspaceId.substring(0, 8); // Use first 8 chars of UUID
		const date = new Date().toISOString().split('T')[0];
		const filename = `i18n_${workspaceName}_${date}.csv`;

		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error) {
		console.error('Export error:', error);
		return text('Internal server error', { status: 500 });
	}
};
