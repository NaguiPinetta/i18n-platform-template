<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
</script>

<PageBody>
	<PageHeader title="Dashboard" description="Overview of your workspace">
		<svelte:fragment slot="actions">
			<Button>New Project</Button>
		</svelte:fragment>
	</PageHeader>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Projects</h3>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">12</p>
				<p class="text-sm text-muted-foreground">Active projects</p>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Translations</h3>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">1,234</p>
				<p class="text-sm text-muted-foreground">Total keys</p>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Languages</h3>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">8</p>
				<p class="text-sm text-muted-foreground">Supported locales</p>
			</CardContent>
		</Card>
	</div>
</PageBody>
