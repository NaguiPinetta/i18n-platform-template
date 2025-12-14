<script lang="ts">
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase/client';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import CardContent from '$lib/ui/CardContent.svelte';
	import CardHeader from '$lib/ui/CardHeader.svelte';
	import PageBody from '$lib/ui/PageBody.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { t } from '$lib/stores';

	let email = '';
	let password = '';
	let magicLinkEmail = '';
	let loading = false;
	let error = '';
	let magicLinkSent = false;

	const supabase = createClient();

	// Prefill email in development mode only (if DEV_EMAIL env var is set)
	onMount(() => {
		if (dev) {
			// Allow developers to set a dev email via environment variable
			// This prevents hardcoding sensitive emails in the codebase
			const devEmail = import.meta.env.VITE_DEV_EMAIL;
			if (devEmail) {
				email = devEmail;
			}
		}
	});

	async function handleEmailLogin() {
		if (!supabase) {
			error = t('errors.supabase_not_configured', 'Supabase is not configured. Please add environment variables.');
			return;
		}

		loading = true;
		error = '';

		const { error: authError } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		loading = false;

		if (authError) {
			error = authError.message;
		} else {
			goto('/dashboard');
		}
	}

	async function handleMagicLink() {
		if (!supabase) {
			error = t('errors.supabase_not_configured', 'Supabase is not configured. Please add environment variables.');
			return;
		}

		loading = true;
		error = '';
		magicLinkSent = false;

		const { error: authError } = await supabase.auth.signInWithOtp({
			email: magicLinkEmail,
			options: {
				emailRedirectTo: `${$page.url.origin}/dashboard`
			}
		});

		loading = false;

		if (authError) {
			error = authError.message;
		} else {
			magicLinkSent = true;
		}
	}
</script>

<PageBody maxWidth="md">
	<div class="flex min-h-screen items-center justify-center py-12">
		<Card class="w-full max-w-md">
		<CardHeader>
			<PageHeader
				title={t('auth.login.title', 'Sign In')}
				description={t('auth.login.subtitle', 'Sign in to your account')}
			/>
		</CardHeader>
			<CardContent>
				{#if error}
					<div class="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				{/if}

				{#if magicLinkSent}
					<div class="mb-4 rounded-md bg-primary/10 p-3 text-sm text-primary">
						{t('auth.messages.magic_link_sent', 'Check your email for the magic link!')}
					</div>
				{/if}

				<!-- Email + Password Login -->
				<form on:submit|preventDefault={handleEmailLogin} class="space-y-4">
					<div>
						<label for="email" class="mb-2 block text-sm font-medium">
							{t('auth.login.email', 'Email')}
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder={t('auth.login.email_placeholder', 'you@example.com')}
						/>
					</div>
					<div>
						<label for="password" class="mb-2 block text-sm font-medium">
							{t('auth.login.password', 'Password')}
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder={t('auth.login.password_placeholder', '••••••••')}
						/>
					</div>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading
							? t('auth.login.signing_in', 'Signing in...')
							: t('auth.login.sign_in', 'Sign In')}
					</Button>
				</form>

				<div class="my-6 flex items-center gap-4">
					<div class="h-px flex-1 bg-border"></div>
					<span class="text-sm text-muted-foreground">{t('common.or', 'OR')}</span>
					<div class="h-px flex-1 bg-border"></div>
				</div>

				<!-- Magic Link Login -->
				<form on:submit|preventDefault={handleMagicLink} class="space-y-4">
					<div>
						<label for="magic-email" class="mb-2 block text-sm font-medium">
							{t('auth.login.magic_link_label', 'Email (Magic Link)')}
						</label>
						<input
							id="magic-email"
							type="email"
							bind:value={magicLinkEmail}
							required
							class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							placeholder={t('auth.login.email_placeholder', 'you@example.com')}
						/>
					</div>
					<Button type="submit" variant="outline" class="w-full" disabled={loading}>
						{loading
							? t('auth.login.sending', 'Sending...')
							: t('auth.login.send_magic_link', 'Send Magic Link')}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</PageBody>
