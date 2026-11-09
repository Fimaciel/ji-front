import { createContext } from 'react'
import type { ContextoAtivo, EntradaLogin, SessaoAutenticada, UsuarioResumo } from '../tipos/autenticacao'

export interface ValorContextoAutenticacao {
  sessao: SessaoAutenticada | null
  carregandoSessao: boolean
  entrar(entrada: EntradaLogin): Promise<SessaoAutenticada>
  sair(): Promise<void>
  criarContexto(nome: string): Promise<ContextoAtivo>
  selecionarContexto(contextoId: string): Promise<void>
  recarregarContextos(): Promise<void>
  atualizarUsuario(usuario: UsuarioResumo): void
  encerrarConta(aposEncerrar?: () => void): Promise<void>
}

export const ContextoAutenticacao = createContext<ValorContextoAutenticacao | null>(null)
