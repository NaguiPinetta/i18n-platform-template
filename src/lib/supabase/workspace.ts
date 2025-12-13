import type { RequestEvent } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Get the current workspace ID from cookies
 */
export function getWorkspaceIdFromCookie(event: RequestEvent): string | null {
	return event.cookies.get('ws') || null;
}

/**
 * Validate that the authenticated user is a member of the workspace
 * Returns the workspace ID if valid, null otherwise
 */
export async function validateWorkspaceMembership(
	supabase: SupabaseClient<Database> | null,
	workspaceId: string | null,
	userId: string
): Promise<{ valid: boolean; workspaceId: string | null; error?: string }> {
	if (!supabase) {
		return { valid: false, workspaceId: null, error: 'Supabase not configured' };
	}

	if (!workspaceId) {
		return { valid: false, workspaceId: null, error: 'No workspace selected' };
	}

	try {
		// Check if user is owner or member of the workspace
		const { data: workspace, error: workspaceError } = await supabase
			.from('workspaces')
			.select('id, owner_id')
			.eq('id', workspaceId)
			.single();

		if (workspaceError || !workspace) {
			return { valid: false, workspaceId: null, error: 'Workspace not found' };
		}

		// Type assertion for workspace
		const workspaceData = workspace as { id: string; owner_id: string } | null;

		// Check if user is owner
		if (workspaceData && workspaceData.owner_id === userId) {
			return { valid: true, workspaceId };
		}

		// Check if user is a member
		const { data: member, error: memberError } = await supabase
			.from('workspace_members')
			.select('role')
			.eq('workspace_id', workspaceId)
			.eq('user_id', userId)
			.single();

		if (memberError || !member) {
			return { valid: false, workspaceId: null, error: 'Not a member of this workspace' };
		}

		return { valid: true, workspaceId };
	} catch (error) {
		console.error('Error validating workspace membership:', error);
		return { valid: false, workspaceId: null, error: 'Error validating workspace' };
	}
}

/**
 * Check if user has owner/admin role in workspace
 */
export async function hasOwnerOrAdminRole(
	supabase: SupabaseClient<Database> | null,
	workspaceId: string | null,
	userId: string
): Promise<boolean> {
	if (!supabase || !workspaceId) {
		return false;
	}

	try {
		// Check if user is owner
		const { data: workspace } = await supabase
			.from('workspaces')
			.select('owner_id')
			.eq('id', workspaceId)
			.single();

		const workspaceData = workspace as { owner_id: string } | null;
		if (workspaceData && workspaceData.owner_id === userId) {
			return true;
		}

		// Check if user is admin
		const { data: member } = await supabase
			.from('workspace_members')
			.select('role')
			.eq('workspace_id', workspaceId)
			.eq('user_id', userId)
			.single();

		const memberData = member as { role: string } | null;
		return memberData?.role === 'owner' || memberData?.role === 'admin';
	} catch (error) {
		console.error('Error checking owner/admin role:', error);
		return false;
	}
}
