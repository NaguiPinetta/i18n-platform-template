import { createClient } from '$lib/supabase/server';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client (may be null if env vars missing)
	event.locals.supabase = createClient(event);

	// Get session (only if Supabase is configured)
	let session = null;
	if (event.locals.supabase) {
		try {
			const {
				data: { session: sessionData }
			} = await event.locals.supabase.auth.getSession();
			session = sessionData;
		} catch (error) {
			// Error getting session - continue without session
			console.warn('Error getting session:', error);
		}
	}
	event.locals.session = session;

	// Protected routes
	const protectedRoutes = [
		'/dashboard',
		'/projects',
		'/chat',
		'/agents',
		'/datasets',
		'/settings'
	];

	const isProtectedRoute = protectedRoutes.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !session) {
		throw redirect(303, '/login');
	}

	// Redirect authenticated users away from login
	if (event.url.pathname === '/login' && session) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
