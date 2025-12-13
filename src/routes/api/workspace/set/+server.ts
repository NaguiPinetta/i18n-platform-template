import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '$lib/supabase/server';
import { validateWorkspaceMembership } from '$lib/supabase/workspace';

export const POST: RequestHandler = async (event) => {
	const supabase = createClient(event);

	if (!supabase) {
		return json({ error: 'Supabase not configured' }, { status: 503 });
	}

	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { workspaceId } = await event.request.json();

	if (!workspaceId || typeof workspaceId !== 'string') {
		return json({ error: 'Invalid workspace ID' }, { status: 400 });
	}

	// Validate user is a member of this workspace
	const validation = await validateWorkspaceMembership(
		supabase,
		workspaceId,
		session.user.id
	);

	if (!validation.valid) {
		return json({ error: validation.error || 'Not a member of this workspace' }, { status: 403 });
	}

	// Set cookie (expires in 1 year)
	event.cookies.set('ws', workspaceId, {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production'
	});

	return json({ success: true, workspaceId });
};
