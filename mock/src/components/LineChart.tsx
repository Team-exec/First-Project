interface LineChartProps {
  title: string
  data: number[]
  yMin: number
  yMax: number
  xLabel: string
  yLabel: string
}

const W = 560
const H = 210
const PAD = 26

export function LineChart({ title, data, yMin, yMax, xLabel, yLabel }: LineChartProps) {
  const max = Math.max(yMax, ...data)
  const min = Math.min(yMin, ...data)
  const span = max - min || 1

  const points = data.map((v, i) => {
    const x = PAD + (i / Math.max(1, data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((v - min) / span) * (H - PAD * 2)
    return { x, y }
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${points[points.length - 1]?.x.toFixed(1)} ${H - PAD} L ${points[0]?.x.toFixed(1)} ${H - PAD} Z`

  return (
    <div className="chart">
      <h4>{title}</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="linechart" role="img" aria-label={title}>
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">
          {xLabel}
        </text>
        <text x={10} y={PAD - 6} fontSize="10" fill="var(--muted)">
          {max.toFixed(0)}
        </text>
        <text x={10} y={H - PAD + 10} fontSize="10" fill="var(--muted)">
          {min.toFixed(0)}
        </text>
        <text x={PAD + 6} y={H - PAD - 8} fontSize="10" fill="var(--muted)">
          {yLabel}
        </text>
        <path d={area} fill="var(--teal)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--teal)" stroke="var(--panel)" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  )
}
