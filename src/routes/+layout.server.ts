import type { LayoutServerLoad } from './$types';
import { dev } from '$app/environment';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const session = locals.session;
	const supabaseConfigured = !!locals.supabase;
	const currentLocale = cookies.get('locale') || 'en';

	if (!session || !locals.supabase) {
		return {
			session: null,
			user: null,
			workspaces: [],
			supabaseConfigured,
			languages: [],
			currentLocale
		};
	}

	try {
		if (!locals.supabase) {
			return {
				session,
				user: session.user,
				workspaces: [],
				supabaseConfigured: false,
				languages: [],
				currentLocale
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
		const { data: ownedWorkspaces, error: ownedError } = await supabase
			.from('workspaces')
			.select('*')
			.eq('owner_id', session.user.id);

		if (ownedError) {
			console.error('Error fetching owned workspaces:', ownedError);
		}

		// Get workspace memberships - query separately to avoid RLS join issues
		const { data: memberships, error: memberError } = await supabase
			.from('workspace_members')
			.select('workspace_id')
			.eq('user_id', session.user.id);

		if (memberError) {
			console.error('Error fetching workspace memberships:', memberError);
		}

		// Get workspace details for memberships
		let memberWorkspaces: any[] = [];
		if (memberships && memberships.length > 0) {
			const membershipsData = memberships as { workspace_id: string }[];
			const workspaceIds = membershipsData.map((m) => m.workspace_id);
			const { data: workspaces, error: wsError } = await supabase
				.from('workspaces')
				.select('*')
				.in('id', workspaceIds);

			if (wsError) {
				console.error('Error fetching member workspaces:', wsError);
			} else {
				memberWorkspaces = workspaces || [];
			}
		}

		if (dev) {
			console.log('User ID:', session.user.id);
			console.log('Owned workspaces:', ownedWorkspaces?.length || 0, ownedWorkspaces);
			console.log('Member workspaces:', memberWorkspaces?.length || 0, memberWorkspaces);
		}

		const allWorkspaces = [
			...(ownedWorkspaces || []),
			...memberWorkspaces
		];

		// Remove duplicates
		const uniqueWorkspaces = Array.from(
			new Map(allWorkspaces.map((w) => [w.id, w])).values()
		);

		// Workspace-scoped languages (based on ws cookie + membership)
		const wsCookie = cookies.get('ws');
		const activeWorkspaceId = wsCookie && uniqueWorkspaces.some((w) => w.id === wsCookie) ? wsCookie : null;

		let languages: Array<{ code: string; name: string; is_rtl: boolean }> = [];
		if (activeWorkspaceId) {
			const { data: langs, error: langsError } = await supabase
				.from('i18n_languages')
				.select('code, name, is_rtl')
				.eq('workspace_id', activeWorkspaceId)
				.order('code');

			if (!langsError && langs) {
				languages = langs as Array<{ code: string; name: string; is_rtl: boolean }>;
			}
		}

		return {
			session,
			user: user || session.user,
			workspaces: uniqueWorkspaces,
			supabaseConfigured,
			languages,
			currentLocale
		};
	} catch (error) {
		// Handle case when Supabase isn't configured or there's an error
		console.warn('Error loading user data:', error);
		return {
			session,
			user: session.user,
			workspaces: [],
			supabaseConfigured,
			languages: [],
			currentLocale
		};
	}
};
