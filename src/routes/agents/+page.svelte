<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
</script>

<PageBody>
	<PageHeader title="Agents" description="Manage AI translation agents">
		<svelte:fragment slot="actions">
			<Button>Create Agent</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder="Search agents..."
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
	</DataToolbar>

	<EmptyState
		title="No agents configured"
		description="Create an AI agent to automate translation tasks."
	>
		<svelte:fragment slot="actions">
			<Button>Create Agent</Button>
		</svelte:fragment>
	</EmptyState>
</PageBody>
