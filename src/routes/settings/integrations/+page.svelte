<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { t } from '$lib/stores';
</script>

<PageBody>
	<PageHeader
		title={t('settings.integrations.title', 'Integrations')}
		description={t('settings.integrations.subtitle', 'Connect external services and tools')}
	/>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">
					{t('settings.integrations.translation_services', 'Translation Services')}
				</h3>
			</CardHeader>
			<CardContent>
				<p class="mb-4 text-sm text-muted-foreground">
					{t('settings.integrations.translation_services.description', 'Connect to translation APIs')}
				</p>
				<Button variant="outline">{t('common.configure', 'Configure')}</Button>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">
					{t('settings.integrations.version_control', 'Version Control')}
				</h3>
			</CardHeader>
			<CardContent>
				<p class="mb-4 text-sm text-muted-foreground">
					{t('settings.integrations.version_control.description', 'Sync with Git repositories')}
				</p>
				<Button variant="outline">{t('common.configure', 'Configure')}</Button>
			</CardContent>
		</Card>
	</div>
</PageBody>
