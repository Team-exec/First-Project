interface HeatmapProps {
  byState: Record<string, number>
  states: string[]
}

export function Heatmap({ byState, states }: HeatmapProps) {
  const max = Math.max(1, ...Object.values(byState))

  return (
    <div className="heatmap" role="img" aria-label="Regional allocation density heatmap">
      {states.map((state) => {
        const count = byState[state] ?? 0
        const intensity = count / max
        const style = count > 0
          ? {
              backgroundColor: `color-mix(in srgb, var(--teal) ${15 + intensity * 85}%, transparent)`,
            }
          : undefined
        return (
          <div key={state} className="heatmap-cell" style={style}>
            <span className="heatmap-state">{state}</span>
            <span className="heatmap-count">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
