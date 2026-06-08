import { translateApiError } from "@/config/i18n";

describe("i18n translation utility", () => {
  it("should translate a known error code", () => {
    const result = translateApiError("TOKEN_INVALID", "Default error message");
    expect(result).toBe(
      "La sesión ha expirado o el token no es válido. Por favor, inicia sesión de nuevo."
    );
  });

  it("should translate a known default detail string if error code is missing", () => {
    const result = translateApiError(undefined, "Incorrect password");
    expect(result).toBe("Contraseña incorrecta.");
  });

  it("should translate a known default detail string if error code is not found", () => {
    const result = translateApiError("UNKNOWN_CODE", "Incorrect password");
    expect(result).toBe("Contraseña incorrecta.");
  });

  it("should return the default detail string if neither code nor detail are known", () => {
    const result = translateApiError("UNKNOWN_CODE", "Some random error");
    expect(result).toBe("Some random error");
  });

  it("should handle undefined code and undefined defaultDetail gracefully", () => {
    // @ts-expect-error testing invalid input
    const result = translateApiError(undefined, undefined);
    expect(result).toBe(undefined);
  });
});
