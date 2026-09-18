import type { SVGProps } from 'react'

type PropriedadesIcone = SVGProps<SVGSVGElement> & { tamanho?: number }

function IconeBase({ tamanho = 20, children, ...propriedades }: PropriedadesIcone) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...propriedades}
    >
      {children}
    </svg>
  )
}

export function IconeVoltar(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m15 6-6 6 6 6" /></IconeBase>
}

export function IconeCalendario(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></IconeBase>
}

export function IconeEmail(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></IconeBase>
}

export function IconeCheck(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m5 12 5 5L20 7" /></IconeBase>
}

export function IconeRelogio(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></IconeBase>
}

export function IconeSair(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></IconeBase>
}

export function IconeChevronBaixo(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m6 9 6 6 6-6" /></IconeBase>
}
