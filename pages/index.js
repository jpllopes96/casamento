import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Save the Date – 17/04/2027</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.hero}>
        <div className={styles.overlay} />

        <div className={styles.content}>
          <h1 className={styles.saveTheDate}>Save the Date</h1>

          <p className={styles.date}>17 . 04 . 2027</p>

          <div className={styles.divider}>
            <span className={styles.heart}>
              <HeartIcon />
            </span>
          </div>

          <div className={styles.location}>
            <span className={styles.pinIcon}><PinIcon /></span>
            <span>
              Restaurante Lago da Serra – Estr. Serra da Paulista, KM 5<br />
              Córrego Fundo, São João da Boa Vista – SP
              <br />
              <span className={styles.time}>Sábado, às 16h00</span>
            </span>
          </div>

          <div className={styles.buttons}>
            <Link href="/confirmar" className={styles.btn}>
              <HeartOutlineIcon />
              CONFIRMAR PRESENÇA
            </Link>

            <a href="#" className={styles.btn}>
              <GiftIcon />
              LISTA DE PRESENTES
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function HeartOutlineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}
