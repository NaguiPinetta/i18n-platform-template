import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import type { Database } from './database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient(event: RequestEvent) {
	const url = env.PUBLIC_SUPABASE_URL;
	const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		return null;
	}

	const isProd = process.env.NODE_ENV === 'production';

	// NOTE: @supabase/ssr@0.1.0 has outdated SupabaseClient generics compared to @supabase/supabase-js v2.
	// Cast so we keep correct table typing across the app and avoid `never` explosions in svelte-check.
	return createServerClient(url, anonKey, {
		// IMPORTANT:
		// @supabase/ssr expects cookies.get/set/remove (not getAll/setAll).
		// If this adapter is wrong, the server will never see the session cookies -> redirect loop to /login.
		cookies: {
			get(key: string) {
				return event.cookies.get(key);
			},
			set(key: string, value: string, options: CookieOptions) {
				event.cookies.set(key, value, {
					path: '/',
					...(options || {}),
					secure: isProd
				});
			},
			remove(key: string, options: CookieOptions) {
				event.cookies.delete(key, {
					path: '/',
					...(options || {}),
					secure: isProd
				});
			}
		},
		cookieOptions: {
			path: '/',
			sameSite: 'lax',
			secure: isProd
		}
	}) as unknown as SupabaseClient<Database>;
}
