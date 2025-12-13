import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export function createClient(event: RequestEvent) {
	const url = env.PUBLIC_SUPABASE_URL;
	const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		return null;
	}

	return createServerClient(url, anonKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, options);
				});
			}
		}
	});
}
