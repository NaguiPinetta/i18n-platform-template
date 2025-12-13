import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

// Get system preference
function getSystemTheme(): 'light' | 'dark' {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Get initial theme from localStorage or default to 'system'
function getInitialTheme(): Theme {
	if (!browser) return 'system';
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return (stored as Theme) || 'system';
}

// Create theme store
export const theme = writable<Theme>(getInitialTheme());

// Derived store for effective theme (resolves 'system' to actual theme)
export const effectiveTheme = derived(theme, ($theme) => {
	if ($theme === 'system') {
		return getSystemTheme();
	}
	return $theme;
});

// Apply theme to HTML element
function applyTheme(effective: 'light' | 'dark') {
	if (!browser) return;
	const html = document.documentElement;
	if (effective === 'dark') {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}
}

// Listen to system preference changes and apply theme
if (browser) {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		// Only update if theme is set to 'system'
		theme.update((current) => {
			if (current === 'system') {
				applyTheme(getSystemTheme());
			}
			return current;
		});
	});

	// Persist theme changes to localStorage
	theme.subscribe((value) => {
		localStorage.setItem(THEME_STORAGE_KEY, value);
	});

	// Apply theme when effective theme changes
	effectiveTheme.subscribe(applyTheme);
}
