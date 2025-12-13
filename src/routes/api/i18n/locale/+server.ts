import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { validateWorkspaceMembership } from '$lib/supabase/i18n';

export const POST: RequestHandler = async (event) => {
	const membership = await validateWorkspaceMembership(event);
	if (!membership.ok) {
		return json({ ok: false, error: membership.error }, { status: membership.status });
	}

	const { supabase, workspaceId } = membership.ctx;

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const locale = (body as any)?.locale;
	if (!locale || typeof locale !== 'string') {
		return json({ ok: false, error: 'Missing locale' }, { status: 400 });
	}

	const normalized = locale.trim();
	if (!normalized) {
		return json({ ok: false, error: 'Invalid locale' }, { status: 400 });
	}

	// Strict validation: locale must exist in i18n_languages for current workspace
	const { data: lang, error: langError } = await supabase
		.from('i18n_languages')
		.select('code')
		.eq('workspace_id', workspaceId)
		.eq('code', normalized)
		.single();

	if (langError || !lang) {
		return json(
			{ ok: false, error: 'Locale not found for this workspace. Add it in Settings → i18n → Languages.' },
			{ status: 400 }
		);
	}

	event.cookies.set('locale', normalized, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev
	});

	return json({ ok: true, locale: normalized });
};

