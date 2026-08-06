import { useEffect } from 'react'
import { getSocket } from '../../../shared/services/socket'
import { getOrderById, getOrdersByUserId, cancelOrder } from '../services/orderApi'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

export function useOrder(orderId) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  })
}

export function useOrderTracking(orderId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !orderId) return

    function handleUpdate(updatedOrder) {
  if (updatedOrder.id === orderId) {
    queryClient.setQueryData(['order', orderId], updatedOrder)
  }
}

    socket.on('order:updated', handleUpdate)
    return () => socket.off('order:updated', handleUpdate)
  }, [orderId, queryClient])

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 30000, // socket pushes real-time updates now; this is just a safety net
  })
}

export function useUserOrders(userId) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !userId) return

    function handleUpdate() {
      queryClient.invalidateQueries({ queryKey: ['orders', userId] })
    }

    socket.on('order:updated', handleUpdate)
    return () => socket.off('order:updated', handleUpdate)
  }, [userId, queryClient])

  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => getOrdersByUserId(userId),
    enabled: !!userId,
    refetchInterval: 30000,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId) => cancelOrder(orderId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['order', updatedOrder.id], updatedOrder)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}