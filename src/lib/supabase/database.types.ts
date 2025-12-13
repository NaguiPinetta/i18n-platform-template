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
				Relationships: [];
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
				Relationships: [];
			};
			profiles: {
				Row: {
					id: string;
					email: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			i18n_languages: {
				Row: {
					id: string;
					workspace_id: string;
					code: string;
					name: string;
					is_rtl: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					code: string;
					name: string;
					is_rtl?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					code?: string;
					name?: string;
					is_rtl?: boolean;
					created_at?: string;
				};
				Relationships: [];
			};
			i18n_keys: {
				Row: {
					id: string;
					workspace_id: string;
					key: string;
					module: string;
					type: string;
					screen: string | null;
					context: string | null;
					screenshot_ref: string | null;
					max_chars: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					key: string;
					module: string;
					type: string;
					screen?: string | null;
					context?: string | null;
					screenshot_ref?: string | null;
					max_chars?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					key?: string;
					module?: string;
					type?: string;
					screen?: string | null;
					context?: string | null;
					screenshot_ref?: string | null;
					max_chars?: number | null;
					created_at?: string;
				};
				Relationships: [];
			};
			i18n_translations: {
				Row: {
					id: string;
					workspace_id: string;
					key_id: string;
					language_id: string;
					value: string | null;
					status: 'draft' | 'review' | 'approved';
					updated_at: string;
				};
				Insert: {
					id?: string;
					workspace_id: string;
					key_id: string;
					language_id: string;
					value?: string | null;
					status?: 'draft' | 'review' | 'approved';
					updated_at?: string;
				};
				Update: {
					id?: string;
					workspace_id?: string;
					key_id?: string;
					language_id?: string;
					value?: string | null;
					status?: 'draft' | 'review' | 'approved';
					updated_at?: string;
				};
				Relationships: [];
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
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
