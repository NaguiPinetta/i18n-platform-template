<script lang="ts">
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import { t } from '$lib/stores';
</script>

<PageBody>
	<PageHeader
		title={t('chat.title', 'Chat')}
		description={t('chat.description', 'AI-powered translation assistance')}
	/>

	<Card>
		<CardContent class="p-6">
			<div class="flex h-96 items-center justify-center">
				<p class="text-muted-foreground">
					{t('chat.coming_soon', 'Chat interface coming soon...')}
				</p>
			</div>
		</CardContent>
	</Card>
</PageBody>
