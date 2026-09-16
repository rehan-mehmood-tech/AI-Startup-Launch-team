import ChatView from '@/components/validate/chat-view'

export default function Page({ params }: { params: { chatId: string } }) {
  return <ChatView chatId={params.chatId} />
}
