export type TipoCategoria = 'PADRAO' | 'PERSONALIZADA'
export type TipoTransacao = 'ENTRADA' | 'SAIDA'
export type SituacaoOrcamento = 'NORMAL' | 'ATENCAO' | 'EXCEDIDO'

export interface Categoria {
  id: string
  nome: string
  tipo: TipoCategoria
}

export interface Transacao {
  id: string
  tipo: TipoTransacao
  valor: number
  data: string
  descricao: string
  categoria: Categoria
  dataCriacao: string
  dataAtualizacao: string
}

export interface EntradaTransacao {
  tipo: TipoTransacao
  valor: number
  data: string
  categoriaId: string
  descricao: string
}

export interface FiltrosTransacao {
  pagina?: number
  dataInicial?: string
  dataFinal?: string
  tipo?: TipoTransacao
  categoriaId?: string
  busca?: string
}

export interface PaginaTransacoes {
  itens: Transacao[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
}

export interface EntradaOrcamento {
  categoriaId: string
  valorLimite: number
  mesReferencia: string
}

export interface Orcamento {
  id: string
  categoria: Categoria
  valorLimite: number
  valorConsumido: number
  percentualConsumido: number
  situacao: SituacaoOrcamento
  mesReferencia: string
}

export interface ResumoOrcamentos {
  mesReferencia: string
  totalLimite: number
  totalConsumido: number
  percentualConsumido: number
  itens: Orcamento[]
}

export interface FluxoDiario {
  data: string
  entradas: number
  saidas: number
  saldoAcumulado: number
}

export interface CategoriaDashboard {
  categoriaId: string
  categoriaNome: string
  total: number
  percentual: number
}

export interface DashboardResumo {
  mesReferencia: string
  totalEntradas: number
  totalSaidas: number
  saldo: number
  fluxoDiario: FluxoDiario[]
  principaisCategorias: CategoriaDashboard[]
  transacoesRecentes: Transacao[]
  geradoEm: string
}
