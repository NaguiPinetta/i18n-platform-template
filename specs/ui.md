# UI Specification

## Layout Rules

### Page Structure
- Consistent header/navigation across all pages
- Footer placement and content guidelines
- Main content area constraints and padding
- Mobile-first responsive breakpoints

### Grid System
- Container max-widths
- Column spacing and gutters
- Responsive grid behavior

## Design System Primitives

### Typography
- Font families and fallbacks
- Heading hierarchy (h1-h6)
- Body text sizes and line heights
- Font weight scale

### Colors
- Primary color palette
- Semantic colors (success, error, warning, info)
- Neutral grays
- Dark mode support (TBD)

### Spacing
- Consistent spacing scale (4px, 8px, 16px, etc.)
- Component padding and margins
- Section spacing rules

### Components
- Button variants and sizes
- Form inputs and labels
- Cards and containers
- Navigation elements
- Loading states and skeletons

## Shared UI Primitives

All pages must use these shared components to maintain consistency:

### PageHeader
- **Location**: `src/lib/ui/PageHeader.svelte`
- **Purpose**: Standardized page header with title, description, and action buttons
- **Props**: `title` (required), `description` (optional), `actions` slot (optional)
- **Usage**: Every page should start with PageHeader

### PageBody
- **Location**: `src/lib/ui/PageBody.svelte`
- **Purpose**: Consistent page container with padding and max-width constraints
- **Props**: `maxWidth` ('sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'), defaults to 'full'
- **Usage**: Wrap all page content in PageBody

### DataToolbar
- **Location**: `src/lib/ui/DataToolbar.svelte`
- **Purpose**: Toolbar for data pages with search and action buttons
- **Slots**: `search` (optional), `actions` (optional)
- **Usage**: Use on list/table pages for filtering and actions

### EmptyState
- **Location**: `src/lib/ui/EmptyState.svelte`
- **Purpose**: Display when no data is available
- **Props**: `title`, `description`, `icon` slot (optional)
- **Usage**: Show when lists/tables are empty

### LoadingState
- **Location**: `src/lib/ui/LoadingState.svelte`
- **Purpose**: Loading indicator with message
- **Props**: `message` (optional, defaults to "Loading...")
- **Usage**: Show during data fetching

### ErrorState
- **Location**: `src/lib/ui/ErrorState.svelte`
- **Purpose**: Error display with optional retry actions
- **Props**: `title`, `message`
- **Usage**: Show when errors occur

### Card Components
- **Location**: `src/lib/ui/Card.svelte`, `CardHeader.svelte`, `CardContent.svelte`
- **Purpose**: Consistent card container with header and content sections
- **Usage**: Use for grouped content sections

## Page Anatomy

### Standard Page Layout
```
┌─────────────────────────────┐
│ Header / Navigation         │
├─────────────────────────────┤
│                             │
│ Main Content Area           │
│ (with consistent padding)   │
│                             │
├─────────────────────────────┤
│ Footer                      │
└─────────────────────────────┘
```

### Component Hierarchy
- Pages should use shared layout components
- Avoid custom page-specific layouts
- Reuse UI primitives from the design system
- Maintain consistent spacing and alignment

## RTL Considerations

- Automatic layout mirroring for RTL languages
- Icon and image flipping rules
- Text alignment defaults
- Navigation direction handling

### Direction Store
- **Location**: `src/lib/stores/direction.ts`
- **Purpose**: Manages locale and derived direction (LTR/RTL)
- **RTL Languages**: Arabic (ar), Hebrew (he), Persian (fa), Urdu (ur)
- **Implementation**: HTML `dir` and `lang` attributes are automatically updated
- **Usage**: Access via `$locale` and `$dir` stores in components
