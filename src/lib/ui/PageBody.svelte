<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = 'full';

	const maxWidthClasses = {
		sm: 'max-w-screen-sm',
		md: 'max-w-screen-md',
		lg: 'max-w-screen-lg',
		xl: 'max-w-screen-xl',
		'2xl': 'max-w-screen-2xl',
		full: 'max-w-full'
	};
</script>

<div class={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8', maxWidthClasses[maxWidth], className)}>
	<slot />
</div>
