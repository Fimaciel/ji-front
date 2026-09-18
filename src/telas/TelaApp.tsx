import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { IconeChevronBaixo, IconeSair } from '../componentes/Icones'
import { LogoJi } from '../componentes/LogoJi'
import estilos from './TelaApp.module.css'

export function TelaApp() {
  const { sessao, sair } = useAutenticacao()
  const navegar = useNavigate()
  const [saindo, definirSaindo] = useState(false)

  if (!sessao) return null

  async function encerrarSessao() {
    definirSaindo(true)
    await sair()
    navegar('/entrar', { replace: true })
  }

  const iniciais = `${sessao.usuario.nome[0] ?? ''}${sessao.usuario.sobrenome[0] ?? ''}`

  return (
    <div className={estilos.aplicacao}>
      <header className={estilos.cabecalho}>
        <div className={estilos.marca}>
          <LogoJi tamanho={36} somenteSimbolo />
          <span>Ji</span>
        </div>
        <div className={estilos.acoesCabecalho}>
          <div className={estilos.contexto} aria-label="Contexto ativo">
            <span>{sessao.contextoAtivo.nome}</span>
            <small>{sessao.contextoAtivo.tipo} · {sessao.contextoAtivo.papel}</small>
          </div>
          <details className={estilos.menuUsuario}>
            <summary aria-label="Abrir menu do usuário">
              <span className={estilos.avatar}>{iniciais}</span>
              <span className={estilos.nomeCurto}>{sessao.usuario.nome}</span>
              <IconeChevronBaixo tamanho={14} />
            </summary>
            <div className={estilos.menuFlutuante}>
              <div className={estilos.identidade}>
                <strong>{sessao.usuario.nomeCompleto}</strong>
                <span>{sessao.usuario.email}</span>
              </div>
              <Botao
                variante="fantasma"
                larguraTotal
                icone={<IconeSair tamanho={17} />}
                carregando={saindo}
                onClick={encerrarSessao}
              >
                Sair
              </Botao>
            </div>
          </details>
        </div>
      </header>

      <main className={estilos.conteudo}>
        <div className={estilos.saudacao}>Olá, {sessao.usuario.nomeCompleto}</div>
        <h1>Sua conta está pronta</h1>
        <p className={estilos.introducao}>
          O contexto Pessoal foi ativado. As próximas áreas financeiras serão adicionadas nos
          incrementos seguintes do Ji.
        </p>
        <dl className={estilos.resumo}>
          <div>
            <dt>Contexto ativo</dt>
            <dd>{sessao.contextoAtivo.nome}</dd>
          </div>
          <div>
            <dt>Seu papel</dt>
            <dd>Administrador</dd>
          </div>
          <div>
            <dt>Sessão</dt>
            <dd>{sessao.expiraEm ? 'Lembrada por 7 dias' : 'Até fechar a aba'}</dd>
          </div>
        </dl>
        <div className={estilos.proximoPasso}>
          <span aria-hidden="true" />
          Cadastro e autenticação concluídos. Nenhum dado financeiro foi criado nesta sprint.
        </div>
      </main>
    </div>
  )
}
