const PASSWORD_EXPIRY_WARNING_KEY = "auth:password-expiry-warning";

export type PasswordExpiryWarning = {
  mustChangePassword: boolean;
  passwordExpiresInDays?: number;
};

export function savePasswordExpiryWarning(warning: PasswordExpiryWarning) {
  if (typeof window === "undefined" || !warning.mustChangePassword) return;

  sessionStorage.setItem(PASSWORD_EXPIRY_WARNING_KEY, JSON.stringify(warning));
}

export function readPasswordExpiryWarning(): PasswordExpiryWarning | undefined {
  if (typeof window === "undefined") return undefined;

  const rawWarning = sessionStorage.getItem(PASSWORD_EXPIRY_WARNING_KEY);
  if (!rawWarning) return undefined;

  try {
    const warning = JSON.parse(rawWarning) as PasswordExpiryWarning;
    return warning.mustChangePassword ? warning : undefined;
  } catch {
    clearPasswordExpiryWarning();
    return undefined;
  }
}

export function clearPasswordExpiryWarning() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(PASSWORD_EXPIRY_WARNING_KEY);
}
