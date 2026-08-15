import { useState } from 'react'
import type { AllocationRun, Applicant } from './types'
import { applicantSeed, internshipSeed } from './data/seed'
import { runAllocation } from './engine/allocation'
import { NavBar, type TabId } from './components/NavBar'
import { Dashboard } from './components/Dashboard'
import { Applicants } from './components/Applicants'
import { Allocations } from './components/Allocations'
import { Reports } from './components/Reports'
import './App.css'

function App() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [applicants, setApplicants] = useState<Applicant[]>(applicantSeed)
  const [run, setRun] = useState<AllocationRun>(() =>
    runAllocation(applicantSeed, internshipSeed),
  )

  function addApplicant(app: Applicant) {
    setApplicants((prev) => [...prev, app])
    setRun(runAllocation([...applicants, app], internshipSeed))
  }

  function rerun() {
    setRun(runAllocation(applicants, internshipSeed))
  }

  return (
    <div className="app">
      <NavBar active={tab} onNavigate={setTab} />

      <main>
        {tab === 'dashboard' && (
          <Dashboard applicants={applicants} internships={internshipSeed} run={run} />
        )}
        {tab === 'applicants' && (
          <Applicants applicants={applicants} onAdd={addApplicant} />
        )}
        {tab === 'allocations' && (
          <Allocations
            run={run}
            applicants={applicants}
            internships={internshipSeed}
            onRerun={rerun}
          />
        )}
        {tab === 'reports' && (
          <Reports run={run} applicants={applicants} internships={internshipSeed} />
        )}
      </main>

      <footer className="footer">
        AI-Based Smart Allocation Engine for PM Internship Scheme · transparent · preference-aware ·
        policy-aligned
      </footer>
    </div>
  )
}

export default App
