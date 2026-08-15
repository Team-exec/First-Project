import { useState } from 'react'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  title: string
  segments: DonutSegment[]
  centerLabel?: string
}

const TAU = Math.PI * 2
const CX = 110
const CY = 110
const R_OUT = 88
const R_IN = 58

function polar(r: number, angle: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

function donutPath(a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const s0 = polar(R_OUT, a0)
  const e0 = polar(R_OUT, a1)
  const e1 = polar(R_IN, a1)
  const s1 = polar(R_IN, a0)
  return `M ${s0.x.toFixed(2)} ${s0.y.toFixed(2)} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${e0.x.toFixed(2)} ${e0.y.toFixed(2)} L ${e1.x.toFixed(2)} ${e1.y.toFixed(2)} A ${R_IN} ${R_IN} 0 ${large} 0 ${s1.x.toFixed(2)} ${s1.y.toFixed(2)} Z`
}

export function DonutChart({ title, segments, centerLabel }: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const total = segments.reduce((s, x) => s + x.value, 0)

  const arcs = segments.map((seg, i) => {
    const before = segments.slice(0, i).reduce((s, x) => s + x.value, 0)
    const start = -Math.PI / 2 + (before / Math.max(total, 1)) * TAU
    const sweep = total > 0 ? (seg.value / total) * TAU : 0
    return { ...seg, start, end: start + sweep }
  })

  const shown = active !== null ? arcs[active] : null

  return (
    <div className="chart">
      <h4>{title}</h4>
      <div className="donut-wrap">
        <div className="donut">
          <svg viewBox="0 0 220 220" role="img" aria-label={title}>
            {total === 0 && <circle cx={CX} cy={CY} r={R_OUT} fill="var(--track-bg)" />}
            {arcs.map((arc, i) => (
              <path
                key={arc.label}
                d={donutPath(arc.start, arc.end)}
                fill={arc.color}
                opacity={active === null || active === i ? 1 : 0.35}
                stroke="var(--panel)"
                strokeWidth="1.5"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
              />
            ))}
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--text-h)">
              {shown ? shown.value : total}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {shown ? shown.label : (centerLabel ?? 'total')}
            </text>
          </svg>
        </div>
        <ul className="legend">
          {arcs.map((arc, i) => (
            <li
              key={arc.label}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="legend-dot" style={{ backgroundColor: arc.color }} />
              <span className="legend-label">{arc.label}</span>
              <span className="legend-val">
                {arc.value} · {total > 0 ? ((arc.value / total) * 100).toFixed(1) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
