import type { ReactNode } from 'react'
import { LogoJi } from './LogoJi'
import estilos from '../telas/Autenticacao.module.css'

interface PropriedadesLayoutAutenticacao {
  titulo: string
  subtitulo?: ReactNode
  elementoAntesTitulo?: ReactNode
  children: ReactNode
  largura?: 'padrao' | 'ampla'
  tamanhoLogo?: 36 | 40 | 44
}

export function LayoutAutenticacao({
  titulo,
  subtitulo,
  elementoAntesTitulo,
  children,
  largura = 'padrao',
  tamanhoLogo = 40,
}: PropriedadesLayoutAutenticacao) {
  return (
    <main className={estilos.paginaAutenticacao}>
      <section
        className={`${estilos.conteudoAutenticacao} ${largura === 'ampla' ? estilos.conteudoAmplo : ''}`}
        aria-labelledby="titulo-pagina"
      >
        <div className={estilos.logoAutenticacao}>
          <LogoJi tamanho={tamanhoLogo} />
        </div>
        {elementoAntesTitulo}
        <header className={estilos.cabecalhoAutenticacao}>
          <h1 id="titulo-pagina">{titulo}</h1>
          {subtitulo ? <div className={estilos.subtitulo}>{subtitulo}</div> : null}
        </header>
        {children}
      </section>
    </main>
  )
}
