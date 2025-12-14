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
		title={t('agents.title', 'Agents')}
		description={t('agents.description', 'Manage AI translation agents')}
	>
		<svelte:fragment slot="actions">
			<Button>{t('agents.create', 'Create Agent')}</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder={t('agents.search_placeholder', 'Search agents...')}
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
	</DataToolbar>

	<EmptyState
		title={t('agents.empty.title', 'No agents configured')}
		description={t('agents.empty.description', 'Create an AI agent to automate translation tasks.')}
	>
		<svelte:fragment slot="actions">
			<Button>{t('agents.create', 'Create Agent')}</Button>
		</svelte:fragment>
	</EmptyState>
</PageBody>
