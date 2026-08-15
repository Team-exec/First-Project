import { useState } from 'react'
import type { Applicant, Category, LocationPref, Sector } from '../types'
import { CATEGORIES, SECTORS, SKILLS, STATES } from '../data/seed'
import { downloadTemplate, parseUpload, type UploadSummary } from '../engine/upload'

interface ApplicantsProps {
  applicants: Applicant[]
  onAdd: (app: Applicant) => void
  onAddMany: (apps: Applicant[]) => void
}

const QUALIFICATIONS = [
  'Graduate',
  'B.Com',
  'BBA',
  'B.Sc Agriculture',
  'B.Sc Nursing',
  'B.Pharm',
  'B.E Civil',
  'B.Tech CSE',
  'B.Tech Electrical',
  'B.Tech Mechanical',
  'M.Sc Economics',
  'MCA',
]

const emptyForm = {
  name: '',
  age: '',
  gender: 'Female' as Applicant['gender'],
  qualification: 'Graduate',
  academics: '',
  state: 'Tamil Nadu',
  category: 'General' as Category,
  locationPref: 'Home State' as LocationPref,
  skills: [] as string[],
  preferredSectors: [] as Sector[],
}

export function Applicants({ applicants, onAdd, onAddMany }: ApplicantsProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [added, setAdded] = useState('')
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [importMsg, setImportMsg] = useState('')

  async function handleFile(file: File | undefined) {
    setUploadError('')
    setImportMsg('')
    if (!file) return
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setUploadError('Unsupported file type. Use .csv, .xlsx or .xls.')
      return
    }
    try {
      setSummary(await parseUpload(file))
    } catch {
      setUploadError('Could not read the file. Check the format and try again.')
    }
  }

  function importValid() {
    if (!summary || summary.valid.length === 0) return
    const base = Math.max(...applicants.map((a) => Number(a.id.split('-')[1])), 100)
    const list: Applicant[] = summary.valid.map((row, i) => ({
      id: `APP-${base + i + 1}`,
      ...row.data!,
    }))
    onAddMany(list)
    setImportMsg(
      `Imported ${list.length} applicant${list.length === 1 ? '' : 's'}${
        summary.invalid.length > 0 ? `; ${summary.invalid.length} row(s) skipped` : ''
      }.`,
    )
    setSummary(null)
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }))
  }

  function toggleSector(sector: Sector) {
    setForm((f) => ({
      ...f,
      preferredSectors: f.preferredSectors.includes(sector)
        ? f.preferredSectors.filter((s) => s !== sector)
        : [...f.preferredSectors, sector],
    }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const age = Number(form.age)
    const academics = Number(form.academics)
    if (!form.name.trim()) return setError('Applicant name is required.')
    if (!age || age < 18 || age > 30)
      return setError('Age must be between 18 and 30.')
    if (!academics || academics < 0 || academics > 100)
      return setError('Academic percentage must be between 0 and 100.')
    if (form.skills.length === 0)
      return setError('Select at least one skill.')
    if (form.preferredSectors.length === 0)
      return setError('Select at least one preferred sector.')

    const nextId = `APP-${Math.max(...applicants.map((a) => Number(a.id.split('-')[1])), 100) + 1}`
    onAdd({
      id: nextId,
      name: form.name.trim(),
      age,
      gender: form.gender,
      qualification: form.qualification,
      academics,
      skills: form.skills,
      state: form.state,
      category: form.category,
      preferredSectors: form.preferredSectors,
      locationPref: form.locationPref,
    })
    setForm(emptyForm)
    setError('')
    setAdded(`${form.name.trim()} registered as ${nextId}. Run the allocation engine to place them.`)
  }

  return (
    <div className="view">
      <section className="panel">
        <h3>Applicant Registration</h3>
        <p className="panel-note">
          Submit candidate details — the engine evaluates academics, skills, preferences,
          location and reservation criteria before recommending an allocation.
        </p>
        <form className="form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Nair"
              />
            </label>
            <label>
              Age
              <input
                type="number"
                min={18}
                max={30}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </label>
            <label>
              Gender
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: e.target.value as Applicant['gender'] })
                }
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Qualification
              <select
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              >
                {QUALIFICATIONS.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </label>
            <label>
              Academic percentage (%)
              <input
                type="number"
                min={0}
                max={100}
                value={form.academics}
                onChange={(e) => setForm({ ...form, academics: e.target.value })}
              />
            </label>
            <label>
              Home state
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Category })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Location preference
              <select
                value={form.locationPref}
                onChange={(e) =>
                  setForm({ ...form, locationPref: e.target.value as LocationPref })
                }
              >
                <option>Home State</option>
                <option>Anywhere</option>
              </select>
            </label>
          </div>

          <fieldset>
            <legend>Skills</legend>
            <div className="chips">
              {SKILLS.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`chip ${form.skills.includes(s) ? 'chip-on' : ''}`}
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Preferred sectors</legend>
            <div className="chips">
              {SECTORS.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`chip ${form.preferredSectors.includes(s) ? 'chip-on' : ''}`}
                  onClick={() => toggleSector(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary">
            Submit application
          </button>
          {added && <p className="form-success">{added}</p>}
        </form>
      </section>

      <section className="panel">
        <h3>Bulk Upload</h3>
        <p className="panel-note">
          Import applicants from a CSV or Excel (.xlsx / .xls) file. Columns: Name, Age, Gender,
          Qualification, Academics (%), State, Category, Location Preference, Skills,
          Preferred Sectors.
        </p>
        <div className="upload-row">
          <label className="file-input">
            Choose file
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                void handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          <button type="button" className="btn-secondary" onClick={downloadTemplate}>
            Download CSV template
          </button>
        </div>
        {uploadError && <p className="form-error">{uploadError}</p>}
        {importMsg && <p className="form-success">{importMsg}</p>}

        {summary && (
          <div className="upload-preview">
            <div className="upload-preview-head">
              <span>
                <strong>{summary.valid.length}</strong> valid row(s),{' '}
                <strong>{summary.invalid.length}</strong> invalid
              </span>
              <div className="head-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={importValid}
                  disabled={summary.valid.length === 0}
                >
                  Import {summary.valid.length}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSummary(null)}
                >
                  Discard
                </button>
              </div>
            </div>
            {summary.invalid.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.invalid.map((r) => (
                      <tr key={r.row} className="row-unalloc">
                        <td className="mono">{r.row}</td>
                        <td>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Registered Applicants ({applicants.length})</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Qualification</th>
                <th>Academics</th>
                <th>State</th>
                <th>Category</th>
                <th>Preferred Sectors</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.id}</td>
                  <td>{a.name}</td>
                  <td>{a.age}</td>
                  <td>{a.qualification}</td>
                  <td>{a.academics}%</td>
                  <td>{a.state}</td>
                  <td>
                    <span className={`pill pill-cat-${a.category.toLowerCase()}`}>{a.category}</span>
                  </td>
                  <td>{a.preferredSectors.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
