# Frontend & Webapp Standards

> Standards for web application development in this project using Next.js (App Router), React, and Material UI (MUI).

## Layered Folder Structure (Clean Architecture)

While following Clean Architecture, organize the **Presentation Layer** (`src/presentation`) and other directories as follows:

```
src/
├── presentation/          # Next.js Presentation Logic
│   ├── components/        # FSD Component Architecture
│   │   ├── ui/            # Pure, domain-agnostic UI wrappers
│   │   ├── layout/        # Application layout structures (Sidebar, Headers)
│   │   └── features/      # Business domain bound components (auth, users, exchange)
│   ├── hooks/             # Presentation-specific hooks
│   ├── stores/            # Zustand global state stores
│   ├── styles/            # Global CSS and MUI Theme
│   └── views/             # Page-level components
├── app/                   # Next.js App Router (Routing, Layouts, Metadata)
├── config/                # Global configuration and environment variables
├── domain/                # Business logic and interfaces
├── use-cases/             # Application specific logic
├── infrastructure/        # Implementation of repositories and services
└── utils/                 # Pure helper functions
```

---

## React Components

### Prefer Functional Components

Use functional components for all UI. Use Class Components only for **Error Boundaries**.

### Avoid Render Functions in Component Body

Prefer extracting sub-components over creating `renderHeader()` functions within a component.

```tsx
// GOOD
export function Card() {
  return (
    <Box>
      <CardHeader />
      <CardContent />
    </Box>
  );
}

function CardHeader() {
  /* ... */
}
```

### Avoid Writing Your Own Request Logic

Use **TanStack Query (React Query)** if the project requires complex caching/syncing. For simpler requirements, use Server Components and `fetch`.

### Prefer Zustand over complex React Context

For global state that requires high performance or frequent updates, prefer **Zustand** over React Context to avoid unnecessary re-renders of the entire tree.

---

## Next.js (App Router)

- **Server Components by Default:** Fetch data directly in Server Components whenever possible.
- **Client Components:** Use `'use client'` only when strictly necessary (interactivity, browser APIs, context).
- **Metadata:** Use the `generateMetadata` API for SEO.
- **Optimization:** Use `next/image` for images and `next/link` for internal navigation.

---

## Styling & MUI

### Mobile-First Responsive Design

Always design for mobile first. Use MUI's responsive objects or media queries.

```tsx
// GOOD — MUI responsive object
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
    gap: { xs: 2, md: 3, lg: 4 },
  }}
>
  {/* Content */}
</Box>
```

### Theme Consistency

- **NEVER** hardcode colors or spacing.
- Use `theme.spacing()` (e.g., `padding: theme.spacing(2)`).
- Use `theme.palette.*` for all colors.

---

## Security

- **Validate Input:** Use **Zod** for all external data (API responses, form inputs).
- **Sanitize:** Avoid `dangerouslySetInnerHTML`. If forced to use it, sanitize with `sanitize-html`.
- **Public Files:** Remember `public/` is completely open to the internet. Do not store sensitive assets there.
- **Client-Side Auth:** Do not rely solely on client-side checks for security.

---

## Backend-First Approach

- All frontend communications should ideally go through a proxy or local API route if transformation/security check is needed.
- Prefer manipulating complex data in the backend/infrastructure layer rather than the presentation layer.
