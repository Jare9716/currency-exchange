# UI/UX Standards — Currency Exchange Project

This document defines the strict interface rules to ensure the application remains simple, robust, and prioritizes usability and consistency.

## 1. List Screen Composition (Tables)

All screens displaying lists (Customers, Transactions, etc.) must follow this header layout inside the `Paper` component.

```tsx
<Box sx={{ p: 3, display: "flex", gap: 2, alignItems: "center" }}>
  <TextField
    label="Search"
    placeholder="Descriptive text..."
    variant="outlined"
    size="small" // Standard size for high-density dashboards
    sx={{ flex: 1 }}
    slotProps={{
      inputLabel: { shrink: true },
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
          </InputAdornment>
        ),
      },
    }}
  />

  <Button 
    variant="contained" 
    fullWidth={false}
    size="small"
    sx={{ minWidth: "120px" }}
  >
    Action
  </Button>
</Box>
```

### Key Rules:
- **`flex: 1`** for the search bar: It must occupy all available space.
- **Native MUI Sizing:** Use the `size` prop (defaulting to `"small"` for this project) to maintain consistency. **NEVER** hardcode `height` or `padding` to force a specific size.
- **Grid v2 Engine:** Use the `Grid` component with the `size` prop for responsive layouts. Avoid legacy props like `xs`, `md` directly on the component; use `size={{ xs: 12, md: 6 }}`.

## 2. Forms and Modals

### Proportions:
- Use `display: "flex"` or `Grid` with `gap: 3` to group fields in the same row.
- **The Label Gap:** Modals must have a `pt: 6` (48px) on `DialogContent` to prevent floating labels from being clipped by the modal's top boundary.
- **Consistency:** All inputs in a form MUST share the same `size` (usually `"small"`).

## 3. MUI v6/v7 Deprecation Policy

To maintain architectural integrity with React 19 and Next.js 16, **deprecated props are strictly forbidden**. 

| Legacy Prop (❌ Forbidden) | Modern Prop (✅ Standard) |
| :--- | :--- |
| `InputProps` | `slotProps.input` |
| `InputLabelProps` | `slotProps.inputLabel` |
| `SelectProps` | `slotProps.select` |
| `primaryTypographyProps` | `slotProps.primary` |
| `secondaryTypographyProps` | `slotProps.secondary` |

**Example of correct usage:**
```tsx
<TextField
  slotProps={{
    input: { startAdornment: <Icon /> },
    inputLabel: { shrink: true }
  }}
/>
```

## 4. Language and Text Consistency

- **UI Language:** 100% Spanish (to match the end-user requirements).
- **Buttons:** Use clear action verbs (Nuevo, Guardar, Realizar transacción, Cancelar).
- **Placeholders:** Must provide clear examples (e.g., 10203040, Acme SAS).

### Error Message Localization:
- **Decoupled Boundary:** Do NOT hardcode error string translations in the core infrastructure layer (`HttpClient`). 
- **Error Codes:** Rely strictly on standard backend `error_code` strings (e.g., `NO_OPEN_SHIFT`, `CUSTOMER_FLAGGED`) for programmatic checks.
- **UI-Level Translations:** Localize error codes inside UI components or Presentation hooks (e.g., via localized dictionaries or internationalization helpers) to display the correct, human-readable Spanish feedback to the end-user.

## 5. Critical MUI + Next.js App Router Setup

These rules MUST be followed to prevent rendering regressions:

- **No `* { box-sizing: border-box }` in global CSS.** MUI's input components depend on `box-sizing: content-box` internally. Global resets break input height calculations.
- **Never use `enableCssLayer: true`**. This lowers MUI's cascade priority, allowing global CSS to override theme components silently.
- **SSR Hydration Fix:** `AppRouterCacheProvider` MUST live in a Server Component (e.g., `layout.tsx`) wrapping a Client Component `ThemeRegistry`. This ensures consistent ID generation between SSR and CSR.

```tsx
// layout.tsx (Server Component)
<AppRouterCacheProvider>
  <ThemeRegistry>{children}</ThemeRegistry>
</AppRouterCacheProvider>
```
