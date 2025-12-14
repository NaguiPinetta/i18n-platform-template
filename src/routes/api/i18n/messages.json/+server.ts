import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadMessages } from '$lib/supabase/i18n';

export const GET: RequestHandler = async (event) => {
	const result = await loadMessages(event);

	if (!result.ok) {
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

	return json(
		{ messages: result.messages, locale: result.locale || locale },
		{
			headers: {
				'Cache-Control': 'no-store, must-revalidate'
			}
		}
	);
};

