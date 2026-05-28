export type TwoFactorSession = {
  stateToken: string;
  email: string;
};

const TWO_FACTOR_SESSION_KEY = "auth:2fa-verification";

export const saveTwoFactorSession = (session: TwoFactorSession) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TWO_FACTOR_SESSION_KEY, JSON.stringify(session));
};

export const readTwoFactorSession = (): TwoFactorSession | undefined => {
  if (typeof window === "undefined") return undefined;

  const rawSession = sessionStorage.getItem(TWO_FACTOR_SESSION_KEY);
  if (!rawSession) return undefined;

  try {
    return JSON.parse(rawSession) as TwoFactorSession;
  } catch {
    sessionStorage.removeItem(TWO_FACTOR_SESSION_KEY);
    return undefined;
  }
};

export const clearTwoFactorSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TWO_FACTOR_SESSION_KEY);
};
