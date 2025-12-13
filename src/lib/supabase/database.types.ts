export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			workspaces: {
				Row: {
					id: string;
					name: string;
					owner_id: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					owner_id: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					owner_id?: string;
					created_at?: string;
				};
			};
			workspace_members: {
				Row: {
					workspace_id: string;
					user_id: string;
					role: string;
					created_at: string;
				};
				Insert: {
					workspace_id: string;
					user_id: string;
					role: string;
					created_at?: string;
				};
				Update: {
					workspace_id?: string;
					user_id?: string;
					role?: string;
					created_at?: string;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
	};
}
