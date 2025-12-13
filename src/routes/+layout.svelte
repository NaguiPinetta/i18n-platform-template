<script lang="ts">
	import '../app.css';
	import { locale, dir } from '$lib/stores/direction';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { onMount } from 'svelte';

	// Update HTML attributes when locale or direction changes
	$: if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('lang', $locale);
		document.documentElement.setAttribute('dir', $dir);
	}

	// Initialize on mount
	onMount(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('lang', $locale);
			document.documentElement.setAttribute('dir', $dir);
		}
	});
</script>

<div class="flex h-screen overflow-hidden">
	<Sidebar />
	<div class="flex flex-1 flex-col overflow-hidden">
		<Header />
		<main class="flex-1 overflow-y-auto bg-background">
			<slot />
		</main>
	</div>
</div>
