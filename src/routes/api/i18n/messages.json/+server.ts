import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { loadMessages } from '$lib/supabase/i18n';

export const GET: RequestHandler = async (event) => {
	// Support cache-busting query param (ignored but allows client to force refresh)
	const url = new URL(event.request.url);
	const cacheBuster = url.searchParams.get('t');

	if (dev) {
		const locale = event.cookies.get('locale') || 'en';
		console.log(`[i18n API] GET /api/i18n/messages.json - locale: ${locale}${cacheBuster ? ` (cache-bust: ${cacheBuster})` : ''}`);
	}

	const result = await loadMessages(event);

	if (!result.ok) {
		if (dev) {
			console.warn(`[i18n API] Failed to load messages:`, result.error);
		}
		return json(
			{ error: result.error, messages: {}, locale: 'en' },
			{
				status: result.status,
				headers: {
					'Cache-Control': 'no-store, must-revalidate'
				}
			}
		);
	}

	// Get locale from cookie to ensure we're returning the right locale
	const locale = event.cookies.get('locale') || 'en';
	const messageCount = Object.keys(result.messages).length;

	if (dev) {
		console.log(`[i18n API] Returning ${messageCount} messages for locale: ${result.locale || locale}`);
	}

	return json(
		{ messages: result.messages, locale: result.locale || locale },
		{
			headers: {
				'Cache-Control': 'no-store, must-revalidate'
			}
		}
	);
};

