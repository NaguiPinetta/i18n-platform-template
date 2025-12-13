<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	$: classAttr = $$props.class || '';
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className, classAttr)} {...$$restProps}>
	<slot />
</div>
