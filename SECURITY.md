# Security Guidelines

This document outlines security best practices for this template repository.

## Sensitive Information Policy

**⚠️ CRITICAL**: This is a public repository. Never commit sensitive information.

### What NOT to Commit

- **Passwords** - Never hardcode passwords in source code
- **API Keys** - Never commit API keys, service role keys, or other secrets
- **Email Addresses** - Avoid hardcoding real email addresses (use environment variables)
- **Database Credentials** - Never commit database connection strings or credentials
- **Private Keys** - Never commit SSH keys, SSL certificates, or private keys
- **`.env` files** - Never commit `.env` files (already in `.gitignore`)

### Environment Variables

All sensitive configuration should use environment variables:

- **Supabase**: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (public variables, safe to expose)
- **Dev Email Prefill**: `VITE_DEV_EMAIL` (optional, for development convenience)

**⚠️ Important**: This template does NOT include scripts that require service role keys. User creation should be done via the UI sign-up flow or magic link authentication.

### Files That Handle Sensitive Data

#### `src/routes/login/+page.svelte`
- **Purpose**: Login page with dev convenience feature
- **Security**: Only prefills email if `VITE_DEV_EMAIL` is set (dev mode only)
- **Never**: Hardcode real email addresses in this file

## Security Checklist

Before committing code, ensure:

- [ ] No hardcoded passwords
- [ ] No hardcoded API keys or secrets
- [ ] No real email addresses in source code
- [ ] All sensitive values use environment variables
- [ ] `.env` file is in `.gitignore` (✅ already configured)
- [ ] No `.env` files are tracked in git
- [ ] No service role keys in code
- [ ] No database credentials in code

## If You Accidentally Commit Sensitive Data

If sensitive information is accidentally committed:

1. **Immediately** rotate/revoke the exposed credentials
2. Remove the sensitive data from the commit history
3. Update the credentials in your environment
4. Review all commits to ensure no other sensitive data was exposed

### Removing Sensitive Data from Git History

```bash
# Use git filter-branch or BFG Repo-Cleaner
# Example with git filter-branch:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team first!)
git push origin --force --all
```

**Warning**: Force pushing rewrites history. Coordinate with your team before doing this.

## Public vs Private Variables

### Safe to Expose (Public Variables)
- `PUBLIC_SUPABASE_URL` - Public API endpoint
- `PUBLIC_SUPABASE_ANON_KEY` - Designed to be public; protected by RLS

### Never Expose (Private Variables)
- `SUPABASE_SERVICE_ROLE_KEY` - Full admin access, never expose (not used in this template)
- Any API keys without `PUBLIC_` prefix
- User passwords or credentials
- Real email addresses in source code

## Supabase Security Notes

- **Anon Key**: The `PUBLIC_SUPABASE_ANON_KEY` is designed to be public. **RLS (Row Level Security) is the security boundary** - the anon key alone does not grant access to data.
- **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and has full admin access. **This template does not include any scripts that require service role keys.** Use UI sign-up or magic link for user creation.
- **RLS Policies**: All database tables should have proper RLS policies enabled. See `supabase/migrations/` for examples.
- **User Creation**: Always use the UI sign-up flow (`/login` page) or magic link authentication. Do not create users via scripts requiring privileged keys.

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** create a public issue
2. Contact the repository maintainers privately
3. Provide details about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
