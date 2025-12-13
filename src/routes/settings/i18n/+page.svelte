<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import LoadingState from '$lib/ui/LoadingState.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { currentWorkspace } from '$lib/stores/workspace';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { missingKeys, clearRegistry } from '$lib/stores/i18n-registry';

	const supabase = createClient();
	let languagesCount = 0;
	let keysCount = 0;
	let coverage = 0;
	let loading = true;
	let canSyncKeys = false;
	let syncingKeys = false;
	let syncError = '';
	let syncSuccess = '';

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	onMount(() => {
		if (supabaseConfigured && hasWorkspace) {
			loadStats();
			loadCanSync();
		} else {
			loading = false;
		}
	});

	$: if (supabaseConfigured && hasWorkspace) {
		// Re-evaluate permissions when workspace changes
		loadCanSync();
	}

	async function loadStats() {
		if (!supabase || !$currentWorkspace) {
			loading = false;
			return;
		}

		loading = true;

		// Load languages count
		const { count: langsCount } = await supabase
			.from('i18n_languages')
			.select('*', { count: 'exact', head: true })
			.eq('workspace_id', $currentWorkspace.id);

		// Load keys count
		const { count: keysCnt } = await supabase
			.from('i18n_keys')
			.select('*', { count: 'exact', head: true })
			.eq('workspace_id', $currentWorkspace.id);

		// Load translations for coverage calculation
		const { data: translations } = await supabase
			.from('i18n_translations')
			.select('id')
			.eq('workspace_id', $currentWorkspace.id)
			.not('value', 'is', null)
			.neq('value', '');

		languagesCount = langsCount || 0;
		keysCount = keysCnt || 0;

		// Calculate coverage: non-empty translations / (keys * languages)
		const totalPossible = keysCount * languagesCount;
		if (totalPossible > 0) {
			coverage = Math.round(((translations?.length || 0) / totalPossible) * 100);
		} else {
			coverage = 0;
		}

		loading = false;
	}

	async function loadCanSync() {
		if (!browser) return;
		syncError = '';
		syncSuccess = '';
		canSyncKeys = false;

		if (!supabaseConfigured || !supabase || !$currentWorkspace) return;
		const session = $page.data.session;
		if (!session) return;

		// Owner check via workspace row
		if (($currentWorkspace as any).owner_id && session.user?.id === ($currentWorkspace as any).owner_id) {
			canSyncKeys = true;
			return;
		}

		// Fallback: check membership role
		const { data, error } = await supabase
			.from('workspace_members')
			.select('role')
			.eq('workspace_id', $currentWorkspace.id)
			.eq('user_id', session.user.id)
			.single();

		if (error) return;
		const role = (data as any)?.role;
		canSyncKeys = role === 'owner' || role === 'admin';
	}

	async function syncRegistryToWorkspace() {
		if (!browser) return;
		syncError = '';
		syncSuccess = '';

		if (!canSyncKeys) {
			syncError = 'Only workspace owners/admins can sync keys.';
			return;
		}

		const entries = Array.from($missingKeys.values());
		if (entries.length === 0) return;

		syncingKeys = true;
		try {
			const res = await fetch('/api/i18n/sync-keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					keys: entries.map((e) => ({
						key: e.key,
						module: e.module || 'ui',
						type: e.type || 'microcopy',
						screen: e.screen,
						context: e.context,
						screenshot_ref: e.screenshot_ref,
						max_chars: e.max_chars ?? null,
						fallback_en: e.fallback
					}))
				})
			});

			if (!res.ok) {
				const msg = await res.text().catch(() => '');
				throw new Error(msg || `Sync failed (${res.status})`);
			}

			const data = await res.json();
			clearRegistry();
			await loadStats();
			syncSuccess = `Synced keys. Inserted: ${data.inserted_keys || 0}, Updated: ${data.updated_keys || 0}, EN filled: ${data.en_values_written || 0}.`;
		} catch (err) {
			syncError = err instanceof Error ? err.message : 'Failed to sync keys';
		} finally {
			syncingKeys = false;
		}
	}

	function downloadRegistryCsv() {
		if (!browser) return;
		const entries = Array.from($missingKeys.values());
		const header = ['key', 'module', 'type', 'screen', 'context', 'screenshot_ref', 'max_chars', 'en'];

		function esc(v: unknown): string {
			const s = v === null || v === undefined ? '' : String(v);
			if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
			return s;
		}

		const rows = [header.join(',')].concat(
			entries.map((e) =>
				[
					e.key,
					e.module || 'ui',
					e.type || 'microcopy',
					e.screen || '',
					e.context || '',
					e.screenshot_ref || '',
					e.max_chars ?? '',
					e.fallback || ''
				]
					.map(esc)
					.join(',')
			)
		);

		const csv = rows.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `i18n_registry_${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
</script>

<PageBody>
	<PageHeader
		title="i18n Management"
		description="Manage translation keys, languages, and import/export workflows"
	/>

	{#if !supabaseConfigured}
		<EmptyState
			title="Supabase Not Configured"
			description="Please configure Supabase environment variables to use i18n features."
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title="No Workspace Selected"
			description="Please select or create a workspace to manage translations."
		>
			<svelte:fragment slot="actions">
				<Button on:click={() => goto('/dashboard')}>Go to Dashboard</Button>
			</svelte:fragment>
		</EmptyState>
	{:else if loading}
		<LoadingState />
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Languages</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{languagesCount}</p>
					<p class="text-sm text-muted-foreground">Configured languages</p>
					<Button variant="outline" class="mt-4 w-full" on:click={() => goto('/settings/i18n/languages')}>
						Manage Languages
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Translation Keys</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{keysCount}</p>
					<p class="text-sm text-muted-foreground">Total keys</p>
					<Button variant="outline" class="mt-4 w-full" on:click={() => goto('/settings/i18n/keys')}>
						Manage Keys
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Coverage</h3>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{coverage}%</p>
					<p class="text-sm text-muted-foreground">Translation coverage</p>
				</CardContent>
			</Card>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Export CSV</h3>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground mb-4">
						Export all translation keys and values to CSV for translation in Omniglot or other tools.
					</p>
					<Button variant="outline" class="w-full" on:click={() => goto('/settings/i18n/export')}>
						Export Translations
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Import CSV</h3>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground mb-4">
						Import translated CSV files back into the system. Supports conflict resolution policies.
					</p>
					<Button variant="outline" class="w-full" on:click={() => goto('/settings/i18n/import')}>
						Import Translations
					</Button>
				</CardContent>
			</Card>
		</div>

		<div class="mt-6">
			<Card>
				<CardHeader>
					<h3 class="text-lg font-semibold">Key Registry</h3>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						As you replace strings with <code class="rounded bg-muted px-1 py-0.5">t('key','English')</code>, missing
						keys are collected locally so you can sync them into the workspace for export.
					</p>

					<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<p class="text-2xl font-bold">{$missingKeys.size}</p>
							<p class="text-sm text-muted-foreground">Keys collected locally</p>
						</div>
						<div class="flex gap-2">
							<Button
								variant="outline"
								disabled={$missingKeys.size === 0}
								on:click={downloadRegistryCsv}
							>
								Download registry CSV
							</Button>
							<Button
								disabled={!canSyncKeys || syncingKeys || $missingKeys.size === 0}
								on:click={syncRegistryToWorkspace}
								title={!canSyncKeys ? 'Only owners/admins can sync keys' : ''}
							>
								{syncingKeys ? 'Syncing...' : 'Sync to Workspace'}
							</Button>
						</div>
					</div>

					{#if syncError}
						<div class="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{syncError}
						</div>
					{/if}
					{#if syncSuccess}
						<div class="mt-4 rounded-md bg-primary/10 p-3 text-sm text-primary">
							{syncSuccess}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
</PageBody>
