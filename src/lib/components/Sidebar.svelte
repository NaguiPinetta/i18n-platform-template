<script lang="ts">
	import { page } from '$app/stores';
	import { t } from '$lib/stores';
	import { cn } from '$lib/utils';
	import {
		LayoutDashboard,
		FolderKanban,
		FileText,
		MessageSquare,
		Bot,
		Database,
		Settings,
		Languages,
		Users,
		Plug
	} from 'lucide-svelte';

	interface NavItem {
		titleKey: string;
		fallback: string;
		href: string;
		icon: typeof LayoutDashboard;
	}

	interface NavGroup {
		titleKey: string;
		fallback: string;
		items: NavItem[];
	}

	const navGroups: NavGroup[] = [
		{
			titleKey: 'nav.group.core',
			fallback: 'Core',
			items: [
				{ titleKey: 'nav.dashboard', fallback: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
				{ titleKey: 'nav.projects', fallback: 'Projects', href: '/projects', icon: FolderKanban },
				{ titleKey: 'nav.logs', fallback: 'Logs', href: '/logs', icon: FileText }
			]
		},
		{
			titleKey: 'nav.group.ai',
			fallback: 'AI',
			items: [
				{ titleKey: 'nav.chat', fallback: 'Chat', href: '/chat', icon: MessageSquare },
				{ titleKey: 'nav.agents', fallback: 'Agents', href: '/agents', icon: Bot },
				{ titleKey: 'nav.datasets', fallback: 'Datasets', href: '/datasets', icon: Database }
			]
		},
		{
			titleKey: 'nav.group.settings',
			fallback: 'Settings',
			items: [
				{ titleKey: 'nav.settings', fallback: 'Settings', href: '/settings', icon: Settings },
				{ titleKey: 'nav.i18n', fallback: 'i18n', href: '/settings/i18n', icon: Languages },
				{ titleKey: 'nav.users', fallback: 'Users', href: '/settings/users', icon: Users },
				{
					titleKey: 'nav.integrations',
					fallback: 'Integrations',
					href: '/settings/integrations',
					icon: Plug
				}
			]
		}
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<aside class="flex h-screen w-64 flex-col border-r bg-card">
	<nav class="flex-1 space-y-1 p-4">
		{#each navGroups as group}
			<div class="mb-4">
				<h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{t(group.titleKey, group.fallback)}
				</h2>
				<div class="space-y-1">
					{#each group.items as item}
						<a
							href={item.href}
							class={cn(
								'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
								isActive(item.href)
									? 'bg-accent text-accent-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
							)}
						>
							<svelte:component this={item.icon} class="h-5 w-5 flex-shrink-0" />
							<span>{t(item.titleKey, item.fallback)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</nav>
</aside>
