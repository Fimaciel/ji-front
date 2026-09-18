import type { CSSProperties } from 'react'
import estilos from './LogoJi.module.css'

interface PropriedadesLogoJi {
  tamanho?: 36 | 40 | 44
  somenteSimbolo?: boolean
}

export function LogoJi({ tamanho = 40, somenteSimbolo = false }: PropriedadesLogoJi) {
  const tamanhoPalavra = Math.round(tamanho * 0.58)

  return (
    <span
      className={estilos.logo}
      role="img"
      aria-label="Ji"
      style={{ '--tamanho-simbolo': `${tamanho}px` } as CSSProperties}
    >
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 100 100"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M 50 6 L 94 50 Q 70 38 50 50 T 6 50 Z" />
        <path d="M 6 54 Q 30 42 50 54 T 94 54 L 50 94 Z" />
      </svg>
      {somenteSimbolo ? null : (
        <svg
          width={tamanhoPalavra * 1.15}
          height={tamanhoPalavra}
          viewBox="0 0 110 92"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M 8 4 L 50 4 L 50 60 Q 50 88 27 88 Q 4 88 4 60 L 4 54 L 22 54 L 22 60 Q 22 72 27 72 Q 32 72 32 60 L 32 4 Z" />
          <rect x="80" y="4" width="22" height="22" rx="3" />
          <rect x="80" y="32" width="22" height="56" rx="3" />
        </svg>
      )}
    </span>
  )
}
