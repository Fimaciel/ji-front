import { createContext } from 'react'
import type { TemaUsuario } from '../tipos/conta'

export interface ValorContextoTema {
  tema: TemaUsuario
  alterandoTema: boolean
  alterarTema(tema: TemaUsuario): Promise<void>
  restaurarTemaLocal(): void
}

export const ContextoTema = createContext<ValorContextoTema | null>(null)
