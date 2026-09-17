import { redirect } from 'next/navigation'

// The old one-shot dashboard was replaced by the chat workspace's report.
export default function Page() {
  redirect('/validate')
}
