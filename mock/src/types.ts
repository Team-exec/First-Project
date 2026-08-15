export type Category = 'General' | 'EWS' | 'OBC' | 'SC' | 'ST'

export type Sector =
  | 'Information Technology'
  | 'Engineering & Manufacturing'
  | 'Finance & Banking'
  | 'Healthcare'
  | 'Agriculture & Rural Development'
  | 'Education'
  | 'Renewable Energy'
  | 'Public Administration'

export type LocationPref = 'Home State' | 'Anywhere'

export interface Applicant {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  qualification: string
  academics: number
  skills: string[]
  state: string
  category: Category
  preferredSectors: Sector[]
  locationPref: LocationPref
}

export interface Internship {
  id: string
  title: string
  organization: string
  sector: Sector
  state: string
  slots: number
  minQualification: string
  minAcademics: number
  requiredSkills: string[]
  stipend: string
  reservation: Partial<Record<Category, number>>
}

export type AllocationStatus = 'Allocated' | 'Unallocated'

export interface Allocation {
  applicantId: string
  internshipId: string | null
  status: AllocationStatus
  score: number
  reasoning: string
  matchedSkills: string[]
}

export interface AuditEntry {
  applicantId: string
  internshipId: string | null
  decision: AllocationStatus
  score: number
  step: number
  note: string
}

export interface AllocationRun {
  allocations: Allocation[]
  audit: AuditEntry[]
  generatedAt: string
  engineVersion: string
}
