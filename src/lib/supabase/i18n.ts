import type { RequestEvent } from '@sveltejs/kit';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { createClient as createServerClient } from '$lib/supabase/server';
import {
	getWorkspaceIdFromCookie,
	validateWorkspaceMembership as validateMembership
} from '$lib/supabase/workspace';

export function getLocaleFromCookie(event: RequestEvent): string {
	const raw = event.cookies.get('locale');
	return raw && raw.trim() ? raw.trim() : 'en';
}

export type MembershipContext = {
	supabase: SupabaseClient<Database>;
	session: Session;
	workspaceId: string;
	locale: string;
};

export async function validateWorkspaceMembership(
	event: RequestEvent
): Promise<{ ok: true; ctx: MembershipContext } | { ok: false; status: number; error: string }> {
	const supabase = createServerClient(event);
	if (!supabase) return { ok: false, status: 503, error: 'Supabase not configured' };

	const {
		data: { session }
	} = await supabase.auth.getSession();
	if (!session) return { ok: false, status: 401, error: 'Unauthorized' };

	const workspaceId = getWorkspaceIdFromCookie(event);
	const validation = await validateMembership(supabase, workspaceId, session.user.id);
	if (!validation.valid || !validation.workspaceId) {
		const isMissing = (validation.error || '').toLowerCase().includes('selected');
		return {
			ok: false,
			status: isMissing ? 400 : 403,
			error: validation.error || 'No workspace selected'
		};
	}

	return {
		ok: true,
		ctx: {
			supabase,
			session,
			workspaceId: validation.workspaceId,
			locale: getLocaleFromCookie(event)
		}
	};
}

export async function loadMessages(
	event: RequestEvent
): Promise<
	| { ok: true; locale: string; messages: Record<string, string> }
	| { ok: false; status: number; error: string }
> {
	const membership = await validateWorkspaceMembership(event);
	if (!membership.ok) return membership;

	const { supabase, workspaceId, locale } = membership.ctx;

	// Resolve language id for locale; if missing, return empty messages (client will fall back)
	const { data: language, error: langError } = await supabase
		.from('i18n_languages')
		.select('id')
		.eq('workspace_id', workspaceId)
		.eq('code', locale)
		.single();

	const languageData = language as { id: string } | null;
	if (langError || !languageData) {
		return { ok: true, locale, messages: {} };
	}

	const [{ data: keys, error: keysError }, { data: translations, error: transError }] =
		await Promise.all([
			supabase.from('i18n_keys').select('id, key').eq('workspace_id', workspaceId),
			supabase
				.from('i18n_translations')
				.select('key_id, value')
				.eq('workspace_id', workspaceId)
				.eq('language_id', languageData.id)
		]);

	if (keysError) return { ok: false, status: 500, error: 'Error fetching keys' };
	if (transError) return { ok: false, status: 500, error: 'Error fetching translations' };

	const idToKey = new Map<string, string>();
	for (const k of (keys as Array<{ id: string; key: string }> | null) || []) idToKey.set(k.id, k.key);

	const messages: Record<string, string> = {};
	for (const t of (translations as Array<{ key_id: string; value: string | null }> | null) || []) {
		const key = idToKey.get(t.key_id);
		const value = (t.value || '').trim();
		if (!key || !value) continue;
		messages[key] = value;
	}

	return { ok: true, locale, messages };
}

