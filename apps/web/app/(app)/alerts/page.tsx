import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { AlertRulesManager } from './rules-manager'
import { AlertHistory } from './history'

export const metadata = {
  title: 'Alerts - Edgeloop',
  description: 'Manage your trading alerts and notifications',
}

export default async function AlertsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Alerts</h1>
        <p className="mt-2 text-gray-600">
          Create and manage alerts for EV, arbitrage, middle, and line movement opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AlertRulesManager />
        </div>

        <div>
          <AlertHistory />
        </div>
      </div>
    </div>
  )
}
