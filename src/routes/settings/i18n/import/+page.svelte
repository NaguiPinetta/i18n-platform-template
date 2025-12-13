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

	interface ImportPreview {
		keys_to_create: number;
		keys_to_update: number;
		translations_to_upsert: number;
		rows_skipped: number;
		skipped_reasons: Array<{ row: number; reason: string }>;
	}

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	let fileInput: HTMLInputElement;
	let selectedFile: File | null = null;
	let conflictPolicy: 'overwrite' | 'fill-missing' = 'fill-missing';
	let loading = false;
	let preview: ImportPreview | null = null;
	let showPreviewDialog = false;
	let importing = false;
	let importResult: ImportPreview | null = null;
	let showResultDialog = false;

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
			preview = null;
		}
	}

	async function handlePreview() {
		if (!selectedFile || !hasWorkspace) return;

		loading = true;
		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('policy', conflictPolicy);
		formData.append('preview', 'true');

		try {
			const response = await fetch('/api/i18n/import', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.text();
				alert('Preview failed: ' + error);
				loading = false;
				return;
			}

			preview = await response.json();
			showPreviewDialog = true;
		} catch (error) {
			console.error('Preview error:', error);
			alert('Failed to preview import: ' + (error as Error).message);
		}
		loading = false;
	}

	async function handleImport() {
		if (!selectedFile || !hasWorkspace || !preview) return;

		importing = true;
		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('policy', conflictPolicy);

		try {
			const response = await fetch('/api/i18n/import', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.text();
				alert('Import failed: ' + error);
				importing = false;
				return;
			}

			importResult = await response.json();
			showPreviewDialog = false;
			showResultDialog = true;
			selectedFile = null;
			if (fileInput) fileInput.value = '';
		} catch (error) {
			console.error('Import error:', error);
			alert('Failed to import CSV: ' + (error as Error).message);
		}
		importing = false;
	}
</script>

<PageBody>
	<PageHeader
		title="Import Translations"
		description="Upload translated CSV files to update translation values"
	/>

	{#if !supabaseConfigured}
		<EmptyState
			title="Supabase Not Configured"
			description="Please configure Supabase environment variables to import translations."
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title="No Workspace Selected"
			description="Please select or create a workspace to import translations."
		/>
	{:else}
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">CSV Import</h3>
			</CardHeader>
			<CardContent class="space-y-6">
				<div>
					<label for="file" class="mb-2 block text-sm font-medium">CSV File</label>
					<input
						id="file"
						bind:this={fileInput}
						type="file"
						accept=".csv"
						on:change={handleFileSelect}
						class="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
					/>
					{#if selectedFile}
						<p class="mt-2 text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
					{/if}
				</div>

				<div>
					<label for="policy" class="mb-2 block text-sm font-medium">Conflict Policy</label>
					<select
						id="policy"
						bind:value={conflictPolicy}
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="fill-missing">Fill Missing (only update empty translations)</option>
						<option value="overwrite">Overwrite (replace all existing translations)</option>
					</select>
					<p class="mt-2 text-sm text-muted-foreground">
						{#if conflictPolicy === 'fill-missing'}
							Only translations that are currently empty will be updated.
						{:else}
							All translations will be replaced with values from the CSV file.
						{/if}
					</p>
				</div>

				<div class="flex gap-2">
					<Button
						on:click={handlePreview}
						disabled={!selectedFile || loading}
						variant="outline"
					>
						{loading ? 'Previewing...' : 'Preview Import'}
					</Button>
					{#if preview}
						<Button on:click={handleImport} disabled={importing}>
							{importing ? 'Importing...' : 'Confirm & Import'}
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Preview Dialog -->
	<Dialog bind:open={showPreviewDialog}>
		<DialogTitle>Import Preview</DialogTitle>
		<DialogDescription class="mb-4">
			Review the changes that will be made before confirming the import.
		</DialogDescription>
		{#if preview}
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Keys to Create</div>
						<div class="text-2xl font-bold">{preview.keys_to_create}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Keys to Update</div>
						<div class="text-2xl font-bold">{preview.keys_to_update}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Translations to Upsert</div>
						<div class="text-2xl font-bold">{preview.translations_to_upsert}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Rows Skipped</div>
						<div class="text-2xl font-bold">{preview.rows_skipped}</div>
					</div>
				</div>
				{#if preview.skipped_reasons.length > 0}
					<div>
						<div class="mb-2 text-sm font-medium">Skipped Rows:</div>
						<div class="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
							{#each preview.skipped_reasons as reason}
								<div>Row {reason.row}: {reason.reason}</div>
							{/each}
						</div>
					</div>
				{/if}
				<div class="flex justify-end gap-2">
					<Button variant="outline" on:click={() => (showPreviewDialog = false)}>Cancel</Button>
					<Button on:click={handleImport} disabled={importing}>
						{importing ? 'Importing...' : 'Confirm Import'}
					</Button>
				</div>
			</div>
		{/if}
	</Dialog>

	<!-- Result Dialog -->
	<Dialog bind:open={showResultDialog}>
		<DialogTitle>Import Complete</DialogTitle>
		<DialogDescription class="mb-4">
			The import has been processed. Review the results below.
		</DialogDescription>
		{#if importResult}
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Keys Created</div>
						<div class="text-2xl font-bold">{importResult.keys_to_create}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Keys Updated</div>
						<div class="text-2xl font-bold">{importResult.keys_to_update}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Translations Upserted</div>
						<div class="text-2xl font-bold">{importResult.translations_to_upsert}</div>
					</div>
					<div class="rounded-md border p-3">
						<div class="text-sm text-muted-foreground">Rows Skipped</div>
						<div class="text-2xl font-bold">{importResult.rows_skipped}</div>
					</div>
				</div>
				<div class="flex justify-end">
					<Button on:click={() => (showResultDialog = false)}>Close</Button>
				</div>
			</div>
		{/if}
	</Dialog>
</PageBody>
