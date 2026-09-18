import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAutenticacao } from './useAutenticacao'
import estilos from '../telas/Autenticacao.module.css'

function AguardeSessao() {
  return (
    <main className={estilos.paginaAutenticacao} aria-busy="true" aria-label="Carregando sessão">
      <span className={estilos.carregandoPagina} aria-hidden="true" />
    </main>
  )
}

export function RotaProtegida({ children }: { children: ReactNode }) {
  const { sessao, carregandoSessao } = useAutenticacao()
  const localizacao = useLocation()

  if (carregandoSessao) return <AguardeSessao />
  if (!sessao) {
    return <Navigate to="/entrar" replace state={{ de: localizacao.pathname }} />
  }
  return children
}

export function RotaPublica({ children }: { children: ReactNode }) {
  const { sessao, carregandoSessao } = useAutenticacao()
  if (carregandoSessao) return <AguardeSessao />
  if (sessao) return <Navigate to="/app" replace />
  return children
}
