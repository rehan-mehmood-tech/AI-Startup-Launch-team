import { redirect } from 'next/navigation'

// The one-shot wizard was replaced by the human-in-the-loop chat flow.
export default function Page() {
  redirect('/validate')
}
