import { writable, derived } from 'svelte/store';

// RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] as const;

// Locale store
export const locale = writable<string>('en');

// Workspace-configurable RTL language codes (defaults to common list)
export const rtlLanguageCodes = writable<string[]>([...RTL_LANGUAGES]);

export function setRtlLanguages(codes: string[]) {
	rtlLanguageCodes.set(codes && codes.length > 0 ? codes : [...RTL_LANGUAGES]);
}

// Derived direction store
export const dir = derived([locale, rtlLanguageCodes], ([$locale, $rtlLanguageCodes]) => {
	return $rtlLanguageCodes.includes($locale) ? 'rtl' : 'ltr';
});

// Helper to check if current locale is RTL
export const isRTL = derived(dir, ($dir) => $dir === 'rtl');
