import { useContext } from 'react'
import { ContextoTema } from './contextoTema'

export function useTema() {
  const contexto = useContext(ContextoTema)
  if (!contexto) throw new Error('useTema deve ser usado dentro de ProvedorTema.')
  return contexto
}
