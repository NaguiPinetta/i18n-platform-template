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
	import { browser, dev } from '$app/environment';
	import { currentWorkspace, currentWorkspaceId } from '$lib/stores/workspace';
	import { locale } from '$lib/stores';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { missingKeys, clearRegistry } from '$lib/stores/i18n-registry';
	import { t, highlightUntranslated } from '$lib/stores';
	import TranslatedText from '$lib/components/TranslatedText.svelte';

	const supabase = createClient();
	let languagesCount = 0;
	let keysCount = 0;
	let coverage = 0;
	let loading = true;
	let canSyncKeys = false;
	let syncingKeys = false;
	let syncError = '';
	let syncSuccess = '';

	// Diagnostics data (dev-only)
	let diagnosticsLoading = false;
	let diagnosticsData: {
		workspaceId: string | null;
		currentLocale: string;
		languagesCount: number;
		keysCount: number;
		translationsCount: number;
		missingTranslations: Array<{ key: string; fallback: string }>;
	} | null = null;

	$: supabaseConfigured = $page.data.supabaseConfigured;
	$: hasWorkspace = !!$currentWorkspace;

	onMount(() => {
		if (supabaseConfigured && hasWorkspace) {
			loadStats();
			loadCanSync();
			if (dev) {
				loadDiagnostics();
			}
		} else {
			loading = false;
		}
	});

	// Reload diagnostics when locale or workspace changes (dev-only)
	$: if (dev && supabaseConfigured && hasWorkspace && $locale) {
		loadDiagnostics();
	}

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

	async function loadDiagnostics() {
		if (!dev || !browser || !supabase || !$currentWorkspace) {
			diagnosticsData = null;
			return;
		}

		diagnosticsLoading = true;
		const currentLocaleValue = $locale || $page.data.currentLocale || 'en';

		try {
			// Get language ID for current locale
			const { data: language } = await supabase
				.from('i18n_languages')
				.select('id')
				.eq('workspace_id', $currentWorkspace.id)
				.eq('code', currentLocaleValue)
				.single();

			// Get all keys
			const { data: allKeys } = await supabase
				.from('i18n_keys')
				.select('id, key')
				.eq('workspace_id', $currentWorkspace.id);

			// Get translations for current locale
			let translationsCount = 0;
			let missingTranslations: Array<{ key: string; fallback: string }> = [];

			if (language?.id && allKeys) {
				const { data: translations } = await supabase
					.from('i18n_translations')
					.select('key_id, value')
					.eq('workspace_id', $currentWorkspace.id)
					.eq('language_id', language.id)
					.not('value', 'is', null)
					.neq('value', '');

				translationsCount = translations?.length || 0;

				// Build map of key_id -> value
				const translationMap = new Map<string, string>();
				if (translations) {
					for (const t of translations) {
						if (t.value) {
							translationMap.set(t.key_id, t.value);
						}
					}
				}

				// Find missing translations (first 10)
				const keyIdToKey = new Map<string, string>();
				for (const k of allKeys) {
					keyIdToKey.set(k.id, k.key);
				}

				for (const key of allKeys.slice(0, 20)) {
					// Check up to 20 keys to find 10 missing ones
					if (missingTranslations.length >= 10) break;

					const hasTranslation = translationMap.has(key.id);
					if (!hasTranslation) {
						// Try to get fallback from registry or use key as fallback
						const registryEntry = $missingKeys.get(key.key);
						missingTranslations.push({
							key: key.key,
							fallback: registryEntry?.fallback || key.key
						});
					}
				}
			}

			diagnosticsData = {
				workspaceId: $currentWorkspaceId,
				currentLocale: currentLocaleValue,
				languagesCount,
				keysCount,
				translationsCount,
				missingTranslations
			};
		} catch (err) {
			console.error('Error loading diagnostics:', err);
			diagnosticsData = null;
		} finally {
			diagnosticsLoading = false;
		}
	}

	function openMessagesJson() {
		if (!browser) return;
		const url = `/api/i18n/messages.json?ts=${Date.now()}`;
		window.open(url, '_blank');
	}

	async function loadCanSync() {
		if (!browser) return;
		syncError = '';
		syncSuccess = '';
		canSyncKeys = false;

		if (!supabaseConfigured || !supabase || !$currentWorkspace) return;
		const session = $page.data.session;
		if (!session) return;

		// Owner check via workspace row (primary check - most reliable)
		if (($currentWorkspace as any).owner_id && session.user?.id === ($currentWorkspace as any).owner_id) {
			canSyncKeys = true;
			return;
		}

		// Fallback: check membership role (may fail due to RLS/foreign key issues, but we try)
		try {
			const { data, error } = await supabase
				.from('workspace_members')
				.select('role')
				.eq('workspace_id', $currentWorkspace.id)
				.eq('user_id', session.user.id)
				.single();

			if (!error && data) {
				const role = (data as any)?.role;
				canSyncKeys = role === 'owner' || role === 'admin';
			}
			// If error, canSyncKeys stays false (user is not admin/member or query failed)
		} catch (err) {
			// Silently fail - user is not admin/member or there's a query issue
			console.debug('Could not check workspace membership for sync permission:', err);
		}
	}

	async function syncRegistryToWorkspace() {
		if (!browser) return;
		syncError = '';
		syncSuccess = '';

		const entries = Array.from($missingKeys.values());
		if (entries.length === 0) {
			syncError = t('i18n.registry.no_keys', 'No keys to sync');
			return;
		}

		// Check permissions - but allow sync attempt even if check failed (server will validate)
		if (!canSyncKeys) {
			// Re-check permissions before sync (might have changed)
			await loadCanSync();
			if (!canSyncKeys) {
				syncError = t('errors.unauthorized', 'Only workspace owners/admins can sync keys.');
				return;
			}
		}

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
						screen: e.screen || null,
						context: e.context || null,
						screenshot_ref: e.screenshot_ref || null,
						max_chars: e.max_chars ?? null,
						fallback_en: e.fallback
					}))
				})
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				const errorMsg = errorData.error || errorData.message || `Sync failed (${res.status})`;
				throw new Error(errorMsg);
			}

			const data = await res.json();
			clearRegistry();
			await loadStats();
			syncSuccess = t(
				'i18n.registry.sync_success',
				`Synced keys. Inserted: ${data.inserted_keys || 0}, Updated: ${data.updated_keys || 0}, EN filled: ${data.en_values_written || 0}.`
			);
		} catch (err) {
			console.error('Sync error:', err);
			syncError = err instanceof Error ? err.message : t('errors.generic', 'Failed to sync keys');
		} finally {
			syncingKeys = false;
		}
	}

	function downloadRegistryCsv() {
		if (!browser) return;
		const entries = Array.from($missingKeys.values());
		
		if (entries.length === 0) {
			console.warn('No keys to download');
			return;
		}

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
		// Clean up after a short delay to ensure download starts
		setTimeout(() => {
			a.remove();
			URL.revokeObjectURL(url);
		}, 100);
	}
</script>

<PageBody>
	<PageHeader
		title={t('i18n.title', 'i18n Management')}
		description={t('i18n.subtitle', 'Manage translation keys, languages, and import/export workflows')}
	/>

	{#if !supabaseConfigured}
		<EmptyState
			title={t('errors.supabase_not_configured', 'Supabase Not Configured')}
			description={t(
				'errors.supabase_not_configured.description',
				'Please configure Supabase environment variables to use i18n features.'
			)}
		/>
	{:else if !hasWorkspace}
		<EmptyState
			title={t('workspace.none_selected_title', 'No Workspace Selected')}
			description={t(
				'workspace.select_description',
				'Please select or create a workspace to manage translations.'
			)}
		>
			<svelte:fragment slot="actions">
				<Button on:click={() => goto('/dashboard')}>
					{t('common.go_to_dashboard', 'Go to Dashboard')}
				</Button>
			</svelte:fragment>
		</EmptyState>
	{:else if loading}
		<LoadingState />
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<TranslatedText
						key="i18n.languages.title"
						fallback="Languages"
						tag="h3"
						class="text-lg font-semibold"
					/>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{languagesCount}</p>
					<TranslatedText
						key="i18n.languages.configured"
						fallback="Configured languages"
						tag="p"
						class="text-sm text-muted-foreground"
					/>
					<Button variant="outline" class="mt-4 w-full" on:click={() => goto('/settings/i18n/languages')}>
						<TranslatedText key="common.manage" fallback="Manage" />{' '}
						<TranslatedText key="i18n.languages.title" fallback="Languages" />
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TranslatedText
						key="i18n.keys.title"
						fallback="Translation Keys"
						tag="h3"
						class="text-lg font-semibold"
					/>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{keysCount}</p>
					<TranslatedText
						key="i18n.keys.total"
						fallback="Total keys"
						tag="p"
						class="text-sm text-muted-foreground"
					/>
					<Button variant="outline" class="mt-4 w-full" on:click={() => goto('/settings/i18n/keys')}>
						<TranslatedText key="common.manage" fallback="Manage" />{' '}
						<TranslatedText key="i18n.keys.title" fallback="Translation Keys" />
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TranslatedText
						key="i18n.coverage"
						fallback="Coverage"
						tag="h3"
						class="text-lg font-semibold"
					/>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-bold">{coverage}%</p>
					<TranslatedText
						key="i18n.coverage.description"
						fallback="Translation coverage"
						tag="p"
						class="text-sm text-muted-foreground"
					/>
				</CardContent>
			</Card>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<TranslatedText
						key="i18n.export.title"
						fallback="Export CSV"
						tag="h3"
						class="text-lg font-semibold"
					/>
				</CardHeader>
				<CardContent>
					<TranslatedText
						key="i18n.export.description"
						fallback="Export all translation keys and values to CSV for translation in Omniglot or other tools."
						tag="p"
						class="text-sm text-muted-foreground mb-4"
					/>
					<Button variant="outline" class="w-full" on:click={() => goto('/settings/i18n/export')}>
						<TranslatedText key="i18n.export.button" fallback="Export Translations" />
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TranslatedText
						key="i18n.import.title"
						fallback="Import CSV"
						tag="h3"
						class="text-lg font-semibold"
					/>
				</CardHeader>
				<CardContent>
					<TranslatedText
						key="i18n.import.description"
						fallback="Import translated CSV files back into the system. Supports conflict resolution policies."
						tag="p"
						class="text-sm text-muted-foreground mb-4"
					/>
					<Button variant="outline" class="w-full" on:click={() => goto('/settings/i18n/import')}>
						<TranslatedText key="i18n.import.button" fallback="Import Translations" />
					</Button>
				</CardContent>
			</Card>
		</div>

		<div class="mt-6">
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<TranslatedText
							key="i18n.registry.title"
							fallback="Key Registry"
							tag="h3"
							class="text-lg font-semibold"
						/>
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								bind:checked={$highlightUntranslated}
								class="h-4 w-4 rounded border-gray-300"
							/>
							<span class="text-muted-foreground">
								{t('i18n.highlight_missing', 'Highlight missing translations')}
							</span>
						</label>
					</div>
				</CardHeader>
				<CardContent>
					<TranslatedText
						key="i18n.registry.description"
						fallback="As you replace strings with t('key','English'), missing keys are collected locally so you can sync them into the workspace for export."
						tag="p"
						class="text-sm text-muted-foreground"
					/>

					<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<p class="text-2xl font-bold">{$missingKeys.size}</p>
							<TranslatedText
								key="i18n.registry.collected"
								fallback="Keys collected locally"
								tag="p"
								class="text-sm text-muted-foreground"
							/>
						</div>
						<div class="flex gap-2">
							<Button
								variant="outline"
								disabled={$missingKeys.size === 0}
								on:click={downloadRegistryCsv}
								title={$missingKeys.size === 0 ? t('i18n.registry.no_keys', 'No keys to download') : ''}
							>
								<TranslatedText
									key="i18n.registry.download_csv"
									fallback="Download registry CSV"
								/>
							</Button>
							<Button
								disabled={syncingKeys || $missingKeys.size === 0}
								on:click={syncRegistryToWorkspace}
								title={
									!canSyncKeys
										? t('errors.unauthorized', 'Only owners/admins can sync keys')
										: $missingKeys.size === 0
											? t('i18n.registry.no_keys', 'No keys to sync')
											: ''
								}
							>
								{#if syncingKeys}
									<TranslatedText key="common.syncing" fallback="Syncing..." />
								{:else}
									<TranslatedText key="i18n.registry.sync" fallback="Sync to Workspace" />
								{/if}
							</Button>
						</div>
						{#if !canSyncKeys && $missingKeys.size > 0}
							<p class="mt-2 text-xs text-muted-foreground">
								{t(
									'i18n.registry.sync_hint',
									'Note: Only workspace owners and admins can sync keys. The sync button will be enabled once permissions are verified.'
								)}
							</p>
						{/if}
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

		<!-- Dev-only Diagnostics Panel -->
		{#if dev && supabaseConfigured && hasWorkspace}
			<div class="mt-6">
				<Card>
					<CardHeader>
						<h3 class="text-lg font-semibold">🔧 i18n Diagnostics (Dev Only)</h3>
					</CardHeader>
					<CardContent>
						{#if diagnosticsLoading}
							<p class="text-sm text-muted-foreground">Loading diagnostics...</p>
						{:else if diagnosticsData}
							<div class="space-y-4">
								<div class="grid gap-4 md:grid-cols-2">
									<div>
										<p class="text-xs font-medium text-muted-foreground">Workspace ID</p>
										<p class="text-sm font-mono break-all">{diagnosticsData.workspaceId || 'Not set'}</p>
									</div>
									<div>
										<p class="text-xs font-medium text-muted-foreground">Current Locale</p>
										<p class="text-sm font-mono">{diagnosticsData.currentLocale}</p>
									</div>
								</div>

								<div class="grid gap-4 md:grid-cols-3">
									<div>
										<p class="text-xs font-medium text-muted-foreground">Languages</p>
										<p class="text-2xl font-bold">{diagnosticsData.languagesCount}</p>
									</div>
									<div>
										<p class="text-xs font-medium text-muted-foreground">Total Keys</p>
										<p class="text-2xl font-bold">{diagnosticsData.keysCount}</p>
									</div>
									<div>
										<p class="text-xs font-medium text-muted-foreground">
											Translations ({diagnosticsData.currentLocale})
										</p>
										<p class="text-2xl font-bold">{diagnosticsData.translationsCount}</p>
										{#if diagnosticsData.keysCount > 0}
											<p class="text-xs text-muted-foreground">
												{Math.round(
													(diagnosticsData.translationsCount / diagnosticsData.keysCount) * 100
												)}%
												coverage
											</p>
										{/if}
									</div>
								</div>

								{#if diagnosticsData.missingTranslations.length > 0}
									<div>
										<p class="mb-2 text-xs font-medium text-muted-foreground">
											Missing Translations Sample ({diagnosticsData.missingTranslations.length} of{' '}
											{diagnosticsData.keysCount - diagnosticsData.translationsCount} missing)
										</p>
										<div class="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-2">
											{#each diagnosticsData.missingTranslations as item}
												<div class="flex items-start gap-2 text-xs">
													<span class="font-mono text-muted-foreground">{item.key}:</span>
													<span class="text-muted-foreground">{item.fallback}</span>
												</div>
											{/each}
										</div>
									</div>
								{:else if diagnosticsData.keysCount > 0}
									<div class="rounded-md border border-green-500/50 bg-green-50 dark:bg-green-900/20 p-3">
										<p class="text-sm text-green-800 dark:text-green-200">
											✓ All {diagnosticsData.keysCount} keys have translations for{' '}
											{diagnosticsData.currentLocale}
										</p>
									</div>
								{/if}

								<div class="pt-2">
									<Button variant="outline" size="sm" on:click={openMessagesJson}>
										Open Messages JSON
									</Button>
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">Unable to load diagnostics</p>
						{/if}
					</CardContent>
				</Card>
			</div>
		{/if}
	{/if}
</PageBody>
