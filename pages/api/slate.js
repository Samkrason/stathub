// pages/api/slate.js
// Pulls live MLB schedule + probable pitchers from MLB's free Stats API
// Cached 60s so re-rolls don't hammer their servers

const MLB = 'https://statsapi.mlb.com/api/v1'

const TEAM_ABBR = {
  108:'LAA',109:'AZ', 110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',
  115:'COL',116:'DET',117:'HOU',118:'KC', 119:'LAD',120:'WSH',121:'NYM',
  133:'ATH',134:'PIT',135:'SD', 136:'SEA',137:'SF', 138:'STL',139:'TB',
  140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',
  147:'NYY',158:'MIL',
}

const PARK = {
  'Coors Field':                {pf:1.35, roof:false},
  'Yankee Stadium':             {pf:1.22, roof:false},
  'Wrigley Field':              {pf:1.16, roof:false},
  'Citizens Bank Park':         {pf:1.14, roof:false},
  'Great American Ball Park':   {pf:1.10, roof:false},
  'Chase Field':                {pf:1.08, roof:true},
  'Target Field':               {pf:1.07, roof:false},
  'Truist Park':                {pf:1.04, roof:false},
  'Oriole Park at Camden Yards':{pf:1.04, roof:false},
  'Rogers Centre':              {pf:1.02, roof:true},
  'Nationals Park':             {pf:1.02, roof:false},
  'Minute Maid Park':           {pf:1.01, roof:true},
  'Kauffman Stadium':           {pf:1.00, roof:false},
  'American Family Field':      {pf:1.00, roof:true},
  'Globe Life Field':           {pf:1.00, roof:true},
  'Dodger Stadium':             {pf:0.98, roof:false},
  'Tropicana Field':            {pf:0.97, roof:true},
  'Progressive Field':          {pf:0.97, roof:false},
  'Angel Stadium':              {pf:0.97, roof:false},
  'Citi Field':                 {pf:0.97, roof:false},
  'Busch Stadium':              {pf:0.95, roof:false},
  'T-Mobile Park':              {pf:0.94, roof:true},
  'Sutter Health Park':         {pf:0.94, roof:false},
  'Comerica Park':              {pf:0.94, roof:false},
  'Fenway Park':                {pf:0.93, roof:false},
  'loanDepot park':             {pf:0.92, roof:true},
  'Petco Park':                 {pf:0.92, roof:false},
  'Oracle Park':                {pf:0.91, roof:false},
  'PNC Park':                   {pf:0.90, roof:false},
}

let CACHE = { date: '', data: null, ts: 0 }
const CACHE_MS = 60_000

async function fetchPitcherStats(id, season) {
  try {
    const r = await fetch(`${MLB}/people/${id}/stats?stats=season&group=pitching&season=${season}&gameType=R`)
    if (!r.ok) return null
    const d = await r.json()
    const s = d.stats?.[0]?.splits?.[0]?.stat
    if (!s) return null
    return {
      ERA: parseFloat(s.era) || null,
      K9:  parseFloat(s.strikeoutsPer9Inn) || null,
      HR9: parseFloat(s.homeRunsPer9) || null,
      BB9: parseFloat(s.walksPer9Inn) || null,
      IP:  parseFloat(s.inningsPitched) || 0,
      GS:  s.gamesStarted || 0,
    }
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    const now = Date.now()
    if (CACHE.date === date && CACHE.data && (now - CACHE.ts) < CACHE_MS) {
      return res.status(200).json({ ...CACHE.data, cached: true })
    }

    const r = await fetch(`${MLB}/schedule?sportId=1&date=${date}&hydrate=probablePitcher,team,venue`)
    if (!r.ok) return res.status(502).json({ error: `MLB API ${r.status}` })
    const d = await r.json()
    const season = parseInt(date.slice(0, 4), 10)

    const games = (d.dates?.[0]?.games || []).map(g => {
      const v = g.venue?.name || ''
      const park = PARK[v] || { pf: 1.00, roof: false }
      const mapSide = side => ({
        team: TEAM_ABBR[g.teams[side].team.id] || g.teams[side].team.abbreviation,
        teamName: g.teams[side].team.name,
        teamId: g.teams[side].team.id,
        probablePitcher: g.teams[side].probablePitcher ? {
          id: g.teams[side].probablePitcher.id,
          name: g.teams[side].probablePitcher.fullName,
          hand: g.teams[side].probablePitcher.pitchHand?.code || 'R',
        } : null,
      })
      return {
        id: String(g.gamePk),
        gameDate: g.gameDate,
        status: g.status?.abstractGameState,
        home: mapSide('home'),
        away: mapSide('away'),
        venue: { name: v, ...park },
      }
    })

    // Fetch pitcher stats in parallel
    await Promise.all(games.flatMap(g => [g.home, g.away].map(async side => {
      if (side.probablePitcher?.id) {
        const stats = await fetchPitcherStats(side.probablePitcher.id, season)
        if (stats) Object.assign(side.probablePitcher, stats)
      }
    })))

    const data = { date, games, fetchedAt: new Date().toISOString() }
    CACHE = { date, data, ts: now }
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}