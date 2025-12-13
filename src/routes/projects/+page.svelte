<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
</script>

<PageBody>
	<PageHeader title="Projects" description="Manage your translation projects">
		<svelte:fragment slot="actions">
			<Button>New Project</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder="Search projects..."
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
		<svelte:fragment slot="actions">
			<Button variant="outline">Filter</Button>
		</svelte:fragment>
	</DataToolbar>

	<EmptyState
		title="No projects yet"
		description="Create your first project to get started with translations."
	>
		<svelte:fragment slot="actions">
			<Button>Create Project</Button>
		</svelte:fragment>
	</EmptyState>
</PageBody>
