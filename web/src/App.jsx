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

const EMOJI_MAP = [
  ['milk', '🥛'], ['egg', '🥚'], ['bread', '🍞'], ['butter', '🧈'], ['banana', '🍌'],
  ['apple', '🍎'], ['orange', '🍊'], ['tomato', '🍅'], ['chicken', '🍗'], ['beef', '🥩'],
  ['cheese', '🧀'], ['yogurt', '🥛'], ['rice', '🌾'], ['pasta', '🍝'], ['soup', '🥣'],
  ['coffee', '☕'], ['tea', '🍵'], ['juice', '🧃'], ['water', '💧'], ['cereal', '🥣'],
  ['soap', '🧴'], ['toilet', '🧻'], ['detergent', '🧺'], ['shampoo', '🧴'],
  ['onion', '🧅'], ['garlic', '🧄'], ['potato', '🥔'], ['carrot', '🥕'], ['fish', '🐟'],
  ['pork', '🥩'], ['lamb', '🍖'], ['cake', '🎂'], ['cookie', '🍪'], ['chocolate', '🍫'],
  ['sugar', '🍬'], ['salt', '🧂'], ['oil', '🫙'], ['broccoli', '🥦'], ['sauce', '🫙'],
]

function guessEmoji(name) {
  const lower = name.toLowerCase()
  for (const [word, emoji] of EMOJI_MAP) if (lower.includes(word)) return emoji
  return '🛒'
}

// Placeholder content for screens the API does not serve yet.
const SAMPLE_HISTORY = [
  { date: 'Monday 18 Nov', items: [['Butter', 'Dad'], ['Bananas', 'Mum'], ['Broccoli', 'Mum'], ['Orange juice', 'Caleb'], ['Toilet paper', 'Dad'], ['Pasta sauce', 'Mum']] },
  { date: 'Friday 15 Nov', items: [['Milk', 'Mum'], ['Bread', 'Dad'], ['Cheddar cheese', 'Caleb'], ['Chicken thighs', 'Mum']] },
  { date: 'Tuesday 12 Nov', items: [['Eggs', 'Laylah'], ['Coffee beans', 'Dad'], ['Dish soap', 'Mum']] },
]

const SAMPLE_MEMBERS = [
  { initials: 'CA', name: 'Caleb', count: 14, color: '#1E5C38', you: true },
  { initials: 'DA', name: 'Dad', count: 9, color: '#2E6B8A' },
  { initials: 'MU', name: 'Mum', count: 21, color: '#7A4A9A' },
  { initials: 'LA', name: 'Laylah', count: 5, color: '#A05030' },
  { initials: 'SH', name: 'Sharon', count: 2, color: '#3A7A5A' },
]

const TABS = ['list', 'history', 'members', 'account']

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
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
    if (!sheetOpen) return
    const timer = setTimeout(() => nameInputRef.current?.focus(), 300)
    const onKey = (e) => { if (e.key === 'Escape') closeSheet() }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(timer); document.removeEventListener('keydown', onKey) }
  }, [sheetOpen])

  function switchTab(tab) {
    setActiveTab(tab)
    if (contentRef.current) contentRef.current.scrollTop = 0
    setScrolled(false)
  }

  function openSheet() { setSheetOpen(true) }
  function closeSheet() { setSheetOpen(false); setName(''); setQuantity('') }

  async function addItem(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await api('/items', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), quantity: quantity.trim() || undefined }),
      })
      closeSheet()
      await loadItems()
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

  const needed = items.filter(i => !i.boughtAt)
  const bought = items.filter(i => i.boughtAt)
  const subline = loading
    ? 'Loading…'
    : `${needed.length} item${needed.length !== 1 ? 's' : ''} needed · ${bought.length} bought`

  return (
    <div className="app">

      <div className={`topbar${scrolled ? ' scrolled' : ''}`}>
        <div className="topbar-logo">🛒 Mpungu</div>
        <div className="avatar" title="Caleb">CA</div>
      </div>

      <div className="content" ref={contentRef} onScroll={e => setScrolled(e.currentTarget.scrollTop > 4)}>

        {activeTab === 'list' && (
          <div className="screen active">
            <div className="pg-hd">
              <span className="pg-eyebrow">Today</span>
              <div className="pg-title">What we need</div>
              <div className="pg-sub">{subline}</div>
            </div>

            {bannerVisible && !loading && (
              <div className="banner">
                <CartIcon />
                <span>{needed.length} item{needed.length !== 1 ? 's' : ''} on the list right now</span>
                <button className="banner-dismiss" onClick={() => setBannerVisible(false)} aria-label="Dismiss">×</button>
              </div>
            )}

            {error && !sheetOpen && <div className="error-bar" role="alert">{error}</div>}

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
                <div>
                  {needed.length === 0
                    ? <p className="item-meta" style={{ padding: '4px 2px' }}>Nothing needed right now.</p>
                    : needed.map(item => <ItemCard key={item.id} item={item} onCheck={markBought} />)}
                </div>

                <div className="sec" style={{ marginTop: 4 }}>
                  <span>Bought</span>
                  <span className="sec-pill grey">{bought.length}</span>
                </div>
                <div>
                  {bought.map(item => <ItemCard key={item.id} item={item} isBought />)}
                </div>
              </>
            )}
            <div className="spacer" />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="screen active">
            <div className="pg-hd">
              <span className="pg-eyebrow">Past shops</span>
              <div className="pg-title">History</div>
              <div className="pg-sub">Last 30 days</div>
            </div>
            {SAMPLE_HISTORY.map(day => (
              <div className="hist-day" key={day.date}>
                <div className="hist-day-hd">
                  <span className="hist-day-date">{day.date}</span>
                  <span className="hist-day-count">{day.items.length} bought</span>
                </div>
                {day.items.map(([itemName, who]) => (
                  <div className="hist-item" key={itemName}>
                    <span className="hist-emoji">{guessEmoji(itemName)}</span>
                    <span className="hist-name">{itemName}</span>
                    <span className="hist-who">{who}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="spacer" />
          </div>
        )}

        {activeTab === 'members' && (
          <div className="screen active">
            <div className="pg-hd">
              <span className="pg-eyebrow">Your household</span>
              <div className="pg-title">Members</div>
              <div className="pg-sub">{SAMPLE_MEMBERS.length} people · Mpungu Family</div>
            </div>
            <div className="sec"><span>Family</span></div>
            <div>
              {SAMPLE_MEMBERS.map(m => (
                <div className="member-card" key={m.name}>
                  <div className="member-av" style={{ background: m.color }}>{m.initials}</div>
                  <div className="member-body">
                    <div className="member-name">{m.name}</div>
                    <div className="member-role">{m.count} items this month</div>
                  </div>
                  {m.you && <div className="member-badge">You</div>}
                </div>
              ))}
            </div>
            <div className="invite-card">
              <div className="invite-icon">+</div>
              <div className="invite-text">Invite a family member</div>
            </div>
            <div className="spacer" />
          </div>
        )}

        {activeTab === 'account' && (
          <div className="screen active">
            <div className="acct-hero">
              <div className="acct-av">CA</div>
              <div>
                <div className="acct-name">Caleb Mpungu</div>
                <div className="acct-email">Mpungu Family</div>
              </div>
            </div>

            <div className="sec"><span>Household</span></div>
            <div className="settings-group">
              <SettingsRow icon="🏠" label="Household name" value="Mpungu Family" />
              <SettingsRow icon="👥" label="Members" value={`${SAMPLE_MEMBERS.length} people`} />
            </div>

            <div className="sec"><span>Notifications</span></div>
            <div className="settings-group">
              <SettingsRow icon="🔔" label="Item added alerts" value="On" />
              <SettingsRow icon="🕐" label="Daily reminder" value="8:00 AM" />
            </div>

            <div className="sec"><span>App</span></div>
            <div className="settings-group">
              <SettingsRow icon="📱" label="Install on home screen" />
              <SettingsRow icon="🔐" label="Sign out" noChevron />
            </div>
            <div className="spacer" />
          </div>
        )}

      </div>

      <nav className="nav">
        {TABS.map(tab => (
          <button key={tab} className={`nav-item${activeTab === tab ? ' active' : ''}`} onClick={() => switchTab(tab)}>
            <div className="nav-pill"><NavIcon tab={tab} /></div>
            <span>{tab[0].toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </nav>

      <div className={`sheet-backdrop${sheetOpen ? ' show' : ''}`} onClick={closeSheet} />
      <form className={`sheet${sheetOpen ? ' show' : ''}`} onSubmit={addItem} role="dialog" aria-modal="true" aria-label="Add an item">
        <div className="sheet-handle" />
        <div className="sheet-title">Add an item</div>
        <input
          ref={nameInputRef}
          className="sheet-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Orange juice"
          maxLength={100}
          autoComplete="off"
          required
        />
        <div className="sheet-row">
          <input
            className="sheet-input"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Qty (optional)"
            maxLength={50}
            autoComplete="off"
          />
        </div>
        {error && sheetOpen && <div className="error-bar">{error}</div>}
        <button className="sheet-submit" type="submit" disabled={submitting || !name.trim()}>
          {submitting ? 'Adding…' : 'Add to list'}
        </button>
      </form>

    </div>
  )
}

function ItemCard({ item, onCheck, isBought = false }) {
  const meta = isBought
    ? 'Bought today'
    : item.requestedBy ? `Added by ${item.requestedBy}` : 'Added'
  return (
    <div className={`item${isBought ? ' bought' : ''}`}>
      <div className="emoji-box">{guessEmoji(item.name)}</div>
      <div className="item-body">
        <div className={`item-name${isBought ? ' strike' : ''}`}>{item.name}</div>
        <div className="item-meta">{meta}</div>
      </div>
      <div className="item-right">
        <button
          className={`check-btn${isBought ? ' done' : ''}`}
          onClick={isBought ? undefined : () => onCheck(item.id)}
          disabled={isBought}
          aria-label={isBought ? 'Bought' : `Mark ${item.name} as bought`}
        >✓</button>
        {item.quantity && <span className="qty">{item.quantity}</span>}
      </div>
    </div>
  )
}

function SettingsRow({ icon, label, value, noChevron = false }) {
  return (
    <div className="settings-row">
      <div className="settings-icon">{icon}</div>
      <span className="settings-label">{label}</span>
      {value && <span className="settings-value">{value}</span>}
      {!noChevron && <span className="settings-chev">›</span>}
    </div>
  )
}

function CartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 002 1.58h9.78a2 2 0 001.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function NavIcon({ tab }) {
  const props = { className: 'nav-svg', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (tab === 'list') return (
    <svg {...props}>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
  if (tab === 'history') return (
    <svg {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
  if (tab === 'members') return (
    <svg {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
  return (
    <svg {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  )
}
