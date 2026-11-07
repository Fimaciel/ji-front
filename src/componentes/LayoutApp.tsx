import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from './Botao'
import {
  IconeChevronBaixo,
  IconeConfiguracoes,
  IconeCarteira,
  IconeEtiqueta,
  IconeInicio,
  IconeSair,
  IconeTransacoes,
} from './Icones'
import { LogoJi } from './LogoJi'
import estilos from './LayoutApp.module.css'

export function LayoutApp() {
  const { sessao, sair } = useAutenticacao()
  const navegar = useNavigate()
  const [saindo, definirSaindo] = useState(false)

  if (!sessao) return null

  async function encerrarSessao() {
    definirSaindo(true)
    try {
      await sair()
      navegar('/entrar', { replace: true })
    } finally {
      definirSaindo(false)
    }
  }

  const iniciais = `${sessao.usuario.nome[0] ?? ''}${sessao.usuario.sobrenome[0] ?? ''}`

  return (
    <div className={estilos.aplicacao}>
      <header className={estilos.cabecalho}>
        <NavLink className={estilos.marca} to="/app" aria-label="Ji — início">
          <LogoJi tamanho={36} somenteSimbolo />
          <span className={estilos.nomeMarca}>Ji</span>
        </NavLink>
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
              <NavLink className={estilos.atalhoMenu} to="/app/configuracoes">
                <IconeConfiguracoes tamanho={17} /> Configurações
              </NavLink>
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

      <div className={estilos.corpo}>
        <aside className={estilos.barraLateral} aria-label="Navegação principal">
          <nav>
            <NavLink
              to="/app"
              end
              aria-label="Visão geral"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeInicio tamanho={19} /> <span>Visão geral</span>
            </NavLink>
            <NavLink
              to="/app/transacoes"
              aria-label="Transações"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeTransacoes tamanho={19} /> <span>Transações</span>
            </NavLink>
            <NavLink
              to="/app/orcamentos"
              aria-label="Orçamentos"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeCarteira tamanho={19} /> <span>Orçamentos</span>
            </NavLink>
            <NavLink
              to="/app/categorias"
              aria-label="Categorias"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeEtiqueta tamanho={19} /> <span>Categorias</span>
            </NavLink>
            <NavLink
              to="/app/configuracoes"
              aria-label="Configurações"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeConfiguracoes tamanho={19} /> <span>Configurações</span>
            </NavLink>
          </nav>
          <p className={estilos.rodapeLateral}>Seu contexto financeiro permanece isolado e protegido.</p>
        </aside>
        <main className={estilos.principal}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
