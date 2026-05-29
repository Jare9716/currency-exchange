import { AcceptInviteView } from "@/presentation/components/features/auth/views/AcceptInviteView";

type InviteTokenPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InviteTokenPage({ params }: InviteTokenPageProps) {
  const { token } = await params;

  return <AcceptInviteView token={token} />;
}
