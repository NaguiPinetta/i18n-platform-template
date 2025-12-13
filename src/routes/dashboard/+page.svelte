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
	import { currentWorkspace, workspaces, currentWorkspaceId, t } from '$lib/stores';
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	const supabase = createClient();
	let showCreateDialog = false;
	let showFirstRunDialog = false;
	let workspaceName = 'i18n Platform';
	let creating = false;
	let pageLoaded = false;

	// First-run bootstrap: show dialog if user has no workspaces (only once)
	onMount(() => {
		pageLoaded = true;
		
		if ($workspaces.length === 0 && $page.data.session) {
			showFirstRunDialog = true;
		}
	});

	function handleRefresh() {
		window.location.reload();
	}

	function handleCreateClick() {
		showCreateDialog = true;
	}

	async function createWorkspace() {
		if (!workspaceName.trim() || !supabase) {
			return;
		}

		creating = true;
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();

		if (userError || !user) {
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
			alert('Failed to create workspace: ' + workspaceError.message);
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
				// Don't fail completely, but log the error
				console.warn('Error adding workspace member:', memberError);
			}

			// Update local store
			workspaces.update((ws) => [...ws, workspace]);
			
			// Set as current workspace
			currentWorkspaceId.set(workspace.id);
			
			// Set workspace cookie
			try {
				await fetch('/api/workspace/set', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ workspaceId: workspace.id })
				});
			} catch (error) {
				console.warn('Failed to set workspace cookie:', error);
			}

			showCreateDialog = false;
			showFirstRunDialog = false;
			workspaceName = 'i18n Platform';
			
			// Reload page to refresh workspace data
			window.location.reload();
		}

		creating = false;
	}
</script>

<PageBody>
	<!-- First-run bootstrap dialog (auto-shows on mount if no workspaces) -->
	<Dialog bind:open={showFirstRunDialog}>
		<DialogTitle>{t('workspace.first_run.title', 'Create Your First Workspace')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t(
				'workspace.first_run.description',
				'Get started by creating your first workspace. You can create more later.'
			)}
		</DialogDescription>
		<div class="space-y-4">
			<div>
				<label for="first-workspace-name" class="mb-2 block text-sm font-medium">
					{t('workspace.name_label', 'Workspace Name')}
				</label>
				<input
					id="first-workspace-name"
					type="text"
					bind:value={workspaceName}
					placeholder={t('workspace.name_placeholder', 'i18n Platform')}
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
				<div class="flex justify-end gap-2">
					<Button 
						variant="outline" 
						on:click={() => { 
							showFirstRunDialog = false;
						}}
					>
						{t('common.skip', 'Skip')}
					</Button>
					<Button 
						on:click={() => {
							createWorkspace();
						}} 
						disabled={creating || !workspaceName.trim()}
					>
						{creating
							? t('common.creating', 'Creating...')
							: t('workspace.create', 'Create Workspace')}
					</Button>
				</div>
		</div>
	</Dialog>

	<!-- Workspace creation dialog (triggered by button click) -->
	<Dialog bind:open={showCreateDialog}>
		<DialogTitle>{t('workspace.create', 'Create Workspace')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t('workspace.create.description', 'Enter a name for your new workspace.')}
		</DialogDescription>
		<div class="space-y-4">
			<div>
				<label for="workspace-name" class="mb-2 block text-sm font-medium">
					{t('workspace.name_label', 'Workspace Name')}
				</label>
				<input
					id="workspace-name"
					type="text"
					bind:value={workspaceName}
					placeholder={t('workspace.name_placeholder_generic', 'My Workspace')}
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div class="flex justify-end gap-2">
				<Button 
					variant="outline" 
					on:click={() => {
						showCreateDialog = false;
					}}
				>
					{t('common.cancel', 'Cancel')}
				</Button>
				<Button 
					on:click={() => {
						createWorkspace();
					}} 
					disabled={creating || !workspaceName.trim()}
				>
					{creating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
				</Button>
			</div>
		</div>
	</Dialog>

	<!-- Always show dashboard header -->
	<PageHeader
		title={t('dashboard.title', 'Dashboard')}
		description={t('dashboard.description', 'Overview of your workspace')}
	>
		<svelte:fragment slot="actions">
			{#if $currentWorkspace}
				<Button>{t('projects.new', 'New Project')}</Button>
			{/if}
		</svelte:fragment>
	</PageHeader>

	<!-- Show banner if no workspace -->
	{#if $workspaces.length === 0}
		<div class="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-4">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<h3 class="mb-1 text-sm font-semibold text-yellow-800 dark:text-yellow-200">
						{t('workspace.none_selected_title', 'No workspace selected')}
					</h3>
					<p class="text-sm text-yellow-700 dark:text-yellow-300">
						{t(
							'workspace.none_selected_description',
							'Create your first workspace to get started with translations. If you created a workspace via SQL, try refreshing the page.'
						)}
					</p>
				</div>
				<div class="ml-4 flex gap-2">
					<Button 
						variant="outline" 
						size="sm"
						on:click={handleRefresh}
					>
						{t('common.refresh', 'Refresh')}
					</Button>
					<Button 
						size="sm"
						on:click={handleCreateClick}
					>
						{t('workspace.create', 'Create Workspace')}
					</Button>
				</div>
			</div>
		</div>
	{:else if !$currentWorkspace}
		<div class="mb-6 rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-900/20 p-4">
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<h3 class="mb-1 text-sm font-semibold text-blue-800 dark:text-blue-200">
						{t('workspace.select_title', 'Select a workspace')}
					</h3>
					<p class="text-sm text-blue-700 dark:text-blue-300">
						{t(
							'workspace.select_description',
							'Choose a workspace from the dropdown in the header to view your dashboard.'
						)}
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Dashboard content (only show if workspace is selected) -->
	{#if $currentWorkspace}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">{t('dashboard.cards.projects', 'Projects')}</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">12</p>
					<p class="text-sm text-muted-foreground">
						{t('dashboard.cards.projects.subtitle', 'Active projects')}
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">
						{t('dashboard.cards.translations', 'Translations')}
					</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">1,234</p>
					<p class="text-sm text-muted-foreground">{t('dashboard.cards.keys', 'Total keys')}</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">{t('dashboard.cards.languages', 'Languages')}</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">8</p>
					<p class="text-sm text-muted-foreground">
						{t('dashboard.cards.languages.subtitle', 'Supported locales')}
					</p>
				</CardContent>
			</Card>
		</div>
	{:else}
		<!-- Empty state when no workspace selected but workspaces exist -->
		<EmptyState
			title={t('workspace.none_selected_title', 'No workspace selected')}
			description={t(
				'workspace.select_description',
				'Select a workspace from the dropdown in the header to view your dashboard.'
			)}
		/>
	{/if}
</PageBody>
