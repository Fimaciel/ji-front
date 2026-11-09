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
  IconeUsuario,
  IconeEmail,
} from './Icones'
import { LogoJi } from './LogoJi'
import estilos from './LayoutApp.module.css'

export function LayoutApp() {
  const { sessao, sair, selecionarContexto } = useAutenticacao()
  const navegar = useNavigate()
  const [saindo, definirSaindo] = useState(false)
  const [selecionando, definirSelecionando] = useState('')

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

  async function trocarContexto(contextoId: string) {
    if (contextoId === sessao?.contextoAtivo.id) return
    definirSelecionando(contextoId)
    try {
      await selecionarContexto(contextoId)
    } finally {
      definirSelecionando('')
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
          <details className={estilos.menuContexto}>
            <summary className={estilos.contexto} aria-label="Contexto ativo">
              <span>{sessao.contextoAtivo.nome}</span>
              <small>{sessao.contextoAtivo.tipo} · {sessao.contextoAtivo.papel}</small>
              <IconeChevronBaixo tamanho={14} />
            </summary>
            <div className={estilos.listaContextos}>
              <p>Trocar contexto</p>
              {sessao.contextos.map((contexto) => (
                <button
                  key={contexto.id}
                  type="button"
                  className={contexto.id === sessao.contextoAtivo.id ? estilos.contextoAtivo : ''}
                  disabled={Boolean(selecionando)}
                  onClick={() => trocarContexto(contexto.id)}
                >
                  <span>{contexto.nome}</span>
                  <small>{contexto.id === sessao.contextoAtivo.id ? 'Ativo' : contexto.papel.toLocaleLowerCase('pt-BR')}</small>
                </button>
              ))}
              <NavLink to="/app/contextos">Gerenciar contextos</NavLink>
            </div>
          </details>
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
              to="/app/contextos"
              aria-label="Contextos"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeUsuario tamanho={19} /> <span>Contextos</span>
            </NavLink>
            <NavLink
              to="/app/convites"
              aria-label="Meus convites"
              className={({ isActive }) => `${estilos.itemNavegacao} ${isActive ? estilos.ativo : ''}`}
            >
              <IconeEmail tamanho={19} /> <span>Convites</span>
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
          <Outlet key={sessao.contextoAtivo.id} />
        </main>
      </div>
    </div>
  )
}
