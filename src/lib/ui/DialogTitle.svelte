<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { cn } from '$lib/utils';

	export let className: string = '';
	$: classAttr = $$props.class || '';
</script>

<Dialog.Title class={cn('text-lg font-semibold leading-none tracking-tight', className, classAttr)} {...$$restProps}>
	<slot />
</Dialog.Title>
