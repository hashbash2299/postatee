export const dynamic = 'force-dynamic'
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

import ChatRoomClient from "./ChatRoomClient"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatRoomClient id={id} />
}