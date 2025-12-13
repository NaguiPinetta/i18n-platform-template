<script lang="ts">
	import { cn } from '$lib/utils';

	export let title: string = 'Something went wrong';
	export let message: string = 'An error occurred. Please try again.';
	export let className: string = '';
</script>

<div class={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
	<div class="mb-4 text-4xl">⚠️</div>
	<h3 class="text-lg font-semibold">{title}</h3>
	{#if message}
		<p class="mt-2 text-sm text-muted-foreground max-w-sm">{message}</p>
	{/if}
	{#if $$slots.actions}
		<div class="mt-6">
			<slot name="actions" />
		</div>
	{/if}
</div>
