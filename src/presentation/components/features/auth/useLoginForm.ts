import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginSchema,
  LoginFormData,
} from "@/presentation/components/features/auth/login.schema";
import { AuthenticateUser } from "@/use-cases/AuthenticateUser";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { to } from "@/utils/async";
import { ApiError } from "@/domain/Errors";

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

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(undefined);

    // 1. Validate with Zod
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

    // 2. Call Use Case
    const authenticateUser = new AuthenticateUser(authService);
    const [err, tokens] = await to(
      authenticateUser.execute({
        email: validation.data.email,
        password: validation.data.password,
      })
    );

    setIsSubmitting(false);

    if (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.detail || "Credenciales inválidas");
      } else {
        setGeneralError("Error de conexión al iniciar sesión");
      }
      return;
    }

    // Success! Redirect to dashboard
    if (tokens) {
      useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken);
      router.push("/dashboard/customers");
    }
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
