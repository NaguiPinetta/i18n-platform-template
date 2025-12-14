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

export async function loadMessages(forceLocale?: string): Promise<void> {
	if (!browser) return;

	const workspaceId = get(currentWorkspaceId);
	const currentState = get(state);
	const locale = forceLocale || currentState.locale || 'en';
	if (!workspaceId) return;

	const key = `${workspaceId}:${locale}`;
	// Only skip if same key AND we have messages AND locale hasn't been forced
	if (!forceLocale && key === lastLoadKey && currentState.messages && Object.keys(currentState.messages).length > 0) {
		return;
	}
	// If forcing a locale change, reset cache and allow new request
	if (forceLocale && key !== lastLoadKey) {
		lastLoadKey = null;
		inFlight = null;
	} else if (inFlight && !forceLocale) {
		return inFlight;
	}

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
			// Add cache busting when forcing a locale change
			const cacheBuster = forceLocale ? `?t=${Date.now()}` : '';
			const res = await fetch(`/api/i18n/messages.json${cacheBuster}`, {
				headers: { Accept: 'application/json' },
				cache: forceLocale ? 'no-store' : 'default'
			});

			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(text || `Failed to load messages (${res.status})`);
			}

			const data = (await res.json()) as { messages?: Record<string, string>; locale?: string };
			const messages = data?.messages && typeof data.messages === 'object' ? data.messages : {};
			const returnedLocale = (data?.locale || locale).toString();

			// Clear old locale cache from localStorage when locale changes
			if (forceLocale && returnedLocale !== currentState.locale) {
				try {
					// Clear all cached messages for this workspace
					for (let i = 0; i < localStorage.length; i++) {
						const key = localStorage.key(i);
						if (key && key.startsWith(`i18n_messages:${workspaceId}:`)) {
							localStorage.removeItem(key);
						}
					}
				} catch {
					// ignore
				}
			}

			// Update state - this will trigger reactivity in all components using t()
			// The state is a writable store, so updating it will notify all subscribers
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

// Global setting to enable/disable highlighting of untranslated keys
export const highlightUntranslated = writable<boolean>(true);

// Export t as a function that reads from the store
// IMPORTANT: This function must be called within a Svelte component context to be reactive
// Svelte will track the store subscription when t() is called in templates
// When the i18n store updates, components using t() will automatically re-render
export function t(key: string, fallback?: string): string {
	// Use get() to read from store - in component templates, Svelte tracks this
	// The key is that state is a writable store, so when it updates, components re-render
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

// Check if a translation exists (useful for highlighting)
export function hasTranslation(key: string): boolean {
	const { messages } = get(state);
	return !!messages[key];
}

// Get translation with metadata (text + isFallback flag)
export function tWithMeta(key: string, fallback?: string): { text: string; isFallback: boolean } {
	const { messages } = get(state);
	const value = messages[key];
	if (value) {
		return { text: value, isFallback: false };
	}
	if (fallback !== undefined) {
		registerKey({
			key,
			fallback,
			module: 'ui',
			type: 'microcopy'
		});
		return { text: fallback, isFallback: true };
	}
	return { text: key, isFallback: true };
}

