import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { currentWorkspaceId } from './workspace';
import { registerKey } from './i18n-registry';

type I18nState = {
	locale: string;
	messages: Record<string, string>;
	loading: boolean;
	error: string | null;
};

const state = writable<I18nState>({
	locale: 'en',
	messages: {},
	loading: false,
	error: null
});

let lastLoadKey: string | null = null;
let inFlight: Promise<void> | null = null;

function cacheKey(workspaceId: string, locale: string): string {
	return `i18n_messages:${workspaceId}:${locale}`;
}

export const i18n = {
	subscribe: state.subscribe
};

export function setRuntimeLocale(locale: string) {
	state.update((s) => ({ ...s, locale }));
}

export async function loadMessages(): Promise<void> {
	if (!browser) return;

	const workspaceId = get(currentWorkspaceId);
	const locale = get(state).locale || 'en';
	if (!workspaceId) return;

	const key = `${workspaceId}:${locale}`;
	if (key === lastLoadKey && get(state).messages && Object.keys(get(state).messages).length > 0) return;
	if (inFlight) return inFlight;

	// Warm from localStorage cache (best-effort)
	try {
		const cached = localStorage.getItem(cacheKey(workspaceId, locale));
		if (cached) {
			const parsed = JSON.parse(cached) as { messages?: Record<string, string> };
			if (parsed?.messages && typeof parsed.messages === 'object') {
				state.update((s) => ({ ...s, messages: parsed.messages as Record<string, string> }));
			}
		}
	} catch {
		// ignore
	}

	state.update((s) => ({ ...s, loading: true, error: null }));

	inFlight = (async () => {
		try {
			const res = await fetch('/api/i18n/messages.json', {
				headers: { Accept: 'application/json' }
			});

			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(text || `Failed to load messages (${res.status})`);
			}

			const data = (await res.json()) as { messages?: Record<string, string>; locale?: string };
			const messages = data?.messages && typeof data.messages === 'object' ? data.messages : {};
			const returnedLocale = (data?.locale || locale).toString();

			state.update((s) => ({
				...s,
				locale: returnedLocale,
				messages,
				loading: false,
				error: null
			}));

			try {
				localStorage.setItem(cacheKey(workspaceId, returnedLocale), JSON.stringify({ messages }));
			} catch {
				// ignore
			}

			lastLoadKey = `${workspaceId}:${returnedLocale}`;
		} catch (err) {
			console.warn('i18n: failed to load messages', err);
			state.update((s) => ({
				...s,
				loading: false,
				error: err instanceof Error ? err.message : 'Failed to load messages'
			}));
		} finally {
			inFlight = null;
		}
	})();

	return inFlight;
}

export function t(key: string, fallback?: string): string {
	const { messages } = get(state);
	const value = messages[key];
	if (value) return value;
	if (fallback !== undefined) {
		// Collect missing keys (for later sync to workspace). Avoid spamming DB: this is local-only.
		registerKey({
			key,
			fallback,
			module: 'ui',
			type: 'microcopy'
		});
		return fallback;
	}
	return key;
}

