<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DialogTitle from '$lib/ui/DialogTitle.svelte';
	import DialogDescription from '$lib/ui/DialogDescription.svelte';
	import LoadingState from '$lib/ui/LoadingState.svelte';
	import { createClient } from '$lib/supabase/client';
	import { currentWorkspace } from '$lib/stores/workspace';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Plus, Trash2, Edit } from 'lucide-svelte';

	interface Key {
		id: string;
		workspace_id: string;
		key: string;
		module: string;
		type: string;
		screen: string | null;
		context: string | null;
		screenshot_ref: string | null;
		max_chars: number | null;
		created_at: string;
	}

	const supabase = createClient();
	let keys: Key[] = [];
	let filteredKeys: Key[] = [];
	let loading = true;
	let searchQuery = '';
	let showAddDialog = false;
	let showEditDialog = false;
	let showDeleteDialog = false;
	let selectedKey: Key | null = null;
	let formKey = '';
	let formModule = '';
	let formType = '';
	let formScreen = '';
	let formContext = '';
	let formScreenshotRef = '';
	let formMaxChars = '';

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	$: {
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filteredKeys = keys.filter(
				(k) =>
					k.key.toLowerCase().includes(query) ||
					k.module.toLowerCase().includes(query) ||
					(k.screen && k.screen.toLowerCase().includes(query)) ||
					(k.context && k.context.toLowerCase().includes(query))
			);
		} else {
			filteredKeys = keys;
		}
	}

	onMount(() => {
		if (supabaseConfigured && hasWorkspace) {
			loadKeys();
		} else {
			loading = false;
		}
	});

	async function loadKeys() {
		if (!supabase || !$currentWorkspace) return;

		loading = true;
		const { data, error } = await supabase
			.from('i18n_keys')
			.select('*')
			.eq('workspace_id', $currentWorkspace.id)
			.order('module')
			.order('key');

		if (error) {
			console.error('Error loading keys:', error);
		} else {
			keys = data || [];
		}
		loading = false;
	}

	function openAddDialog() {
		formKey = '';
		formModule = '';
		formType = '';
		formScreen = '';
		formContext = '';
		formScreenshotRef = '';
		formMaxChars = '';
		showAddDialog = true;
	}

	function openEditDialog(key: Key) {
		selectedKey = key;
		formKey = key.key;
		formModule = key.module;
		formType = key.type;
		formScreen = key.screen || '';
		formContext = key.context || '';
		formScreenshotRef = key.screenshot_ref || '';
		formMaxChars = key.max_chars?.toString() || '';
		showEditDialog = true;
	}

	function openDeleteDialog(key: Key) {
		selectedKey = key;
		showDeleteDialog = true;
	}

	async function handleSave() {
		if (!supabase || !$currentWorkspace || !formKey.trim() || !formModule.trim() || !formType.trim())
			return;

		const keyData: any = {
			workspace_id: $currentWorkspace.id,
			key: formKey.trim(),
			module: formModule.trim(),
			type: formType.trim()
		};

		if (formScreen.trim()) keyData.screen = formScreen.trim();
		if (formContext.trim()) keyData.context = formContext.trim();
		if (formScreenshotRef.trim()) keyData.screenshot_ref = formScreenshotRef.trim();
		if (formMaxChars.trim()) {
			const maxChars = parseInt(formMaxChars);
			if (!isNaN(maxChars)) keyData.max_chars = maxChars;
		}

		if (showAddDialog) {
			const { error } = await supabase.from('i18n_keys').insert(keyData);

			if (error) {
				console.error('Error creating key:', error);
				alert('Failed to create key: ' + error.message);
			} else {
				showAddDialog = false;
				loadKeys();
			}
		} else if (showEditDialog && selectedKey) {
			const { error } = await supabase.from('i18n_keys').update(keyData).eq('id', selectedKey.id);

			if (error) {
				console.error('Error updating key:', error);
				alert('Failed to update key: ' + error.message);
			} else {
				showEditDialog = false;
				selectedKey = null;
				loadKeys();
			}
		}
	}

	async function handleDelete() {
		if (!supabase || !selectedKey) return;

		const { error } = await supabase.from('i18n_keys').delete().eq('id', selectedKey.id);

		if (error) {
			console.error('Error deleting key:', error);
			alert('Failed to delete key: ' + error.message);
		} else {
			showDeleteDialog = false;
			selectedKey = null;
			loadKeys();
		}
	}
</script>

<PageBody>
	<PageHeader title="Translation Keys" description="Manage translation keys and metadata">
		<svelte:fragment slot="actions">
			<Button on:click={openAddDialog} disabled={!supabaseConfigured || !hasWorkspace}>
				<Plus class="mr-2 h-4 w-4" />
				Add Key
			</Button>
		</svelte:fragment>
	</PageHeader>

	{#if !supabaseConfigured}
		<EmptyState
			title="Supabase Not Configured"
			description="Please configure Supabase environment variables to manage translation keys."
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title="No Workspace Selected"
			description="Please select or create a workspace to manage translation keys."
		/>
	{:else if loading}
		<LoadingState />
	{:else if keys.length === 0}
		<EmptyState
			title="No translation keys"
			description="Add your first translation key to get started."
		>
			<svelte:fragment slot="actions">
				<Button on:click={openAddDialog}>Add Key</Button>
			</svelte:fragment>
		</EmptyState>
	{:else}
		<DataToolbar>
			<svelte:fragment slot="search">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search keys, modules, screens..."
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
				/>
			</svelte:fragment>
		</DataToolbar>

		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="px-6 py-3 text-left text-sm font-medium">Key</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Module</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Type</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Screen</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Screenshot Ref</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Context</th>
								<th class="px-6 py-3 text-right text-sm font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredKeys as key}
								<tr class="border-b last:border-0 hover:bg-accent/50">
									<td class="px-6 py-4 text-sm font-mono">{key.key}</td>
									<td class="px-6 py-4 text-sm">{key.module}</td>
									<td class="px-6 py-4 text-sm">
										<span class="rounded-full bg-accent px-2 py-1 text-xs font-medium">
											{key.type}
										</span>
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{key.screen || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{key.screenshot_ref || '-'}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{key.context || '-'}
									</td>
									<td class="px-6 py-4 text-sm">
										<div class="flex justify-end gap-2">
											<Button variant="ghost" size="icon" on:click={() => openEditDialog(key)}>
												<Edit class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												on:click={() => openDeleteDialog(key)}
											>
												<Trash2 class="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Add/Edit Dialog -->
	<Dialog bind:open={showAddDialog}>
		<DialogTitle>Add Translation Key</DialogTitle>
		<DialogDescription class="mb-4">
			Enter the key identifier and metadata. Key, Module, and Type are required.
		</DialogDescription>
		<div class="space-y-4 max-h-[60vh] overflow-y-auto">
			<div>
				<label for="key" class="mb-2 block text-sm font-medium">Key *</label>
				<input
					id="key"
					type="text"
					bind:value={formKey}
					placeholder="button.save"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="module" class="mb-2 block text-sm font-medium">Module *</label>
				<input
					id="module"
					type="text"
					bind:value={formModule}
					placeholder="common"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="type" class="mb-2 block text-sm font-medium">Type *</label>
				<input
					id="type"
					type="text"
					bind:value={formType}
					placeholder="button"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="screen" class="mb-2 block text-sm font-medium">Screen</label>
				<input
					id="screen"
					type="text"
					bind:value={formScreen}
					placeholder="settings"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="context" class="mb-2 block text-sm font-medium">Context</label>
				<textarea
					id="context"
					bind:value={formContext}
					placeholder="Additional context for translators"
					rows="3"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="screenshot-ref" class="mb-2 block text-sm font-medium">Screenshot Ref</label>
				<input
					id="screenshot-ref"
					type="text"
					bind:value={formScreenshotRef}
					placeholder="screenshot-url"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="max-chars" class="mb-2 block text-sm font-medium">Max Characters</label>
				<input
					id="max-chars"
					type="number"
					bind:value={formMaxChars}
					placeholder="100"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" on:click={() => (showAddDialog = false)}>Cancel</Button>
				<Button
					on:click={handleSave}
					disabled={!formKey.trim() || !formModule.trim() || !formType.trim()}
				>
					Save
				</Button>
			</div>
		</div>
	</Dialog>

	<Dialog bind:open={showEditDialog}>
		<DialogTitle>Edit Translation Key</DialogTitle>
		<DialogDescription class="mb-4">
			Update the key metadata. Key, Module, and Type are required.
		</DialogDescription>
		<div class="space-y-4 max-h-[60vh] overflow-y-auto">
			<div>
				<label for="edit-key" class="mb-2 block text-sm font-medium">Key *</label>
				<input
					id="edit-key"
					type="text"
					bind:value={formKey}
					placeholder="button.save"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-module" class="mb-2 block text-sm font-medium">Module *</label>
				<input
					id="edit-module"
					type="text"
					bind:value={formModule}
					placeholder="common"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-type" class="mb-2 block text-sm font-medium">Type *</label>
				<input
					id="edit-type"
					type="text"
					bind:value={formType}
					placeholder="button"
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-screen" class="mb-2 block text-sm font-medium">Screen</label>
				<input
					id="edit-screen"
					type="text"
					bind:value={formScreen}
					placeholder="settings"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-context" class="mb-2 block text-sm font-medium">Context</label>
				<textarea
					id="edit-context"
					bind:value={formContext}
					placeholder="Additional context for translators"
					rows="3"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-screenshot-ref" class="mb-2 block text-sm font-medium">Screenshot Ref</label>
				<input
					id="edit-screenshot-ref"
					type="text"
					bind:value={formScreenshotRef}
					placeholder="screenshot-url"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-max-chars" class="mb-2 block text-sm font-medium">Max Characters</label>
				<input
					id="edit-max-chars"
					type="number"
					bind:value={formMaxChars}
					placeholder="100"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" on:click={() => (showEditDialog = false)}>Cancel</Button>
				<Button
					on:click={handleSave}
					disabled={!formKey.trim() || !formModule.trim() || !formType.trim()}
				>
					Save
				</Button>
			</div>
		</div>
	</Dialog>

	<!-- Delete Confirmation Dialog -->
	<Dialog bind:open={showDeleteDialog}>
		<DialogTitle>Delete Translation Key</DialogTitle>
		<DialogDescription class="mb-4">
			Are you sure you want to delete the key "{selectedKey?.key}"? This will also delete all
			translations for this key. This action cannot be undone.
		</DialogDescription>
		<div class="flex justify-end gap-2">
			<Button variant="outline" on:click={() => (showDeleteDialog = false)}>Cancel</Button>
			<Button variant="destructive" on:click={handleDelete}>Delete</Button>
		</div>
	</Dialog>
</PageBody>
