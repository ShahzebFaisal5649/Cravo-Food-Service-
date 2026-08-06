import { useState } from 'react'
import AdminRestaurantsTab from './AdminRestaurantsTab'
import AdminOrdersTab from './AdminOrdersTab'
import AdminUsersTab from './AdminUsersTab'
import AdminMenuItemsTab from './AdminMenuItemsTab'
import { StatCard } from './AdminUI'
import { useAdminRestaurants, useAdminOrders, useAdminUsers, useAdminStats } from '../hooks/useAdmin'
import { IconRestaurant, IconMenuItems, IconOrders, IconUsers, IconRevenue } from './AdminIcons'

const TABS = [
  { label: 'Restaurants', icon: IconRestaurant },
  { label: 'Menu Items', icon: IconMenuItems },
  { label: 'Orders', icon: IconOrders },
  { label: 'Users', icon: IconUsers },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Restaurants')

  const { data: restaurants } = useAdminRestaurants()
  const { data: orders } = useAdminOrders()
  const { data: users } = useAdminUsers()

  const { data: stats } = useAdminStats()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-gold text-3xl mb-6">Admin Panel</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Restaurants" value={restaurants?.totalCount ?? '—'} icon={<IconRestaurant className="w-6 h-6" />} accent="gold" />
        <StatCard label="Orders" value={orders?.totalCount ?? '—'} icon={<IconOrders className="w-6 h-6" />} accent="champagne" />
        <StatCard label="Users" value={users?.length ?? '—'} icon={<IconUsers className="w-6 h-6" />} accent="success" />
        <StatCard label="Revenue" value={`Rs. ${stats?.totalRevenue ?? '—'}`} icon={<IconRevenue className="w-6 h-6" />} accent="gold" />
      </div>

      <div className="flex gap-2 border-b border-borderDark mb-6 overflow-x-auto">
        {TABS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={
              'flex items-center gap-2 px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ' +
              (activeTab === label
                ? 'border-gold text-gold'
                : 'border-transparent text-warmGray hover:text-offwhite')
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'Restaurants' && <AdminRestaurantsTab />}
      {activeTab === 'Menu Items' && <AdminMenuItemsTab />}
      {activeTab === 'Orders' && <AdminOrdersTab />}
      {activeTab === 'Users' && <AdminUsersTab />}
    </div>
  )
}