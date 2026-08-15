import type { AllocationRun, Applicant, Category, Internship } from '../types'

export interface DashboardStats {
  totalApplicants: number
  totalSlots: number
  totalAllocated: number
  totalUnallocated: number
  fillRate: number
  averageScore: number
  satisfaction: string
  byState: Record<string, number>
  bySector: { sector: string; demand: number; supply: number }[]
  byCategory: { category: Category; allocated: number; applicants: number }[]
  reservedFilled: number
  reservedTotal: number
  auditSteps: number
}

export function computeStats(
  applicants: Applicant[],
  internships: Internship[],
  run: AllocationRun,
): DashboardStats {
  const allocated = run.allocations.filter((a) => a.status === 'Allocated')

  const byState: Record<string, number> = {}
  for (const a of allocated) {
    const app = applicants.find((x) => x.id === a.applicantId)
    if (app) byState[app.state] = (byState[app.state] ?? 0) + 1
  }

  const bySector = internships.map((pos) => {
    const demand = applicants.filter((a) => a.preferredSectors.includes(pos.sector)).length
    return { sector: pos.sector, demand, supply: pos.slots }
  })

  const byCategory: DashboardStats['byCategory'] = (['General', 'EWS', 'OBC', 'SC', 'ST'] as Category[]).map(
    (cat) => {
      const catApplicants = applicants.filter((a) => a.category === cat)
      const catAllocated = allocated.filter((al) => {
        const app = applicants.find((x) => x.id === al.applicantId)
        return app?.category === cat
      }).length
      return { category: cat, allocated: catAllocated, applicants: catApplicants.length }
    },
  )

  const reservedTotal = internships.reduce(
    (sum, pos) =>
      sum + (['EWS', 'OBC', 'SC', 'ST'] as Category[]).reduce(
        (s, c) => s + (pos.reservation[c] ?? 0),
        0,
      ),
    0,
  )

  return {
    totalApplicants: applicants.length,
    totalSlots: internships.reduce((s, p) => s + p.slots, 0),
    totalAllocated: allocated.length,
    totalUnallocated: run.allocations.length - allocated.length,
    fillRate: applicants.length > 0 ? (allocated.length / applicants.length) * 100 : 0,
    averageScore:
      allocated.length > 0
        ? Math.round((allocated.reduce((s, a) => s + a.score, 0) / allocated.length) * 10) / 10
        : 0,
    satisfaction: '4.7 / 5',
    byState,
    bySector,
    byCategory,
    reservedFilled: 0,
    reservedTotal,
    auditSteps: run.audit.length,
  }
}
