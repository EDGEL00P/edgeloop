'use client'

import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { getAlertHistory } from '@edgeloop/api/alerts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@edgeloop/ui/cards'

export function AlertHistory() {
  const { user } = useUser()
  const userId = user?.id

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['alertHistory', userId],
    queryFn: () => (userId ? getAlertHistory(userId, 20) : Promise.resolve([])),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const statusConfig = {
    pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    sent: { label: 'Sent', color: 'text-green-600', bg: 'bg-green-50' },
    failed: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50' },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>Last 20 alerts sent</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-gray-500 text-sm">No alerts sent yet</div>
        ) : (
          <div className="space-y-2">
            {history.map((alert) => {
              const status = statusConfig[alert.deliveryStatus as keyof typeof statusConfig]
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${status?.bg || 'bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 capitalize">
                        {alert.type}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(alert.createdAt).toLocaleTimeString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        status?.color
                      }`}
                    >
                      {status?.label}
                    </span>
                  </div>
                  {alert.errorMessage && (
                    <p className="text-xs text-red-600 mt-2">{alert.errorMessage}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
