# i18n Pipeline Specification

## Translation Keys File (CSV Contract)

### File Format
- CSV file containing translation keys and values
- Structure: `key,locale,value`
- Example:
  ```
  key,locale,value
  welcome.title,en,Welcome
  welcome.title,es,Bienvenido
  welcome.title,ar,مرحبا
  ```

### Key Naming Convention
- Use dot notation for hierarchical organization
- Format: `{module}.{component}.{element}`
- Examples: `auth.login.button`, `dashboard.stats.title`

### Supported Locales
- ISO 639-1 language codes (e.g., `en`, `es`, `fr`)
- Optional region codes (e.g., `en-US`, `en-GB`)
- Default locale: `en`

## Export Flow

1. Extract translation keys from source code
2. Generate CSV file with all keys and current values
3. Export file for translation tool (e.g., Omniglot)
4. Track missing translations per locale

## Import Flow

1. Receive translated CSV from translation tool
2. Validate CSV structure and required fields
3. Import translations into application
4. Update locale files or database
5. Verify all keys are present for all locales

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
