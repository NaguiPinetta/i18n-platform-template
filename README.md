# i18n-platform-template

A reusable i18n + localization pipeline template built on SvelteKit, TypeScript, and modern web technologies. This template provides a foundation for building internationalized web applications with built-in support for translation workflows, RTL languages, and a consistent UI/UX system.

## Purpose

This template is designed to accelerate development of multi-language applications by providing:
- Standardized localization pipeline with CSV-based translation management
- Integration with translation tools (e.g., Omniglot)
- Built-in RTL (Right-to-Left) language support
- Consistent UI component library and design system
- Supabase integration for data persistence
- TypeScript-first development experience

## Quickstart

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd i18n-platform-template

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
PUBLIC_DEFAULT_LOCALE=en
PUBLIC_SUPPORTED_LOCALES=en,es,fr,ar

# Translation Service (if applicable)
TRANSLATION_SERVICE_API_KEY=your_api_key
```

## Localization Pipeline

The template includes a streamlined workflow for managing translations:

1. **Export**: Extract translation keys from your codebase into a CSV file
   ```bash
   npm run i18n:export
   ```

2. **Translate**: Send the CSV file to your translation service (e.g., Omniglot) for professional translation

3. **Import**: Import the translated CSV back into the application
   ```bash
   npm run i18n:import
   ```

The pipeline automatically handles:
- Key extraction and validation
- Missing translation detection
- RTL language detection and layout adjustments
- Locale file generation

## Documentation

For detailed specifications and guidelines, see the `/specs` folder:

- **[Product Specification](./specs/product.md)** - Overview, core modules, and use cases
- **[UI Specification](./specs/ui.md)** - Layout rules, design system primitives, and page anatomy
- **[i18n Pipeline Specification](./specs/i18n-pipeline.md)** - Translation workflow, CSV contract, and RTL rules
- **[Data Model Specification](./specs/data-model.md)** - Supabase schema and RLS policies
- **[Roadmap](./specs/roadmap.md)** - Development phases and milestones

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Branch and commit conventions
- Pull request process
- Code style and UI component usage

## License

See [LICENSE](./LICENSE) for details.
