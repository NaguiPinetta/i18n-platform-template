<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DialogTitle from '$lib/ui/DialogTitle.svelte';
	import DialogDescription from '$lib/ui/DialogDescription.svelte';
	import { currentWorkspace, workspaces } from '$lib/stores';
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	const supabase = createClient();
	let showCreateDialog = false;
	let showFirstRunDialog = false;
	let workspaceName = 'i18n Platform';
	let creating = false;

	// First-run bootstrap: show dialog if user has no workspaces (only once)
	onMount(() => {
		if ($workspaces.length === 0 && $page.data.session) {
			showFirstRunDialog = true;
		}
	});

	async function createWorkspace() {
		if (!workspaceName.trim() || !supabase) return;

		creating = true;
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			creating = false;
			return;
		}

		// Create workspace
		const { data: workspace, error: workspaceError } = await supabase
			.from('workspaces')
			.insert({ name: workspaceName.trim(), owner_id: user.id })
			.select()
			.single();

		if (workspaceError) {
			console.error('Error creating workspace:', workspaceError);
			creating = false;
			return;
		}

		// Add user as owner/admin in workspace_members
		if (workspace) {
			const { error: memberError } = await supabase.from('workspace_members').insert({
				workspace_id: workspace.id,
				user_id: user.id,
				role: 'owner'
			});

			if (memberError) {
				console.error('Error adding workspace member:', memberError);
			}

			workspaces.update((ws) => [...ws, workspace]);
			showCreateDialog = false;
			showFirstRunDialog = false;
			workspaceName = 'i18n Platform';
		}

		creating = false;
	}
</script>

<PageBody>
	<!-- First-run bootstrap dialog -->
	<Dialog bind:open={showFirstRunDialog}>
		<DialogTitle>Create Your First Workspace</DialogTitle>
		<DialogDescription class="mb-4">
			Get started by creating your first workspace. You can create more later.
		</DialogDescription>
		<div class="space-y-4">
			<div>
				<label for="first-workspace-name" class="mb-2 block text-sm font-medium">
					Workspace Name
				</label>
				<input
					id="first-workspace-name"
					type="text"
					bind:value={workspaceName}
					placeholder="i18n Platform"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" on:click={() => (showFirstRunDialog = false)}>
					Skip
				</Button>
				<Button on:click={createWorkspace} disabled={creating || !workspaceName.trim()}>
					{creating ? 'Creating...' : 'Create Workspace'}
				</Button>
			</div>
		</div>
	</Dialog>

	{#if $workspaces.length === 0 && !showFirstRunDialog}
		<EmptyState
			title="No workspace found"
			description="Create your first workspace to get started with translations."
		>
			<svelte:fragment slot="actions">
				<Button on:click={() => (showCreateDialog = true)}>Create Workspace</Button>
			</svelte:fragment>
		</EmptyState>

		<Dialog bind:open={showCreateDialog}>
			<DialogTitle>Create Workspace</DialogTitle>
			<DialogDescription class="mb-4">
				Enter a name for your new workspace.
			</DialogDescription>
			<div class="space-y-4">
				<div>
					<label for="workspace-name" class="mb-2 block text-sm font-medium">
						Workspace Name
					</label>
					<input
						id="workspace-name"
						type="text"
						bind:value={workspaceName}
						placeholder="My Workspace"
						class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					/>
				</div>
				<div class="flex justify-end gap-2">
					<Button variant="outline" on:click={() => (showCreateDialog = false)}>
						Cancel
					</Button>
					<Button on:click={createWorkspace} disabled={creating || !workspaceName.trim()}>
						{creating ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</div>
		</Dialog>
	{:else if $currentWorkspace}
		<PageHeader title="Dashboard" description="Overview of your workspace">
			<svelte:fragment slot="actions">
				<Button>New Project</Button>
			</svelte:fragment>
		</PageHeader>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Projects</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">12</p>
					<p class="text-sm text-muted-foreground">Active projects</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Translations</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">1,234</p>
					<p class="text-sm text-muted-foreground">Total keys</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Languages</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">8</p>
					<p class="text-sm text-muted-foreground">Supported locales</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</PageBody>
