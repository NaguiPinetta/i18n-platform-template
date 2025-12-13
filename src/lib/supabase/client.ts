import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

export function createClient() {
	const url = env.PUBLIC_SUPABASE_URL;
	const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		return null;
	}

	return createBrowserClient(url, anonKey);
}
