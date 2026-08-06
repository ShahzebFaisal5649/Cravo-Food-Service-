import { IconAlert } from './AdminIcons'

export function StatCard({ label, value, icon, accent = 'gold' }) {
  const accentClasses = {
    gold: 'text-gold border-gold/30 bg-gold/5',
    success: 'text-success border-success/30 bg-success/5',
    error: 'text-error border-error/30 bg-error/5',
    champagne: 'text-champagne border-champagne/30 bg-champagne/5',
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${accentClasses[accent]}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-display leading-none">{value}</p>
        <p className="text-warmGray text-xs mt-1">{label}</p>
      </div>
    </div>
  )
}

export function SkeletonRows({ count = 3 }) {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate border border-borderDark rounded-lg h-[60px]" />
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center border border-dashed border-borderDark rounded-xl py-12 px-4">
      <div className="text-warmGray mb-3">{icon}</div>
      <p className="text-offwhite font-medium">{title}</p>
      {message && <p className="text-warmGray text-sm mt-1 max-w-sm">{message}</p>}
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-center gap-2 text-error border border-error/30 bg-error/5 rounded-lg px-4 py-3 text-sm">
      <IconAlert className="w-4 h-4 shrink-0" />
      {message}
    </div>
  )
}