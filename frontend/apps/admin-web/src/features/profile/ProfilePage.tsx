import { PageHeader } from "@/components/layout/PageHeader";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { tr } from "@/i18n/tr";
import { ProfileForm } from "./ProfileForm";
import { useProfile } from "./useProfile";

export function ProfilePage() {
  const profile = useProfile();

  if (profile.isSuccess) {
    return <ProfileForm profile={profile.data} />;
  }
  return (
    <>
      <PageHeader kicker={tr.nav.profileGroup} title={tr.profile.title} />
      {profile.isError ? <LoadError onRetry={() => void profile.refetch()} /> : <Loading />}
    </>
  );
}
