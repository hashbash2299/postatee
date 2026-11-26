export function generateStaticParams() {
  return [{ uid: "0" }];
}

import ProfileClient from "./ProfileClient";

export default async function Page({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  return <ProfileClient uid={uid} />;
}