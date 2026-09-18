import type { ButtonHTMLAttributes, ReactNode } from 'react'
import estilos from './Componentes.module.css'

interface PropriedadesBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'fantasma'
  larguraTotal?: boolean
  carregando?: boolean
  icone?: ReactNode
}

export function Botao({
  variante = 'primario',
  larguraTotal = false,
  carregando = false,
  icone,
  children,
  className = '',
  disabled,
  ...propriedades
}: PropriedadesBotao) {
  const classeVariante = {
    primario: estilos.botaoPrimario,
    secundario: estilos.botaoSecundario,
    fantasma: estilos.botaoFantasma,
  }[variante]

  return (
    <button
      className={`${estilos.botao} ${classeVariante} ${larguraTotal ? estilos.larguraTotal : ''} ${className}`}
      disabled={disabled || carregando}
      {...propriedades}
    >
      {carregando ? <span className={estilos.carregando} aria-hidden="true" /> : icone}
      {children}
    </button>
  )
}
