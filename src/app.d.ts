// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { Database } from './lib/supabase/database.types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database> | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
