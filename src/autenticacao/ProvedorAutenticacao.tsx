import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { servicoAutenticacao, servicoConta, servicoContextos } from '../servicos/instanciaAutenticacao'
import { atualizarSessaoPersistida, atualizarUsuarioPersistido } from '../servicos/armazenamentoSessao'
import type { EntradaLogin, SessaoAutenticada, UsuarioResumo } from '../tipos/autenticacao'
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
    return novaSessao
  }, [])

  const sair = useCallback(async () => {
    await servicoAutenticacao.encerrarSessao()
    definirSessao(null)
  }, [])

  const atualizarUsuario = useCallback((usuario: UsuarioResumo) => {
    atualizarUsuarioPersistido(usuario)
    definirSessao((atual) => atual ? { ...atual, usuario } : atual)
  }, [])

  const criarContexto = useCallback(async (nome: string) => {
    const contexto = await servicoContextos.criarContexto(nome)
    definirSessao((atual) => {
      if (!atual) return atual
      const novaSessao = { ...atual, contextos: [...atual.contextos, contexto] }
      atualizarSessaoPersistida(novaSessao)
      return novaSessao
    })
    return contexto
  }, [])

  const selecionarContexto = useCallback(async (contextoId: string) => {
    const contexto = await servicoContextos.selecionarContexto(contextoId)
    definirSessao((atual) => {
      if (!atual) return atual
      const novaSessao = {
        ...atual,
        contextoAtivo: contexto,
        selecaoContextoNecessaria: false,
      }
      atualizarSessaoPersistida(novaSessao)
      return novaSessao
    })
  }, [])

  const recarregarContextos = useCallback(async () => {
    const contextos = await servicoContextos.listarContextos()
    const contextoMarcadoAtivo = contextos.find((contexto) => contexto.ativo)
    const contextoAtivo = contextoMarcadoAtivo
      ?? (contextos.length === 1 ? await servicoContextos.selecionarContexto(contextos[0].id) : null)
    definirSessao((atual) => {
      if (!atual) return atual
      const novaSessao = {
        ...atual,
        contextos: contextos.map(({ id, nome, tipo, papel }) => ({ id, nome, tipo, papel })),
        contextoAtivo: contextoAtivo
          ? { id: contextoAtivo.id, nome: contextoAtivo.nome, tipo: contextoAtivo.tipo, papel: contextoAtivo.papel }
          : atual.contextoAtivo,
        selecaoContextoNecessaria: !contextoAtivo && contextos.length > 1,
      }
      atualizarSessaoPersistida(novaSessao)
      return novaSessao
    })
  }, [])

  const encerrarConta = useCallback(async (aposEncerrar?: () => void) => {
    await servicoConta.encerrarConta()
    aposEncerrar?.()
    definirSessao(null)
  }, [])

  const valor = useMemo(
    () => ({
      sessao,
      carregandoSessao,
      entrar,
      sair,
      criarContexto,
      selecionarContexto,
      recarregarContextos,
      atualizarUsuario,
      encerrarConta,
    }),
    [
      sessao,
      carregandoSessao,
      entrar,
      sair,
      criarContexto,
      selecionarContexto,
      recarregarContextos,
      atualizarUsuario,
      encerrarConta,
    ],
  )

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>
}
