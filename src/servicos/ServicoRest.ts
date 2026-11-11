import type { ServicoAutenticacao } from './ServicoAutenticacao'
import type { ServicoConta } from './ServicoConta'
import type { ServicoFinanceiro } from './ServicoFinanceiro'
import type { ServicoContextos } from './ServicoContextos'
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
  type ContextoGerenciamento,
  type ConviteContexto,
  type ConviteEnviado,
  type Dependente,
  type EntradaDependente,
  type PapelContexto,
  type ParticipanteContexto,
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
import type {
  AnaliseImportacao,
  ArquivoDownload,
  Categoria,
  CategoriaDashboard,
  DashboardResumo,
  EntradaConfirmacaoImportacao,
  EntradaOrcamento,
  EntradaTransacao,
  FiltrosRelatorio,
  FiltrosTransacao,
  FormatoImportacao,
  FormatoRelatorio,
  FluxoDiario,
  ImportacaoArquivo,
  Orcamento,
  PaginaTransacoes,
  RelatorioResumo,
  ResumoOrcamentos,
  SituacaoOrcamento,
  Transacao,
  TipoCategoria,
  TipoTransacao,
} from '../tipos/financeiro'

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
  selecaoContextoNecessaria: boolean
  contextos: ContextoApi[]
}

interface SessaoApi {
  usuario: UsuarioApi
  contextoAtivoId: number | null
  expiraEm: string
  selecaoContextoNecessaria: boolean
  contextos: ContextoApi[]
}

interface ContextoGerenciamentoApi extends ContextoApi {
  quantidadeParticipantes: number
  ativo: boolean
}

interface ConviteContextoApi {
  id: number
  contextoId: number
  contextoNome: string
  convidadoPor: string
  papelProposto: ContextoAtivo['papel']
  status: ConviteContexto['status']
  dataCriacao: string
  dataExpiracao: string
  dataResposta?: string | null
}

interface ConviteEnviadoApi {
  id: number
  emailConvidado: string
  papelProposto: PapelContexto
  status: ConviteEnviado['status']
  dependenteId?: number | null
  dataCriacao: string
  dataExpiracao: string
  dataResposta?: string | null
}

interface ParticipanteContextoApi {
  id: number
  usuarioId: number
  nome: string
  email: string
  papel: PapelContexto
  dataIngresso: string
  dataSaida?: string | null
  ativo: boolean
}

interface DependenteApi {
  id: number
  nome: string
  dataNascimento: string
  tipo: Dependente['tipo']
  participanteId?: number | null
  usuarioVinculado?: string | null
  dataCriacao: string
  dataAtualizacao: string
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

interface CategoriaApi {
  id: number
  nome: string
  tipo: TipoCategoria
}

interface TransacaoApi {
  id: number
  tipo: TipoTransacao
  valor: number
  data: string
  descricao: string
  categoria: CategoriaApi
  dataCriacao: string
  dataAtualizacao: string
}

interface PaginaTransacoesApi {
  itens: TransacaoApi[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
}

interface OrcamentoApi {
  id: number
  categoria: CategoriaApi
  valorLimite: number
  valorConsumido: number
  percentualConsumido: number
  situacao: SituacaoOrcamento
  mesReferencia: string
}

interface ResumoOrcamentosApi {
  mesReferencia: string
  totalLimite: number
  totalConsumido: number
  percentualConsumido: number
  itens: OrcamentoApi[]
}

interface FluxoDiarioApi extends Omit<FluxoDiario, 'entradas' | 'saidas' | 'saldoAcumulado'> {
  entradas: number
  saidas: number
  saldoAcumulado: number
}

interface CategoriaDashboardApi extends Omit<CategoriaDashboard, 'categoriaId'> {
  categoriaId: number
}

interface DashboardApi {
  mesReferencia: string
  totalEntradas: number
  totalSaidas: number
  saldo: number
  fluxoDiario: FluxoDiarioApi[]
  principaisCategorias: CategoriaDashboardApi[]
  transacoesRecentes: TransacaoApi[]
  geradoEm: string
}

interface RegistroImportacaoApi {
  linha: number
  data: string
  descricao: string
  valor: number
  tipo: TipoTransacao
  categoriaSugerida: CategoriaApi
  duplicado: boolean
}

interface AnaliseImportacaoApi {
  nomeArquivo: string
  formato: FormatoImportacao
  totalLidos: number
  totalNovos: number
  totalDuplicados: number
  registros: RegistroImportacaoApi[]
}

interface ImportacaoApi {
  id: number
  nomeArquivo: string
  formato: FormatoImportacao
  status: ImportacaoArquivo['status']
  totalLidos: number
  totalImportados: number
  totalDuplicados: number
  executadoPor: string
  dataCriacao: string
  dataDesfeita?: string | null
}

interface RelatorioResumoApi extends Omit<RelatorioResumo,
  'tipo' | 'totalEntradas' | 'totalSaidas' | 'saldo' | 'fluxoMensal' | 'categorias' | 'transacoes'> {
  tipo?: TipoTransacao | null
  totalEntradas: number
  totalSaidas: number
  saldo: number
  fluxoMensal: Array<{ mes: string; entradas: number; saidas: number }>
  categorias: Array<{ categoria: string; quantidade: number; total: number; media: number }>
  transacoes: Array<{
    id: number
    contexto: string
    data: string
    descricao: string
    categoria: string
    tipo: TipoTransacao
    valor: number
  }>
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

function mapearConvite(convite: ConviteContextoApi): ConviteContexto {
  return {
    ...convite,
    id: String(convite.id),
    contextoId: String(convite.contextoId),
    dataResposta: convite.dataResposta ?? undefined,
  }
}

function mapearConviteEnviado(convite: ConviteEnviadoApi): ConviteEnviado {
  return {
    ...convite,
    id: String(convite.id),
    dependenteId: convite.dependenteId == null ? undefined : String(convite.dependenteId),
    dataResposta: convite.dataResposta ?? undefined,
  }
}

function mapearParticipante(participante: ParticipanteContextoApi): ParticipanteContexto {
  return {
    ...participante,
    id: String(participante.id),
    usuarioId: String(participante.usuarioId),
    dataSaida: participante.dataSaida ?? undefined,
  }
}

function mapearDependente(dependente: DependenteApi): Dependente {
  return {
    ...dependente,
    id: String(dependente.id),
    participanteId: dependente.participanteId == null ? undefined : String(dependente.participanteId),
    usuarioVinculado: dependente.usuarioVinculado ?? undefined,
  }
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

function mapearCategoria(categoria: CategoriaApi): Categoria {
  return { ...categoria, id: String(categoria.id) }
}

function mapearTransacao(transacao: TransacaoApi): Transacao {
  return {
    ...transacao,
    id: String(transacao.id),
    valor: Number(transacao.valor),
    categoria: mapearCategoria(transacao.categoria),
  }
}

function mapearOrcamento(orcamento: OrcamentoApi): Orcamento {
  return {
    ...orcamento,
    id: String(orcamento.id),
    categoria: mapearCategoria(orcamento.categoria),
    valorLimite: Number(orcamento.valorLimite),
    valorConsumido: Number(orcamento.valorConsumido),
    percentualConsumido: Number(orcamento.percentualConsumido),
  }
}

function mapearImportacao(importacao: ImportacaoApi): ImportacaoArquivo {
  return {
    ...importacao,
    id: String(importacao.id),
    dataDesfeita: importacao.dataDesfeita ?? undefined,
  }
}

function parametrosRelatorio(filtros: FiltrosRelatorio) {
  const parametros = new URLSearchParams({
    dataInicial: filtros.dataInicial,
    dataFinal: filtros.dataFinal,
  })
  if (filtros.tipo) parametros.set('tipo', filtros.tipo)
  if (filtros.categoriaId) parametros.set('categoriaId', filtros.categoriaId)
  filtros.contextoIds?.forEach((id) => parametros.append('contextoIds', id))
  return parametros
}

export class ServicoRest implements ServicoAutenticacao, ServicoConta, ServicoFinanceiro, ServicoContextos {
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
        contextos: resposta.contextos.map(contextoAtivo),
        selecaoContextoNecessaria: resposta.selecaoContextoNecessaria,
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
        contextoAtivo: contextoAtivo(
          resposta.contextos.find((item) => item.id === resposta.contextoAtivoId)
            ?? resposta.contextos[0],
        ),
        contextos: resposta.contextos.map(contextoAtivo),
        selecaoContextoNecessaria: resposta.selecaoContextoNecessaria,
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

  async listarContextos(): Promise<ContextoGerenciamento[]> {
    const contextos = await this.requisitar<ContextoGerenciamentoApi[]>('/api/v1/contextos', {}, true)
    return contextos.map((contexto) => ({ ...contexto, id: String(contexto.id) }))
  }

  async criarContexto(nome: string): Promise<ContextoGerenciamento> {
    const contexto = await this.requisitar<ContextoGerenciamentoApi>('/api/v1/contextos', {
      method: 'POST',
      body: JSON.stringify({ nome }),
    }, true)
    return { ...contexto, id: String(contexto.id) }
  }

  async selecionarContexto(contextoId: string): Promise<ContextoAtivo> {
    const contexto = await this.requisitar<ContextoApi>('/api/v1/contextos/ativo', {
      method: 'PUT',
      body: JSON.stringify({ contextoId: Number(contextoId) }),
    }, true)
    return contextoAtivo(contexto)
  }

  async listarConvites(): Promise<ConviteContexto[]> {
    const convites = await this.requisitar<ConviteContextoApi[]>('/api/v1/convites', {}, true)
    return convites.map(mapearConvite)
  }

  async detalharConvite(token: string): Promise<ConviteContexto> {
    const convite = await this.requisitar<ConviteContextoApi>(
      `/api/v1/convites/token/${encodeURIComponent(token)}`,
    )
    return mapearConvite(convite)
  }

  async aceitarConvite(conviteId: string): Promise<ConviteContexto> {
    return mapearConvite(await this.requisitar<ConviteContextoApi>(
      `/api/v1/convites/${encodeURIComponent(conviteId)}/aceite`,
      { method: 'POST' },
      true,
    ))
  }

  async recusarConvite(conviteId: string): Promise<ConviteContexto> {
    return mapearConvite(await this.requisitar<ConviteContextoApi>(
      `/api/v1/convites/${encodeURIComponent(conviteId)}/recusa`,
      { method: 'POST' },
      true,
    ))
  }

  async listarConvitesEnviados(): Promise<ConviteEnviado[]> {
    const convites = await this.requisitar<ConviteEnviadoApi[]>(
      '/api/v1/contextos/ativo/convites', {}, true,
    )
    return convites.map(mapearConviteEnviado)
  }

  async convidarColaborador(email: string): Promise<ConviteEnviado> {
    return mapearConviteEnviado(await this.requisitar<ConviteEnviadoApi>(
      '/api/v1/contextos/ativo/convites',
      { method: 'POST', body: JSON.stringify({ email }) },
      true,
    ))
  }

  async reenviarConvite(conviteId: string): Promise<ConviteEnviado> {
    return mapearConviteEnviado(await this.requisitar<ConviteEnviadoApi>(
      `/api/v1/contextos/ativo/convites/${encodeURIComponent(conviteId)}/reenvio`,
      { method: 'POST' },
      true,
    ))
  }

  async cancelarConvite(conviteId: string): Promise<void> {
    await this.requisitar(
      `/api/v1/contextos/ativo/convites/${encodeURIComponent(conviteId)}`,
      { method: 'DELETE' },
      true,
    )
  }

  async listarParticipantes(): Promise<ParticipanteContexto[]> {
    const participantes = await this.requisitar<ParticipanteContextoApi[]>(
      '/api/v1/contextos/ativo/participantes', {}, true,
    )
    return participantes.map(mapearParticipante)
  }

  async alterarPapelParticipante(participanteId: string, papel: PapelContexto) {
    return mapearParticipante(await this.requisitar<ParticipanteContextoApi>(
      `/api/v1/contextos/ativo/participantes/${encodeURIComponent(participanteId)}/papel`,
      { method: 'PATCH', body: JSON.stringify({ papel }) },
      true,
    ))
  }

  async removerParticipante(participanteId: string): Promise<void> {
    await this.requisitar(
      `/api/v1/contextos/ativo/participantes/${encodeURIComponent(participanteId)}`,
      { method: 'DELETE' },
      true,
    )
  }

  async sairDoContexto(): Promise<void> {
    await this.requisitar('/api/v1/contextos/ativo/participantes/me', { method: 'DELETE' }, true)
  }

  async listarDependentes(): Promise<Dependente[]> {
    const dependentes = await this.requisitar<DependenteApi[]>('/api/v1/dependentes', {}, true)
    return dependentes.map(mapearDependente)
  }

  async criarDependente(entrada: EntradaDependente): Promise<Dependente> {
    return mapearDependente(await this.requisitar<DependenteApi>('/api/v1/dependentes', {
      method: 'POST', body: JSON.stringify(entrada),
    }, true))
  }

  async atualizarDependente(dependenteId: string, entrada: EntradaDependente): Promise<Dependente> {
    return mapearDependente(await this.requisitar<DependenteApi>(
      `/api/v1/dependentes/${encodeURIComponent(dependenteId)}`,
      { method: 'PUT', body: JSON.stringify(entrada) },
      true,
    ))
  }

  async excluirDependente(dependenteId: string): Promise<void> {
    await this.requisitar(
      `/api/v1/dependentes/${encodeURIComponent(dependenteId)}`,
      { method: 'DELETE' },
      true,
    )
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

  async listarCategorias() {
    const categorias = await this.requisitar<CategoriaApi[]>('/api/v1/categorias', {}, true)
    return categorias.map(mapearCategoria)
  }

  async criarCategoria(nome: string) {
    const categoria = await this.requisitar<CategoriaApi>('/api/v1/categorias', {
      method: 'POST',
      body: JSON.stringify({ nome }),
    }, true)
    return mapearCategoria(categoria)
  }

  async editarCategoria(categoriaId: string, nome: string) {
    const categoria = await this.requisitar<CategoriaApi>(
      `/api/v1/categorias/${encodeURIComponent(categoriaId)}`,
      { method: 'PUT', body: JSON.stringify({ nome }) },
      true,
    )
    return mapearCategoria(categoria)
  }

  async excluirCategoria(categoriaId: string) {
    await this.requisitar(
      `/api/v1/categorias/${encodeURIComponent(categoriaId)}`,
      { method: 'DELETE' },
      true,
    )
  }

  async listarTransacoes(filtros: FiltrosTransacao = {}): Promise<PaginaTransacoes> {
    const parametros = new URLSearchParams()
    parametros.set('pagina', String(filtros.pagina ?? 0))
    if (filtros.dataInicial) parametros.set('dataInicial', filtros.dataInicial)
    if (filtros.dataFinal) parametros.set('dataFinal', filtros.dataFinal)
    if (filtros.tipo) parametros.set('tipo', filtros.tipo)
    if (filtros.categoriaId) parametros.set('categoriaId', filtros.categoriaId)
    if (filtros.busca?.trim()) parametros.set('busca', filtros.busca.trim())
    const pagina = await this.requisitar<PaginaTransacoesApi>(
      `/api/v1/transacoes?${parametros.toString()}`,
      {},
      true,
    )
    return { ...pagina, itens: pagina.itens.map(mapearTransacao) }
  }

  async criarTransacao(entrada: EntradaTransacao) {
    const transacao = await this.requisitar<TransacaoApi>('/api/v1/transacoes', {
      method: 'POST',
      body: JSON.stringify({ ...entrada, categoriaId: Number(entrada.categoriaId) }),
    }, true)
    return mapearTransacao(transacao)
  }

  async editarTransacao(transacaoId: string, entrada: EntradaTransacao) {
    const transacao = await this.requisitar<TransacaoApi>(
      `/api/v1/transacoes/${encodeURIComponent(transacaoId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...entrada, categoriaId: Number(entrada.categoriaId) }),
      },
      true,
    )
    return mapearTransacao(transacao)
  }

  async excluirTransacao(transacaoId: string) {
    await this.requisitar(
      `/api/v1/transacoes/${encodeURIComponent(transacaoId)}`,
      { method: 'DELETE' },
      true,
    )
  }

  async obterDashboard(mes?: string): Promise<DashboardResumo> {
    const parametros = mes ? `?mes=${encodeURIComponent(mes)}` : ''
    const dashboard = await this.requisitar<DashboardApi>(
      `/api/v1/dashboard${parametros}`,
      {},
      true,
    )
    return {
      ...dashboard,
      totalEntradas: Number(dashboard.totalEntradas),
      totalSaidas: Number(dashboard.totalSaidas),
      saldo: Number(dashboard.saldo),
      fluxoDiario: dashboard.fluxoDiario.map((dia) => ({
        ...dia,
        entradas: Number(dia.entradas),
        saidas: Number(dia.saidas),
        saldoAcumulado: Number(dia.saldoAcumulado),
      })),
      principaisCategorias: dashboard.principaisCategorias.map((categoria) => ({
        ...categoria,
        categoriaId: String(categoria.categoriaId),
        total: Number(categoria.total),
        percentual: Number(categoria.percentual),
      })),
      transacoesRecentes: dashboard.transacoesRecentes.map(mapearTransacao),
    }
  }

  async listarOrcamentos(mes?: string): Promise<ResumoOrcamentos> {
    const parametros = mes ? `?mes=${encodeURIComponent(mes)}` : ''
    const resumo = await this.requisitar<ResumoOrcamentosApi>(
      `/api/v1/orcamentos${parametros}`,
      {},
      true,
    )
    return {
      ...resumo,
      totalLimite: Number(resumo.totalLimite),
      totalConsumido: Number(resumo.totalConsumido),
      percentualConsumido: Number(resumo.percentualConsumido),
      itens: resumo.itens.map(mapearOrcamento),
    }
  }

  async criarOrcamento(entrada: EntradaOrcamento) {
    const orcamento = await this.requisitar<OrcamentoApi>('/api/v1/orcamentos', {
      method: 'POST',
      body: JSON.stringify({ ...entrada, categoriaId: Number(entrada.categoriaId) }),
    }, true)
    return mapearOrcamento(orcamento)
  }

  async editarOrcamento(orcamentoId: string, entrada: EntradaOrcamento) {
    const orcamento = await this.requisitar<OrcamentoApi>(
      `/api/v1/orcamentos/${encodeURIComponent(orcamentoId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...entrada, categoriaId: Number(entrada.categoriaId) }),
      },
      true,
    )
    return mapearOrcamento(orcamento)
  }

  async excluirOrcamento(orcamentoId: string) {
    await this.requisitar(
      `/api/v1/orcamentos/${encodeURIComponent(orcamentoId)}`,
      { method: 'DELETE' },
      true,
    )
  }

  async analisarImportacao(arquivo: File): Promise<AnaliseImportacao> {
    const formulario = new FormData()
    formulario.append('arquivo', arquivo)
    const analise = await this.requisitar<AnaliseImportacaoApi>(
      '/api/v1/importacoes/analise',
      { method: 'POST', body: formulario },
      true,
    )
    return {
      ...analise,
      registros: analise.registros.map((registro) => ({
        ...registro,
        valor: Number(registro.valor),
        categoriaSugerida: mapearCategoria(registro.categoriaSugerida),
      })),
    }
  }

  async confirmarImportacao(entrada: EntradaConfirmacaoImportacao): Promise<ImportacaoArquivo> {
    const importacao = await this.requisitar<ImportacaoApi>('/api/v1/importacoes', {
      method: 'POST',
      body: JSON.stringify({
        ...entrada,
        registros: entrada.registros.map((registro) => ({
          ...registro,
          categoriaId: Number(registro.categoriaId),
        })),
      }),
    }, true)
    return mapearImportacao(importacao)
  }

  async listarImportacoes(): Promise<ImportacaoArquivo[]> {
    const importacoes = await this.requisitar<ImportacaoApi[]>('/api/v1/importacoes', {}, true)
    return importacoes.map(mapearImportacao)
  }

  async desfazerUltimaImportacao(): Promise<ImportacaoArquivo> {
    return mapearImportacao(await this.requisitar<ImportacaoApi>(
      '/api/v1/importacoes/ultima', { method: 'DELETE' }, true,
    ))
  }

  async obterRelatorio(filtros: FiltrosRelatorio): Promise<RelatorioResumo> {
    const resumo = await this.requisitar<RelatorioResumoApi>(
      `/api/v1/relatorios/resumo?${parametrosRelatorio(filtros)}`,
      {}, true,
    )
    return {
      ...resumo,
      tipo: resumo.tipo ?? undefined,
      totalEntradas: Number(resumo.totalEntradas),
      totalSaidas: Number(resumo.totalSaidas),
      saldo: Number(resumo.saldo),
      fluxoMensal: resumo.fluxoMensal.map((item) => ({
        ...item, entradas: Number(item.entradas), saidas: Number(item.saidas),
      })),
      categorias: resumo.categorias.map((item) => ({
        ...item, total: Number(item.total), media: Number(item.media),
      })),
      transacoes: resumo.transacoes.map((item) => ({
        ...item, id: String(item.id), valor: Number(item.valor),
      })),
    }
  }

  async exportarRelatorio(
    filtros: FiltrosRelatorio,
    formato: FormatoRelatorio,
  ): Promise<ArquivoDownload> {
    const parametros = parametrosRelatorio(filtros)
    parametros.set('formato', formato)
    const resposta = await this.buscarAutenticado(`/api/v1/relatorios/exportacao?${parametros}`)
    const disposicao = resposta.headers.get('Content-Disposition') ?? ''
    const utf8 = disposicao.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    const simples = disposicao.match(/filename="?([^";]+)"?/i)?.[1]
    return {
      conteudo: await resposta.blob(),
      nome: decodeURIComponent(utf8 ?? simples ?? `relatorio-ji.${formato.toLowerCase()}`),
    }
  }

  private async requisitar<T = void>(
    caminho: string,
    opcoes: RequestInit = {},
    autenticado = false,
  ): Promise<T> {
    const headers = new Headers(opcoes.headers)
    if (opcoes.body && !(opcoes.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
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

  private async buscarAutenticado(caminho: string): Promise<Response> {
    const sessao = lerSessaoAtual()
    if (!sessao) throw new ErroApi('sessao-invalida', 'Faça login novamente.', {}, 401)
    const resposta = await fetch(`${this.urlBase}${caminho}`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
    })
    if (!resposta.ok) {
      const problema = await resposta.json().catch(() => ({})) as ProblemaApi
      throw new ErroApi(
        problema.codigo ?? 'erro-inesperado',
        problema.detail ?? 'Não foi possível concluir a operação.',
        problema.campos ?? {},
        resposta.status,
      )
    }
    return resposta
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
