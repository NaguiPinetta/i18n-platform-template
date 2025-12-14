<script lang="ts">
	import {
		locale,
		currentWorkspaceId,
		currentWorkspace,
		theme,
		effectiveTheme,
		loadMessages,
		setRuntimeLocale,
		t
	} from '$lib/stores';
	import type { Workspace } from '$lib/stores/workspace';
	import { cn } from '$lib/utils';
	import { Globe, ChevronDown, LogOut, User, Sun, Moon, Monitor } from 'lucide-svelte';
	import Button from '$lib/ui/Button.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import type { Session } from '@supabase/supabase-js';

	export let session: Session | null = null;
	export let user: { email?: string | null } | null = null;
	export let workspaces: Workspace[] = [];
	export let languages: Array<{ code: string; name: string; is_rtl: boolean }> = [];
	export let currentLocale: string = 'en';

	let showWorkspaceMenu = false;
	let showUserMenu = false;
	let showThemeMenu = false;
	let showLanguageMenu = false;
	let selectedLanguage: { code: string; name: string; is_rtl: boolean } | null = null;

	$: selectedLanguage =
		languages.find((l) => l.code === $locale) || languages.find((l) => l.code === currentLocale) || null;

	async function handleLocaleChange(code: string) {
		if (!session) return;
		if (!code) return;

		// Persist locale selection server-side (strict: must exist in workspace languages)
		try {
			const res = await fetch('/api/i18n/locale', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ locale: code })
			});

			if (!res.ok) {
				const msg = await res.text().catch(() => '');
				console.warn('Failed to set locale cookie', msg);
				return;
			}
		} catch (err) {
			console.warn('Failed to set locale cookie', err);
			return;
		}

		// Update locale first
		locale.set(code);
		setRuntimeLocale(code);
		
		// Force reload messages with new locale (bypasses cache)
		// This will clear localStorage cache and fetch fresh messages
		await loadMessages(code);
		
		// Small delay to ensure state update propagates
		await new Promise(resolve => setTimeout(resolve, 50));
		
		// Invalidate all routes to force re-render with new translations
		await invalidateAll();
	}

	async function handleLogout() {
		await fetch('/logout', { method: 'POST' });
		goto('/login');
	}

	async function handleWorkspaceChange(workspaceId: string) {
		currentWorkspaceId.set(workspaceId);
		showWorkspaceMenu = false;

		// Set workspace cookie on server
		try {
			await fetch('/api/workspace/set', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ workspaceId })
			});
		} catch (error) {
			console.error('Failed to set workspace cookie:', error);
		}
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
			<h2 class="text-lg font-semibold">{t('workspace.label', 'Workspace')}</h2>
			<span class="text-sm text-muted-foreground">
				{t('workspace.none_selected', 'No workspace selected')}
			</span>
		{:else}
			<h2 class="text-lg font-semibold">{t('app.title', 'i18n Platform')}</h2>
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
		<div class="relative">
			<button
				disabled={!session || languages.length === 0}
				on:click={() => (showLanguageMenu = !showLanguageMenu)}
				class={cn(
					'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent',
					(!session || languages.length === 0) && 'cursor-not-allowed opacity-60 hover:bg-transparent'
				)}
				title={
					languages.length === 0
						? t('i18n.no_languages_hint', 'Add languages in Settings → i18n → Languages')
						: t('i18n.language', 'Language')
				}
			>
				<Globe class="h-4 w-4 text-muted-foreground" />
				<span>{selectedLanguage ? selectedLanguage.name : $locale}</span>
				<ChevronDown class="h-4 w-4" />
			</button>
			{#if showLanguageMenu && session && languages.length > 0}
				<div
					class="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-popover shadow-md"
					role="menu"
					tabindex="-1"
					on:click|stopPropagation
					on:keydown|stopPropagation
				>
					<div class="p-1">
						{#each languages as lang}
							<button
								on:click={() => {
									showLanguageMenu = false;
									handleLocaleChange(lang.code);
								}}
								class={cn(
									'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
									$locale === lang.code
										? 'bg-accent text-accent-foreground'
										: 'hover:bg-accent hover:text-accent-foreground'
								)}
							>
								<span class="flex items-center justify-between gap-2">
									<span>{lang.name}</span>
									<span class="text-xs text-muted-foreground">{lang.code}</span>
								</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
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
								<span>{t('auth.sign_out', 'Sign Out')}</span>
							</button>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<Button variant="outline" on:click={() => goto('/login')}>
				{t('auth.login', 'Login')}
			</Button>
		{/if}
	</div>
</header>
