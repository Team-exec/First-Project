import type {
  Allocation,
  AllocationRun,
  Applicant,
  AuditEntry,
  Category,
  Internship,
} from '../types'

const ENGINE_VERSION = 'SAAE v1.0 (Smart Allocation Engine)'

const RESERVABLE: Category[] = ['EWS', 'OBC', 'SC', 'ST']

interface SeatState {
  capacity: number
  generalUsed: number
  generalSeats: number
  reservedTotal: number
  reservedUsed: Record<Category, number>
}

function levelOf(q: string): number {
  const s = q.toLowerCase()
  if (s.includes('phd')) return 4
  if (/(m\.tech|m\.sc|m\.com|m\.a\b|mba|mca|m\.e\b|m\.pharm|m\.phil)/.test(s))
    return 3
  if (/(b\.tech|b\.e\b|b\.sc|b\.com|bba|b\.pharm|b\.a\b)/.test(s)) return 2
  if (s.includes('graduate')) return 1
  return 0
}

const TOKEN_STOPS = new Set([
  'b',
  'm',
  'a',
  'tech',
  'e',
  'sc',
  'com',
  'ba',
  'ma',
  'eng',
  'of',
  'and',
  'in',
  'the',
  'graduate',
])

function tokensOf(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !TOKEN_STOPS.has(t))
}

function meetsQualification(app: Applicant, req: string): boolean {
  const appLevel = levelOf(app.qualification)
  const appTokens = tokensOf(app.qualification)
  const alternatives = req.split('/').map((a) => a.trim())

  return alternatives.some((alt) => {
    if (levelOf(alt) > appLevel) return false
    const reqTokens = tokensOf(alt)
    if (reqTokens.length === 0) return true
    return reqTokens.some((t) => appTokens.includes(t))
  })
}

function meetsAge(app: Applicant): boolean {
  return app.age >= 18 && app.age <= 30
}

function eligibleFor(app: Applicant, pos: Internship): string | null {
  if (!meetsAge(app)) return `Age ${app.age} is outside the 18–30 scheme limit`
  if (!meetsQualification(app, pos.minQualification))
    return `Qualification (${app.qualification}) does not meet ${pos.minQualification}`
  if (app.academics < pos.minAcademics)
    return `Academics ${app.academics}% is below required ${pos.minAcademics}%`
  return null
}

function matchedSkills(app: Applicant, pos: Internship): string[] {
  return pos.requiredSkills.filter((s) => app.skills.includes(s))
}

function scoreMatch(app: Applicant, pos: Internship): { score: number; parts: string[]; matched: string[] } {
  const matched = matchedSkills(app, pos)
  const academicScore = (app.academics / 100) * 30
  const skillScore = pos.requiredSkills.length
    ? (matched.length / pos.requiredSkills.length) * 30
    : 15
  const sectorMatched = app.preferredSectors.includes(pos.sector)
  const sectorScore = sectorMatched ? 20 : 0
  const homeMatched = app.state === pos.state
  const locationScore = homeMatched ? 10 : app.locationPref === 'Anywhere' ? 5 : 0
  const score = Math.round((academicScore + skillScore + sectorScore + locationScore) * 10) / 10

  return {
    score,
    matched,
    parts: [
      `Academics ${app.academics}% → ${Math.round(academicScore * 10) / 10} pts`,
      `Skills matched ${matched.length}/${pos.requiredSkills.length} → ${Math.round(skillScore * 10) / 10} pts`,
      `Sector ${sectorMatched ? 'preferred' : 'not preferred'} → ${sectorScore} pts`,
      `Location ${homeMatched ? 'home state' : app.locationPref} → ${locationScore} pts`,
    ],
  }
}

function initSeats(pos: Internship): SeatState {
  const reservedUsed: Record<Category, number> = {
    General: 0,
    EWS: 0,
    OBC: 0,
    SC: 0,
    ST: 0,
  }
  const reservedTotal = RESERVABLE.reduce(
    (sum, c) => sum + (pos.reservation[c] ?? 0),
    0,
  )
  return {
    capacity: pos.slots,
    generalUsed: 0,
    generalSeats: Math.max(0, pos.slots - reservedTotal),
    reservedTotal,
    reservedUsed,
  }
}

function seatAvailable(pos: Internship, seats: SeatState, cat: Category): 'reserved' | 'general' | null {
  if (cat !== 'General' && (pos.reservation[cat] ?? 0) > 0) {
    if (seats.reservedUsed[cat] < (pos.reservation[cat] ?? 0)) return 'reserved'
  }
  if (seats.generalUsed < seats.generalSeats) return 'general'
  return null
}

function anySeatAvailable(seats: SeatState): 'reserved' | 'general' | null {
  const used =
    seats.generalUsed +
    seats.reservedUsed.EWS +
    seats.reservedUsed.OBC +
    seats.reservedUsed.SC +
    seats.reservedUsed.ST
  if (used >= seats.capacity) return null
  if (seats.generalUsed < seats.generalSeats) return 'general'
  return 'reserved'
}

function takeSeat(seats: SeatState, kind: 'reserved' | 'general', cat: Category): void {
  if (kind === 'reserved') seats.reservedUsed[cat] += 1
  else seats.generalUsed += 1
}

function meritRank(applicants: Applicant[]): number[] {
  const sorted = applicants
    .map((a, i) => ({ i, a }))
    .sort(
      (x, y) =>
        y.a.academics - x.a.academics ||
        levelOf(x.a.qualification) - levelOf(y.a.qualification) ||
        x.a.age - y.a.age,
    )
  const rank = new Array(applicants.length)
  sorted.forEach((entry, idx) => {
    rank[entry.i] = idx + 1
  })
  return rank
}

export function runAllocation(
  applicants: Applicant[],
  internships: Internship[],
): AllocationRun {
  const seats = new Map<string, SeatState>()
  for (const pos of internships) seats.set(pos.id, initSeats(pos))

  const merit = meritRank(applicants)
  const allocations = new Map<string, Allocation>()
  const audit: AuditEntry[] = []
  let step = 0

  const order = applicants
    .map((_, i) => i)
    .sort((a, b) => merit[a] - merit[b])

  const MIN_MATCH_SCORE = 45

  function attempt(idx: number, pass2: boolean): void {
    const app = applicants[idx]
    step += 1
    let best: Internship | null = null
    let bestScore = -1
    let bestParts: string[] = []
    let bestKind: 'reserved' | 'general' | null = null
    let bestMatched: string[] = []

    for (const pos of internships) {
      const inelig = eligibleFor(app, pos)
      if (inelig) continue
      const kind = pass2 ? anySeatAvailable(seats.get(pos.id)!) : seatAvailable(pos, seats.get(pos.id)!, app.category)
      if (!kind) continue
      const { score, parts, matched } = scoreMatch(app, pos)
      if (score > bestScore) {
        bestScore = score
        best = pos
        bestParts = parts
        bestKind = kind
        bestMatched = matched
      }
    }

    if (best && bestScore >= MIN_MATCH_SCORE && bestKind) {
      takeSeat(seats.get(best.id)!, bestKind, app.category)
      const seatNote =
        pass2 && bestKind === 'reserved'
          ? `${app.category} seat via de-reservation`
          : bestKind === 'reserved'
            ? `${app.category} reserved seat`
            : `${app.category} general seat`
      const reasoning =
        `Merit rank ${merit[idx]}/${applicants.length}. ` +
        bestParts.join('. ') +
        `. Score ${bestScore}/100. Seat: ${seatNote}.`
      allocations.set(app.id, {
        applicantId: app.id,
        internshipId: best.id,
        status: 'Allocated',
        score: bestScore,
        reasoning,
        matchedSkills: bestMatched,
      })
      audit.push({
        applicantId: app.id,
        internshipId: best.id,
        decision: 'Allocated',
        score: bestScore,
        step,
        note: seatNote,
      })
    } else {
      const reasons = internships
        .map((pos) => {
          const inelig = eligibleFor(app, pos)
          if (inelig) return `${pos.title}: ${inelig}`
          const kind = pass2 ? anySeatAvailable(seats.get(pos.id)!) : seatAvailable(pos, seats.get(pos.id)!, app.category)
          if (!kind) return `${pos.title}: capacity exhausted for ${app.category}`
          return null
        })
        .filter((r): r is string => r !== null)
      const lowScore = best && bestScore < MIN_MATCH_SCORE
      const reasoning = lowScore
        ? `Best available match scored ${bestScore}/100, below the ${MIN_MATCH_SCORE} match-quality threshold. ${reasons[0] ?? ''}`
        : reasons.length > 0
          ? `No seat secured. ${reasons.slice(0, 2).join(' | ')}`
          : `No internship matched your profile in this cycle.`
      allocations.set(app.id, {
        applicantId: app.id,
        internshipId: null,
        status: 'Unallocated',
        score: 0,
        reasoning,
        matchedSkills: [],
      })
      audit.push({
        applicantId: app.id,
        internshipId: null,
        decision: 'Unallocated',
        score: 0,
        step,
        note: lowScore ? 'Best match below quality threshold' : 'No eligible position with available capacity',
      })
    }
  }

  for (const idx of order) attempt(idx, false)
  for (const idx of order) {
    if (allocations.get(applicants[idx].id)?.status !== 'Allocated') attempt(idx, true)
  }

  return {
    allocations: order.map((idx) => allocations.get(applicants[idx].id)!),
    audit,
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
  }
}
