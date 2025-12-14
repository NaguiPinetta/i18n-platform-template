import type { Action } from 'svelte/action';
import { get } from 'svelte/store';
import { i18n, highlightUntranslated as globalHighlightSetting } from '$lib/stores/i18n';

interface HighlightUntranslatedParams {
	translationKey: string;
	fallback?: string;
	enabled?: boolean; // undefined = use global setting, true/false = override
}

/**
 * Svelte action to automatically highlight text when translation is missing
 * Usage: <span use:highlightUntranslated={{translationKey: 'some.key', fallback: 'English text'}}>
 * 
 * Respects global highlightUntranslated setting unless explicitly overridden with enabled: true/false
 */
export const highlightUntranslated: Action<HTMLElement, HighlightUntranslatedParams> = (
	node,
	params
) => {
	if (!params) return;

	let { translationKey, fallback, enabled } = params;

	function updateHighlight() {
		// Determine if highlighting should be enabled
		// enabled === undefined means use global setting
		const shouldHighlight = enabled !== undefined ? enabled : get(globalHighlightSetting);

		if (!shouldHighlight) {
			node.classList.remove('untranslated');
			node.removeAttribute('title');
			return;
		}

		const { messages } = get(i18n);
		const hasTranslation = !!messages[translationKey];
		const isFallback = !hasTranslation && fallback !== undefined;

		if (isFallback) {
			node.classList.add('untranslated');
			node.setAttribute('title', `Missing translation for: ${translationKey}`);
		} else {
			node.classList.remove('untranslated');
			node.removeAttribute('title');
		}
	}

	// Initial check
	updateHighlight();

	// Subscribe to both i18n store and global highlight setting changes
	const unsubscribeI18n = i18n.subscribe(() => {
		updateHighlight();
	});

	const unsubscribeHighlight = globalHighlightSetting.subscribe(() => {
		updateHighlight();
	});

	return {
		update(newParams: HighlightUntranslatedParams) {
			translationKey = newParams.translationKey ?? translationKey;
			fallback = newParams.fallback ?? fallback;
			enabled = newParams.enabled !== undefined ? newParams.enabled : enabled;
			updateHighlight();
		},
		destroy() {
			unsubscribeI18n();
			unsubscribeHighlight();
			node.classList.remove('untranslated');
			node.removeAttribute('title');
		}
	};
};
