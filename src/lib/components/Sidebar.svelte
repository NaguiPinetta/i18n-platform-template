<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import {
		LayoutDashboard,
		FolderKanban,
		MessageSquare,
		Bot,
		Database,
		Settings,
		Languages,
		Users,
		Plug
	} from 'lucide-svelte';

	interface NavItem {
		title: string;
		href: string;
		icon: typeof LayoutDashboard;
	}

	interface NavGroup {
		title: string;
		items: NavItem[];
	}

	const navGroups: NavGroup[] = [
		{
			title: 'Core',
			items: [
				{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
				{ title: 'Projects', href: '/projects', icon: FolderKanban }
			]
		},
		{
			title: 'AI',
			items: [
				{ title: 'Chat', href: '/chat', icon: MessageSquare },
				{ title: 'Agents', href: '/agents', icon: Bot },
				{ title: 'Datasets', href: '/datasets', icon: Database }
			]
		},
		{
			title: 'Settings',
			items: [
				{ title: 'Settings', href: '/settings', icon: Settings },
				{ title: 'i18n', href: '/settings/i18n', icon: Languages },
				{ title: 'Users', href: '/settings/users', icon: Users },
				{ title: 'Integrations', href: '/settings/integrations', icon: Plug }
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
					{group.title}
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
							<span>{item.title}</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</nav>
</aside>
