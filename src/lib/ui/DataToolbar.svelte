<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
</script>

<div class={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
	{#if $$slots.search}
		<div class="flex-1">
			<slot name="search" />
		</div>
	{/if}
	{#if $$slots.actions}
		<div class="flex items-center gap-2">
			<slot name="actions" />
		</div>
	{/if}
</div>
