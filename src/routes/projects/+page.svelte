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
		title={t('projects.title', 'Projects')}
		description={t('projects.description', 'Manage your translation projects')}
	>
		<svelte:fragment slot="actions">
			<Button>{t('projects.new', 'New Project')}</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder={t('projects.search_placeholder', 'Search projects...')}
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
		<svelte:fragment slot="actions">
			<Button variant="outline">{t('projects.filter', 'Filter')}</Button>
		</svelte:fragment>
	</DataToolbar>

	<EmptyState
		title={t('projects.empty.title', 'No projects yet')}
		description={t('projects.empty.description', 'Create your first project to get started with translations.')}
	>
		<svelte:fragment slot="actions">
			<Button>{t('projects.create', 'Create Project')}</Button>
		</svelte:fragment>
	</EmptyState>
</PageBody>
