# i18n Pipeline Specification

## Translation Keys File (CSV Contract)

### File Format
- CSV file containing translation keys, metadata, and values for all languages
- Wide format: one row per key, one column per language
- Structure: `key,module,type,screen,context,screenshot_ref,max_chars,<language_code_1>,<language_code_2>,...`
- Example:
  ```csv
  key,module,type,screen,context,screenshot_ref,max_chars,en,es,ar
  button.save,common,button,settings,Save button for settings page,,50,Save,Guardar,حفظ
  welcome.title,home,heading,landing,Welcome message on landing page,landing.png,100,Welcome,Bienvenido,مرحبا
  ```

### Required Columns
- `key` (required): Unique translation key identifier
- `module` (required): Module/namespace for the key (e.g., "common", "auth", "dashboard")
- `type` (required): Type of UI element (e.g., "button", "heading", "label", "placeholder")
- `screen` (optional): Screen/page where the key is used
- `context` (optional): Additional context for translators
- `screenshot_ref` (optional): Reference to screenshot showing the key in context
- `max_chars` (optional): Maximum character limit for the translation
- Language columns: One column per configured language (e.g., `en`, `es`, `ar`)

### Key Naming Convention
- Use dot notation for hierarchical organization
- Format: `{module}.{component}.{element}` or `{module}.{key}`
- Examples: `auth.login.button`, `dashboard.stats.title`, `common.save`

### Supported Locales
- ISO 639-1 language codes (e.g., `en`, `es`, `fr`, `ar`)
- Language codes are configured per workspace in the Languages management page
- RTL languages are automatically detected (Arabic, Hebrew, Farsi, Urdu, etc.)

## Export Flow

1. Navigate to Settings → i18n → Export
2. Click "Download CSV" to generate CSV file
3. CSV includes:
   - All translation keys with metadata
   - All configured languages as columns
   - Current translation values (empty cells for missing translations)
4. Send CSV file to translation service (e.g., Omniglot)
5. Track missing translations per locale

## Import Flow

1. Receive translated CSV from translation tool
2. Navigate to Settings → i18n → Import
3. Upload CSV file
4. **Column Mapping** (if needed):
   - System auto-detects language columns (2-3 letter codes) and common field names
   - Manually map CSV columns to system fields:
     - Required: `key` (translation key identifier)
     - Required: `en` (English fallback value)
     - Optional: `module`, `type`, `screen`, `context`, `screenshot_ref`, `max_chars`
     - Language columns: Map to language codes (e.g., `es`, `fr`, `ar`)
   - Supports flexible CSV formats with different column names
5. Choose conflict policy:
   - **Fill Missing**: Only update empty translations (preserves existing work) - **Recommended**
   - **Overwrite**: Replace all translations with CSV values
6. Preview changes before importing (shows what will be created/updated)
7. Confirm import to apply changes
8. System will:
   - Create missing languages automatically from CSV columns
   - Create missing keys with metadata
   - Update key metadata if provided
   - Upsert translations based on conflict policy
   - Set translation status to 'draft' for new/updated translations
   - **Clear cache and reload translations** - UI updates immediately

## Runtime i18n MVP (DB-driven)

This template includes a minimal runtime translation layer that loads translations from Supabase at runtime (per workspace).

### Cookies

- `ws` (httpOnly): current workspace id (set via `/api/workspace/set`)
- `locale` (httpOnly): selected locale code (set via `/api/i18n/locale`)

### Endpoints

- `GET /api/i18n/messages.json`
  - Auth required
  - Reads `ws` + validates membership
  - Reads `locale` cookie (defaults to `en`)
  - Returns `{ messages: Record<string,string>, locale: string }`
  - Omits missing/empty translations so the client can fall back
  - Cache header: `Cache-Control: no-store, must-revalidate` (prevents stale translations)
  - Supports cache-busting query parameter `?t=timestamp`

- `POST /api/i18n/locale`
  - Auth required
  - Reads `ws` + validates membership
  - Accepts JSON `{ locale: string }`
  - Strict validation: locale must exist in `i18n_languages` for the current workspace
  - Sets `locale` cookie (1 year)

### Key registry (auto-collect UI microcopy)

Problem: CSV exports are empty unless `i18n_keys` has rows.

Solution: when developers replace UI strings with `t('key', 'English fallback')`, the app collects those keys locally (in-memory) without touching the database. Then an owner/admin can sync them to Supabase in one batch so exports include all microcopy.

- **Collector**: `src/lib/stores/i18n-registry.ts`
  - store: `missingKeys` (Map keyed by `key`)
  - function: `registerKey(entry)` adds/merges entries
  - function: `clearRegistry()`

- **Where keys are collected**: `t(key, fallback)` registers a key when the translation is missing and a fallback is provided.

- **Sync endpoint**: `POST /api/i18n/sync-keys`
  - Auth required
  - Reads `ws` + validates membership
  - **Owner/admin only**
  - Accepts JSON `{ keys: Array<{ key,module,type,screen?,context?,screenshot_ref?,max_chars?,fallback_en? }>, overwrite_en?: boolean }`
  - Upserts `i18n_keys` (workspace-scoped, unique by `(workspace_id, key)`)
  - Ensures `en` exists in `i18n_languages` (creates if missing)
  - Writes `en` translations from `fallback_en` using **fill-missing** by default
    - Only overwrites existing `en` values when `overwrite_en: true`
  - Returns counts: `inserted_keys`, `updated_keys`, `en_values_written`

### Cache Management

- **Client-side caching**: Messages are cached in `localStorage` keyed by `(workspaceId, locale)`
- **Cache invalidation**: Automatically clears cache on:
  - Locale change
  - Workspace change
  - Successful import
- **Force refresh**: Uses cache-busting timestamps and `no-store` headers to ensure fresh data
- **Immediate UI updates**: Uses SvelteKit's `invalidate()` to force re-renders after state changes

### Fallback behavior

- If Supabase is not configured, the app stays usable and displays English fallback strings.
- If a translation is missing, the client shows the provided English fallback (or the key itself).
- **Visual highlighting**: Optional highlighting of untranslated keys (yellow in dark mode, red in light mode)
  - Toggle in Settings → i18n → "Highlight untranslated keys"
  - Helps identify missing translations during development

## RTL Rules

### Language Detection
- Maintain list of RTL languages (e.g., Arabic, Hebrew, Urdu)
- Auto-detect RTL based on locale code
- Apply RTL layout classes/styles automatically

### Layout Adjustments
- Mirror horizontal layouts (left ↔ right)
- Adjust text alignment (left-aligned becomes right-aligned)
- Flip directional icons and arrows
- Maintain logical reading order

### CSS Handling
- Use logical properties where possible (`margin-inline-start` vs `margin-left`)
- Apply `dir="rtl"` attribute to root element
- Test all components in both LTR and RTL modes

## Translation Workflow

1. **Development**: 
   - Replace UI strings with `t('key.name', 'English fallback')`
   - Navigate through app to collect keys in registry
   - Sync registry to workspace (owner/admin only)
2. **Export**: Generate CSV with all keys and current translations
3. **Translation**: Send CSV to translation service (Omniglot)
4. **Import**: 
   - Upload translated CSV
   - Map columns if needed (flexible format support)
   - Preview and confirm import
   - UI updates immediately
5. **Verification**: 
   - Switch language in header selector
   - Navigate through app to verify translations
   - Use "Highlight untranslated" toggle to identify missing translations
6. **Deployment**: Translations are stored in database, no deployment needed

## Key Naming Conventions

Following Phase 5 completion, all UI microcopy uses consistent key naming:

- `nav.*` - Navigation labels (e.g., `nav.dashboard`, `nav.projects`)
- `page.<route>.<section>.*` - Page titles/descriptions/buttons (e.g., `page.projects.title`, `page.logs.empty.title`)
- `dialog.<name>.*` - Modal/dialog strings (e.g., `dialog.add_key.title`)
- `form.<name>.*` - Form labels/placeholders/errors (e.g., `form.login.email_placeholder`)
- `common.*` - Reusable strings (e.g., `common.save`, `common.cancel`, `common.delete`)
- `i18n.*` - i18n management UI (e.g., `i18n.keys.add`, `i18n.import.title`)
- `settings.*` - Settings pages (e.g., `settings.users.title`, `settings.integrations.title`)
