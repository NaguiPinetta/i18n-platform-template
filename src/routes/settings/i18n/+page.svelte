<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
</script>

<PageBody>
	<PageHeader title="i18n Settings" description="Configure internationalization and localization" />

	<div class="space-y-6">
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Supported Languages</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">Manage supported locales and languages</p>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">Translation Pipeline</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">Configure export/import workflows</p>
			</CardContent>
		</Card>
	</div>
</PageBody>
