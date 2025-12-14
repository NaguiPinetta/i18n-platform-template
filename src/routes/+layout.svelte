<script lang="ts">
	import '../app.css';
	import { locale, dir, setRtlLanguages } from '$lib/stores/direction';
	import { workspaces, currentWorkspaceId } from '$lib/stores/workspace';
	import { effectiveTheme } from '$lib/stores/theme';
	import { loadMessages, setRuntimeLocale } from '$lib/stores/i18n';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SupabaseBanner from '$lib/components/SupabaseBanner.svelte';
	import { onMount } from 'svelte';
	import { browser, dev } from '$app/environment';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let localeInitialized = false;
	let lastMessagesKey = '';

	let lastSyncedWorkspaceId: string | null = null;

	// Sync workspaces from server
	$: if (data.workspaces) {
		workspaces.set(data.workspaces);
		// Set current workspace if not set and workspaces exist
		if (data.workspaces.length > 0 && !$currentWorkspaceId) {
			currentWorkspaceId.set(data.workspaces[0].id);
		}
	}

	// Ensure workspace cookie is set when workspace changes (browser only)
	$: if (
		browser &&
		$currentWorkspaceId &&
		$currentWorkspaceId !== lastSyncedWorkspaceId &&
		data.session &&
		data.workspaces.some((w) => w.id === $currentWorkspaceId)
	) {
		lastSyncedWorkspaceId = $currentWorkspaceId;
		// Set cookie on server (async, non-blocking)
		fetch('/api/workspace/set', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ workspaceId: $currentWorkspaceId })
		}).catch((err) => {
			// Reset on error so it can retry
			lastSyncedWorkspaceId = null;
			console.debug('Workspace cookie sync failed:', err);
		});
	}

	// Sync workspace-configured RTL languages (fallback to defaults if empty)
	$: if (data.languages) {
		setRtlLanguages((data.languages || []).filter((l) => l.is_rtl).map((l) => l.code));
	}

	// Track data and page changes to ensure locale syncs on every navigation
	let lastDataLocale: string | null = null;
	let lastPagePath: string | null = null;

	// Sync locale from server on every navigation (ensures consistency)
	// React to both data.currentLocale and page.url changes to catch all navigation
	$: if (data.currentLocale) {
		const shouldSync = data.currentLocale !== lastDataLocale || $page.url.pathname !== lastPagePath;
		if (shouldSync) {
			lastDataLocale = data.currentLocale;
			lastPagePath = $page.url.pathname;
			if (data.currentLocale !== $locale) {
				locale.set(data.currentLocale);
				setRuntimeLocale(data.currentLocale);
			}
		}
	}

	// Load runtime messages when workspace/locale changes (no blocking UI)
	// Always use data.currentLocale (from server cookie) as source of truth
	// React to both data.currentLocale and page.url to ensure it runs on every navigation
	$: if (data.supabaseConfigured && data.session && $currentWorkspaceId && data.currentLocale) {
		const activeLocale = data.currentLocale;
		const key = `${$currentWorkspaceId}:${activeLocale}`;
		const pageChanged = $page.url.pathname !== lastPagePath;
		
		// Reload messages when:
		// 1. Locale from server changes
		// 2. Page changes (navigation)
		// 3. Workspace changes
		if (key !== lastMessagesKey || activeLocale !== lastDataLocale || pageChanged) {
			lastMessagesKey = key;
			lastDataLocale = activeLocale;
			lastPagePath = $page.url.pathname;
			// Ensure locale store is synced
			if (activeLocale !== $locale) {
				locale.set(activeLocale);
				setRuntimeLocale(activeLocale);
			}
			// Load messages with the locale from server (source of truth)
			// Force reload to bypass cache when locale changes
			const shouldForce = activeLocale !== lastDataLocale;
			loadMessages(shouldForce ? activeLocale : undefined).then(() => {
				// Invalidate all routes after messages load to force re-render
				// This ensures all components re-evaluate t() calls with new messages
				if (browser) {
					// Use a small delay to ensure state update completes
					setTimeout(() => {
						invalidateAll();
					}, 0);
				}
			});
		}
	}

	// Update HTML attributes when locale, direction, or theme changes
	$: if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('lang', $locale);
		document.documentElement.setAttribute('dir', $dir);
		// Theme is handled by theme store, but ensure it's applied
		if ($effectiveTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		if (browser && dev) {
			console.log(`[i18n Layout] HTML attributes updated - lang: ${$locale}, dir: ${$dir}`);
		}
	}

	// Initialize on mount
	onMount(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('lang', $locale);
			document.documentElement.setAttribute('dir', $dir);
			// Theme is handled by theme store
		}
	});
</script>

<div class="flex h-screen overflow-hidden">
	{#if data.session}
		<Sidebar />
	{/if}
	<div class="flex flex-1 flex-col overflow-hidden">
		<Header
			session={data.session}
			user={data.user}
			workspaces={data.workspaces}
			languages={data.languages}
			currentLocale={data.currentLocale}
		/>
		{#if !data.supabaseConfigured}
			<SupabaseBanner />
		{/if}
		<main class="flex-1 overflow-y-auto bg-background">
			<slot />
		</main>
	</div>
</div>
