<script lang="ts">
	import { X } from 'lucide-svelte';
	import Button from '$lib/ui/Button.svelte';

	export let onDismiss: (() => void) | undefined = undefined;
	let dismissed = false;
</script>

{#if !dismissed}
	<div
		class="border-b bg-destructive/10 px-6 py-3 text-sm text-destructive"
		role="alert"
		aria-live="polite"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="flex-1">
				<strong>Supabase not configured.</strong> Add{' '}
				<code class="rounded bg-destructive/20 px-1 py-0.5 text-xs">PUBLIC_SUPABASE_URL</code> and{' '}
				<code class="rounded bg-destructive/20 px-1 py-0.5 text-xs">PUBLIC_SUPABASE_ANON_KEY</code>{' '}
				to <code class="rounded bg-destructive/20 px-1 py-0.5 text-xs">.env</code> to enable
				authentication and workspaces.
			</div>
			{#if onDismiss}
				<button
					on:click={() => {
						dismissed = true;
						onDismiss?.();
					}}
					class="rounded-md p-1 hover:bg-destructive/20"
					aria-label="Dismiss banner"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</div>
{/if}
