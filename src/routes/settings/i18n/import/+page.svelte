<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DialogTitle from '$lib/ui/DialogTitle.svelte';
	import DialogDescription from '$lib/ui/DialogDescription.svelte';
	import LoadingState from '$lib/ui/LoadingState.svelte';
	import { page } from '$app/stores';
	import { currentWorkspace } from '$lib/stores/workspace';
	import { Upload, CheckCircle2, XCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { t } from '$lib/stores';

	interface ImportPreview {
		keys_to_create: number;
		keys_to_update: number;
		translations_to_upsert: number;
		rows_skipped: number;
		skipped_reasons: Array<{ row: number; reason: string }>;
	}

	interface ColumnMapping {
		key: number | null;
		module: number | null;
		type: number | null;
		screen: number | null;
		context: number | null;
		screenshot_ref: number | null;
		max_chars: number | null;
		languages: Record<string, number>; // language code -> column index
	}

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;
	$: workspaceLanguages = $page.data.languages || [];

	let fileInput: HTMLInputElement;
	let selectedFile: File | null = null;
	let csvHeaders: string[] = [];
	let columnMapping: ColumnMapping = {
		key: null,
		module: null,
		type: null,
		screen: null,
		context: null,
		screenshot_ref: null,
		max_chars: null,
		languages: {}
	};
	let showMappingDialog = false;
	let conflictPolicy: 'overwrite' | 'fill-missing' = 'fill-missing';
	let loading = false;
	let preview: ImportPreview | null = null;
	let showPreviewDialog = false;
	let importing = false;
	let importResult: ImportPreview | null = null;
	let showResultDialog = false;

	// Parse CSV line (handles quoted fields)
	function parseCsvLine(line: string): string[] {
		const fields: string[] = [];
		let currentField = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					currentField += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				fields.push(currentField);
				currentField = '';
			} else {
				currentField += char;
			}
		}
		fields.push(currentField);
		return fields;
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
			preview = null;

			// Parse CSV header to detect columns
			try {
				const fileContent = await selectedFile.text();
				const lines = fileContent.split(/\r?\n/).filter((line) => line.trim());
				if (lines.length > 0) {
					csvHeaders = parseCsvLine(lines[0]);
					
					// Auto-detect mappings based on header names
					columnMapping = {
						key: null,
						module: null,
						type: null,
						screen: null,
						context: null,
						screenshot_ref: null,
						max_chars: null,
						languages: {}
					};

					csvHeaders.forEach((header, index) => {
						const lowerHeader = header.toLowerCase().trim();
						
						// Map standard fields
						if (lowerHeader === 'key' || lowerHeader === 'translation_key' || lowerHeader === 'key_id') {
							columnMapping.key = index;
						} else if (lowerHeader === 'module' || lowerHeader === 'namespace') {
							columnMapping.module = index;
						} else if (lowerHeader === 'type' || lowerHeader === 'element_type') {
							columnMapping.type = index;
						} else if (lowerHeader === 'screen' || lowerHeader === 'page') {
							columnMapping.screen = index;
						} else if (lowerHeader === 'context' || lowerHeader === 'description') {
							columnMapping.context = index;
						} else if (lowerHeader === 'screenshot_ref' || lowerHeader === 'screenshot' || lowerHeader === 'screenshot_url') {
							columnMapping.screenshot_ref = index;
						} else if (lowerHeader === 'max_chars' || lowerHeader === 'max_chars' || lowerHeader === 'max_length') {
							columnMapping.max_chars = index;
						} else {
							// Try to match with workspace languages first
							const matchingLang = workspaceLanguages.find(
								(lang: { code: string; name: string; is_rtl: boolean }) => lang.code.toLowerCase() === lowerHeader
							);
							if (matchingLang) {
								columnMapping.languages[matchingLang.code] = index;
							} else {
								// Fallback: assume it's a language code (2-3 letter codes)
								const langCode = lowerHeader.match(/^[a-z]{2,3}$/);
								if (langCode) {
									columnMapping.languages[lowerHeader] = index;
								}
							}
						}
					});

					// Show mapping dialog if key or languages are not detected
					if (columnMapping.key === null || Object.keys(columnMapping.languages).length === 0) {
						showMappingDialog = true;
					}
				}
			} catch (error) {
				console.error('Error parsing CSV header:', error);
				alert(t('i18n.import.parse_error', 'Failed to parse CSV file. Please check the file format.'));
			}
		}
	}

	function validateMapping(): boolean {
		if (columnMapping.key === null) {
			alert(t('i18n.import.mapping.key_required', 'Key column mapping is required'));
			return false;
		}
		if (Object.keys(columnMapping.languages).length === 0) {
			alert(t('i18n.import.mapping.language_required', 'At least one language column must be mapped'));
			return false;
		}
		return true;
	}

	async function handlePreview() {
		if (!selectedFile || !hasWorkspace) return;

		if (!validateMapping()) {
			return;
		}

		loading = true;
		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('policy', conflictPolicy);
		formData.append('preview', 'true');
		formData.append('columnMapping', JSON.stringify(columnMapping));

		try {
			const response = await fetch('/api/i18n/import', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.text();
				alert(t('i18n.import.preview_error', 'Preview failed: ') + error);
				loading = false;
				return;
			}

			preview = await response.json();
			showPreviewDialog = true;
		} catch (error) {
			console.error('Preview error:', error);
			alert(t('i18n.import.preview_error', 'Failed to preview import: ') + (error as Error).message);
		}
		loading = false;
	}

	async function handleImport() {
		if (!selectedFile || !hasWorkspace || !preview) return;

		if (!validateMapping()) {
			return;
		}

		importing = true;
		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('policy', conflictPolicy);
		formData.append('columnMapping', JSON.stringify(columnMapping));

		try {
			const response = await fetch('/api/i18n/import', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.text();
				alert(t('i18n.import.import_error', 'Import failed: ') + error);
				importing = false;
				return;
			}

			importResult = await response.json();
			showPreviewDialog = false;
			showResultDialog = true;
			selectedFile = null;
			csvHeaders = [];
			columnMapping = {
				key: null,
				module: null,
				type: null,
				screen: null,
				context: null,
				screenshot_ref: null,
				max_chars: null,
				languages: {}
			};
			if (fileInput) fileInput.value = '';
		} catch (error) {
			console.error('Import error:', error);
			alert(t('i18n.import.import_error', 'Failed to import CSV: ') + (error as Error).message);
		}
		importing = false;
	}
</script>

<PageBody>
	<PageHeader
		title={t('i18n.import.title', 'Import Translations')}
		description={t('i18n.import.subtitle', 'Upload translated CSV files to update translation values')}
	/>

	{#if !supabaseConfigured}
		<EmptyState
			title={t('errors.supabase_not_configured', 'Supabase Not Configured')}
			description={t(
				'errors.supabase_not_configured.description',
				'Please configure Supabase environment variables to import translations.'
			)}
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title={t('workspace.none_selected_title', 'No Workspace Selected')}
			description={t(
				'workspace.select_description',
				'Please select or create a workspace to import translations.'
			)}
		/>
	{:else}
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">{t('i18n.import.csv_title', 'CSV Import')}</h3>
			</CardHeader>
			<CardContent class="space-y-6">
				<div>
					<label for="file" class="mb-2 block text-sm font-medium">
						{t('i18n.import.file_label', 'CSV File')}
					</label>
					<input
						id="file"
						bind:this={fileInput}
						type="file"
						accept=".csv"
						on:change={handleFileSelect}
						class="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
					/>
					{#if selectedFile}
						<p class="mt-2 text-sm text-muted-foreground">
							{t('i18n.import.file_selected', 'Selected:')} {selectedFile.name}
						</p>
					{/if}
				</div>

				<div>
					<label for="policy" class="mb-2 block text-sm font-medium">
						{t('i18n.import.policy_label', 'Conflict Policy')}
					</label>
					<select
						id="policy"
						bind:value={conflictPolicy}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="fill-missing">
							{t('i18n.import.policy.fill_missing', 'Fill Missing (only update empty translations)')}
						</option>
						<option value="overwrite">
							{t('i18n.import.policy.overwrite', 'Overwrite (replace all existing translations)')}
						</option>
					</select>
					<p class="mt-2 text-sm text-muted-foreground">
						{#if conflictPolicy === 'fill-missing'}
							{t('i18n.import.policy.fill_missing.description', 'Only translations that are currently empty will be updated.')}
						{:else}
							{t('i18n.import.policy.overwrite.description', 'All translations will be replaced with values from the CSV file.')}
						{/if}
					</p>
				</div>

				{#if csvHeaders.length > 0}
					<div>
						<div class="mb-2 flex items-center justify-between">
							<label class="text-sm font-medium">
								{t('i18n.import.mapping.title', 'Column Mapping')}
							</label>
							<Button
								variant="outline"
								size="sm"
								on:click={() => (showMappingDialog = true)}
							>
								{t('i18n.import.mapping.edit', 'Edit Mapping')}
							</Button>
						</div>
						<div class="rounded-md border bg-muted/50 p-3 text-sm">
							<div class="space-y-1">
								<div>
									<span class="font-medium">{t('i18n.import.mapping.key', 'Key')}:</span>
									<span class="ml-2 text-muted-foreground">
										{columnMapping.key !== null
											? `Column ${columnMapping.key + 1} (${csvHeaders[columnMapping.key]})`
											: t('i18n.import.mapping.not_mapped', 'Not mapped')}
									</span>
								</div>
								<div>
									<span class="font-medium">{t('i18n.import.mapping.languages', 'Languages')}:</span>
									<span class="ml-2 text-muted-foreground">
										{Object.keys(columnMapping.languages).length > 0
											? Object.keys(columnMapping.languages)
													.map(
														(lang) =>
															`${lang} (Col ${columnMapping.languages[lang] + 1})`
													)
													.join(', ')
											: t('i18n.import.mapping.not_mapped', 'Not mapped')}
									</span>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<div class="flex gap-2">
					<Button
						on:click={handlePreview}
						disabled={!selectedFile || loading}
						variant="outline"
					>
						{loading
							? t('i18n.import.previewing', 'Previewing...')
							: t('i18n.import.preview', 'Preview Import')}
					</Button>
					{#if preview}
						<Button on:click={handleImport} disabled={importing}>
							{importing
								? t('i18n.import.importing', 'Importing...')
								: t('i18n.import.confirm', 'Confirm & Import')}
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Column Mapping Dialog -->
	<Dialog bind:open={showMappingDialog}>
		<DialogTitle>{t('i18n.import.mapping.dialog_title', 'Map CSV Columns')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t(
				'i18n.import.mapping.dialog_description',
				'Map your CSV columns to the expected fields. Key and at least one language are required.'
			)}
		</DialogDescription>
		<div class="space-y-4 max-h-[60vh] overflow-y-auto">
			<div class="space-y-3">
				<!-- Key (Required) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.key', 'Key')} *
					</label>
					<select
						bind:value={columnMapping.key}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.select_column', 'Select column...')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Module (Optional) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.module', 'Module')}
					</label>
					<select
						bind:value={columnMapping.module}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.optional', 'Optional')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Type (Optional) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.type', 'Type')}
					</label>
					<select
						bind:value={columnMapping.type}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.optional', 'Optional')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Screen (Optional) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.screen', 'Screen')}
					</label>
					<select
						bind:value={columnMapping.screen}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.optional', 'Optional')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Context (Optional) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.context', 'Context')}
					</label>
					<select
						bind:value={columnMapping.context}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.optional', 'Optional')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Screenshot Ref (Optional) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.screenshot_ref', 'Screenshot Ref')}
					</label>
					<select
						bind:value={columnMapping.screenshot_ref}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.optional', 'Optional')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Max Chars (Optional) -->
				<div>
					<label class="mb-1 block text-sm font-medium">
						{t('i18n.import.mapping.max_chars', 'Max Characters')}
					</label>
					<select
						bind:value={columnMapping.max_chars}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value={null}>{t('i18n.import.mapping.optional', 'Optional')}</option>
						{#each csvHeaders as header, index}
							<option value={index}>
								Column {index + 1}: {header}
							</option>
						{/each}
					</select>
				</div>

				<!-- Language Columns -->
				<div>
					<div class="mb-2 text-sm font-medium">
						{t('i18n.import.mapping.languages', 'Languages')} *
					</div>
					<div class="space-y-3">
						{#if workspaceLanguages.length > 0}
							{#each workspaceLanguages as lang}
								{@const currentMapping = columnMapping.languages[lang.code] ?? null}
								<div>
									<label for="lang-{lang.code}" class="mb-1 block text-sm font-medium">
										{lang.name} ({lang.code})
									</label>
									<select
										id="lang-{lang.code}"
										value={currentMapping !== null ? currentMapping.toString() : ''}
										on:change={(e) => {
											const selectedValue = e.currentTarget.value;
											if (selectedValue === '') {
												delete columnMapping.languages[lang.code];
											} else {
												columnMapping.languages[lang.code] = parseInt(selectedValue);
											}
											columnMapping = columnMapping; // Trigger reactivity
										}}
										class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										<option value="">{t('i18n.import.mapping.not_mapped', 'Not mapped')}</option>
										{#each csvHeaders as header, index}
											{@const isLanguage = /^[a-z]{2,3}$/i.test(header.trim())}
											{@const isDetected = header.trim().toLowerCase() === lang.code.toLowerCase()}
											<option value={index}>
												Column {index + 1}: {header}
												{#if isDetected}
													{' '}(auto-detected)
												{:else if isLanguage}
													{' '}(language code)
												{/if}
											</option>
										{/each}
									</select>
								</div>
							{/each}
						{:else}
							<!-- Fallback: allow mapping any language code from CSV -->
							<div>
								<div class="mb-2 text-sm font-medium">
									{t('i18n.import.mapping.csv_languages', 'CSV Language Columns')}
								</div>
								<div class="space-y-2 max-h-40 overflow-y-auto rounded-md border p-2">
									{#each csvHeaders as header, index}
										{@const isLanguage = /^[a-z]{2,3}$/i.test(header.trim())}
										{@const langCode = header.trim().toLowerCase()}
										{@const isMapped = columnMapping.languages[langCode] === index}
										{#if isLanguage || isMapped}
											<div class="flex items-center gap-2">
												<input
													type="checkbox"
													id="lang-{index}"
													checked={isMapped}
													on:change={(e) => {
														if (e.currentTarget.checked) {
															columnMapping.languages[langCode] = index;
														} else {
															delete columnMapping.languages[langCode];
														}
														columnMapping = columnMapping; // Trigger reactivity
													}}
													class="h-4 w-4 rounded border-gray-300"
												/>
												<label for="lang-{index}" class="text-sm">
													Column {index + 1}: <span class="font-mono">{header}</span>
													{#if isLanguage}
														<span class="ml-1 text-xs text-muted-foreground">(detected)</span>
													{/if}
												</label>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/if}
					</div>
					<p class="mt-2 text-xs text-muted-foreground">
						{t(
							'i18n.import.mapping.languages_hint',
							'Map each language to the CSV column containing its translation values'
						)}
					</p>
				</div>
			</div>

			<div class="flex justify-end gap-2">
				<Button variant="outline" on:click={() => (showMappingDialog = false)}>
					{t('common.close', 'Close')}
				</Button>
				<Button
					on:click={() => {
						if (validateMapping()) {
							showMappingDialog = false;
						}
					}}
				>
					{t('common.save', 'Save')}
				</Button>
			</div>
		</div>
	</Dialog>

	<!-- Preview Dialog -->
	<Dialog bind:open={showPreviewDialog}>
		<DialogTitle>{t('i18n.import.preview_title', 'Import Preview')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t('i18n.import.preview_description', 'Review the changes that will be made before confirming the import.')}
		</DialogDescription>
		{#if preview}
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.preview.keys_to_create', 'Keys to Create')}
						</div>
						<div class="text-2xl font-bold">{preview.keys_to_create}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.preview.keys_to_update', 'Keys to Update')}
						</div>
						<div class="text-2xl font-bold">{preview.keys_to_update}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.preview.translations_to_upsert', 'Translations to Upsert')}
						</div>
						<div class="text-2xl font-bold">{preview.translations_to_upsert}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.preview.rows_skipped', 'Rows Skipped')}
						</div>
						<div class="text-2xl font-bold">{preview.rows_skipped}</div>
					</div>
				</div>
				{#if preview.skipped_reasons.length > 0}
					<div>
						<div class="mb-2 text-sm font-medium">
							{t('i18n.import.preview.skipped_rows', 'Skipped Rows:')}
						</div>
						<div class="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
							{#each preview.skipped_reasons as reason}
								<div>
									{t('i18n.import.preview.row', 'Row')} {reason.row}: {reason.reason}
								</div>
							{/each}
						</div>
					</div>
				{/if}
				<div class="flex justify-end gap-2">
					<Button variant="outline" on:click={() => (showPreviewDialog = false)}>
						{t('common.cancel', 'Cancel')}
					</Button>
					<Button on:click={handleImport} disabled={importing}>
						{importing
							? t('i18n.import.importing', 'Importing...')
							: t('i18n.import.confirm_import', 'Confirm Import')}
					</Button>
				</div>
			</div>
		{/if}
	</Dialog>

	<!-- Result Dialog -->
	<Dialog bind:open={showResultDialog}>
		<DialogTitle>{t('i18n.import.complete_title', 'Import Complete')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t('i18n.import.complete_description', 'The import has been processed. Review the results below.')}
		</DialogDescription>
		{#if importResult}
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.result.keys_created', 'Keys Created')}
						</div>
						<div class="text-2xl font-bold">{importResult.keys_to_create}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.result.keys_updated', 'Keys Updated')}
						</div>
						<div class="text-2xl font-bold">{importResult.keys_to_update}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.result.translations_upserted', 'Translations Upserted')}
						</div>
						<div class="text-2xl font-bold">{importResult.translations_to_upsert}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">
							{t('i18n.import.result.rows_skipped', 'Rows Skipped')}
						</div>
						<div class="text-2xl font-bold">{importResult.rows_skipped}</div>
					</div>
				</div>
				<div class="flex justify-end">
					<Button on:click={() => (showResultDialog = false)}>
						{t('common.close', 'Close')}
					</Button>
				</div>
			</div>
		{/if}
	</Dialog>
</PageBody>
