import type { ServicoAutenticacao } from './ServicoAutenticacao'
import type { ServicoConta } from './ServicoConta'
import {
  atualizarUsuarioPersistido,
  lerSessaoAtual,
  limparArmazenamentoJi,
  limparSessao,
  persistirSessao,
} from './armazenamentoSessao'
import { ErroApi } from '../tipos/api'
import {
  ErroAutenticacao,
  type ContextoAtivo,
  type EntradaCadastroUsuario,
  type EntradaLogin,
  type EntradaRedefinicaoSenha,
  type EstadoTokenRedefinicao,
  type ResultadoSolicitacaoRecuperacao,
  type SessaoAutenticada,
  type UsuarioResumo,
} from '../tipos/autenticacao'
import type {
  ConfiguracaoConta,
  ContaUsuario,
  EntradaAtualizacaoConfiguracao,
  EntradaAtualizacaoPerfil,
  TemaUsuario,
} from '../tipos/conta'

interface UsuarioApi {
  id: number
  nome: string
  sobrenome: string
  cpf?: string | null
  dataNascimento?: string | null
  email: string
  dataCriacao: string
}

interface ContextoApi {
  id: number
  nome: string
  tipo: 'PESSOAL' | 'COMPARTILHADO'
  papel: 'ADMINISTRADOR' | 'COLABORADOR' | 'DEPENDENTE'
}

interface AutenticacaoApi {
  tokenAcesso: string
  expiraEm: string
  usuario: UsuarioApi
  contextoAtivoId: number | null
  contextos: ContextoApi[]
}

interface SessaoApi {
  usuario: UsuarioApi
  contextoAtivoId: number | null
  expiraEm: string
}

interface ConfiguracaoApi {
  salarioMensal: number
  moeda: 'BRL'
  notificacoesAtivas: boolean
  tema: TemaUsuario
}

interface ContaApi extends UsuarioApi {
  dataAtualizacao: string
  configuracao: ConfiguracaoApi
}

interface ProblemaApi {
  detail?: string
  codigo?: string
  campos?: Record<string, string>
}

const DURACAO_TOKEN_REDEFINICAO = 30 * 60 * 1000

function usuarioResumo(usuario: UsuarioApi): UsuarioResumo {
  return {
    id: String(usuario.id),
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    nomeCompleto: `${usuario.nome} ${usuario.sobrenome}`.trim(),
    email: usuario.email,
  }
}

function contextoAtivo(contexto: ContextoApi): ContextoAtivo {
  return { ...contexto, id: String(contexto.id) }
}

function mapearConfiguracao(configuracao: ConfiguracaoApi): ConfiguracaoConta {
  return { ...configuracao, salarioMensal: Number(configuracao.salarioMensal) }
}

function mapearConta(conta: ContaApi): ContaUsuario {
  return {
    id: String(conta.id),
    nome: conta.nome,
    sobrenome: conta.sobrenome,
    cpf: conta.cpf ?? undefined,
    dataNascimento: conta.dataNascimento ?? undefined,
    email: conta.email,
    dataCriacao: conta.dataCriacao,
    dataAtualizacao: conta.dataAtualizacao,
    configuracao: mapearConfiguracao(conta.configuracao),
  }
}

export class ServicoRest implements ServicoAutenticacao, ServicoConta {
  private readonly urlBase: string

  constructor(urlBase: string) {
    this.urlBase = urlBase.replace(/\/$/, '')
  }

  async cadastrarUsuario(entrada: EntradaCadastroUsuario) {
    try {
      await this.requisitar('/api/v1/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify({
          nome: entrada.nome,
          sobrenome: entrada.sobrenome,
          cpf: entrada.cpf?.replace(/\D/g, '') || null,
          dataNascimento: entrada.dataNascimento || null,
          email: entrada.email,
          senha: entrada.senha,
        }),
      })
    } catch (erro) {
      throw this.mapearErroAutenticacao(erro)
    }
  }

  async entrar(entrada: EntradaLogin): Promise<SessaoAutenticada> {
    try {
      const resposta = await this.requisitar<AutenticacaoApi>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: entrada.email, senha: entrada.senha }),
      })
      const contexto = resposta.contextos.find(
        (item) => item.id === resposta.contextoAtivoId,
      ) ?? resposta.contextos[0]
      if (!contexto) throw new ErroApi('usuario-sem-contexto', 'A conta não possui contexto ativo.')
      const sessao: SessaoAutenticada = {
        token: resposta.tokenAcesso,
        expiraEm: resposta.expiraEm,
        usuario: usuarioResumo(resposta.usuario),
        contextoAtivo: contextoAtivo(contexto),
      }
      persistirSessao(sessao, entrada.lembrar)
      return sessao
    } catch (erro) {
      throw this.mapearErroAutenticacao(erro)
    }
  }

  async solicitarRecuperacao(email: string): Promise<ResultadoSolicitacaoRecuperacao> {
    await this.requisitar('/api/v1/auth/recuperacao-senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    return { expiraEm: new Date(Date.now() + DURACAO_TOKEN_REDEFINICAO).toISOString() }
  }

  async validarTokenRedefinicao(token: string): Promise<EstadoTokenRedefinicao> {
    const resposta = await this.requisitar<{
      status: 'valido' | 'expirado' | 'utilizado' | 'invalido'
      email?: string
      expiraEm?: string
    }>(`/api/v1/auth/redefinicao-senha/validacao?token=${encodeURIComponent(token)}`)
    if (resposta.status === 'valido' && resposta.email && resposta.expiraEm) {
      return { status: 'valido', email: resposta.email, expiraEm: resposta.expiraEm }
    }
    if (resposta.status === 'expirado') return { status: 'expirado' }
    if (resposta.status === 'utilizado') return { status: 'utilizado' }
    return { status: 'invalido' }
  }

  async redefinirSenha(entrada: EntradaRedefinicaoSenha) {
    try {
      await this.requisitar('/api/v1/auth/redefinicao-senha', {
        method: 'POST',
        body: JSON.stringify({
          token: entrada.token,
          novaSenha: entrada.novaSenha,
          confirmacaoSenha: entrada.novaSenha,
        }),
      })
    } catch (erro) {
      throw this.mapearErroAutenticacao(erro)
    }
  }

  async recuperarSessao(): Promise<SessaoAutenticada | null> {
    const armazenada = lerSessaoAtual()
    if (!armazenada) return null
    try {
      const resposta = await this.requisitar<SessaoApi>('/api/v1/auth/sessao', {}, true)
      const sessao = {
        ...armazenada,
        expiraEm: resposta.expiraEm,
        usuario: usuarioResumo(resposta.usuario),
      }
      const lembrada = localStorage.getItem('ji:sessao:v1') !== null
      persistirSessao(sessao, lembrada)
      return sessao
    } catch {
      limparSessao()
      return null
    }
  }

  async encerrarSessao() {
    try {
      if (lerSessaoAtual()) {
        await this.requisitar('/api/v1/auth/logout', { method: 'POST' }, true)
      }
    } finally {
      limparSessao()
    }
  }

  async obterConta() {
    return mapearConta(await this.requisitar<ContaApi>('/api/v1/usuarios/me', {}, true))
  }

  async atualizarPerfil(entrada: EntradaAtualizacaoPerfil) {
    const conta = mapearConta(await this.requisitar<ContaApi>('/api/v1/usuarios/me/perfil', {
      method: 'PUT',
      body: JSON.stringify({
        ...entrada,
        dataNascimento: entrada.dataNascimento || null,
        novaSenha: entrada.novaSenha || null,
        confirmacaoNovaSenha: entrada.confirmacaoNovaSenha || null,
      }),
    }, true))
    atualizarUsuarioPersistido(usuarioResumo({ ...conta, id: Number(conta.id) }))
    return conta
  }

  async atualizarConfiguracao(entrada: EntradaAtualizacaoConfiguracao) {
    const resposta = await this.requisitar<ConfiguracaoApi>('/api/v1/usuarios/me/configuracao', {
      method: 'PUT',
      body: JSON.stringify(entrada),
    }, true)
    return mapearConfiguracao(resposta)
  }

  async atualizarTema(tema: TemaUsuario) {
    const resposta = await this.requisitar<ConfiguracaoApi>(
      '/api/v1/usuarios/me/configuracao/tema',
      { method: 'PATCH', body: JSON.stringify({ tema }) },
      true,
    )
    return mapearConfiguracao(resposta)
  }

  async restaurarConfiguracao() {
    const resposta = await this.requisitar<ConfiguracaoApi>(
      '/api/v1/usuarios/me/configuracao',
      { method: 'DELETE' },
      true,
    )
    return mapearConfiguracao(resposta)
  }

  async encerrarConta() {
    await this.requisitar('/api/v1/usuarios/me', { method: 'DELETE' }, true)
    limparArmazenamentoJi()
  }

  private async requisitar<T = void>(
    caminho: string,
    opcoes: RequestInit = {},
    autenticado = false,
  ): Promise<T> {
    const headers = new Headers(opcoes.headers)
    if (opcoes.body) headers.set('Content-Type', 'application/json')
    if (autenticado) {
      const sessao = lerSessaoAtual()
      if (!sessao) throw new ErroApi('sessao-invalida', 'Faça login novamente.', {}, 401)
      headers.set('Authorization', `Bearer ${sessao.token}`)
    }

    const resposta = await fetch(`${this.urlBase}${caminho}`, { ...opcoes, headers })
    if (!resposta.ok) {
      const problema = await resposta.json().catch(() => ({})) as ProblemaApi
      throw new ErroApi(
        problema.codigo ?? 'erro-inesperado',
        problema.detail ?? 'Não foi possível concluir a operação.',
        problema.campos ?? {},
        resposta.status,
      )
    }
    if (resposta.status === 204) return undefined as T
    return await resposta.json() as T
  }

  private mapearErroAutenticacao(erro: unknown) {
    if (!(erro instanceof ErroApi)) return erro
    const codigos = {
      'email-em-uso': 'EMAIL_EM_USO',
      'cpf-em-uso': 'CPF_EM_USO',
      'credenciais-invalidas': 'CREDENCIAIS_INVALIDAS',
      'token-redefinicao-invalido': 'TOKEN_INVALIDO',
    } as const
    const codigo = codigos[erro.codigo as keyof typeof codigos]
    return codigo ? new ErroAutenticacao(codigo, erro.message) : erro
  }
}
