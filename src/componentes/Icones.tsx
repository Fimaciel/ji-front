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

export function IconeInicio(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></IconeBase>
}

export function IconeConfiguracoes(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.94 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.57 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.57 1.7 1.7 0 0 0 10 3h4v.08A1.7 1.7 0 0 0 15.06 4.6a1.7 1.7 0 0 0 1.88-.34L17 4.2 19.8 7l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.6.76 1 1.4 1H21v4h-.08a1.7 1.7 0 0 0-1.52 1Z" /></IconeBase>
}

export function IconeUsuario(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></IconeBase>
}

export function IconeEscudo(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></IconeBase>
}

export function IconeCarteira(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M4 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" /><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" /></IconeBase>
}

export function IconeSol(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" /></IconeBase>
}

export function IconeLua(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></IconeBase>
}

export function IconeMonitor(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></IconeBase>
}

export function IconeRestaurar(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></IconeBase>
}

export function IconeAlerta(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M10.3 3.6 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></IconeBase>
}

export function IconeTransacoes(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4" /></IconeBase>
}

export function IconeEtiqueta(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M20.6 13.6 11 4H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></IconeBase>
}

export function IconeMais(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M12 5v14M5 12h14" /></IconeBase>
}

export function IconeBusca(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></IconeBase>
}

export function IconeEditar(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></IconeBase>
}

export function IconeExcluir(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></IconeBase>
}

export function IconeFechar(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m6 6 12 12M18 6 6 18" /></IconeBase>
}

export function IconeSetaCima(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m18 15-6-6-6 6" /></IconeBase>
}

export function IconeSetaBaixo(propriedades: PropriedadesIcone) {
  return <IconeBase {...propriedades}><path d="m6 9 6 6 6-6" /></IconeBase>
}
