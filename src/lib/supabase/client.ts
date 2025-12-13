import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Database } from './database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient() {
	const url = env.PUBLIC_SUPABASE_URL;
	const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		return null;
	}

	// NOTE: @supabase/ssr@0.1.0 has outdated SupabaseClient generics compared to @supabase/supabase-js v2.
	// Cast so we keep correct table typing across the app and avoid `never` explosions in svelte-check.
	return createBrowserClient(url, anonKey) as unknown as SupabaseClient<Database>;
}
