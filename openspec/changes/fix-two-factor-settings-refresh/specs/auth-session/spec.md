# Auth Session Spec Delta

## Modified Requirements

### Two-Factor Settings Management
The system SHALL keep the security settings landing view available for multiple settings options and derive the two-factor management flow from the current authenticated user's 2FA status only after the user selects the 2FA option.

#### Scenario: settings section opens
- **GIVEN** an authenticated user opens or refreshes the security settings page
- **WHEN** the settings page renders
- **THEN** the page displays the settings options list
- **AND** it does not automatically display a 2FA setup or disable flow

#### Scenario: 2FA is disabled
- **GIVEN** an authenticated user whose profile indicates 2FA is disabled
- **WHEN** the user selects `Verificacion de dos factores`
- **THEN** the page displays the QR setup and activation flow directly
- **AND** it does not display a disabled/status selection view first

#### Scenario: 2FA is enabled
- **GIVEN** an authenticated user whose profile indicates 2FA is enabled
- **WHEN** the user selects `Verificacion de dos factores`
- **THEN** the page displays the disable 2FA confirmation flow directly
- **AND** it does not display the configure/activate 2FA option first
