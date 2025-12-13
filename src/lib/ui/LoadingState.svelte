<script lang="ts">
	import { cn } from '$lib/utils';

	export let message: string = 'Loading...';
	export let className: string = '';
</script>

<div class={cn('flex flex-col items-center justify-center py-12', className)}>
	<div class="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
	<p class="text-sm text-muted-foreground">{message}</p>
</div>
