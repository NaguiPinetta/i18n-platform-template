import { browser } from '$app/environment';
import { dev } from '$app/environment';
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

/**
 * Clear all cached messages for a specific workspace
 */
export function clearWorkspaceCache(workspaceId: string | null): void {
	if (!browser || !workspaceId) return;

	try {
		// Clear all localStorage entries for this workspace
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key && key.startsWith(`i18n_messages:${workspaceId}:`)) {
				localStorage.removeItem(key);
				if (dev) {
					console.log(`[i18n] Cleared workspace cache: ${key}`);
				}
			}
		}
	} catch {
		// ignore
	}

	// Reset in-memory cache tracking
	lastLoadKey = null;
	inFlight = null;

	// Clear state messages
	state.update((s) => ({ ...s, messages: {} }));
}

/**
 * Clear all cached messages (for all workspaces)
 */
export function clearAllCache(): void {
	if (!browser) return;

	try {
		// Clear all i18n-related localStorage entries
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key && key.startsWith('i18n_messages:')) {
				localStorage.removeItem(key);
				if (dev) {
					console.log(`[i18n] Cleared cache: ${key}`);
				}
			}
		}
	} catch {
		// ignore
	}

	// Reset in-memory cache tracking
	lastLoadKey = null;
	inFlight = null;

	// Clear state messages
	state.update((s) => ({ ...s, messages: {} }));
}

export async function loadMessages(forceLocale?: string): Promise<void> {
	if (!browser) return;

	const workspaceId = get(currentWorkspaceId);
	const currentState = get(state);
	const oldLocale = currentState.locale;
	const locale = forceLocale || currentState.locale || 'en';
	if (!workspaceId) return;

	const key = `${workspaceId}:${locale}`;

	// If forcing a locale change, clear all caches first
	if (forceLocale && forceLocale !== oldLocale) {
		if (dev) {
			console.log(`[i18n] Force loading messages for locale: ${forceLocale} (was: ${oldLocale})`);
		}

		// Clear localStorage cache for all locales of this workspace
		try {
			for (let i = localStorage.length - 1; i >= 0; i--) {
				const key = localStorage.key(i);
				if (key && key.startsWith(`i18n_messages:${workspaceId}:`)) {
					localStorage.removeItem(key);
					if (dev) {
						console.log(`[i18n] Cleared cache: ${key}`);
					}
				}
			}
		} catch {
			// ignore
		}

		// Reset load tracking to force fresh fetch
		lastLoadKey = null;
		inFlight = null;
	} else {
		// Only skip if same key AND we have messages AND locale hasn't been forced
		if (!forceLocale && key === lastLoadKey && currentState.messages && Object.keys(currentState.messages).length > 0) {
			if (dev) {
				console.log(`[i18n] Skipping load - messages already cached for ${key}`);
			}
			return;
		}

		// If there's an in-flight request and we're not forcing, wait for it
		if (inFlight && !forceLocale) {
			return inFlight;
		}
	}

	// Only warm from localStorage cache if NOT forcing a locale change
	if (!forceLocale) {
		try {
			const cached = localStorage.getItem(cacheKey(workspaceId, locale));
			if (cached) {
				const parsed = JSON.parse(cached) as { messages?: Record<string, string> };
				if (parsed?.messages && typeof parsed.messages === 'object') {
					state.update((s) => ({ ...s, messages: parsed.messages as Record<string, string> }));
					if (dev) {
						console.log(`[i18n] Loaded ${Object.keys(parsed.messages).length} messages from cache for ${locale}`);
					}
				}
			}
		} catch {
			// ignore
		}
	}

	state.update((s) => ({ ...s, loading: true, error: null }));

	inFlight = (async () => {
		try {
			// Always use cache busting to ensure fresh data
			const cacheBuster = `?t=${Date.now()}`;
			const res = await fetch(`/api/i18n/messages.json${cacheBuster}`, {
				headers: { Accept: 'application/json' },
				cache: 'no-store' // Always bypass browser cache
			});

			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(text || `Failed to load messages (${res.status})`);
			}

			const data = (await res.json()) as { messages?: Record<string, string>; locale?: string };
			const messages = data?.messages && typeof data.messages === 'object' ? data.messages : {};
			const returnedLocale = (data?.locale || locale).toString();

			if (dev) {
				console.log(`[i18n] Loaded ${Object.keys(messages).length} messages for locale: ${returnedLocale}`);
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

			// Cache the new messages
			try {
				localStorage.setItem(cacheKey(workspaceId, returnedLocale), JSON.stringify({ messages }));
				if (dev) {
					console.log(`[i18n] Cached messages for ${returnedLocale}`);
				}
			} catch {
				// ignore
			}

			lastLoadKey = `${workspaceId}:${returnedLocale}`;
		} catch (err) {
			console.warn('[i18n] Failed to load messages', err);
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
// Persist to localStorage
const HIGHLIGHT_STORAGE_KEY = 'i18n_highlight_untranslated';

function getInitialHighlightSetting(): boolean {
	if (!browser) return true;
	try {
		const stored = localStorage.getItem(HIGHLIGHT_STORAGE_KEY);
		if (stored !== null) {
			return stored === 'true';
		}
	} catch {
		// ignore
	}
	return true; // Default to enabled
}

export const highlightUntranslated = writable<boolean>(getInitialHighlightSetting());

// Persist to localStorage when changed
if (browser) {
	highlightUntranslated.subscribe((value) => {
		try {
			localStorage.setItem(HIGHLIGHT_STORAGE_KEY, value.toString());
		} catch {
			// ignore
		}
	});
}

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

