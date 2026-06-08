# zod-error-translation

## Overview
Replaces default English validation messages thrown by Zod with standard Spanish strings dynamically at runtime.

## Actors
- **Zod library**: Performs schema validations.
- **UI Components**: Displays parsed Zod errors to the user (e.g., Auth, Profile, Customer Modals).

## Use Cases

### Displaying Validation Error
- **Trigger**: A user submits a form with invalid data (e.g. invalid email format) processed by a Zod schema.
- **Flow**:
  1. The schema validates the payload and detects an anomaly.
  2. Zod checks its internal global error map (which was overridden during app startup via `z.setErrorMap`).
  3. Zod resolves the error key via `zod-i18n-map` (which uses `i18next` set to `es` language).
  4. Zod returns a localized Spanish string (e.g., "Correo electrónico inválido") instead of "Invalid email".
  5. The UI catches the error and surfaces the translated string seamlessly.
