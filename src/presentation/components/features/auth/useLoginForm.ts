import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormData } from "@/presentation/components/features/auth/login.schema";
import { AuthenticateUser } from "@/use-cases/AuthenticateUser";
import { userRepository } from "@/infrastructure/MockUserRepository";

export function useLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | undefined>(undefined);

  const handleChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
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
    try {
      const authenticateUser = new AuthenticateUser(userRepository);
      await authenticateUser.execute(validation.data.email);
      
      // Success! Redirect to dashboard
      router.push("/dashboard/users");
    } catch (error: any) {
      setGeneralError(error.message || "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
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
