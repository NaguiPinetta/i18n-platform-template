export interface LogEntry {
	timestamp: string;
	level: 'info' | 'warn' | 'error' | 'debug';
	source: string;
	message: string;
	workspace: string;
}

export const mockLogs: LogEntry[] = [
	{
		timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
		level: 'info',
		source: 'api',
		message: 'Translation export completed successfully',
		workspace: 'i18n Platform'
	},
	{
		timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
		level: 'warn',
		source: 'worker',
		message: 'Slow query detected in workspace_members table',
		workspace: 'i18n Platform'
	},
	{
		timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
		level: 'error',
		source: 'auth',
		message: 'Failed to verify session token',
		workspace: 'i18n Platform'
	},
	{
		timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
		level: 'info',
		source: 'api',
		message: 'New workspace created',
		workspace: 'i18n Platform'
	},
	{
		timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
		level: 'debug',
		source: 'worker',
		message: 'Background job started: sync_translations',
		workspace: 'i18n Platform'
	}
];
