<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { cn } from '$lib/utils';

	export let className: string = '';
	$: classAttr = $$props.class || '';
</script>

<Dialog.Description class={cn('text-sm text-muted-foreground', className, classAttr)} {...$$restProps}>
	<slot />
</Dialog.Description>
