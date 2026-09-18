import type { HTMLAttributes } from 'react'
import estilos from './Componentes.module.css'

interface PropriedadesMensagem extends HTMLAttributes<HTMLParagraphElement> {
  tom: 'erro' | 'sucesso' | 'informativa'
}

export function Mensagem({ tom, className = '', children, ...propriedades }: PropriedadesMensagem) {
  const classeTom = {
    erro: estilos.mensagemErro,
    sucesso: estilos.mensagemSucesso,
    informativa: estilos.mensagemInformativa,
  }[tom]

  return (
    <p
      className={`${estilos.mensagem} ${classeTom} ${className}`}
      role={tom === 'erro' ? 'alert' : 'status'}
      {...propriedades}
    >
      {children}
    </p>
  )
}
