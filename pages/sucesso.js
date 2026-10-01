import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/Sucesso.module.css'

export default function Sucesso() {
  const router = useRouter()
  const { grupo } = router.query

  return (
    <div className={styles.page}>
      <Head>
        <title>Isa & JP – Presença Confirmada – 17/04/2027</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <div className={styles.card}>
          <span className={styles.checkIcon}>
            <CheckIcon />
          </span>

          <h1 className={styles.title}>Presença Confirmada!</h1>

          <p className={styles.message}>
            Que alegria ter você conosco nesse dia especial.
            <br />
            Mal podemos esperar para celebrar com você!
          </p>

          <div className={styles.divider}>
            <HeartIcon />
          </div>

          <div className={styles.dateBox}>
            <span className={styles.dateLabel}>SAVE THE DATE</span>
            <span className={styles.dateValue}>17 . 04 . 2027</span>
            <span className={styles.dateSep} />
            <span className={styles.dateVenue}>Restaurante Lago da Serra</span>
            <span className={styles.dateCity}>São João da Boa Vista – SP</span>
            <span className={styles.dateTime}>Sábado, 17 de Abril · às 16h00</span>
          </div>

          <a href="#" className={styles.btn}>
            <GiftIcon /> LISTA DE PRESENTES
          </a>

          <Link href="/" className={styles.backLink}>
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
