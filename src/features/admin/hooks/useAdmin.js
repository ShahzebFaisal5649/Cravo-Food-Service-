import { useEffect } from 'react'
import { getSocket } from '../../../shared/services/socket'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  getAllRestaurantsAdmin,
  deleteRestaurant,
  toggleRestaurantOpen,
  getMenuItemsForRestaurant,
  deleteMenuItem,
  getAllUsersAdmin,
  getAllOrdersAdmin,
  updateOrderStatus,
} from '../services/adminApi'

// src/features/admin/hooks/useAdmin.js — add to the imports from '../services/adminApi', and add the hook:
import { /* ...existing..., */ getAdminStats } from '../services/adminApi'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  })
}

//RESTAURANTS 

export function useAdminRestaurants(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['admin-restaurants', page, limit],
    queryFn: () => getAllRestaurantsAdmin({ page, limit }),
    placeholderData: keepPreviousData,
  })
}


export function useDeleteRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
  })
}


export function useToggleRestaurantOpen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isOpen }) => toggleRestaurantOpen(id, isOpen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] })
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant'] })
    },
  })
}

//MENU ITEMS 

export function useAdminMenuItems(restaurantId) {
  return useQuery({
    queryKey: ['admin-menu-items', restaurantId],
    queryFn: () => getMenuItemsForRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
  })
}
export function useDeleteMenuItem(restaurantId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-menu-items', restaurantId] })
      queryClient.invalidateQueries({ queryKey: ['menuItems', restaurantId] })
    },
  })
}

//USERS 
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsersAdmin,
  })
}

//ORDERS 

export function useAdminOrders(page = 1, limit = 10) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    function refresh() {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    }

    socket.on('admin:orderCreated', refresh)
    socket.on('admin:orderUpdated', refresh)
    return () => {
      socket.off('admin:orderCreated', refresh)
      socket.off('admin:orderUpdated', refresh)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['admin-orders', page, limit],
    queryFn: () => getAllOrdersAdmin({ page, limit }),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', String(orderId)] })
    },
  })
}