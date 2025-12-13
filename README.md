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

### Supabase Setup

This template uses Supabase for authentication and data persistence. You'll need to set up a Supabase project:

#### Option 1: Using Supabase Cloud

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon/public key

#### Option 2: Using Supabase Local Development

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Start local Supabase:
   ```bash
   supabase start
   ```

4. The CLI will output your local Supabase URL and keys. Use these in your `.env` file.

5. Apply migrations:
   ```bash
   supabase db reset
   ```
   This will run all migrations in `supabase/migrations/`

#### Applying Migrations

**For Supabase Cloud Users:**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in order. You can print all migrations with:
   ```bash
   npm run migrations:print
   ```
4. Copy and paste each migration file's contents into the SQL Editor and execute them in order:
   - `001_workspaces.sql` - Creates workspaces and workspace_members tables with RLS
   - `002_profiles.sql` - Creates profiles table and trigger for user creation

**For Supabase CLI Users:**

If you have Supabase CLI configured locally, you can apply all migrations at once:
```bash
supabase db reset
```

This will run all migrations in `supabase/migrations/` in order.

### Environment Variables

**⚠️ Important**: You must create a `.env` file to test authentication and workspaces features.

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:

```env
# Supabase Configuration (REQUIRED for auth/workspaces)
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
PUBLIC_DEFAULT_LOCALE=en
PUBLIC_SUPPORTED_LOCALES=en,es,fr,ar

# Translation Service (if applicable)
TRANSLATION_SERVICE_API_KEY=your_api_key
```

**Security Notes**:
- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` are public variables (prefixed with `PUBLIC_`) and safe to expose in the browser
- **The anon key is designed to be public** - security is provided by **Row Level Security (RLS) policies** in Supabase, which is the security boundary
- **Never commit your `.env` file to version control** - it's already in `.gitignore`
- The app will run without these variables, but authentication and workspace features will be disabled (a banner will be shown)
- **User Creation**: Use the UI sign-up flow or magic link authentication. Do not use service role keys in scripts.

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

## Security

**⚠️ Important**: This is a public template repository. Please review our security guidelines before contributing.

- **[Security Guidelines](./SECURITY.md)** - Comprehensive security best practices
- **Key Points**:
  - Never commit passwords, API keys, or service role keys
  - The `PUBLIC_SUPABASE_ANON_KEY` is safe to expose - RLS is the security boundary
  - Use UI sign-up/magic link for user creation, not privileged scripts
  - All sensitive data must use environment variables

For security vulnerabilities, please contact maintainers privately (do not create public issues).

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Branch and commit conventions
- Pull request process
- Code style and UI component usage

## License

See [LICENSE](./LICENSE) for details.
