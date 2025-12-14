<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { page } from '$app/stores';
	import { currentWorkspace } from '$lib/stores/workspace';
	import { Download } from 'lucide-svelte';
	import { t } from '$lib/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	let lastExportTime: Date | null = null;
	let includeOnlyMissing = false;

	const STORAGE_KEY = 'i18n_last_export_time';

	onMount(() => {
		if (browser) {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				lastExportTime = new Date(stored);
			}
		}
	});

	async function handleExport() {
		if (!hasWorkspace) return;

		try {
			const url = includeOnlyMissing 
				? '/api/i18n/export.csv?missing_only=true'
				: '/api/i18n/export.csv';
			
			const response = await fetch(url);
			if (!response.ok) {
				const error = await response.text();
				alert(t('i18n.export.error', 'Export failed: ') + error);
				return;
			}

			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = downloadUrl;
			a.download = `i18n_${$currentWorkspace?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(downloadUrl);
			
			// Store export timestamp
			if (browser) {
				lastExportTime = new Date();
				localStorage.setItem(STORAGE_KEY, lastExportTime.toISOString());
			}
		} catch (error) {
			console.error('Export error:', error);
			alert(t('i18n.export.error', 'Failed to export CSV: ') + (error as Error).message);
		}
	}
</script>

<PageBody>
	<PageHeader
		title={t('i18n.export.title', 'Export Translations')}
		description={t('i18n.export.subtitle', 'Download translation keys and values as CSV')}
	/>

	{#if !supabaseConfigured}
		<EmptyState
			title={t('errors.supabase_not_configured', 'Supabase Not Configured')}
			description={t(
				'errors.supabase_not_configured.description',
				'Please configure Supabase environment variables to export translations.'
			)}
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title={t('workspace.none_selected_title', 'No Workspace Selected')}
			description={t(
				'workspace.select_description',
				'Please select or create a workspace to export translations.'
			)}
		/>
	{:else}
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">{t('i18n.export.csv_title', 'CSV Export')}</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-4">
					{t(
						'i18n.export.description',
						'Export all translation keys and their values to a CSV file. This file can be sent to translation services like Omniglot for professional translation.'
					)}
				</p>
				<p class="text-sm text-muted-foreground mb-6">
					{t('i18n.export.includes_title', 'The CSV file includes:')}
				</p>
				<ul class="list-disc list-inside text-sm text-muted-foreground mb-4 space-y-1">
					<li>
						{t(
							'i18n.export.includes.keys',
							'All translation keys with metadata (module, type, screen, context, etc.)'
						)}
					</li>
					<li>
						{t('i18n.export.includes.languages', 'All language columns with current translation values')}
					</li>
					<li>
						{t('i18n.export.includes.empty', 'Empty cells for missing translations')}
					</li>
				</ul>
				
				{#if lastExportTime}
					<p class="text-xs text-muted-foreground mb-4">
						{t('i18n.export.last_export', 'Last export:')} {lastExportTime.toLocaleString()}
					</p>
				{/if}
				
				<div class="mb-4 flex items-center gap-2">
					<input
						type="checkbox"
						id="includeOnlyMissing"
						bind:checked={includeOnlyMissing}
						class="h-4 w-4 rounded border-input"
					/>
					<label for="includeOnlyMissing" class="text-sm text-muted-foreground">
						{t('i18n.export.include_only_missing', 'Include only keys missing translations')}
					</label>
				</div>
				
				<Button on:click={handleExport} class="w-full sm:w-auto">
					<Download class="mr-2 h-4 w-4" />
					{t('i18n.export.download', 'Download CSV')}
				</Button>
			</CardContent>
		</Card>
	{/if}
</PageBody>
