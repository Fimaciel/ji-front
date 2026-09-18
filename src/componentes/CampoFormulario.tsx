import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import estilos from './Componentes.module.css'

interface PropriedadesCampoFormulario extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  rotulo: string
  erro?: string
  ajuda?: string
  sufixo?: ReactNode
}

export const CampoFormulario = forwardRef<HTMLInputElement, PropriedadesCampoFormulario>(
  function CampoFormulario({ id, rotulo, erro, ajuda, sufixo, className = '', ...propriedades }, ref) {
    const descricaoId = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined

    return (
      <div className={`${estilos.campoGrupo} ${className}`}>
        <label className={estilos.rotulo} htmlFor={id}>{rotulo}</label>
        <span className={`${estilos.campoCaixa} ${erro ? estilos.campoComErro : ''}`}>
          <input
            id={id}
            ref={ref}
            className={estilos.campo}
            aria-invalid={Boolean(erro)}
            aria-describedby={descricaoId}
            {...propriedades}
          />
          {sufixo ? <span className={estilos.sufixo}>{sufixo}</span> : null}
        </span>
        {erro ? <span id={`${id}-erro`} className={estilos.erroCampo} role="alert">{erro}</span> : null}
        {!erro && ajuda ? <span id={`${id}-ajuda`} className={estilos.ajuda}>{ajuda}</span> : null}
      </div>
    )
  },
)
