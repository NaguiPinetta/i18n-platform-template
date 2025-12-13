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

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	async function handleExport() {
		if (!hasWorkspace) return;

		try {
			const response = await fetch('/api/i18n/export.csv');
			if (!response.ok) {
				const error = await response.text();
				alert('Export failed: ' + error);
				return;
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `i18n_${$currentWorkspace?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export error:', error);
			alert('Failed to export CSV: ' + (error as Error).message);
		}
	}
</script>

<PageBody>
	<PageHeader title="Export Translations" description="Download translation keys and values as CSV" />

	{#if !supabaseConfigured}
		<EmptyState
			title="Supabase Not Configured"
			description="Please configure Supabase environment variables to export translations."
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title="No Workspace Selected"
			description="Please select or create a workspace to export translations."
		/>
	{:else}
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">CSV Export</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-4">
					Export all translation keys and their values to a CSV file. This file can be sent to
					translation services like Omniglot for professional translation.
				</p>
				<p class="text-sm text-muted-foreground mb-6">
					The CSV file includes:
				</p>
				<ul class="list-disc list-inside text-sm text-muted-foreground mb-6 space-y-1">
					<li>All translation keys with metadata (module, type, screen, context, etc.)</li>
					<li>All language columns with current translation values</li>
					<li>Empty cells for missing translations</li>
				</ul>
				<Button on:click={handleExport} class="w-full sm:w-auto">
					<Download class="mr-2 h-4 w-4" />
					Download CSV
				</Button>
			</CardContent>
		</Card>
	{/if}
</PageBody>
