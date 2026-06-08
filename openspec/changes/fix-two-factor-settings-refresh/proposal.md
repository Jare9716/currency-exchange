# Fix Two-Factor Settings Selection Flow

## Summary
Ensure the security settings page keeps its initial options list and opens the correct two-factor authentication management flow only after the user selects `Verificacion de dos factores`.

## Problem
The settings section can contain multiple options. Entering `Configuracion` should not immediately force the user into 2FA setup or disable screens. The 2FA status should only determine which 2FA flow appears after selecting the 2FA option.

## Proposed Change
Keep the settings page on its initial options view, then use the authenticated profile's 2FA status when the 2FA option is selected:

- 2FA disabled: show the QR setup and activation flow.
- 2FA enabled: show the disable confirmation flow.

## Impact
- Presentation: security settings view conditional flow.
- Infrastructure: auth profile response mapping for 2FA status aliases.
