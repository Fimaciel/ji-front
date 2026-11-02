import { createContext } from 'react'
import type { EntradaLogin, SessaoAutenticada, UsuarioResumo } from '../tipos/autenticacao'

export interface ValorContextoAutenticacao {
  sessao: SessaoAutenticada | null
  carregandoSessao: boolean
  entrar(entrada: EntradaLogin): Promise<void>
  sair(): Promise<void>
  atualizarUsuario(usuario: UsuarioResumo): void
  encerrarConta(aposEncerrar?: () => void): Promise<void>
}

export const ContextoAutenticacao = createContext<ValorContextoAutenticacao | null>(null)
