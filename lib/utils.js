// Wedding date: 17 April 2027
const WEDDING = new Date(2027, 3, 17)

export function calcularIdade(dataNascimento) {
  // dataNascimento format: "DD/MM/YYYY"
  const parts = dataNascimento.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  const nasc = new Date(y, m - 1, d)
  if (isNaN(nasc.getTime())) return null

  let idade = WEDDING.getFullYear() - nasc.getFullYear()
  if (
    WEDDING.getMonth() < nasc.getMonth() ||
    (WEDDING.getMonth() === nasc.getMonth() && WEDDING.getDate() < nasc.getDate())
  ) {
    idade--
  }
  return Math.max(0, idade)
}

export function getFaixa(idade) {
  if (idade === null) return 'indefinido'
  if (idade < 6) return '0-5'
  if (idade <= 7) return '6-7'
  if (idade <= 17) return '8-17'
  return '18+'
}

export const FAIXAS = [
  { key: 'todos', label: 'Todos' },
  { key: '0-5', label: '0–5 anos' },
  { key: '6-7', label: '6–7 anos' },
  { key: '8-17', label: '8–17 anos' },
  { key: '18+', label: '18+ anos' },
]

export function enrichGrupos(grupos) {
  return grupos.map(g => ({
    ...g,
    convidados: g.convidados.map(c => {
      const idade = calcularIdade(c.dataNascimento)
      return { ...c, idade, faixa: getFaixa(idade) }
    }),
  }))
}
