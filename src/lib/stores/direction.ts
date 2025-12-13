import { writable, derived } from 'svelte/store';

// RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'] as const;

// Locale store
export const locale = writable<string>('en');

// Derived direction store
export const dir = derived(locale, ($locale) => {
	return RTL_LANGUAGES.includes($locale as (typeof RTL_LANGUAGES)[number]) ? 'rtl' : 'ltr';
});

// Helper to check if current locale is RTL
export const isRTL = derived(dir, ($dir) => $dir === 'rtl');
