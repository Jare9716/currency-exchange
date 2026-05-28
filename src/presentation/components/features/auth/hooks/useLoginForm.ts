import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginSchema,
  LoginFormData,
} from "@/presentation/components/features/auth/schemas/login.schema";
import { AuthenticateUser } from "@/use-cases/AuthenticateUser";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { to } from "@/utils/async";
import { savePasswordExpiryWarning } from "@/presentation/components/features/auth/utils/password-expiry-warning";
import { saveTwoFactorSession } from "@/presentation/components/features/auth/utils/two-factor-session";
import { getSpanishAuthErrorMessage } from "@/presentation/components/features/auth/utils/auth-error-message";

const authenticateUser = new AuthenticateUser(authService);

export function useLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | undefined>(
    undefined,
  );

  const handleChange =
    (field: keyof LoginFormData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(undefined);

    const validation = loginSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    const [err, result] = await to(
      authenticateUser.execute({
        email: validation.data.email,
        password: validation.data.password,
      }),
    );

    setIsSubmitting(false);

    if (err) {
      setGeneralError(getSpanishAuthErrorMessage(err, "Error de conexion al iniciar sesion"));
      return;
    }

    if (!result) return;

    if (result.type === "tenant_selection_required") {
      sessionStorage.setItem(
        "auth:tenant-selection",
        JSON.stringify({
          sessionToken: result.sessionToken,
          memberships: result.memberships,
          email: validation.data.email,
        }),
      );
      router.push("/login/tenant");
      return;
    }


    if (result.type === "two_factor_required") {
      saveTwoFactorSession({
        stateToken: result.stateToken,
        email: validation.data.email,
      });
      router.push("/2fa/verify");
      return;
    }

    useAuthStore.getState().setTokens(result.accessToken, result.refreshToken);
    savePasswordExpiryWarning({
      mustChangePassword: !!result.mustChangePassword,
      passwordExpiresInDays: result.passwordExpiresInDays,
    });

    router.push("/dashboard/transactions");
  };

  return {
    formData,
    errors,
    isSubmitting,
    generalError,
    handleChange,
    handleLogin,
  };
}
