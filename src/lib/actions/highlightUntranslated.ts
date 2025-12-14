import type { Action } from 'svelte/action';
import { get } from 'svelte/store';
import { i18n } from '$lib/stores/i18n';

interface HighlightUntranslatedParams {
	translationKey: string;
	fallback?: string;
	enabled?: boolean;
}

/**
 * Svelte action to automatically highlight text when translation is missing
 * Usage: <span use:highlightUntranslated={{translationKey: 'some.key', fallback: 'English text'}}>
 */
export const highlightUntranslated: Action<HTMLElement, HighlightUntranslatedParams> = (
	node,
	params
) => {
	if (!params) return;

	const { translationKey, fallback, enabled = true } = params;

	function updateHighlight() {
		if (!enabled) {
			node.classList.remove('untranslated');
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

	// Subscribe to i18n store changes
	const unsubscribe = i18n.subscribe(() => {
		updateHighlight();
	});

	return {
		update(newParams: HighlightUntranslatedParams) {
			Object.assign(params, newParams);
			updateHighlight();
		},
		destroy() {
			unsubscribe();
			node.classList.remove('untranslated');
		}
	};
};
