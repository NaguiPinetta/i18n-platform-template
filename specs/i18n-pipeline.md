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
4. Choose conflict policy:
   - **Fill Missing**: Only update empty translations (preserves existing work)
   - **Overwrite**: Replace all translations with CSV values
5. Preview changes before importing
6. Confirm import to apply changes
7. System will:
   - Create missing languages automatically
   - Create missing keys
   - Update key metadata if provided
   - Upsert translations based on conflict policy
   - Set translation status to 'draft' for new/updated translations

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
  - Cache header: `Cache-Control: private, max-age=60`

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

### Fallback behavior

- If Supabase is not configured, the app stays usable and displays English fallback strings.
- If a translation is missing, the client shows the provided English fallback (or the key itself).

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

1. **Development**: Add new translation keys in code
2. **Export**: Generate CSV with all keys
3. **Translation**: Send CSV to translation service (Omniglot)
4. **Import**: Receive translated CSV and import into app
5. **Verification**: Test translations in UI
6. **Deployment**: Deploy updated translations
