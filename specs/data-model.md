# Data Model Specification

## Supabase Tables

### Overview
This section outlines the database schema and table structures for the i18n platform template.

### Core Tables (TBD)

#### Users Table
- User authentication and profile information
- Role-based access control fields
- Preferences and settings

#### Translations Table
- Translation keys and values
- Locale associations
- Version tracking
- Last updated timestamps

#### Projects/Workspaces Table
- Multi-tenant support (if applicable)
- Project-specific settings
- User associations

### Row Level Security (RLS) Goals

#### General Principles
- Users can only access data they're authorized to view
- Translation data access based on project/workspace membership
- Admin users have elevated permissions
- Public read access for published translations (if applicable)

#### Specific Policies (TBD)
- User table: Users can read/update their own records
- Translations: Users can read translations for their projects, admins can write
- Projects: Users can read projects they're members of

### Relationships
- User ↔ Project (many-to-many)
- Project ↔ Translation (one-to-many)
- Translation ↔ Locale (many-to-one)

### Indexes
- Optimize queries on frequently accessed columns
- Translation key lookups
- User authentication queries

### Migration Strategy
- Version-controlled schema migrations
- Backward compatibility considerations
- Data migration scripts for schema changes
