import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.supabase) {
		await locals.supabase.auth.signOut();
	}

	// Clear all auth cookies
	cookies.getAll().forEach((cookie) => {
		if (cookie.name.startsWith('sb-')) {
			cookies.delete(cookie.name, { path: '/' });
		}
	});

	throw redirect(303, '/login');
};
