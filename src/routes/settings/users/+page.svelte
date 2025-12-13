<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
</script>

<PageBody>
	<PageHeader title="Users" description="Manage workspace users and permissions">
		<svelte:fragment slot="actions">
			<Button>Invite User</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder="Search users..."
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
	</DataToolbar>

	<EmptyState
		title="No users found"
		description="Invite team members to collaborate on translations."
	>
		<svelte:fragment slot="actions">
			<Button>Invite User</Button>
		</svelte:fragment>
	</EmptyState>
</PageBody>
