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
	import { t } from '$lib/stores';

	interface Language {
		id: string;
		workspace_id: string;
		code: string;
		name: string;
		is_rtl: boolean;
		created_at: string;
	}

	const supabase = createClient();
	let languages: Language[] = [];
	let loading = true;
	let showAddDialog = false;
	let showEditDialog = false;
	let showDeleteDialog = false;
	let selectedLanguage: Language | null = null;
	let formCode = '';
	let formName = '';
	let formIsRtl = false;

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	onMount(() => {
		if (supabaseConfigured && hasWorkspace) {
			loadLanguages();
		} else {
			loading = false;
		}
	});

	async function loadLanguages() {
		if (!supabase || !$currentWorkspace) return;

		loading = true;
		const { data, error } = await supabase
			.from('i18n_languages')
			.select('*')
			.eq('workspace_id', $currentWorkspace.id)
			.order('code');

		if (error) {
			console.error('Error loading languages:', error);
		} else {
			languages = data || [];
		}
		loading = false;
	}

	function openAddDialog() {
		formCode = '';
		formName = '';
		formIsRtl = false;
		showAddDialog = true;
	}

	function openEditDialog(language: Language) {
		selectedLanguage = language;
		formCode = language.code;
		formName = language.name;
		formIsRtl = language.is_rtl;
		showEditDialog = true;
	}

	function openDeleteDialog(language: Language) {
		selectedLanguage = language;
		showDeleteDialog = true;
	}

	async function handleSave() {
		if (!supabase || !$currentWorkspace || !formCode.trim() || !formName.trim()) return;

		if (showAddDialog) {
			const { error } = await supabase.from('i18n_languages').insert({
				workspace_id: $currentWorkspace.id,
				code: formCode.trim(),
				name: formName.trim(),
				is_rtl: formIsRtl
			});

			if (error) {
				console.error('Error creating language:', error);
				alert(t('i18n.languages.create_error', 'Failed to create language: ') + error.message);
			} else {
				showAddDialog = false;
				loadLanguages();
			}
		} else if (showEditDialog && selectedLanguage) {
			const { error } = await supabase
				.from('i18n_languages')
				.update({
					code: formCode.trim(),
					name: formName.trim(),
					is_rtl: formIsRtl
				})
				.eq('id', selectedLanguage.id);

			if (error) {
				console.error('Error updating language:', error);
				alert(t('i18n.languages.update_error', 'Failed to update language: ') + error.message);
			} else {
				showEditDialog = false;
				selectedLanguage = null;
				loadLanguages();
			}
		}
	}

	async function handleDelete() {
		if (!supabase || !selectedLanguage) return;

		const { error } = await supabase.from('i18n_languages').delete().eq('id', selectedLanguage.id);

		if (error) {
			console.error('Error deleting language:', error);
			alert(t('i18n.languages.delete_error', 'Failed to delete language: ') + error.message);
		} else {
			showDeleteDialog = false;
			selectedLanguage = null;
			loadLanguages();
		}
	}
</script>

<PageBody>
	<PageHeader
		title={t('i18n.languages.title', 'Languages')}
		description={t('i18n.languages.subtitle', 'Manage supported languages for translations')}
	>
		<svelte:fragment slot="actions">
			<Button on:click={openAddDialog} disabled={!supabaseConfigured || !hasWorkspace}>
				<Plus class="mr-2 h-4 w-4" />
				{t('i18n.languages.add', 'Add Language')}
			</Button>
		</svelte:fragment>
	</PageHeader>

	{#if !supabaseConfigured}
		<EmptyState
			title={t('errors.supabase_not_configured', 'Supabase Not Configured')}
			description={t(
				'errors.supabase_not_configured.description',
				'Please configure Supabase environment variables to manage languages.'
			)}
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title={t('workspace.none_selected_title', 'No Workspace Selected')}
			description={t(
				'workspace.select_description',
				'Please select or create a workspace to manage languages.'
			)}
		/>
	{:else if loading}
		<LoadingState />
	{:else if languages.length === 0}
		<EmptyState
			title={t('empty.no_data', 'No languages configured')}
			description={t('i18n.languages.empty.description', 'Add your first language to get started with translations.')}
		>
			<svelte:fragment slot="actions">
				<Button on:click={openAddDialog}>{t('i18n.languages.add', 'Add Language')}</Button>
			</svelte:fragment>
		</EmptyState>
	{:else}
		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="px-6 py-3 text-left text-sm font-medium">
									{t('i18n.table.code', 'Code')}
								</th>
								<th class="px-6 py-3 text-left text-sm font-medium">
									{t('i18n.table.name', 'Name')}
								</th>
								<th class="px-6 py-3 text-left text-sm font-medium">
									{t('i18n.table.rtl', 'RTL')}
								</th>
								<th class="px-6 py-3 text-left text-sm font-medium">
									{t('i18n.table.created', 'Created')}
								</th>
								<th class="px-6 py-3 text-right text-sm font-medium">
									{t('i18n.table.actions', 'Actions')}
								</th>
							</tr>
						</thead>
						<tbody>
							{#each languages as language}
								<tr class="border-b last:border-0 hover:bg-accent/50">
									<td class="px-6 py-4 text-sm font-mono">{language.code}</td>
									<td class="px-6 py-4 text-sm">{language.name}</td>
									<td class="px-6 py-4 text-sm">
										{#if language.is_rtl}
											<span class="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
												{t('i18n.table.rtl', 'RTL')}
											</span>
										{:else}
											<span class="text-muted-foreground">{t('i18n.table.ltr', 'LTR')}</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{new Date(language.created_at).toLocaleDateString()}
									</td>
									<td class="px-6 py-4 text-sm">
										<div class="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="icon"
												on:click={() => openEditDialog(language)}
											>
												<Edit class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												on:click={() => openDeleteDialog(language)}
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
		<DialogTitle>
			{showAddDialog
				? t('i18n.languages.add', 'Add Language')
				: t('i18n.languages.edit', 'Edit Language')}
		</DialogTitle>
		<DialogDescription class="mb-4">
			{t('i18n.languages.dialog.description', "Enter the language code (e.g., 'en', 'ar') and display name.")}
		</DialogDescription>
		<div class="space-y-4">
			<div>
				<label for="code" class="mb-2 block text-sm font-medium">
					{t('i18n.languages.dialog.code_label', 'Language Code')}
				</label>
				<input
					id="code"
					type="text"
					bind:value={formCode}
					placeholder={t('i18n.languages.dialog.code_placeholder', 'en')}
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="name" class="mb-2 block text-sm font-medium">
					{t('i18n.languages.dialog.name_label', 'Display Name')}
				</label>
				<input
					id="name"
					type="text"
					bind:value={formName}
					placeholder={t('i18n.languages.dialog.name_placeholder', 'English')}
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div class="flex items-center gap-2">
				<input
					id="rtl"
					type="checkbox"
					bind:checked={formIsRtl}
					class="h-4 w-4 rounded border-input"
				/>
				<label for="rtl" class="text-sm font-medium">
					{t('i18n.languages.dialog.rtl_label', 'Right-to-Left (RTL)')}
				</label>
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" on:click={() => (showAddDialog = false)}>
					{t('common.cancel', 'Cancel')}
				</Button>
				<Button on:click={handleSave} disabled={!formCode.trim() || !formName.trim()}>
					{t('common.save', 'Save')}
				</Button>
			</div>
		</div>
	</Dialog>

	<Dialog bind:open={showEditDialog}>
		<DialogTitle>{t('i18n.languages.edit', 'Edit Language')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t('i18n.languages.dialog.edit_description', 'Update the language code and display name.')}
		</DialogDescription>
		<div class="space-y-4">
			<div>
				<label for="edit-code" class="mb-2 block text-sm font-medium">
					{t('i18n.languages.dialog.code_label', 'Language Code')}
				</label>
				<input
					id="edit-code"
					type="text"
					bind:value={formCode}
					placeholder={t('i18n.languages.dialog.code_placeholder', 'en')}
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div>
				<label for="edit-name" class="mb-2 block text-sm font-medium">
					{t('i18n.languages.dialog.name_label', 'Display Name')}
				</label>
				<input
					id="edit-name"
					type="text"
					bind:value={formName}
					placeholder={t('i18n.languages.dialog.name_placeholder', 'English')}
					required
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>
			<div class="flex items-center gap-2">
				<input
					id="edit-rtl"
					type="checkbox"
					bind:checked={formIsRtl}
					class="h-4 w-4 rounded border-input"
				/>
				<label for="edit-rtl" class="text-sm font-medium">
					{t('i18n.languages.dialog.rtl_label', 'Right-to-Left (RTL)')}
				</label>
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" on:click={() => (showEditDialog = false)}>
					{t('common.cancel', 'Cancel')}
				</Button>
				<Button on:click={handleSave} disabled={!formCode.trim() || !formName.trim()}>
					{t('common.save', 'Save')}
				</Button>
			</div>
		</div>
	</Dialog>

	<!-- Delete Confirmation Dialog -->
	<Dialog bind:open={showDeleteDialog}>
		<DialogTitle>{t('i18n.languages.delete', 'Delete Language')}</DialogTitle>
		<DialogDescription class="mb-4">
			{t('i18n.languages.delete.confirmation_prefix', 'Are you sure you want to delete')} "{selectedLanguage?.name || ''}"? {t('i18n.languages.delete.confirmation_suffix', 'This will also delete all translations for this language. This action cannot be undone.')}
		</DialogDescription>
		<div class="flex justify-end gap-2">
			<Button variant="outline" on:click={() => (showDeleteDialog = false)}>
				{t('common.cancel', 'Cancel')}
			</Button>
			<Button variant="destructive" on:click={handleDelete}>
				{t('common.delete', 'Delete')}
			</Button>
		</div>
	</Dialog>
</PageBody>
