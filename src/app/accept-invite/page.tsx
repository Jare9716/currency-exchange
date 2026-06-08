import { AcceptInviteView } from "@/presentation/components/features/auth/views/AcceptInviteView";

type AcceptInvitePageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  return <AcceptInviteView token={searchParams?.token} />;
}
