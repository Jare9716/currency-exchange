import { AuthGuard } from "@/presentation/components/features/auth/components/AuthGuard";
import { TwoFactorSetupView } from "@/presentation/components/features/auth/views/TwoFactorSetupView";

export default function TwoFactorSetupPage() {
  return (
    <AuthGuard>
      <TwoFactorSetupView />
    </AuthGuard>
  );
}
