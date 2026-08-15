import { useEffect, useState } from 'react'
import logo from '../assets/logo.svg'

export type TabId = 'dashboard' | 'analytics' | 'applicants' | 'allocations' | 'reports'

interface NavBarProps {
  active: TabId
  onNavigate: (tab: TabId) => void
}

type Theme = 'light' | 'dark'

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'applicants', label: 'Applicants' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'reports', label: 'Reports' },
]

function initialTheme(): Theme {
  const stored = localStorage.getItem('saa-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function NavBar({ active, onNavigate }: NavBarProps) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('saa-theme', theme)
  }, [theme])

  function navigate(tab: TabId) {
    onNavigate(tab)
    setOpen(false)
  }

  return (
    <header className="navbar">
      <div className="nav-brand">
        <img src={logo} alt="PM Internship Scheme — Smart Allocation Engine logo" className="brand-mark" />
        <div className="brand-text">
          <h1>PM Internship Scheme</h1>
          <p>Smart Allocation Engine</p>
        </div>
      </div>

      <nav className={`nav-menu ${open ? 'nav-menu-open' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link ${active === item.id ? 'nav-link-active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="nav-actions">
        <button
          type="button"
          className="theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
