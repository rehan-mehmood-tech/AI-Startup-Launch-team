import type { Metadata } from 'next'
import ShareReportPage from '@/components/validate/share-report-page'

export const metadata: Metadata = {
  title: 'Validation Report · AI Startup Launch Team',
  robots: { index: false, follow: false },
}

export default function Page({ params }: { params: { id: string } }) {
  return <ShareReportPage shareId={params.id} />
}
