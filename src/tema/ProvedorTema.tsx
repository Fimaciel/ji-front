import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { servicoConta } from '../servicos/instanciaAutenticacao'
import type { TemaUsuario } from '../tipos/conta'
import { ContextoTema } from './contextoTema'
import { aplicarTema, CHAVE_TEMA, obterTemaLocal, persistirTema } from './tema'

export function ProvedorTema({ children }: { children: ReactNode }) {
  const { sessao } = useAutenticacao()
  const [tema, definirTema] = useState<TemaUsuario>(obterTemaLocal)
  const [alterandoTema, definirAlterandoTema] = useState(false)

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const acompanharSistema = () => {
      if (tema === 'AUTOMATICO') aplicarTema('AUTOMATICO')
    }
    acompanharSistema()
    consulta.addEventListener('change', acompanharSistema)
    return () => consulta.removeEventListener('change', acompanharSistema)
  }, [tema])

  useEffect(() => {
    if (!sessao) return
    let ativo = true
    servicoConta.obterConta().then((conta) => {
      if (!ativo) return
      definirTema(conta.configuracao.tema)
      persistirTema(conta.configuracao.tema)
    }).catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [sessao])

  const alterarTema = useCallback(async (novoTema: TemaUsuario) => {
    const temaAnterior = tema
    definirTema(novoTema)
    persistirTema(novoTema)
    definirAlterandoTema(true)
    try {
      const configuracao = await servicoConta.atualizarTema(novoTema)
      definirTema(configuracao.tema)
      persistirTema(configuracao.tema)
    } catch (erro) {
      definirTema(temaAnterior)
      persistirTema(temaAnterior)
      throw erro
    } finally {
      definirAlterandoTema(false)
    }
  }, [tema])

  const restaurarTemaLocal = useCallback(() => {
    definirTema('AUTOMATICO')
    localStorage.removeItem(CHAVE_TEMA)
    aplicarTema('AUTOMATICO')
  }, [])

  const valor = useMemo(
    () => ({ tema, alterandoTema, alterarTema, restaurarTemaLocal }),
    [tema, alterandoTema, alterarTema, restaurarTemaLocal],
  )

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}
