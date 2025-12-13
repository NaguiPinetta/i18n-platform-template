import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Database } from '../supabase/database.types';

export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row'] & {
	profiles?: { email: string };
};

export const workspaces = writable<Workspace[]>([]);
export const currentWorkspaceId = writable<string | null>(null);

// Load from localStorage on init
if (browser) {
	const stored = localStorage.getItem('currentWorkspaceId');
	if (stored) {
		currentWorkspaceId.set(stored);
	}

	// Persist to localStorage when changed
	currentWorkspaceId.subscribe((id) => {
		if (id) {
			localStorage.setItem('currentWorkspaceId', id);
		} else {
			localStorage.removeItem('currentWorkspaceId');
		}
	});
}

export const currentWorkspace = derived(
	[workspaces, currentWorkspaceId],
	([$workspaces, $currentWorkspaceId]) => {
		return $workspaces.find((w) => w.id === $currentWorkspaceId) || null;
	}
);
