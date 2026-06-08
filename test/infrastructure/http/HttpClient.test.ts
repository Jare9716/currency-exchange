import { HttpClient } from "@/infrastructure/http/HttpClient";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { ApiError } from "@/domain/Errors";
import { API_BASE_URL } from "@/config";

interface CustomGlobal {
  Response: unknown;
  Headers: unknown;
}

const customGlobal = global as unknown as CustomGlobal;

if (!customGlobal.Response) {
  customGlobal.Response = class Response {
    ok: boolean;
    status: number;
    constructor(public body: string, public init?: { status?: number }) {
      this.ok = (init?.status || 200) >= 200 && (init?.status || 200) < 300;
      this.status = init?.status || 200;
    }
    async json() {
      return JSON.parse(this.body);
    }
  };
}

if (!customGlobal.Headers) {
  customGlobal.Headers = class Headers {
    map = new Map<string, string>();
    constructor(init?: Record<string, unknown>) {
      if (init) Object.entries(init).forEach(([k, v]) => this.set(k, v as string));
    }
    set(k: string, v: string) { this.map.set(k.toLowerCase(), v); }
    get(k: string) { return this.map.get(k.toLowerCase()) || null; }
    has(k: string) { return this.map.has(k.toLowerCase()); }
  };
}

describe("HttpClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    useAuthStore.setState({ accessToken: undefined, refreshToken: undefined });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should append Authorization header when access token exists", async () => {
    // Arrange
    useAuthStore.setState({ accessToken: "fake-access-token" });
    const mockResponse = new Response(JSON.stringify({ data: "success" }), { status: 200 });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Act
    await HttpClient.get("/test");

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/test`,
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    
    const headersArg = (global.fetch as jest.Mock).mock.calls[0][1].headers as Headers;
    expect(headersArg.get("Authorization")).toBe("Bearer fake-access-token");
  });

  it("should throw an ApiError if the backend returns a standardized error", async () => {
    // Arrange
    const errorBody = {
      status_code: 400,
      error_code: "INVALID_CREDENTIALS",
      detail: "Invalid email or password",
      hint: "Try again"
    };
    const mockResponse = new Response(JSON.stringify(errorBody), { status: 400 });
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Act
    let caughtError: ApiError | undefined;
    try {
      await HttpClient.post("/login", { email: "test@test.com" });
    } catch (e) {
      caughtError = e as ApiError;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(ApiError);
    expect(caughtError?.errorCode).toBe("INVALID_CREDENTIALS");
    expect(caughtError?.statusCode).toBe(400);
    expect(caughtError?.detail).toBe("Correo o contraseña incorrectos.");
  });

  it("should attempt token refresh and retry request on TOKEN_INVALID error", async () => {
    // Arrange
    useAuthStore.setState({ accessToken: "expired-token", refreshToken: "valid-refresh" });
    
    const invalidTokenResponse = new Response(
      JSON.stringify({ status_code: 401, error_code: "TOKEN_INVALID", detail: "Token expired" }),
      { status: 401 }
    );
    
    const refreshSuccessResponse = new Response(
      JSON.stringify({ access_token: "new-access", refresh_token: "new-refresh" }),
      { status: 200 }
    );
    
    const successfulRetryResponse = new Response(
      JSON.stringify({ data: "success" }),
      { status: 200 }
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(invalidTokenResponse) // 1. Original call fails
      .mockResolvedValueOnce(refreshSuccessResponse) // 2. Refresh call succeeds
      .mockResolvedValueOnce(successfulRetryResponse); // 3. Retry call succeeds

    // Act
    const result = await HttpClient.get("/protected-route");

    // Assert
    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    // Check that the store was updated
    expect(useAuthStore.getState().accessToken).toBe("new-access");
    
    // Check that the retry request used the new token
    const retryHeadersArg = (global.fetch as jest.Mock).mock.calls[2][1].headers as Headers;
    expect(retryHeadersArg.get("Authorization")).toBe("Bearer new-access");
  });

  it("should clear tokens and dispatch session:expired event if refresh token fails", async () => {
    // Arrange
    useAuthStore.setState({ accessToken: "expired-token", refreshToken: "bad-refresh" });
    
    let dispatchSpy: jest.SpyInstance | undefined;
    if (global.window) {
      dispatchSpy = jest.spyOn(global.window, "dispatchEvent").mockImplementation();
    }
    
    const invalidTokenResponse = new Response(
      JSON.stringify({ status_code: 401, error_code: "TOKEN_INVALID", detail: "Token expired" }),
      { status: 401 }
    );
    
    const refreshFailedResponse = new Response(
      JSON.stringify({ status_code: 401, error_code: "TOKEN_INVALID", detail: "Refresh expired" }),
      { status: 401 }
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(invalidTokenResponse) // 1. Original call fails
      .mockResolvedValueOnce(refreshFailedResponse); // 2. Refresh call fails

    // Act
    let caughtError: ApiError | undefined;
    try {
      await HttpClient.get("/protected-route");
    } catch (e) {
      caughtError = e as ApiError;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().accessToken).toBeUndefined();
    if (dispatchSpy) {
      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
      expect(dispatchSpy.mock.calls[0][0].type).toBe("session:expired");
    }
  });
});
