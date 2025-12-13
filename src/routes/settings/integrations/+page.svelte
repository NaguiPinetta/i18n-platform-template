<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import Button from '$lib/ui/Button.svelte';
</script>

<PageBody>
	<PageHeader title="Integrations" description="Connect external services and tools" />

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Translation Services</h3>
			</CardHeader>
			<CardContent>
				<p class="mb-4 text-sm text-muted-foreground">Connect to translation APIs</p>
				<Button variant="outline">Configure</Button>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Version Control</h3>
			</CardHeader>
			<CardContent>
				<p class="mb-4 text-sm text-muted-foreground">Sync with Git repositories</p>
				<Button variant="outline">Configure</Button>
			</CardContent>
		</Card>
	</div>
</PageBody>
