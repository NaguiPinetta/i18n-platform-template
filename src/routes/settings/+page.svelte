<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import { t } from '$lib/stores';
</script>

<PageBody>
	<PageHeader
		title={t('settings.title', 'Settings')}
		description={t('settings.subtitle', 'Manage your workspace settings')}
	/>

	<div class="space-y-6">
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">{t('settings.section.general', 'General')}</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					{t('settings.section.general.description', 'General workspace settings')}
				</p>
			</CardContent>
		</Card>
		<Card>
			<CardHeader>
				<h3 class="text-lg font-semibold">{t('settings.section.preferences', 'Preferences')}</h3>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					{t('settings.section.preferences.description', 'User preferences and defaults')}
				</p>
			</CardContent>
		</Card>
	</div>
</PageBody>
