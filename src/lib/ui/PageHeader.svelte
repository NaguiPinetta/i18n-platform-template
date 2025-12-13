<script lang="ts">
	import { cn } from '$lib/utils';

	export let title: string;
	export let description: string = '';
	export let className: string = '';
</script>

<header class={cn('mb-6', className)}>
	<h1 class="text-3xl font-bold tracking-tight">{title}</h1>
	{#if description}
		<p class="mt-2 text-muted-foreground">{description}</p>
	{/if}
	{#if $$slots.actions}
		<div class="mt-4 flex items-center gap-2">
			<slot name="actions" />
		</div>
	{/if}
</header>
