import type { AllocationRun, Applicant, Internship } from '../types'
import { computeStats } from '../engine/stats'
import { STATES } from '../data/seed'
import { Heatmap } from './Heatmap'
import { BarChart } from './BarChart'

interface DashboardProps {
  applicants: Applicant[]
  internships: Internship[]
  run: AllocationRun
}

function kpi(label: string, value: string, sub: string, accent: string) {
  return (
    <div className="kpi">
      <div className="kpi-value" style={{ color: accent }}>
        {value}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

export function Dashboard({ applicants, internships, run }: DashboardProps) {
  const stats = computeStats(applicants, internships, run)

  return (
    <div className="view">
      <section className="panel kpi-grid">
        {kpi('Applicants', String(stats.totalApplicants), 'registered for the cycle', 'var(--saffron)')}
        {kpi('Available Slots', String(stats.totalSlots), 'across all internship posts', 'var(--blue)')}
        {kpi('Allocated', String(stats.totalAllocated), 'merit + preference based', 'var(--green)')}
        {kpi('Unallocated', String(stats.totalUnallocated), 'unassigned cases flagged', 'var(--red)')}
        {kpi('Match Rate', `${stats.fillRate.toFixed(1)}%`, 'of applicants placed', 'var(--green)')}
        {kpi('Avg Match Score', `${stats.averageScore}`, '/100 explainable score', 'var(--blue)')}
      </section>

      <div className="grid-2">
        <section className="panel">
          <h3>Regional Allocation Density</h3>
          <p className="panel-note">
            Heatmap of placements per state. Darker cells indicate higher allocation density.
          </p>
          <Heatmap byState={stats.byState} states={STATES} />
        </section>

        <section className="panel">
          <h3>Reservation Utilisation</h3>
          <p className="panel-note">
            Allocated applicants per category versus registered applicants, with reserved-seat
            compliance tracked in the audit trail.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Registered</th>
                <th>Allocated</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.byCategory.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td>{c.applicants}</td>
                  <td>{c.allocated}</td>
                  <td>
                    {c.applicants > 0 ? `${((c.allocated / c.applicants) * 100).toFixed(0)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="panel-footer">
            <span className="pill">Reserved seats available: {stats.reservedTotal}</span>
            <span className="pill">Audit steps recorded: {stats.auditSteps}</span>
            <span className="pill">Usability feedback: {stats.satisfaction}</span>
          </div>
        </section>
      </div>

      <section className="panel">
        <BarChart
          title="Demand–Supply Ratio by Sector"
          seriesA={stats.bySector.map((s) => ({ label: s.sector, value: s.demand }))}
          seriesB={stats.bySector.map((s) => ({ label: s.sector, value: s.supply }))}
          colorA="var(--saffron)"
          colorB="var(--green)"
        />
      </section>
    </div>
  )
}
