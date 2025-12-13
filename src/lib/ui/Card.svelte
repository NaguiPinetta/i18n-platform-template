<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	$: classAttr = $$props.class || '';
</script>

<div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className, classAttr)} {...$$restProps}>
	<slot />
</div>
