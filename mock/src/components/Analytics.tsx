import type { AllocationRun, Applicant, Category, Internship } from '../types'
import { computeStats } from '../engine/stats'
import { STATES } from '../data/seed'
import { Heatmap } from './Heatmap'
import { BarChart } from './BarChart'
import { BarList } from './BarList'
import { DonutChart, type DonutSegment } from './DonutChart'
import { LineChart } from './LineChart'

interface AnalyticsProps {
  applicants: Applicant[]
  internships: Internship[]
  run: AllocationRun
}

const CATEGORY_COLORS: Record<Category, string> = {
  General: '#64748b',
  EWS: '#d97706',
  OBC: '#2563eb',
  SC: '#db2777',
  ST: '#7c3aed',
}

const SECTOR_PALETTE = [
  '#0f766e',
  '#d97706',
  '#2563eb',
  '#db2777',
  '#16a34a',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
]

export function Analytics({ applicants, internships, run }: AnalyticsProps) {
  const stats = computeStats(applicants, internships, run)
  const allocated = run.allocations.filter((a) => a.status === 'Allocated')
  const appOf = (id: string) => applicants.find((a) => a.id === id)

  const categorySegments: DonutSegment[] = stats.byCategory
    .filter((c) => c.allocated > 0)
    .map((c) => ({
      label: c.category,
      value: c.allocated,
      color: CATEGORY_COLORS[c.category],
    }))

  const genderCounts = new Map<string, number>()
  for (const app of applicants) {
    genderCounts.set(app.gender, (genderCounts.get(app.gender) ?? 0) + 1)
  }
  const genderPalette: Record<string, string> = {
    Female: '#d97706',
    Male: '#2563eb',
    Other: '#7c3aed',
  }
  const genderSegments: DonutSegment[] = [...genderCounts.entries()].map(([label, value]) => ({
    label,
    value,
    color: genderPalette[label] ?? '#64748b',
  }))

  const sectorCounts = new Map<string, number>()
  for (const al of allocated) {
    const pos = internships.find((p) => p.id === al.internshipId)
    if (pos) sectorCounts.set(pos.sector, (sectorCounts.get(pos.sector) ?? 0) + 1)
  }
  const sectorSegments: DonutSegment[] = [...sectorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: SECTOR_PALETTE[i % SECTOR_PALETTE.length],
    }))

  const bins = [
    { label: '40–49', min: 40, max: 50 },
    { label: '50–59', min: 50, max: 60 },
    { label: '60–69', min: 60, max: 70 },
    { label: '70–79', min: 70, max: 80 },
    { label: '80–89', min: 80, max: 90 },
    { label: '90–100', min: 90, max: 101 },
  ]
  const scoreHistogram = bins.map((b) => ({
    label: b.label,
    value: allocated.filter((a) => a.score >= b.min && a.score < b.max).length,
  }))

  const scoreTrend = [...allocated].sort((a, b) => b.score - a.score).map((a) => a.score)

  const stateItems = Object.entries(stats.byState)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))

  const sectorDemand = internships.map((pos) => ({
    sector: pos.sector,
    demand: applicants.filter((a) => a.preferredSectors.includes(pos.sector)).length,
    supply: pos.slots,
  }))

  return (
    <div className="view">
      <section className="panel">
        <h3>Data Visualisation Suite</h3>
        <p className="panel-note">
          Interactive dashboards of the allocation engine — category mix, sector placement,
          demand–supply ratios, performance trends and regional density.
        </p>
      </section>

      <div className="chart-grid">
        <section className="panel">
          <DonutChart
            title="Allocation Status"
            segments={[
              { label: 'Allocated', value: stats.totalAllocated, color: 'var(--green)' },
              { label: 'Unallocated', value: stats.totalUnallocated, color: 'var(--red)' },
            ]}
            centerLabel="applicants"
          />
        </section>
        <section className="panel">
          <DonutChart
            title="Allocations by Category"
            segments={categorySegments}
            centerLabel="allocated"
          />
        </section>
      </div>

      <div className="chart-grid">
        <section className="panel">
          <DonutChart
            title="Applicants by Gender"
            segments={genderSegments}
            centerLabel="applicants"
          />
        </section>
        <section className="panel">
          <DonutChart
            title="Allocations by Sector"
            segments={sectorSegments}
            centerLabel="allocated"
          />
        </section>
      </div>

      <div className="chart-grid">
        <section className="panel">
          <BarList title="Match Score Distribution" items={scoreHistogram} />
        </section>
        <section className="panel">
          <LineChart
            title="Match Score Trend (by rank)"
            data={scoreTrend}
            yMin={0}
            yMax={100}
            xLabel="Applicant (best → lowest match)"
            yLabel="score /100"
          />
        </section>
      </div>

      <section className="panel">
        <BarChart
          title="Demand–Supply Ratio by Sector"
          seriesA={sectorDemand.map((s) => ({ label: s.sector, value: s.demand }))}
          seriesB={sectorDemand.map((s) => ({ label: s.sector, value: s.supply }))}
          colorA="var(--saffron)"
          colorB="var(--green)"
        />
      </section>

      <div className="chart-grid">
        <section className="panel">
          <h3>Regional Allocation Density</h3>
          <p className="panel-note">Placements per state — darker cells indicate higher density.</p>
          <Heatmap byState={stats.byState} states={STATES} />
        </section>
        <section className="panel">
          <BarList title="Allocations by State" items={stateItems} color="var(--blue)" />
        </section>
      </div>

      <section className="panel">
        <h3>Category Metrics</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Registered</th>
                <th>Allocated</th>
                <th>Placement rate</th>
                <th>Avg score</th>
              </tr>
            </thead>
            <tbody>
              {stats.byCategory.map((c) => {
                const catAllocated = allocated.filter(
                  (al) => appOf(al.applicantId)?.category === c.category,
                )
                const avg =
                  catAllocated.length > 0
                    ? (catAllocated.reduce((s, a) => s + a.score, 0) / catAllocated.length).toFixed(1)
                    : '—'
                return (
                  <tr key={c.category}>
                    <td>
                      <span className={`pill pill-cat-${c.category.toLowerCase()}`}>{c.category}</span>
                    </td>
                    <td>{c.applicants}</td>
                    <td>{c.allocated}</td>
                    <td>{c.applicants > 0 ? `${((c.allocated / c.applicants) * 100).toFixed(0)}%` : '—'}</td>
                    <td>{avg}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
