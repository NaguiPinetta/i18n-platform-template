<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { t } from '$lib/stores';
</script>

<PageBody>
	<PageHeader
		title={t('datasets.title', 'Datasets')}
		description={t('datasets.description', 'Manage training datasets for AI models')}
	>
		<svelte:fragment slot="actions">
			<Button>{t('datasets.upload', 'Upload Dataset')}</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder={t('datasets.search_placeholder', 'Search datasets...')}
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
		<svelte:fragment slot="actions">
			<Button variant="outline">{t('datasets.filter', 'Filter')}</Button>
		</svelte:fragment>
	</DataToolbar>

	<EmptyState
		title={t('datasets.empty.title', 'No datasets uploaded')}
		description={t('datasets.empty.description', 'Upload a dataset to train custom translation models.')}
	>
		<svelte:fragment slot="actions">
			<Button>{t('datasets.upload', 'Upload Dataset')}</Button>
		</svelte:fragment>
	</EmptyState>
</PageBody>
