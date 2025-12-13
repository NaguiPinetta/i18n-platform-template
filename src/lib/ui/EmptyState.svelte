<script lang="ts">
	import { cn } from '$lib/utils';

	export let title: string = 'No items found';
	export let description: string = 'Get started by creating a new item.';
	export let className: string = '';
</script>

<div class={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
	{#if $$slots.icon}
		<div class="mb-4 text-muted-foreground">
			<slot name="icon" />
		</div>
	{/if}
	<h3 class="text-lg font-semibold">{title}</h3>
	{#if description}
		<p class="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
	{/if}
	{#if $$slots.actions}
		<div class="mt-6">
			<slot name="actions" />
		</div>
	{/if}
</div>
