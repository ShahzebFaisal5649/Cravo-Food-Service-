import { useAdminUsers } from '../hooks/useAdmin'
import { SkeletonRows, EmptyState, ErrorState } from './AdminUI'
import { IconUsers } from './AdminIcons'

export default function AdminUsersTab() {
  const { data: users, isLoading, isError } = useAdminUsers()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-offwhite font-semibold">All Users</h2>
        {!isLoading && !isError && (
          <span className="text-warmGray text-xs">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </span>
        )}
      </div>

      {isLoading && <SkeletonRows count={4} />}
      {isError && <ErrorState message="Couldn't load users." />}

      {!isLoading && !isError && users.length === 0 && (
        <EmptyState
          icon={<IconUsers className="w-10 h-10" />}
          title="No users yet"
          message="Signed-up customers and admins will appear here."
        />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="bg-slate border border-borderDark rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borderDark text-warmGray text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-borderDark last:border-0">
                  <td className="px-4 py-3 text-offwhite">{user.name}</td>
                  <td className="px-4 py-3 text-warmGray">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <span className="bg-gold/20 text-gold text-xs px-2 py-1 rounded">Admin</span>
                    ) : (
                      <span className="text-warmGray text-xs">Customer</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}