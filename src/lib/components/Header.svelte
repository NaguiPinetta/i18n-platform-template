<script lang="ts">
	import { locale } from '$lib/stores/direction';
	import { cn } from '$lib/utils';
	import { Globe } from 'lucide-svelte';

	const languages = [
		{ code: 'en', label: 'English' },
		{ code: 'ar', label: 'العربية' }
	];

	function handleLocaleChange(code: string) {
		locale.set(code);
	}
</script>

<header class="flex h-16 items-center justify-between border-b bg-background px-6">
	<div class="flex items-center gap-4">
		<h2 class="text-lg font-semibold">Workspace</h2>
		<span class="text-sm text-muted-foreground">Placeholder</span>
	</div>
	<div class="flex items-center gap-4">
		<!-- Language Selector -->
		<div class="flex items-center gap-2">
			<Globe class="h-4 w-4 text-muted-foreground" />
			<div class="flex gap-1">
				{#each languages as lang}
					<button
						on:click={() => handleLocaleChange(lang.code)}
						class={cn(
							'rounded-md px-2 py-1 text-xs font-medium transition-colors',
							$locale === lang.code
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
						)}
					>
						{lang.label}
					</button>
				{/each}
			</div>
		</div>
		<!-- User Menu Placeholder -->
		<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
			<span class="text-sm font-medium">U</span>
		</div>
	</div>
</header>
