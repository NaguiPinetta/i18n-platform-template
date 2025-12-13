<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import DataToolbar from '$lib/ui/DataToolbar.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';
	import DialogTitle from '$lib/ui/DialogTitle.svelte';
	import DialogDescription from '$lib/ui/DialogDescription.svelte';
	import { currentWorkspace } from '$lib/stores';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import type { WorkspaceMember } from '$lib/stores/workspace';

	const supabase = createClient();
	let members: WorkspaceMember[] = [];
	let loading = true;
	let showInviteDialog = false;

	async function loadMembers() {
		if (!$currentWorkspace || !supabase) {
			loading = false;
			return;
		}

		loading = true;
		const { data, error } = await supabase
			.from('workspace_members')
			.select('*, profiles:user_id(email)')
			.eq('workspace_id', $currentWorkspace.id);

		if (error) {
			console.error('Error loading members:', error);
		} else {
			members = (data as any) || [];
		}

		loading = false;
	}

	onMount(() => {
		loadMembers();
	});

	$: if ($currentWorkspace) {
		loadMembers();
	}

	function getMemberEmail(member: WorkspaceMember): string {
		const profiles = member.profiles as any;
		return (profiles && profiles.email) || 'N/A';
	}
</script>

<PageBody>
	<PageHeader title="Users" description="Manage workspace users and permissions">
		<svelte:fragment slot="actions">
			<Button on:click={() => (showInviteDialog = true)}>Invite User</Button>
		</svelte:fragment>
	</PageHeader>

	<DataToolbar>
		<svelte:fragment slot="search">
			<input
				type="text"
				placeholder="Search users..."
				class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-sm"
			/>
		</svelte:fragment>
	</DataToolbar>

	{#if loading}
		<div class="py-12 text-center text-sm text-muted-foreground">Loading members...</div>
	{:else if members.length === 0}
		<EmptyState
			title="No members found"
			description="Invite team members to collaborate on translations."
		>
			<svelte:fragment slot="actions">
				<Button on:click={() => (showInviteDialog = true)}>Invite User</Button>
			</svelte:fragment>
		</EmptyState>
	{:else}
		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="px-6 py-3 text-left text-sm font-medium">Email</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Role</th>
								<th class="px-6 py-3 text-left text-sm font-medium">Joined</th>
							</tr>
						</thead>
						<tbody>
							{#each members as member}
								<tr class="border-b last:border-0">
									<td class="px-6 py-4 text-sm">
										{getMemberEmail(member)}
									</td>
									<td class="px-6 py-4 text-sm">
										<span
											class="rounded-full bg-accent px-2 py-1 text-xs font-medium"
										>
											{member.role}
										</span>
									</td>
									<td class="px-6 py-4 text-sm text-muted-foreground">
										{new Date(member.created_at).toLocaleDateString()}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}

	<Dialog bind:open={showInviteDialog}>
		<DialogTitle>Invite User</DialogTitle>
		<DialogDescription class="mb-4">
			User invitation feature coming soon. This will allow you to invite team members to your
			workspace.
		</DialogDescription>
		<div class="flex justify-end">
			<Button variant="outline" on:click={() => (showInviteDialog = false)}> Close </Button>
		</div>
	</Dialog>
</PageBody>
