import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const THEMES = [
  {emoji:'🛋️', name:'Boring Grandpa Parlay',  desc:'just a man and his recliner'},
  {emoji:'🌶️', name:'Spicy K Stack',           desc:'high-K pitcher special'},
  {emoji:'🎯', name:'Floor Maxxing',            desc:'no risk no problems'},
  {emoji:'🌙', name:'Late Slate Sleepers',      desc:'west coast money'},
  {emoji:'🧙', name:'The Wizard Says',          desc:'do not question the wizard'},
  {emoji:'🦝', name:'Trash Panda Special',      desc:"what's left at the bottom"},
  {emoji:'🪙', name:'Coin Flip Chaos',          desc:'all 50/50, all faith'},
  {emoji:'🔥', name:'I Just Like the Guys',     desc:'vibes only, no analysis'},
  {emoji:'📞', name:'Mom Just Called',          desc:'short, distracted, prescient'},
  {emoji:'🧊', name:"Ice in My Veins",          desc:"we don't flinch"},
  {emoji:'🍩', name:'Donut Hole',               desc:'0/3 or 3/3, no in-between'},
  {emoji:'🎤', name:'Karaoke Confidence',       desc:'one drink past good judgment'},
  {emoji:'🪞', name:'Reverse Psychology',       desc:'every cold guy is due'},
  {emoji:'🌯', name:'Burrito on a Tuesday',     desc:'unexpectedly perfect'},
  {emoji:'🌬️', name:'Wrigley Wind Worship',    desc:'the flag tells you the bet'},
]

const pick = arr => arr[Math.floor(Math.random() * arr.length)]

export default function VibePage() {
  const [slate, setSlate] = useState(null)
  const [roll, setRoll]   = useState(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/slate')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setSlate(data)
        rollFresh(data)
      })
      .catch(e => setError(e.message))
  }, [])

  function rollFresh(slateData) {
    const games = (slateData?.games || []).filter(g => g.status !== 'Final')
    if (games.length === 0) {
      setRoll({ theme: pick(THEMES), empty: true })
      return
    }

    const pitchers = []
    games.forEach(g => {
      ;[g.home, g.away].forEach(side => {
        if (side.probablePitcher?.K9 && side.probablePitcher?.IP > 5) {
          const p = side.probablePitcher
          const expK = p.K9 * (5.5 / 9)
          const line = Math.floor(expK) + 0.5
          pitchers.push({
            player: p.name,
            team: side.team,
            prop: `OVER ${line} K`,
            vs: side === g.home ? g.away.team : g.home.team,
            prob: Math.min(0.78, 0.50 + (p.K9 - 7) * 0.05),
            blurb: `${p.K9.toFixed(1)} K/9 across ${p.IP} IP`,
          })
        }
      })
    })

    const teamProps = []
    games.forEach(g => {
      ;[g.home, g.away].forEach(side => {
        const oppP = side === g.home ? g.away.probablePitcher : g.home.probablePitcher
        if (!oppP?.ERA) return
        const oppTeam = side === g.home ? g.away.team : g.home.team
        teamProps.push({
          player: `${side.team} team total`,
          team: side.team,
          prop: 'OVER 4.5 runs',
          vs: `${oppP.name} (${oppTeam})`,
          prob: Math.min(0.72, 0.45 + (oppP.ERA - 3.5) * 0.05),
          blurb: `vs ${oppP.ERA.toFixed(2)} ERA at ${g.venue.name}`,
        })
      })
    })

    if (pitchers.length === 0 || teamProps.length < 2) {
      setRoll({ theme: pick(THEMES), empty: true })
      return
    }

    setRoll({
      theme: pick(THEMES),
      legs: [pick(teamProps), pick(teamProps), pick(pitchers)],
    })
  }

  const reroll = useCallback(() => {
    rollFresh(slate)
    setCount(c => c + 1)
  }, [slate])

  if (error)    return <Shell><Msg>API error: {error}</Msg></Shell>
  if (!roll)    return <Shell><Msg>Loading today's slate...</Msg></Shell>
  if (roll.empty) {
    return (
      <Shell>
        <ThemeBanner theme={roll.theme} />
        <Msg>No games right now, or pitchers haven't been announced yet. Check back later.</Msg>
        <RerollBtn onClick={reroll} />
      </Shell>
    )
  }

  const probs = roll.legs.map(l => l.prob)
  const all = probs.reduce((acc, p) => acc * p, 1)
  const none = probs.reduce((acc, p) => acc * (1 - p), 1)
  const atLeastOne = 1 - none

  return (
    <Shell gameCount={slate?.games.length} rollNum={count + 1}>
      <ThemeBanner theme={roll.theme} />
      <div style={S.legs}>
        {roll.legs.map((leg, i) => (
          <PropRow key={i} slot={['Floor','Edge','K Over'][i]} p={leg} />
        ))}
      </div>
      <div style={S.statsBar}>
        <Stat label="All hit" val={all} color="#137333" />
        <Stat label="1+ hit"  val={atLeastOne} color="#1a73e8" />
      </div>
      <RerollBtn onClick={reroll} />
      <div style={S.disclaimer}>
        <b>For entertainment only.</b> Probabilities are rough model estimates. Don't bet money you can't afford to lose.
      </div>
    </Shell>
  )
}

function Shell({ children, gameCount, rollNum }) {
  return (
    <>
      <Head><title>Random Vibe Generator — StatHub</title></Head>
      <div style={S.page}>
        <header style={S.header}>
          <Link href="/" style={S.back}>← StatHub</Link>
          <span style={S.slash}>/</span>
          <span style={S.title}>Random Vibe Generator</span>
          {gameCount != null && (
            <span style={S.meta}>{gameCount} games · roll #{rollNum}</span>
          )}
        </header>
        <main style={S.main}>{children}</main>
      </div>
    </>
  )
}

function ThemeBanner({ theme }) {
  return (
    <div style={S.banner}>
      <div style={S.bannerTitle}>{theme.emoji} {theme.name}</div>
      <div style={S.bannerDesc}>{theme.desc}</div>
    </div>
  )
}

function PropRow({ slot, p }) {
  const c = p.prob >= 0.65 ? '#137333' : p.prob >= 0.50 ? '#1a73e8' : '#e37400'
  return (
    <div style={S.row}>
      <div style={S.slot}>{slot}</div>
      <div style={S.rowMain}>
        <div style={S.player}>{p.player}</div>
        <div style={S.prop}><b>{p.prop}</b> · vs {p.vs}</div>
        <div style={S.blurb}>{p.blurb}</div>
      </div>
      <div style={{...S.prob, color: c}}>{Math.round(p.prob * 100)}%</div>
    </div>
  )
}

function Stat({ label, val, color }) {
  return (
    <div>
      <div style={S.statLabel}>{label}</div>
      <div style={{...S.statVal, color}}>{Math.round(val * 100)}%</div>
    </div>
  )
}

function RerollBtn({ onClick }) {
  return <button onClick={onClick} style={S.btn}>🎲 Roll again</button>
}

function Msg({ children }) {
  return <div style={{padding: 40, textAlign: 'center', color: '#5f6368'}}>{children}</div>
}

const S = {
  page: { background: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#202124' },
  header: { borderBottom: '0.5px solid #dadce0', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 720, margin: '0 auto' },
  back: { fontSize: 13, color: '#1a73e8', textDecoration: 'none' },
  slash: { color: '#dadce0' },
  title: { fontSize: 14, fontWeight: 700 },
  meta: { marginLeft: 'auto', fontSize: 11, color: '#888' },
  main: { maxWidth: 720, margin: '0 auto', padding: '24px 20px' },
  banner: { background: '#1a73e812', border: '1px solid #1a73e833', borderRadius: 12, padding: '14px 18px', marginBottom: 16 },
  bannerTitle: { fontSize: 22, fontWeight: 700, lineHeight: 1.2 },
  bannerDesc: { fontSize: 12, color: '#5f6368', marginTop: 4, fontStyle: 'italic' },
  legs: { border: '0.5px solid #dadce0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 },
  row: { display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '0.5px solid #dadce0' },
  slot: { flexShrink: 0, width: 56, fontSize: 10, color: '#5f6368', textTransform: 'uppercase', fontWeight: 700 },
  rowMain: { flex: 1, minWidth: 0 },
  player: { fontSize: 14, fontWeight: 700 },
  prop: { fontSize: 12, color: '#5f6368', marginTop: 2 },
  blurb: { fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' },
  prob: { flexShrink: 0, fontSize: 18, fontWeight: 700 },
  statsBar: { background: '#f8f9fa', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', fontWeight: 700 },
  statVal: { fontSize: 18, fontWeight: 700 },
  btn: { width: '100%', padding: '14px 16px', borderRadius: 10, border: 'none', background: '#1a73e8', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  disclaimer: { marginTop: 20, padding: '10px 14px', background: '#fef9e6', borderRadius: 8, fontSize: 11, color: '#854f0b', lineHeight: 1.5 },
}