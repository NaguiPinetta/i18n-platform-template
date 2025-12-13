<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import { cn } from '$lib/utils';
	import { mockLogs, type LogEntry } from '$lib/mocks/logs';

	let logs: LogEntry[] = mockLogs;
	let searchQuery = '';

	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString();
	}

	function getLevelColor(level: string): string {
		switch (level) {
			case 'error':
				return 'text-destructive';
			case 'warn':
				return 'text-yellow-600 dark:text-yellow-500';
			case 'info':
				return 'text-primary';
			case 'debug':
				return 'text-muted-foreground';
			default:
				return 'text-foreground';
		}
	}
</script>

<PageBody>
	<PageHeader title="Logs" description="View system and application logs" />

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder="Search logs..."
				bind:value={searchQuery}
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
		<svelte:fragment slot="actions">
			<select
				class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				<option value="">All Levels</option>
				<option value="error">Error</option>
				<option value="warn">Warning</option>
				<option value="info">Info</option>
				<option value="debug">Debug</option>
			</select>
		</svelte:fragment>
	</DataToolbar>

	{#if logs.length === 0}
		<EmptyState
			title="No logs found"
			description="Logs will appear here as events occur in the system."
		/>
	{:else}
		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="px-6 py-3 text-left text-sm font-medium">Timestamp</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Level</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Source</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Message</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Workspace</th>
							</tr>
						</thead>
						<tbody>
							{#each logs as log}
								<tr class="border-b last:border-0 hover:bg-accent/50">
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{formatTimestamp(log.timestamp)}
									</td>
									<td class="px-6 py-4 text-sm">
										<span
											class={cn(
												'rounded-full px-2 py-1 text-xs font-medium uppercase',
												getLevelColor(log.level)
											)}
										>
											{log.level}
										</span>
									</td>
									<td class="px-6 py-4 text-sm font-mono text-muted-foreground">
										{log.source}
									</td>
									<td class="px-6 py-4 text-sm">{log.message}</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{log.workspace}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}
</PageBody>
