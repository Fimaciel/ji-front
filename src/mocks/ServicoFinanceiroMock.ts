import type { ServicoFinanceiro } from '../servicos/ServicoFinanceiro'
import { dataLocalIso } from '../servicos/dataLocal'
import { ErroApi } from '../tipos/api'
import type {
  Categoria,
  DashboardResumo,
  EntradaOrcamento,
  EntradaTransacao,
  FiltrosTransacao,
  Orcamento,
  PaginaTransacoes,
  ResumoOrcamentos,
  Transacao,
} from '../tipos/financeiro'

const TAMANHO_PAGINA = 20

const categoriasPadrao: Categoria[] = [
  { id: '1', nome: 'Alimentação', tipo: 'PADRAO' },
  { id: '2', nome: 'Transporte', tipo: 'PADRAO' },
  { id: '3', nome: 'Saúde', tipo: 'PADRAO' },
  { id: '4', nome: 'Lazer', tipo: 'PADRAO' },
  { id: '5', nome: 'Salário', tipo: 'PADRAO' },
]

let categorias: Categoria[] = []
let transacoes: Transacao[] = []
type OrcamentoArmazenado = EntradaOrcamento & { id: string; categoria: Categoria }
let orcamentos: OrcamentoArmazenado[] = []
let proximoIdCategoria = 7
let proximoIdTransacao = 3
let proximoIdOrcamento = 3

function dataLocal(diasAtras = 0) {
  const data = new Date()
  data.setDate(data.getDate() - diasAtras)
  return dataLocalIso(data)
}

function mesAtual() {
  return dataLocal().slice(0, 7)
}

function criarDadosIniciais() {
  const mercado: Categoria = { id: '6', nome: 'Mercado', tipo: 'PERSONALIZADA' }
  categorias = [...categoriasPadrao.map((categoria) => ({ ...categoria })), mercado]
  const agora = new Date().toISOString()
  transacoes = [
    {
      id: '1', tipo: 'SAIDA', valor: 184.5, data: dataLocal(),
      descricao: 'Supermercado Pão & Cia', categoria: { ...mercado },
      dataCriacao: agora, dataAtualizacao: agora,
    },
    {
      id: '2', tipo: 'ENTRADA', valor: 3500, data: dataLocal(2),
      descricao: 'Salário mensal', categoria: { ...categoriasPadrao[4] },
      dataCriacao: agora, dataAtualizacao: agora,
    },
  ]
  orcamentos = [
    {
      id: '1', categoriaId: mercado.id, categoria: { ...mercado },
      valorLimite: 220, mesReferencia: mesAtual(),
    },
    {
      id: '2', categoriaId: categoriasPadrao[3].id,
      categoria: { ...categoriasPadrao[3] }, valorLimite: 300,
      mesReferencia: mesAtual(),
    },
  ]
  proximoIdCategoria = 7
  proximoIdTransacao = 3
  proximoIdOrcamento = 3
}

criarDadosIniciais()

function aguardarLatencia() {
  const atraso = import.meta.env.MODE === 'test' ? 0 : 120
  return new Promise<void>((resolver) => window.setTimeout(resolver, atraso))
}

function nomeNormalizado(nome: string) {
  return nome.trim().replace(/\s+/g, ' ')
}

function categoriaDisponivel(categoriaId: string) {
  return categorias.find((categoria) => categoria.id === categoriaId)
}

function validarEntrada(entrada: EntradaTransacao) {
  const categoria = categoriaDisponivel(entrada.categoriaId)
  if (!categoria) {
    throw new ErroApi('categoria-indisponivel', 'A categoria não está disponível.')
  }
  if (!Number.isFinite(entrada.valor) || entrada.valor <= 0) {
    throw new ErroApi('dados-invalidos', 'O valor deve ser maior que zero.')
  }
  if (!entrada.descricao.trim()) {
    throw new ErroApi('dados-invalidos', 'Informe a descrição.')
  }
  if (entrada.data > dataLocal()) {
    throw new ErroApi('data-futura', 'A data não pode ser futura.')
  }
  return categoria
}

function validarMes(mes: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new ErroApi('mes-referencia-invalido', 'Informe o mês no formato AAAA-MM.')
  }
}

function materializarOrcamento(item: OrcamentoArmazenado): Orcamento {
  const valorConsumido = transacoes
    .filter((transacao) => transacao.tipo === 'SAIDA'
      && transacao.categoria.id === item.categoriaId
      && transacao.data.startsWith(item.mesReferencia))
    .reduce((total, transacao) => total + transacao.valor, 0)
  const percentualConsumido = Number(((valorConsumido / item.valorLimite) * 100).toFixed(2))
  return {
    ...item,
    categoria: { ...item.categoria },
    valorConsumido,
    percentualConsumido,
    situacao: percentualConsumido >= 100
      ? 'EXCEDIDO'
      : percentualConsumido >= 80 ? 'ATENCAO' : 'NORMAL',
  }
}

export class ServicoFinanceiroMock implements ServicoFinanceiro {
  async listarCategorias() {
    await aguardarLatencia()
    return categorias.map((categoria) => ({ ...categoria }))
  }

  async criarCategoria(nomeInformado: string) {
    await aguardarLatencia()
    const nome = nomeNormalizado(nomeInformado)
    this.validarNomeCategoria(nome)
    const categoria: Categoria = {
      id: String(proximoIdCategoria++),
      nome,
      tipo: 'PERSONALIZADA',
    }
    categorias.push(categoria)
    return { ...categoria }
  }

  async editarCategoria(categoriaId: string, nomeInformado: string) {
    await aguardarLatencia()
    const categoria = categorias.find((item) => item.id === categoriaId)
    if (!categoria || categoria.tipo === 'PADRAO') {
      throw new ErroApi('categoria-nao-encontrada', 'A categoria personalizada não foi encontrada.', {}, 404)
    }
    const nome = nomeNormalizado(nomeInformado)
    this.validarNomeCategoria(nome, categoriaId)
    categoria.nome = nome
    transacoes = transacoes.map((transacao) => transacao.categoria.id === categoriaId
      ? { ...transacao, categoria: { ...categoria } }
      : transacao)
    return { ...categoria }
  }

  async excluirCategoria(categoriaId: string) {
    await aguardarLatencia()
    const categoria = categorias.find((item) => item.id === categoriaId)
    if (!categoria || categoria.tipo === 'PADRAO') {
      throw new ErroApi('categoria-nao-encontrada', 'A categoria personalizada não foi encontrada.', {}, 404)
    }
    categorias = categorias.filter((item) => item.id !== categoriaId)
  }

  async listarTransacoes(filtros: FiltrosTransacao = {}): Promise<PaginaTransacoes> {
    await aguardarLatencia()
    const busca = filtros.busca?.trim().toLocaleLowerCase('pt-BR')
    const filtradas = transacoes
      .filter((transacao) => !filtros.dataInicial || transacao.data >= filtros.dataInicial)
      .filter((transacao) => !filtros.dataFinal || transacao.data <= filtros.dataFinal)
      .filter((transacao) => !filtros.tipo || transacao.tipo === filtros.tipo)
      .filter((transacao) => !filtros.categoriaId || transacao.categoria.id === filtros.categoriaId)
      .filter((transacao) => !busca
        || transacao.descricao.toLocaleLowerCase('pt-BR').includes(busca)
        || transacao.categoria.nome.toLocaleLowerCase('pt-BR').includes(busca))
      .sort((a, b) => b.data.localeCompare(a.data) || Number(b.id) - Number(a.id))
    const pagina = filtros.pagina ?? 0
    const inicio = pagina * TAMANHO_PAGINA
    return {
      itens: filtradas.slice(inicio, inicio + TAMANHO_PAGINA).map((item) => ({
        ...item,
        categoria: { ...item.categoria },
      })),
      pagina,
      tamanho: TAMANHO_PAGINA,
      totalItens: filtradas.length,
      totalPaginas: Math.ceil(filtradas.length / TAMANHO_PAGINA),
    }
  }

  async criarTransacao(entrada: EntradaTransacao) {
    await aguardarLatencia()
    const categoria = validarEntrada(entrada)
    const agora = new Date().toISOString()
    const transacao: Transacao = {
      id: String(proximoIdTransacao++),
      ...entrada,
      descricao: nomeNormalizado(entrada.descricao),
      categoria: { ...categoria },
      dataCriacao: agora,
      dataAtualizacao: agora,
    }
    transacoes.push(transacao)
    return { ...transacao, categoria: { ...transacao.categoria } }
  }

  async editarTransacao(transacaoId: string, entrada: EntradaTransacao) {
    await aguardarLatencia()
    const indice = transacoes.findIndex((transacao) => transacao.id === transacaoId)
    if (indice < 0) {
      throw new ErroApi('transacao-nao-encontrada', 'A transação não foi encontrada.', {}, 404)
    }
    const categoria = validarEntrada(entrada)
    transacoes[indice] = {
      ...transacoes[indice],
      ...entrada,
      descricao: nomeNormalizado(entrada.descricao),
      categoria: { ...categoria },
      dataAtualizacao: new Date().toISOString(),
    }
    return { ...transacoes[indice], categoria: { ...categoria } }
  }

  async excluirTransacao(transacaoId: string) {
    await aguardarLatencia()
    if (!transacoes.some((transacao) => transacao.id === transacaoId)) {
      throw new ErroApi('transacao-nao-encontrada', 'A transação não foi encontrada.', {}, 404)
    }
    transacoes = transacoes.filter((transacao) => transacao.id !== transacaoId)
  }

  async obterDashboard(mes = mesAtual()): Promise<DashboardResumo> {
    await aguardarLatencia()
    validarMes(mes)
    const movimentacoes = transacoes
      .filter((transacao) => transacao.data.startsWith(mes))
      .sort((a, b) => a.data.localeCompare(b.data) || Number(a.id) - Number(b.id))
    const totalEntradas = movimentacoes
      .filter((transacao) => transacao.tipo === 'ENTRADA')
      .reduce((total, transacao) => total + transacao.valor, 0)
    const totalSaidas = movimentacoes
      .filter((transacao) => transacao.tipo === 'SAIDA')
      .reduce((total, transacao) => total + transacao.valor, 0)

    const porDia = new Map<string, { entradas: number; saidas: number }>()
    const porCategoria = new Map<string, { nome: string; total: number }>()
    for (const transacao of movimentacoes) {
      const dia = porDia.get(transacao.data) ?? { entradas: 0, saidas: 0 }
      if (transacao.tipo === 'ENTRADA') dia.entradas += transacao.valor
      else {
        dia.saidas += transacao.valor
        const categoria = porCategoria.get(transacao.categoria.id) ?? {
          nome: transacao.categoria.nome, total: 0,
        }
        categoria.total += transacao.valor
        porCategoria.set(transacao.categoria.id, categoria)
      }
      porDia.set(transacao.data, dia)
    }
    let saldoAcumulado = 0
    const fluxoDiario = [...porDia.entries()].map(([data, valores]) => {
      saldoAcumulado += valores.entradas - valores.saidas
      return { data, ...valores, saldoAcumulado }
    })
    const principaisCategorias = [...porCategoria.entries()]
      .map(([categoriaId, dados]) => ({
        categoriaId,
        categoriaNome: dados.nome,
        total: dados.total,
        percentual: totalSaidas === 0
          ? 0
          : Number(((dados.total / totalSaidas) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return {
      mesReferencia: mes,
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      fluxoDiario,
      principaisCategorias,
      transacoesRecentes: [...movimentacoes]
        .sort((a, b) => b.data.localeCompare(a.data) || Number(b.id) - Number(a.id))
        .slice(0, 5)
        .map((transacao) => ({ ...transacao, categoria: { ...transacao.categoria } })),
      geradoEm: new Date().toISOString(),
    }
  }

  async listarOrcamentos(mes = mesAtual()): Promise<ResumoOrcamentos> {
    await aguardarLatencia()
    validarMes(mes)
    const itens = orcamentos
      .filter((orcamento) => orcamento.mesReferencia === mes)
      .map(materializarOrcamento)
      .sort((a, b) => a.categoria.nome.localeCompare(b.categoria.nome, 'pt-BR'))
    const totalLimite = itens.reduce((total, item) => total + item.valorLimite, 0)
    const totalConsumido = itens.reduce((total, item) => total + item.valorConsumido, 0)
    return {
      mesReferencia: mes,
      totalLimite,
      totalConsumido,
      percentualConsumido: totalLimite === 0
        ? 0
        : Number(((totalConsumido / totalLimite) * 100).toFixed(2)),
      itens,
    }
  }

  async criarOrcamento(entrada: EntradaOrcamento) {
    await aguardarLatencia()
    this.validarOrcamento(entrada)
    const categoria = categoriaDisponivel(entrada.categoriaId)!
    const orcamento: OrcamentoArmazenado = {
      id: String(proximoIdOrcamento++),
      ...entrada,
      categoria: { ...categoria },
    }
    orcamentos.push(orcamento)
    return materializarOrcamento(orcamento)
  }

  async editarOrcamento(orcamentoId: string, entrada: EntradaOrcamento) {
    await aguardarLatencia()
    const indice = orcamentos.findIndex((orcamento) => orcamento.id === orcamentoId)
    if (indice < 0) {
      throw new ErroApi('orcamento-nao-encontrado', 'O orçamento não foi encontrado.', {}, 404)
    }
    this.validarOrcamento(entrada, orcamentoId)
    const categoria = categoriaDisponivel(entrada.categoriaId)!
    orcamentos[indice] = {
      id: orcamentoId,
      ...entrada,
      categoria: { ...categoria },
    }
    return materializarOrcamento(orcamentos[indice])
  }

  async excluirOrcamento(orcamentoId: string) {
    await aguardarLatencia()
    if (!orcamentos.some((orcamento) => orcamento.id === orcamentoId)) {
      throw new ErroApi('orcamento-nao-encontrado', 'O orçamento não foi encontrado.', {}, 404)
    }
    orcamentos = orcamentos.filter((orcamento) => orcamento.id !== orcamentoId)
  }

  private validarOrcamento(entrada: EntradaOrcamento, orcamentoIgnoradoId?: string) {
    validarMes(entrada.mesReferencia)
    if (!categoriaDisponivel(entrada.categoriaId)) {
      throw new ErroApi('categoria-indisponivel', 'A categoria não está disponível.')
    }
    if (!Number.isFinite(entrada.valorLimite) || entrada.valorLimite <= 0) {
      throw new ErroApi('dados-invalidos', 'O limite deve ser maior que zero.')
    }
    if (orcamentos.some((orcamento) => orcamento.id !== orcamentoIgnoradoId
      && orcamento.categoriaId === entrada.categoriaId
      && orcamento.mesReferencia === entrada.mesReferencia)) {
      throw new ErroApi(
        'orcamento-duplicado',
        'Já existe um orçamento para essa categoria no mês informado.',
        {},
        409,
      )
    }
  }

  private validarNomeCategoria(nome: string, categoriaIgnoradaId?: string) {
    if (!nome) throw new ErroApi('dados-invalidos', 'Informe o nome da categoria.')
    if (categorias.some((categoria) => categoria.id !== categoriaIgnoradaId
      && categoria.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))) {
      throw new ErroApi('categoria-nome-em-uso', 'Já existe uma categoria com esse nome.', {}, 409)
    }
  }
}

export function reiniciarFinanceiroMock() {
  criarDadosIniciais()
}
