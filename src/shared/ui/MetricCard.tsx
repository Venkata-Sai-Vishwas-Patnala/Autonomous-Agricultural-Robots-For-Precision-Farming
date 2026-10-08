import type { LucideIcon } from 'lucide-react'

type MetricCardProps = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: 'green' | 'yellow' | 'blue' | 'coral'
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'green' }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className={`metric-icon tone-${tone}`} aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="metric-copy">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-detail">{detail}</p>
      </div>
    </article>
  )
}

export default MetricCard