interface Series {
  label: string
  value: number
}

interface BarChartProps {
  title: string
  seriesA: Series[]
  seriesB: Series[]
  colorA: string
  colorB: string
}

export function BarChart({ title, seriesA, seriesB, colorA, colorB }: BarChartProps) {
  const max = Math.max(1, ...seriesA.map((s) => s.value), ...seriesB.map((s) => s.value))

  return (
    <div className="chart">
      <h4>{title}</h4>
      <div className="chart-legend">
        <span className="legend-dot" style={{ backgroundColor: colorA }} /> Demand
        <span className="legend-dot" style={{ backgroundColor: colorB }} /> Supply (slots)
      </div>
      <div className="chart-body">
        {seriesA.map((a, i) => {
          const b = seriesB[i]
          return (
            <div key={a.label} className="chart-row">
              <span className="chart-label">{a.label}</span>
              <div className="chart-bars">
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${(a.value / max) * 100}%`, backgroundColor: colorA }}
                  >
                    <span className="chart-value">{a.value}</span>
                  </div>
                </div>
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${((b?.value ?? 0) / max) * 100}%`, backgroundColor: colorB }}
                  >
                    <span className="chart-value">{b?.value ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
