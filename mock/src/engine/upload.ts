import type { Applicant, Category, LocationPref, Sector } from '../types'
import { CATEGORIES, SECTORS, STATES } from '../data/seed'

export type RawApplicant = Omit<Applicant, 'id'>

export interface UploadRow {
  row: number
  data: RawApplicant | null
  reason?: string
}

export interface UploadSummary {
  valid: UploadRow[]
  invalid: UploadRow[]
}

const ALIASES: Record<string, keyof RawApplicant> = {
  name: 'name',
  fullname: 'name',
  applicantname: 'name',
  age: 'age',
  gender: 'gender',
  qualification: 'qualification',
  degree: 'qualification',
  academics: 'academics',
  academicspercentage: 'academics',
  academicpercentage: 'academics',
  percentage: 'academics',
  percent: 'academics',
  marks: 'academics',
  state: 'state',
  homestate: 'state',
  category: 'category',
  categoryreservation: 'category',
  reservation: 'category',
  locationpref: 'locationPref',
  locationpreference: 'locationPref',
  location: 'locationPref',
  skills: 'skills',
  skillsets: 'skills',
  preferredsectors: 'preferredSectors',
  preferredsector: 'preferredSectors',
  sectors: 'preferredSectors',
}

const SECTOR_ALIAS: Record<string, Sector> = {}
for (const s of SECTORS) {
  SECTOR_ALIAS[s.toLowerCase()] = s
}
SECTOR_ALIAS['it'] = 'Information Technology'
SECTOR_ALIAS['informationtechnology'] = 'Information Technology'
SECTOR_ALIAS['engineering'] = 'Engineering & Manufacturing'
SECTOR_ALIAS['manufacturing'] = 'Engineering & Manufacturing'
SECTOR_ALIAS['finance'] = 'Finance & Banking'
SECTOR_ALIAS['banking'] = 'Finance & Banking'
SECTOR_ALIAS['health'] = 'Healthcare'
SECTOR_ALIAS['agriculture'] = 'Agriculture & Rural Development'
SECTOR_ALIAS['ruraldevelopment'] = 'Agriculture & Rural Development'
SECTOR_ALIAS['energy'] = 'Renewable Energy'
SECTOR_ALIAS['solar'] = 'Renewable Energy'
SECTOR_ALIAS['renewable'] = 'Renewable Energy'
SECTOR_ALIAS['publicadministration'] = 'Public Administration'
SECTOR_ALIAS['admin'] = 'Public Administration'
SECTOR_ALIAS['policy'] = 'Public Administration'
SECTOR_ALIAS['education'] = 'Education'

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function splitList(v: unknown): string[] {
  if (v === undefined || v === null) return []
  const s = String(v)
  return s
    .split(/[,;\n|]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
}

function mapSectors(values: string[]): Sector[] {
  const out: Sector[] = []
  for (const v of values) {
    const key = normalizeHeader(v)
    const mapped = SECTOR_ALIAS[key] ?? SECTOR_ALIAS[v.toLowerCase()]
    if (mapped && !out.includes(mapped)) out.push(mapped)
  }
  return out
}

function buildFieldMap(headerKeys: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  headerKeys.forEach((key) => {
    const norm = normalizeHeader(key)
    const field = ALIASES[norm]
    if (field && map[field] === undefined) map[field] = key
  })
  return map
}

export async function parseUpload(file: File): Promise<UploadSummary> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
  const fieldMap = buildFieldMap(rows.length > 0 ? Object.keys(rows[0]) : [])

  const summary: UploadSummary = { valid: [], invalid: [] }

  rows.forEach((row, i) => {
    const rowNo = i + 2
    const get = (field: keyof RawApplicant): unknown =>
      fieldMap[field] !== undefined ? row[fieldMap[field]] : ''

    const name = String(get('name')).trim()
    if (!name) {
      summary.invalid.push({ row: rowNo, data: null, reason: 'Missing name' })
      return
    }

    const age = toNumber(get('age'))
    if (!Number.isFinite(age) || age < 18 || age > 30) {
      summary.invalid.push({ row: rowNo, data: null, reason: `Invalid age "${get('age')}" (18–30 required)` })
      return
    }

    const academics = toNumber(get('academics'))
    if (!Number.isFinite(academics) || academics < 0 || academics > 100) {
      summary.invalid.push({ row: rowNo, data: null, reason: `Invalid academics "${get('academics')}" (0–100)` })
      return
    }

    const categoryRaw = String(get('category')).trim().toLowerCase()
    const category = CATEGORIES.find((c) => c.toLowerCase() === categoryRaw) as Category | undefined
    if (!category) {
      summary.invalid.push({ row: rowNo, data: null, reason: `Unknown category "${get('category')}"` })
      return
    }

    const stateRaw = String(get('state')).trim()
    const state = STATES.find((s) => s.toLowerCase() === stateRaw.toLowerCase())
    if (!state) {
      summary.invalid.push({ row: rowNo, data: null, reason: `Unknown state "${stateRaw}"` })
      return
    }

    const locRaw = String(get('locationPref')).trim().toLowerCase()
    const locationPref: LocationPref =
      locRaw.includes('anywhere') || locRaw.includes('any')
        ? 'Anywhere'
        : locRaw.includes('home') || locRaw === ''
          ? 'Home State'
          : ('Home State' as LocationPref)

    const skills = splitList(get('skills'))
    if (skills.length === 0) {
      summary.invalid.push({ row: rowNo, data: null, reason: 'No skills listed' })
      return
    }

    const preferredSectors = mapSectors(splitList(get('preferredSectors')))
    if (preferredSectors.length === 0) {
      summary.invalid.push({ row: rowNo, data: null, reason: 'No recognised preferred sectors' })
      return
    }

    const genderRaw = String(get('gender')).trim().toLowerCase()
    const gender: Applicant['gender'] =
      genderRaw === 'male' || genderRaw === 'm'
        ? 'Male'
        : genderRaw === 'female' || genderRaw === 'f'
          ? 'Female'
          : 'Other'

    const qualification = String(get('qualification')).trim() || 'Graduate'

    summary.valid.push({
      row: rowNo,
      data: {
        name,
        age: Math.round(age),
        gender,
        qualification,
        academics: Math.round(academics),
        skills,
        state,
        category,
        preferredSectors,
        locationPref,
      },
    })
  })

  return summary
}

export function downloadTemplate(): void {
  const header = 'Name,Age,Gender,Qualification,Academics (%),State,Category,Location Preference,Skills,Preferred Sectors'
  const example =
    'Aarav Sharma,21,Male,B.Tech CSE,87,Tamil Nadu,General,Home State,"Python, SQL, Data Analysis","Information Technology, Public Administration"'
  const csv = `${header}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'applicants-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
