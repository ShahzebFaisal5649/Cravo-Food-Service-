import { useState } from 'react'
import { resetDemoData } from '../services/resetDemoData'
import ConfirmDialog from './ConfirmDialog'

export default function ResetDemoDataLink() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  async function handleConfirm() {
    setIsResetting(true)
    await resetDemoData()
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="fixed bottom-2 right-2 text-warmGray/40 hover:text-warmGray text-xs z-40"
      >
        reset demo data
      </button>

      {confirmOpen && (
        <ConfirmDialog
          title="Reset all demo data?"
          message="This clears your locally-stored login, cart, and favorites on this device. It does not delete restaurants, orders, reviews, or accounts — those are stored on the server."
          confirmLabel={isResetting ? 'Resetting...' : 'Reset'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}