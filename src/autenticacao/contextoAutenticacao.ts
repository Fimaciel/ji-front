import { createContext } from 'react'
import type { EntradaLogin, SessaoAutenticada } from '../tipos/autenticacao'

export interface ValorContextoAutenticacao {
  sessao: SessaoAutenticada | null
  carregandoSessao: boolean
  entrar(entrada: EntradaLogin): Promise<void>
  sair(): Promise<void>
}

export const ContextoAutenticacao = createContext<ValorContextoAutenticacao | null>(null)
