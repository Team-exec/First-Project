import type { AllocationRun, Applicant, Internship } from '../types'
import { computeStats } from '../engine/stats'

interface ReportsProps {
  run: AllocationRun
  applicants: Applicant[]
  internships: Internship[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildReportHtml(
  run: AllocationRun,
  applicants: Applicant[],
  internships: Internship[],
): string {
  const stats = computeStats(applicants, internships, run)
  const rows = run.allocations
    .map((al) => {
      const app = applicants.find((a) => a.id === al.applicantId)
      const pos = internships.find((p) => p.id === al.internshipId)
      return `<tr>
        <td>${escapeHtml(al.applicantId)}</td>
        <td>${escapeHtml(app?.name ?? '')}</td>
        <td>${escapeHtml(app?.category ?? '')}</td>
        <td>${escapeHtml(pos?.title ?? 'Not assigned')}</td>
        <td>${pos ? al.score.toFixed(1) : '—'}</td>
        <td>${al.status}</td>
        <td>${escapeHtml(al.reasoning)}</td>
      </tr>`
    })
    .join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Allocation Report — PM Internship Scheme</title>
<style>
  body{font-family:system-ui,sans-serif;margin:32px;color:#1f2937;line-height:1.5}
  h1{font-size:22px;border-bottom:3px solid #0f766e;padding-bottom:8px}
  h2{font-size:16px;margin-top:24px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
  .k{background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:10px}
  .k b{display:block;font-size:20px;color:#0f766e}
  table{border-collapse:collapse;width:100%;margin-top:12px}
  th,td{border:1px solid #d1d5db;padding:6px 8px;text-align:left;font-size:12px}
  th{background:#f3f4f6}
  .meta{color:#6b7280;font-size:12px}
</style></head><body>
<h1>AI-Based Smart Allocation Engine — PM Internship Scheme</h1>
<p class="meta">Engine: ${escapeHtml(run.engineVersion)} · Generated ${new Date(
    run.generatedAt,
  ).toLocaleString()} · Report format: HTML</p>
<div class="stats">
  <div class="k"><b>${stats.totalApplicants}</b>Applicants</div>
  <div class="k"><b>${stats.totalSlots}</b>Slots</div>
  <div class="k"><b>${stats.totalAllocated}</b>Allocated</div>
  <div class="k"><b>${stats.totalUnallocated}</b>Unallocated</div>
  <div class="k"><b>${stats.fillRate.toFixed(1)}%</b>Match rate</div>
  <div class="k"><b>${stats.averageScore}</b>Avg score /100</div>
  <div class="k"><b>${stats.auditSteps}</b>Audit steps</div>
  <div class="k"><b>${stats.satisfaction}</b>Usability feedback</div>
</div>
<h2>Allocation Summary</h2>
<table>
  <thead><tr><th>Applicant ID</th><th>Name</th><th>Category</th><th>Position</th><th>Score</th><th>Status</th><th>Reasoning</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`
}

export function Reports({ run, applicants, internships }: ReportsProps) {
  const stats = computeStats(applicants, internships, run)

  function exportHtml() {
    const html = buildReportHtml(run, applicants, internships)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  function exportJson() {
    const payload = {
      engine: run.engineVersion,
      generatedAt: run.generatedAt,
      stats,
      allocations: run.allocations,
      audit: run.audit,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'allocation-report.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="view">
      <section className="panel panel-head">
        <div>
          <h3>Report Engine</h3>
          <p className="panel-note">
            Structured reports summarising allocation statistics, applicant demographics and
            performance metrics. Export as HTML (print/save as PDF) or machine-readable JSON for
            portal integration.
          </p>
        </div>
        <div className="head-actions">
          <button className="btn-primary" onClick={exportHtml}>
            Export HTML report
          </button>
          <button className="btn-secondary" onClick={exportJson}>
            Export JSON
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Allocation Statistics</h3>
        <div className="report-stats">
          <div><b>{stats.totalApplicants}</b><span>Applicants</span></div>
          <div><b>{stats.totalSlots}</b><span>Total slots</span></div>
          <div><b>{stats.totalAllocated}</b><span>Allocated</span></div>
          <div><b>{stats.totalUnallocated}</b><span>Unallocated</span></div>
          <div><b>{stats.fillRate.toFixed(1)}%</b><span>Match rate</span></div>
          <div><b>{stats.averageScore}</b><span>Avg score</span></div>
        </div>
      </section>

      <section className="panel">
        <h3>Audit Trail</h3>
        <p className="panel-note">
          Traceable logic behind every decision — each step records the applicant, chosen position,
          score and seat type.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Applicant</th>
                <th>Position</th>
                <th>Decision</th>
                <th>Score</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {run.audit.map((entry) => {
                const app = applicants.find((a) => a.id === entry.applicantId)
                const pos = internships.find((p) => p.id === entry.internshipId)
                return (
                  <tr key={entry.step}>
                    <td className="mono">{entry.step}</td>
                    <td>{app?.name}</td>
                    <td>{pos?.title ?? '—'}</td>
                    <td>
                      <span className={`pill ${entry.decision === 'Allocated' ? 'pill-green' : 'pill-red'}`}>
                        {entry.decision}
                      </span>
                    </td>
                    <td>{entry.score > 0 ? entry.score.toFixed(1) : '—'}</td>
                    <td className="reasoning">{entry.note}</td>
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
