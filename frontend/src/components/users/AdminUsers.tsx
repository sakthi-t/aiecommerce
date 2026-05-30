import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchAdminUsers, deactivateUser, reactivateUser } from '../../api/usersApi'
import type { AdminUser } from '../../api/usersApi'

interface Props {
  getToken: () => Promise<string | null>
}

export default function AdminUsers({ getToken }: Props) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => fetchAdminUsers(getToken, page),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateUser(id, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => reactivateUser(id, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  if (isLoading) return <p className="text-gray-500">Loading users...</p>

  const users = data?.results ?? []

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Manage Users</h3>
      {users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: AdminUser) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{user.display_name || '—'}</td>
                    <td className="py-3 text-gray-500">{user.email}</td>
                    <td className="py-3">{user.total_orders}</td>
                    <td className="py-3">
                      {user.is_active ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-red-500 font-medium">Deactivated</span>
                      )}
                    </td>
                    <td className="py-3">
                      {user.is_active ? (
                        <button
                          onClick={() => deactivateMutation.mutate(user.id)}
                          disabled={deactivateMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivateMutation.mutate(user.id)}
                          disabled={reactivateMutation.isPending}
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.count > 10 && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                disabled={!data.previous}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
