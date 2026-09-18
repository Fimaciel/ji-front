import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { servicoAutenticacao } from '../servicos/instanciaAutenticacao'
import type { EntradaLogin, SessaoAutenticada } from '../tipos/autenticacao'
import { ContextoAutenticacao } from './contextoAutenticacao'

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [sessao, definirSessao] = useState<SessaoAutenticada | null>(null)
  const [carregandoSessao, definirCarregandoSessao] = useState(true)

  useEffect(() => {
    let ativo = true

    servicoAutenticacao.recuperarSessao().then((sessaoRecuperada) => {
      if (!ativo) return
      definirSessao(sessaoRecuperada)
      definirCarregandoSessao(false)
    })

    return () => {
      ativo = false
    }
  }, [])

  const entrar = useCallback(async (entrada: EntradaLogin) => {
    const novaSessao = await servicoAutenticacao.entrar(entrada)
    definirSessao(novaSessao)
  }, [])

  const sair = useCallback(async () => {
    await servicoAutenticacao.encerrarSessao()
    definirSessao(null)
  }, [])

  const valor = useMemo(
    () => ({ sessao, carregandoSessao, entrar, sair }),
    [sessao, carregandoSessao, entrar, sair],
  )

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>
}
