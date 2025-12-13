<script lang="ts">
	import '../app.css';
	import { locale, dir } from '$lib/stores/direction';
	import { workspaces, currentWorkspaceId } from '$lib/stores/workspace';
	import { effectiveTheme } from '$lib/stores/theme';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SupabaseBanner from '$lib/components/SupabaseBanner.svelte';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// Sync workspaces from server
	$: if (data.workspaces) {
		workspaces.set(data.workspaces);
		// Set current workspace if not set and workspaces exist
		if (data.workspaces.length > 0 && !$currentWorkspaceId) {
			currentWorkspaceId.set(data.workspaces[0].id);
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
		<Header session={data.session} user={data.user} workspaces={data.workspaces} />
		{#if !data.supabaseConfigured}
			<SupabaseBanner />
		{/if}
		<main class="flex-1 overflow-y-auto bg-background">
			<slot />
		</main>
	</div>
</div>
