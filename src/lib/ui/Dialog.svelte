<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	export let open: boolean = false;
	export let className: string = '';
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			transition={fade}
			transitionConfig={{ duration: 150 }}
			class="fixed inset-0 z-50 bg-black/80"
		/>
		<Dialog.Content
			transition={fade}
			class={cn(
				'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-card p-6 shadow-lg outline-none',
				className
			)}
			{...$$restProps}
		>
			<Dialog.Close
				class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
			>
				<X class="h-4 w-4" />
				<span class="sr-only">Close</span>
			</Dialog.Close>
			<slot />
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
