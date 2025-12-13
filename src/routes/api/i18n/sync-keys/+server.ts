import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateWorkspaceMembership } from '$lib/supabase/i18n';
import { hasOwnerOrAdminRole } from '$lib/supabase/workspace';

type IncomingKey = {
	key: string;
	module: string;
	type: string;
	screen?: string | null;
	context?: string | null;
	screenshot_ref?: string | null;
	max_chars?: number | null;
	fallback_en?: string | null;
};

function isNonEmptyString(v: unknown): v is string {
	return typeof v === 'string' && v.trim().length > 0;
}

export const POST: RequestHandler = async (event) => {
	const membership = await validateWorkspaceMembership(event);
	if (!membership.ok) {
		return json({ ok: false, error: membership.error }, { status: membership.status });
	}

	const { supabase, workspaceId, session } = membership.ctx;

	// Enforce owner/admin
	const canManage = await hasOwnerOrAdminRole(supabase, workspaceId, session.user.id);
	if (!canManage) {
		return json(
			{ ok: false, error: 'Only workspace owners and admins can sync keys' },
			{ status: 403 }
		);
	}

	let body: any;
	try {
		body = await event.request.json();
	} catch {
		return json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const keys = body?.keys as unknown;
	const overwriteEn = body?.overwrite_en === true;

	if (!Array.isArray(keys)) {
		return json({ ok: false, error: 'Missing keys array' }, { status: 400 });
	}

	// Validate and normalize
	const incoming: IncomingKey[] = [];
	for (const k of keys) {
		if (!k || typeof k !== 'object') continue;
		const key = (k as any).key;
		const module = (k as any).module;
		const type = (k as any).type;
		if (!isNonEmptyString(key) || !isNonEmptyString(module) || !isNonEmptyString(type)) continue;

		const entry: IncomingKey = {
			key: key.trim(),
			module: module.trim(),
			type: type.trim(),
			screen: isNonEmptyString((k as any).screen) ? (k as any).screen.trim() : null,
			context: isNonEmptyString((k as any).context) ? (k as any).context.trim() : null,
			screenshot_ref: isNonEmptyString((k as any).screenshot_ref)
				? (k as any).screenshot_ref.trim()
				: null,
			max_chars: typeof (k as any).max_chars === 'number' ? (k as any).max_chars : null,
			fallback_en: isNonEmptyString((k as any).fallback_en) ? (k as any).fallback_en : null
		};

		incoming.push(entry);
	}

	if (incoming.length === 0) {
		return json({ ok: true, inserted_keys: 0, updated_keys: 0, en_values_written: 0 });
	}

	// Ensure 'en' language exists
	const { data: enLang, error: enErr } = await supabase
		.from('i18n_languages')
		.select('id')
		.eq('workspace_id', workspaceId)
		.eq('code', 'en')
		.single();

	let enLanguageId: string | null = (enLang as any)?.id || null;
	if (enErr || !enLanguageId) {
		const { data: created, error: createErr } = await supabase
			.from('i18n_languages')
			.insert({ workspace_id: workspaceId, code: 'en', name: 'English', is_rtl: false } as any)
			.select('id')
			.single();

		if (createErr || !(created as any)?.id) {
			return json({ ok: false, error: 'Failed to ensure en language exists' }, { status: 500 });
		}
		enLanguageId = (created as any).id as string;
	}

	// Fetch existing keys for comparisons + id mapping
	const { data: existingKeys, error: existingErr } = await supabase
		.from('i18n_keys')
		.select('id, key, module, type, screen, context, screenshot_ref, max_chars')
		.eq('workspace_id', workspaceId);

	if (existingErr) {
		return json({ ok: false, error: 'Failed to load existing keys' }, { status: 500 });
	}

	const existingByKey = new Map<string, any>();
	for (const row of (existingKeys as any[]) || []) {
		existingByKey.set(row.key, row);
	}

	let inserted_keys = 0;
	let updated_keys = 0;

	// Upsert keys
	const upsertRows: any[] = incoming.map((k) => {
		const row: any = {
			workspace_id: workspaceId,
			key: k.key,
			module: k.module,
			type: k.type
		};
		row.screen = k.screen ?? null;
		row.context = k.context ?? null;
		row.screenshot_ref = k.screenshot_ref ?? null;
		row.max_chars = k.max_chars ?? null;
		return row;
	});

	for (const k of incoming) {
		const prev = existingByKey.get(k.key);
		if (!prev) {
			inserted_keys++;
		} else {
			// Count as update only if any provided field differs
			const diffs =
				prev.module !== k.module ||
				prev.type !== k.type ||
				(prev.screen || null) !== (k.screen || null) ||
				(prev.context || null) !== (k.context || null) ||
				(prev.screenshot_ref || null) !== (k.screenshot_ref || null) ||
				(prev.max_chars ?? null) !== (k.max_chars ?? null);
			if (diffs) updated_keys++;
		}
	}

	const { error: upsertErr } = await supabase.from('i18n_keys').upsert(upsertRows as any, {
		onConflict: 'workspace_id,key'
	});

	if (upsertErr) {
		return json({ ok: false, error: 'Failed to upsert keys' }, { status: 500 });
	}

	// Resolve key ids for all incoming keys
	const keyList = incoming.map((k) => k.key);
	const { data: keyRows, error: keyRowsErr } = await supabase
		.from('i18n_keys')
		.select('id, key')
		.eq('workspace_id', workspaceId)
		.in('key', keyList);

	if (keyRowsErr) {
		return json({ ok: false, error: 'Failed to load key ids' }, { status: 500 });
	}

	const keyIdByKey = new Map<string, string>();
	for (const row of (keyRows as any[]) || []) keyIdByKey.set(row.key, row.id);

	// Prepare en translations (fill-missing by default)
	const candidates = incoming
		.filter((k) => isNonEmptyString(k.fallback_en))
		.map((k) => ({ key: k.key, value: (k.fallback_en as string).trim() }))
		.filter((k) => k.value.length > 0);

	let en_values_written = 0;
	if (candidates.length > 0 && enLanguageId) {
		const candidateKeyIds = candidates
			.map((c) => keyIdByKey.get(c.key))
			.filter((id): id is string => !!id);

		// Load existing en translations for these keys
		const { data: existingEn, error: existingEnErr } = await supabase
			.from('i18n_translations')
			.select('key_id, value')
			.eq('workspace_id', workspaceId)
			.eq('language_id', enLanguageId)
			.in('key_id', candidateKeyIds);

		if (existingEnErr) {
			return json({ ok: false, error: 'Failed to load existing en translations' }, { status: 500 });
		}

		const existingEnByKeyId = new Map<string, string>();
		for (const row of (existingEn as any[]) || []) {
			existingEnByKeyId.set(row.key_id, (row.value || '').toString());
		}

		const toUpsert: any[] = [];
		for (const c of candidates) {
			const keyId = keyIdByKey.get(c.key);
			if (!keyId) continue;
			const current = (existingEnByKeyId.get(keyId) || '').trim();
			if (!overwriteEn && current) continue;

			toUpsert.push({
				workspace_id: workspaceId,
				key_id: keyId,
				language_id: enLanguageId,
				value: c.value,
				status: 'draft'
			});
		}

		if (toUpsert.length > 0) {
			const { error: upsertTransErr } = await supabase
				.from('i18n_translations')
				.upsert(toUpsert as any, { onConflict: 'key_id,language_id' });
			if (upsertTransErr) {
				return json({ ok: false, error: 'Failed to upsert en translations' }, { status: 500 });
			}
			en_values_written = toUpsert.length;
		}
	}

	return json({
		ok: true,
		inserted_keys,
		updated_keys,
		en_values_written
	});
};
