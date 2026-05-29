import { ResetPasswordView } from "@/presentation/components/features/auth/views/ResetPasswordView";

type ResetPasswordTokenPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ResetPasswordTokenPage({ params }: ResetPasswordTokenPageProps) {
  const { token } = await params;

  return <ResetPasswordView token={token} />;
}
