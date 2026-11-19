import { useEffect, useRef, useState } from 'react'

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error ?? 'Something went wrong')
  return body
}

function guessEmoji(name) {
  const n = name.toLowerCase()
  if (/milk|dairy/.test(n)) return '🥛'
  if (/bread/.test(n)) return '🍞'
  if (/egg/.test(n)) return '🥚'
  if (/butter/.test(n)) return '🧈'
  if (/cheese/.test(n)) return '🧀'
  if (/chicken/.test(n)) return '🍗'
  if (/beef|mince|steak/.test(n)) return '🥩'
  if (/fish|salmon|tuna/.test(n)) return '🐟'
  if (/apple/.test(n)) return '🍎'
  if (/banana/.test(n)) return '🍌'
  if (/tomato/.test(n)) return '🍅'
  if (/carrot/.test(n)) return '🥕'
  if (/onion/.test(n)) return '🧅'
  if (/potato/.test(n)) return '🥔'
  if (/broccoli/.test(n)) return '🥦'
  if (/lettuce|salad/.test(n)) return '🥗'
  if (/rice/.test(n)) return '🍚'
  if (/pasta|spaghetti|noodle/.test(n)) return '🍝'
  if (/coffee/.test(n)) return '☕'
  if (/tea/.test(n)) return '🍵'
  if (/juice|orange/.test(n)) return '🧃'
  if (/water/.test(n)) return '💧'
  if (/cereal/.test(n)) return '🥣'
  if (/sugar/.test(n)) return '🍬'
  if (/sauce/.test(n)) return '🫙'
  if (/soap|shampoo|wash/.test(n)) return '🧼'
  if (/toilet|tissue/.test(n)) return '🧻'
  if (/toothpaste|toothbrush/.test(n)) return '🪥'
  if (/detergent|laundry/.test(n)) return '🧺'
  return '🛒'
}

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const contentRef = useRef(null)
  const nameInputRef = useRef(null)

  async function loadItems() {
    try {
      setItems(await api('/items'))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [])

  useEffect(() => {
    if (sheetOpen) setTimeout(() => nameInputRef.current?.focus(), 320)
  }, [sheetOpen])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 4)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  async function addItem(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await api('/items', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), quantity: quantity.trim() || undefined }),
      })
      setName('')
      setQuantity('')
      setSheetOpen(false)
      await loadItems()
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function markBought(id) {
    try {
      await api(`/items/${id}`, { method: 'PATCH' })
      await loadItems()
    } catch (err) {
      setError(err.message)
    }
  }

  const needed = items.filter(i => !i.bought_at)
  const bought  = items.filter(i =>  i.bought_at)

  const subline = loading
    ? 'Loading…'
    : `${needed.length} item${needed.length !== 1 ? 's' : ''} needed${bought.length ? ` · ${bought.length} bought` : ''}`

  function openSheet() { setSheetOpen(true) }
  function closeSheet() { setSheetOpen(false); setName(''); setQuantity('') }

  return (
    <div className="app">

      {/* Topbar */}
      <div className={`topbar${scrolled ? ' scrolled' : ''}`}>
        <div className="topbar-logo">🛒 Family</div>
        <div className="avatar">FA</div>
      </div>

      {/* Content */}
      <div className="content" ref={contentRef}>

        {/* LIST screen */}
        <div className={`screen${activeTab === 'list' ? ' active' : ''}`}>
          <div className="pg-hd">
            <span className="pg-eyebrow">Today</span>
            <div className="pg-title">What we need</div>
            <div className="pg-sub">{subline}</div>
          </div>

          {error && <div className="error-bar" role="alert">{error}</div>}

          <div className="add-card" role="button" tabIndex={0} onClick={openSheet} onKeyDown={e => e.key === 'Enter' && openSheet()}>
            <div className="add-plus">+</div>
            <div>
              <div className="add-title">Add an item</div>
              <div className="add-hint">What does the household need?</div>
            </div>
          </div>

          {!loading && (
            <>
              <div className="sec">
                <span>Needed</span>
                <span className="sec-pill">{needed.length}</span>
              </div>
              {needed.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--fg-muted)', padding: '4px 2px' }}>Nothing needed right now.</p>
                : needed.map(item => <ItemCard key={item.id} item={item} onCheck={markBought} />)
              }

              {bought.length > 0 && (
                <>
                  <div className="sec" style={{ marginTop: 4 }}>
                    <span>Bought</span>
                    <span className="sec-pill grey">{bought.length}</span>
                  </div>
                  {bought.map(item => <ItemCard key={item.id} item={item} onCheck={markBought} isBought />)}
                </>
              )}
            </>
          )}
          <div className="spacer" />
        </div>

        {/* HISTORY screen */}
        <div className={`screen${activeTab === 'history' ? ' active' : ''}`}>
          <div className="pg-hd">
            <span className="pg-eyebrow">Past shops</span>
            <div className="pg-title">History</div>
            <div className="pg-sub">Coming in a future update</div>
          </div>
          <div className="stub">
            <div className="stub-icon">📋</div>
            <div className="stub-label">No history yet</div>
            <div className="stub-hint">Bought items will appear here grouped by date.</div>
          </div>
        </div>

        {/* MEMBERS screen */}
        <div className={`screen${activeTab === 'members' ? ' active' : ''}`}>
          <div className="pg-hd">
            <span className="pg-eyebrow">Household</span>
            <div className="pg-title">Members</div>
            <div className="pg-sub">Coming in a future update</div>
          </div>
          <div className="stub">
            <div className="stub-icon">👨‍👩‍👦</div>
            <div className="stub-label">Your household</div>
            <div className="stub-hint">Invite family members to share the list.</div>
          </div>
        </div>

        {/* ACCOUNT screen */}
        <div className={`screen${activeTab === 'account' ? ' active' : ''}`}>
          <div className="pg-hd">
            <span className="pg-eyebrow">You</span>
            <div className="pg-title">Account</div>
            <div className="pg-sub">Coming in a future update</div>
          </div>
          <div className="stub">
            <div className="stub-icon">👤</div>
            <div className="stub-label">Your profile</div>
            <div className="stub-hint">Sign in and manage settings here.</div>
          </div>
        </div>

      </div>

      {/* Bottom nav */}
      <nav className="nav">
        <NavItem icon={<ListIcon />} label="List"    active={activeTab === 'list'}    onClick={() => setActiveTab('list')} />
        <NavItem icon={<HistIcon />} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavItem icon={<MembIcon />} label="Members" active={activeTab === 'members'} onClick={() => setActiveTab('members')} />
        <NavItem icon={<AcctIcon />} label="Account" active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
      </nav>

      {/* Add sheet backdrop */}
      <div className={`sheet-backdrop${sheetOpen ? ' show' : ''}`} onClick={closeSheet} />

      {/* Add sheet */}
      <div className={`sheet${sheetOpen ? ' show' : ''}`} role="dialog" aria-modal="true" aria-label="Add item">
        <div className="sheet-handle" />
        <div className="sheet-title">Add an item</div>
        <form onSubmit={addItem} style={{ display: 'contents' }}>
          <div className="sheet-row">
            <input
              ref={nameInputRef}
              className="sheet-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Milk, Bread…"
              maxLength={100}
              required
            />
            <input
              className="sheet-input sheet-qty"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Qty"
              maxLength={50}
            />
          </div>
          {error && <div className="error-bar">{error}</div>}
          <button className="sheet-submit" type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Adding…' : 'Add to list'}
          </button>
        </form>
      </div>

    </div>
  )
}

function ItemCard({ item, onCheck, isBought = false }) {
  return (
    <div className={`item${isBought ? ' bought' : ''}`}>
      <div className="emoji-box">{guessEmoji(item.name)}</div>
      <div className="item-body">
        <div className={`item-name${isBought ? ' strike' : ''}`}>{item.name}</div>
        {(item.quantity || item.requested_by) && (
          <div className="item-meta">
            {[item.quantity, item.requested_by ? `by ${item.requested_by}` : null].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <div className="item-right">
        <button
          className={`check-btn${isBought ? ' done' : ''}`}
          onClick={() => onCheck(item.id)}
          aria-label={isBought ? 'Mark as needed' : 'Mark as bought'}
        >
          {isBought ? '✓' : ''}
        </button>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`nav-item${active ? ' active' : ''}`} onClick={onClick}>
      <div className="nav-pill">{icon}</div>
      {label}
    </button>
  )
}

function ListIcon() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  )
}

function HistIcon() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 7 12 12 15 15"/>
    </svg>
  )
}

function MembIcon() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}

function AcctIcon() {
  return (
    <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}
