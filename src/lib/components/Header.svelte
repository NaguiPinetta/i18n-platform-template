<script lang="ts">
	import { locale, currentWorkspaceId, currentWorkspace, theme, effectiveTheme } from '$lib/stores';
	import type { Workspace } from '$lib/stores/workspace';
	import { cn } from '$lib/utils';
	import { Globe, ChevronDown, LogOut, User, Sun, Moon, Monitor } from 'lucide-svelte';
	import Button from '$lib/ui/Button.svelte';
	import { goto } from '$app/navigation';
	import type { Session } from '@supabase/supabase-js';

	interface Props {
		session: Session | null;
		user: { email?: string } | null;
		workspaces: Workspace[];
	}

	export let session: Session | null = null;
	export let user: { email?: string } | null = null;
	export let workspaces: Workspace[] = [];

	let showWorkspaceMenu = false;
	let showUserMenu = false;
	let showThemeMenu = false;

	const languages = [
		{ code: 'en', label: 'English' },
		{ code: 'ar', label: 'العربية' }
	];

	function handleLocaleChange(code: string) {
		locale.set(code);
	}

	async function handleLogout() {
		await fetch('/logout', { method: 'POST' });
		goto('/login');
	}

	function handleWorkspaceChange(workspaceId: string) {
		currentWorkspaceId.set(workspaceId);
		showWorkspaceMenu = false;
	}

	function handleThemeChange(newTheme: 'system' | 'light' | 'dark') {
		theme.set(newTheme);
		showThemeMenu = false;
	}

	const themeOptions = [
		{ value: 'light' as const, label: 'Light', icon: Sun },
		{ value: 'dark' as const, label: 'Dark', icon: Moon },
		{ value: 'system' as const, label: 'System', icon: Monitor }
	];
</script>

<header class="flex h-16 items-center justify-between border-b bg-background px-6">
	<div class="flex items-center gap-4">
		{#if session && $currentWorkspace}
			<div class="relative">
				<button
					on:click={() => (showWorkspaceMenu = !showWorkspaceMenu)}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
				>
					<span>{$currentWorkspace.name}</span>
					<ChevronDown class="h-4 w-4" />
				</button>
				{#if showWorkspaceMenu}
					<div
						class="absolute top-full z-50 mt-2 w-48 rounded-md border bg-popover shadow-md"
						role="menu"
						tabindex="-1"
						on:click|stopPropagation
						on:keydown|stopPropagation
					>
						<div class="p-1">
							{#each workspaces as workspace}
								<button
									on:click={() => handleWorkspaceChange(workspace.id)}
									class={cn(
										'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
										$currentWorkspaceId === workspace.id
											? 'bg-accent text-accent-foreground'
											: 'hover:bg-accent hover:text-accent-foreground'
									)}
								>
									{workspace.name}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else if session}
			<h2 class="text-lg font-semibold">Workspace</h2>
			<span class="text-sm text-muted-foreground">No workspace selected</span>
		{:else}
			<h2 class="text-lg font-semibold">i18n Platform</h2>
		{/if}
	</div>
	<div class="flex items-center gap-4">
		<!-- Theme Toggle -->
		<div class="relative">
			<button
				on:click={() => (showThemeMenu = !showThemeMenu)}
				class="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
				aria-label="Toggle theme"
			>
				{#if $effectiveTheme === 'dark'}
					<Moon class="h-4 w-4" />
				{:else}
					<Sun class="h-4 w-4" />
				{/if}
			</button>
			{#if showThemeMenu}
				<div
					class="absolute right-0 top-full z-50 mt-2 w-40 rounded-md border bg-popover shadow-md"
					role="menu"
					tabindex="-1"
					on:click|stopPropagation
					on:keydown|stopPropagation
				>
					<div class="p-1">
						{#each themeOptions as option}
							<button
								on:click={() => handleThemeChange(option.value)}
								class={cn(
									'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
									$theme === option.value
										? 'bg-accent text-accent-foreground'
										: 'hover:bg-accent hover:text-accent-foreground'
								)}
							>
								<svelte:component this={option.icon} class="h-4 w-4" />
								<span>{option.label}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
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
		<!-- User Menu -->
		{#if session && user}
			<div class="relative">
				<button
					on:click={() => (showUserMenu = !showUserMenu)}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
				>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
						<User class="h-4 w-4" />
					</div>
					<span class="text-sm">{user.email || 'User'}</span>
					<ChevronDown class="h-4 w-4" />
				</button>
				{#if showUserMenu}
					<div
						class="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-popover shadow-md"
						role="menu"
						tabindex="-1"
						on:click|stopPropagation
						on:keydown|stopPropagation
					>
						<div class="p-1">
							<button
								on:click={handleLogout}
								class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								<LogOut class="h-4 w-4" />
								<span>Sign Out</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<Button variant="outline" on:click={() => goto('/login')}> Login </Button>
		{/if}
	</div>
</header>
