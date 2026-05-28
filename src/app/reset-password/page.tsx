import { ResetPasswordView } from "@/presentation/components/features/auth/views/ResetPasswordView";

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <ResetPasswordView token={searchParams?.token} />;
}
