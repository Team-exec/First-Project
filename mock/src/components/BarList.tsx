interface BarListItem {
  label: string
  value: number
}

interface BarListProps {
  title: string
  items: BarListItem[]
  color?: string
}

export function BarList({ title, items, color = 'var(--teal)' }: BarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="chart">
      <h4>{title}</h4>
      <div className="chart-body">
        {items.map((item) => (
          <div key={item.label} className="chart-row">
            <span className="chart-label">{item.label}</span>
            <div className="chart-track">
              <div
                className="chart-fill"
                style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
              >
                <span className="chart-value">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
