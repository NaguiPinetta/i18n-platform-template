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
					'Cache-Control': 'private, max-age=60'
				}
			}
		);
	}

	return json(
		{ messages: result.messages, locale: result.locale },
		{
			headers: {
				'Cache-Control': 'private, max-age=60'
			}
		}
	);
};

