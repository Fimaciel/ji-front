import { useEffect, useId, useRef, type ReactNode } from 'react'
import estilos from './ModalConfirmacao.module.css'

interface PropriedadesModalConfirmacao {
  titulo: string
  descricao: string
  children?: ReactNode
  acoes: ReactNode
  fechar(): void
}

export function ModalConfirmacao({
  titulo,
  descricao,
  children,
  acoes,
  fechar,
}: PropriedadesModalConfirmacao) {
  const tituloId = useId()
  const descricaoId = useId()
  const modalRef = useRef<HTMLDivElement>(null)
  const fecharRef = useRef(fechar)

  useEffect(() => {
    fecharRef.current = fechar
  }, [fechar])

  useEffect(() => {
    const focoAnterior = document.activeElement as HTMLElement | null
    const modal = modalRef.current
    modal?.querySelector<HTMLElement>('button, input')?.focus()

    function controlarTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') fecharRef.current()
      if (evento.key !== 'Tab' || !modal) return
      const focaveis = [...modal.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      )]
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis.at(-1)
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault()
        ultimo?.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', controlarTeclado)
    return () => {
      document.removeEventListener('keydown', controlarTeclado)
      focoAnterior?.focus()
    }
  }, [])

  return (
    <div
      className={estilos.fundo}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) fechar()
      }}
    >
      <div
        ref={modalRef}
        className={estilos.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricaoId}
      >
        <div className={estilos.topo}>
          <div>
            <h2 id={tituloId}>{titulo}</h2>
            <p id={descricaoId}>{descricao}</p>
          </div>
          <button className={estilos.fechar} type="button" onClick={fechar} aria-label="Fechar modal">
            ×
          </button>
        </div>
        {children ? <div className={estilos.corpo}>{children}</div> : null}
        <div className={estilos.acoes}>{acoes}</div>
      </div>
    </div>
  )
}
