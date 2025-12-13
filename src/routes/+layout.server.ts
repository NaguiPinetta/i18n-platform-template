import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session;
	const supabaseConfigured = !!locals.supabase;

	if (!session || !locals.supabase) {
		return {
			session: null,
			user: null,
			workspaces: [],
			supabaseConfigured
		};
	}

	try {
		if (!locals.supabase) {
			return {
				session,
				user: session.user,
				workspaces: [],
				supabaseConfigured: false
			};
		}

		const supabase = locals.supabase;

		// Get user profile
		const { data: user } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', session.user.id)
			.single();

		// Get user's workspaces (owned or member of)
		const { data: ownedWorkspaces } = await supabase
			.from('workspaces')
			.select('*')
			.eq('owner_id', session.user.id);

		const { data: memberWorkspaces } = await supabase
			.from('workspace_members')
			.select('workspace_id, workspaces(*)')
			.eq('user_id', session.user.id);

		const allWorkspaces = [
			...(ownedWorkspaces || []),
			...(memberWorkspaces?.map((m: any) => m.workspaces).filter(Boolean) || [])
		];

		// Remove duplicates
		const uniqueWorkspaces = Array.from(
			new Map(allWorkspaces.map((w) => [w.id, w])).values()
		);

		return {
			session,
			user: user || session.user,
			workspaces: uniqueWorkspaces,
			supabaseConfigured
		};
	} catch (error) {
		// Handle case when Supabase isn't configured or there's an error
		console.warn('Error loading user data:', error);
		return {
			session,
			user: session.user,
			workspaces: [],
			supabaseConfigured
		};
	}
};
