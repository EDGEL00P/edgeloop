'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { CreateAlertRuleInput } from '@edgeloop/api'
import { getAlertRules, createAlertRule, updateAlertRule, toggleAlertRule, archiveAlertRule } from '@edgeloop/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@edgeloop/ui/cards'
import { Button } from '@edgeloop/ui/primitives'
import { AlertRuleForm } from './alert-rule-form'

export function AlertRulesManager() {
  const { data: session } = useSession()
  const [showForm, setShowForm] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const userId = session?.user?.id
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alertRules', userId],
    queryFn: () => (userId ? getAlertRules(userId) : Promise.resolve([])),
    enabled: !!userId,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateAlertRuleInput) =>
      userId ? createAlertRule(userId, input) : Promise.reject('No user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules', userId] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: Partial<CreateAlertRuleInput> }) =>
      userId ? updateAlertRule(userId, ruleId, input) : Promise.reject('No user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules', userId] })
      setEditingRuleId(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (ruleId: string) =>
      userId ? toggleAlertRule(userId, ruleId) : Promise.reject('No user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules', userId] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (ruleId: string) =>
      userId ? archiveAlertRule(userId, ruleId) : Promise.reject('No user'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules', userId] })
    },
  })

  const handleCreate = (input: CreateAlertRuleInput) => {
    createMutation.mutate(input)
  }

  const handleUpdate = (input: CreateAlertRuleInput) => {
    if (editingRuleId) {
      updateMutation.mutate({ ruleId: editingRuleId, input })
    }
  }

  if (isLoading) {
    return <div className="text-gray-500">Loading alert rules...</div>
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingRuleId ? 'Edit Alert Rule' : 'Create New Alert Rule'}</CardTitle>
            <CardDescription>
              {editingRuleId
                ? 'Update your alert rule settings'
                : 'Set up a new alert for trading opportunities'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertRuleForm
              onSubmit={editingRuleId ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false)
                setEditingRuleId(null)
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full">
          + Create Alert Rule
        </Button>
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No alert rules yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    {rule.description && <CardDescription>{rule.description}</CardDescription>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={rule.enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleMutation.mutate(rule.id)}
                      disabled={toggleMutation.isPending}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRuleId(rule.id)
                        setShowForm(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => archiveMutation.mutate(rule.id)}
                      disabled={archiveMutation.isPending}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium capitalize">{(rule.config as Record<string, unknown>).type}</p>
                  </div>
                  {((rule.config as Record<string, unknown>).minEV as number) && (
                    <div>
                      <p className="text-gray-500">Min EV</p>
                      <p className="font-medium">
                        {((rule.config as Record<string, unknown>).minEV as number).toFixed(2)}%
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Notifications</p>
                    <p className="font-medium">
                      {((rule.delivery as Record<string, unknown>).email ? '📧 ' : '') +
                        ((rule.delivery as Record<string, unknown>).slack ? '🎯' : '')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
