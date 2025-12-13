import { derived, writable, type Readable } from 'svelte/store';

export type RegistryEntry = {
	key: string;
	/** English fallback used in UI, becomes en translation when syncing */
	fallback: string;
	module?: string;
	type?: string;
	screen?: string | null;
	context?: string | null;
	screenshot_ref?: string | null;
	max_chars?: number | null;
};

type RegistryState = Map<string, RegistryEntry>;

const state = writable<RegistryState>(new Map());

export const missingKeys: Readable<RegistryState> = {
	subscribe: state.subscribe
};

export const missingKeysCount = derived(missingKeys, ($m) => $m.size);
export const missingKeysList = derived(missingKeys, ($m) => Array.from($m.values()));

export function registerKey(entry: RegistryEntry) {
	if (!entry?.key || !entry.fallback) return;

	state.update((prev) => {
		const next = new Map(prev);
		const key = entry.key.trim();
		if (!key) return next;
		const existing = next.get(key);

		if (!existing) {
			next.set(key, { ...entry, key });
			return next;
		}

		// Merge: keep existing values unless new entry provides something
		next.set(key, {
			...existing,
			...Object.fromEntries(
				Object.entries(entry).filter(([, v]) => v !== undefined && v !== null && v !== '')
			)
		} as RegistryEntry);

		return next;
	});
}

export function clearRegistry() {
	state.set(new Map());
}

