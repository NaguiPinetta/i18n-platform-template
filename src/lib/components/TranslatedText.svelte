<script lang="ts">
	import { t, hasTranslation, highlightUntranslated as highlightSetting } from '$lib/stores/i18n';

	export let key: string;
	export let fallback: string | undefined = undefined;
	export let highlightMissing: boolean | undefined = undefined; // undefined = use global setting
	export let tag: string = 'span'; // Allow custom tag (span, div, p, etc.)
	let className: string = ''; // Allow additional classes
	export { className as class };

	$: text = t(key, fallback);
	$: shouldHighlight = highlightMissing !== undefined ? highlightMissing : $highlightSetting;
	$: isFallback = shouldHighlight && !hasTranslation(key) && fallback !== undefined;
</script>

<svelte:element
	this={tag}
	class="{className} {isFallback ? 'untranslated' : ''}"
	title={isFallback ? `Missing translation for: ${key}` : ''}
>
	{text}
</svelte:element>
