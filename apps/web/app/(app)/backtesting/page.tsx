import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@edgeloop/api/auth'
import { BacktestingUI } from '@edgeloop/ui/backtesting-ui'

export const metadata = {
  title: 'Backtesting - Edgeloop',
  description: 'Test your edge detection strategy against historical data',
}

export default async function BacktestingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Backtesting</h1>
        <p className="mt-2 text-gray-600">
          Evaluate your edge detection strategy against historical NFL odds and outcomes
        </p>
      </div>

      <BacktestingUI />
    </div>
  )
}
