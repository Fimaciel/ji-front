import type { ServicoFinanceiro } from '../servicos/ServicoFinanceiro'
import { dataLocalIso } from '../servicos/dataLocal'
import { ErroApi } from '../tipos/api'
import type {
  AnaliseImportacao,
  ArquivoDownload,
  Categoria,
  DashboardResumo,
  EntradaConfirmacaoImportacao,
  EntradaOrcamento,
  EntradaTransacao,
  FiltrosRelatorio,
  FiltrosTransacao,
  FormatoRelatorio,
  ImportacaoArquivo,
  Orcamento,
  PaginaTransacoes,
  RelatorioResumo,
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
  { id: '7', nome: 'Outros', tipo: 'PADRAO' },
]

let categorias: Categoria[] = []
let transacoes: Transacao[] = []
type OrcamentoArmazenado = EntradaOrcamento & { id: string; categoria: Categoria }
let orcamentos: OrcamentoArmazenado[] = []
let importacoes: ImportacaoArquivo[] = []
const transacoesPorImportacao = new Map<string, string[]>()
let proximoIdCategoria = 8
let proximoIdTransacao = 3
let proximoIdOrcamento = 3
let proximoIdImportacao = 1

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
  importacoes = []
  transacoesPorImportacao.clear()
  proximoIdCategoria = 8
  proximoIdTransacao = 3
  proximoIdOrcamento = 3
  proximoIdImportacao = 1
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

  async analisarImportacao(arquivo: File): Promise<AnaliseImportacao> {
    await aguardarLatencia()
    const nome = arquivo.name.toLocaleLowerCase('pt-BR')
    if (!nome.endsWith('.pdf') && !nome.endsWith('.xlsx')) {
      throw new ErroApi('formato-nao-suportado', 'Envie um arquivo PDF ou XLSX.')
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      throw new ErroApi('arquivo-muito-grande', 'O arquivo deve ter no máximo 10 MB.')
    }
    const registros = [
      {
        linha: 2, data: dataLocal(1), descricao: 'Mercado importado', valor: 126.8,
        tipo: 'SAIDA' as const, categoriaSugerida: { ...categoriasPadrao[0] }, duplicado: false,
      },
      {
        linha: 3, data: dataLocal(2), descricao: 'Rendimento importado', valor: 3200,
        tipo: 'ENTRADA' as const, categoriaSugerida: { ...categoriasPadrao[4] }, duplicado: false,
      },
    ]
    return {
      nomeArquivo: arquivo.name,
      formato: nome.endsWith('.pdf') ? 'PDF' : 'XLSX',
      totalLidos: registros.length,
      totalNovos: registros.length,
      totalDuplicados: 0,
      registros,
    }
  }

  async confirmarImportacao(entrada: EntradaConfirmacaoImportacao): Promise<ImportacaoArquivo> {
    await aguardarLatencia()
    if (entrada.registros.length === 0) {
      throw new ErroApi('dados-invalidos', 'Selecione ao menos um registro para importar.')
    }
    const agora = new Date().toISOString()
    const ids: string[] = []
    for (const registro of entrada.registros) {
      const categoria = categoriaDisponivel(registro.categoriaId)
      if (!categoria) throw new ErroApi('categoria-indisponivel', 'A categoria não está disponível.')
      const id = String(proximoIdTransacao++)
      ids.push(id)
      transacoes.push({
        id, ...registro, categoria: { ...categoria }, dataCriacao: agora, dataAtualizacao: agora,
      })
    }
    const importacao: ImportacaoArquivo = {
      id: String(proximoIdImportacao++),
      nomeArquivo: entrada.nomeArquivo,
      formato: entrada.formato,
      status: 'CONCLUIDA',
      totalLidos: entrada.totalLidos,
      totalImportados: entrada.registros.length,
      totalDuplicados: entrada.totalDuplicados,
      executadoPor: 'Pessoa Teste',
      dataCriacao: agora,
    }
    importacoes.unshift(importacao)
    transacoesPorImportacao.set(importacao.id, ids)
    return { ...importacao }
  }

  async listarImportacoes(): Promise<ImportacaoArquivo[]> {
    await aguardarLatencia()
    return importacoes.map((item) => ({ ...item }))
  }

  async desfazerUltimaImportacao(): Promise<ImportacaoArquivo> {
    await aguardarLatencia()
    const importacao = importacoes.find((item) => item.status === 'CONCLUIDA')
    if (!importacao) throw new ErroApi('importacao-nao-encontrada', 'Não há importação para desfazer.', {}, 404)
    const ids = new Set(transacoesPorImportacao.get(importacao.id) ?? [])
    transacoes = transacoes.filter((transacao) => !ids.has(transacao.id))
    importacao.status = 'DESFEITA'
    importacao.dataDesfeita = new Date().toISOString()
    return { ...importacao }
  }

  async obterRelatorio(filtros: FiltrosRelatorio): Promise<RelatorioResumo> {
    await aguardarLatencia()
    const itens = transacoes
      .filter((item) => item.data >= filtros.dataInicial && item.data <= filtros.dataFinal)
      .filter((item) => !filtros.tipo || item.tipo === filtros.tipo)
      .filter((item) => !filtros.categoriaId || item.categoria.id === filtros.categoriaId)
      .sort((a, b) => a.data.localeCompare(b.data))
    const totalEntradas = itens.filter((item) => item.tipo === 'ENTRADA')
      .reduce((total, item) => total + item.valor, 0)
    const totalSaidas = itens.filter((item) => item.tipo === 'SAIDA')
      .reduce((total, item) => total + item.valor, 0)
    const porMes = new Map<string, { entradas: number; saidas: number }>()
    const porCategoria = new Map<string, { quantidade: number; total: number }>()
    for (const item of itens) {
      const mes = porMes.get(item.data.slice(0, 7)) ?? { entradas: 0, saidas: 0 }
      mes[item.tipo === 'ENTRADA' ? 'entradas' : 'saidas'] += item.valor
      porMes.set(item.data.slice(0, 7), mes)
      const categoria = porCategoria.get(item.categoria.nome) ?? { quantidade: 0, total: 0 }
      categoria.quantidade += 1
      categoria.total += item.valor
      porCategoria.set(item.categoria.nome, categoria)
    }
    return {
      ...filtros,
      contextos: ['Pessoal'],
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      quantidadeTransacoes: itens.length,
      fluxoMensal: [...porMes].map(([mes, valores]) => ({ mes, ...valores })),
      categorias: [...porCategoria].map(([categoria, valores]) => ({
        categoria, ...valores, media: valores.total / valores.quantidade,
      })),
      transacoes: itens.map((item) => ({
        id: item.id, contexto: 'Pessoal', data: item.data, descricao: item.descricao,
        categoria: item.categoria.nome, tipo: item.tipo, valor: item.valor,
      })),
    }
  }

  async exportarRelatorio(
    filtros: FiltrosRelatorio,
    formato: FormatoRelatorio,
  ): Promise<ArquivoDownload> {
    const relatorio = await this.obterRelatorio(filtros)
    if (relatorio.quantidadeTransacoes === 0) {
      throw new ErroApi('relatorio-sem-dados', 'Não há dados para exportar nesse período.', {}, 422)
    }
    return {
      conteudo: new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/octet-stream' }),
      nome: `relatorio-ji.${formato.toLowerCase()}`,
    }
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
