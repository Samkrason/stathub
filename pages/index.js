import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>StatHub</title>
        <meta name="description" content="Sports stats, HR predictions, and vibes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <header style={styles.header}>
          <span style={styles.logo}>⚡ StatHub</span>
          <span style={styles.tagline}>Sports stats with edge</span>
        </header>

        <main style={styles.main}>
          <h1 style={styles.h1}>Welcome to StatHub</h1>
          <p style={styles.lede}>
            HR predictions, prop suggestions, and vibes — backed by live MLB data.
          </p>

          <div style={styles.cards}>
            <Link href="/hr-watch" style={styles.card}>
              <div style={styles.cardIcon}>⚾</div>
              <div style={styles.cardTitle}>HR Watch</div>
              <div style={styles.cardDesc}>Logistic model for tonight's home run picks</div>
              <div style={styles.cardSoon}>Coming soon</div>
            </Link>

            <Link href="/vibe" style={styles.card}>
              <div style={styles.cardIcon}>🎲</div>
              <div style={styles.cardTitle}>Random Vibe Generator</div>
              <div style={styles.cardDesc}>3 random props, themed for the slate</div>
              <div style={styles.cardSoon}>Coming soon</div>
            </Link>
          </div>
        </main>

        <footer style={styles.footer}>
          Built with Next.js · Data via MLB Stats API
        </footer>
      </div>
    </>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#202124',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '0.5px solid #dadce0',
    padding: '0 24px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: { fontSize: 18, fontWeight: 700 },
  tagline: { fontSize: 12, color: '#5f6368' },
  main: {
    flex: 1,
    maxWidth: 720,
    width: '100%',
    margin: '0 auto',
    padding: '48px 24px',
  },
  h1: { fontSize: 32, fontWeight: 700, marginBottom: 8 },
  lede: { fontSize: 16, color: '#5f6368', marginBottom: 32, lineHeight: 1.5 },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
  },
  card: {
    border: '0.5px solid #dadce0',
    borderRadius: 12,
    padding: '20px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color 0.2s, transform 0.2s',
    display: 'block',
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#5f6368', marginBottom: 12, lineHeight: 1.5 },
  cardSoon: {
    fontSize: 11,
    fontWeight: 700,
    color: '#e37400',
    background: '#fef3e2',
    padding: '2px 8px',
    borderRadius: 4,
    display: 'inline-block',
  },
  footer: {
    borderTop: '0.5px solid #dadce0',
    padding: '16px 24px',
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
}