<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
</script>

<PageBody>
	<PageHeader title="Settings" description="Manage your workspace settings" />

	<div class="space-y-6">
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">General</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">General workspace settings</p>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Preferences</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">User preferences and defaults</p>
			</CardContent>
		</Card>
	</div>
</PageBody>
