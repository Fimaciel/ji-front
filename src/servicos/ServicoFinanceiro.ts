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

export interface ServicoFinanceiro {
  listarCategorias(): Promise<Categoria[]>
  criarCategoria(nome: string): Promise<Categoria>
  editarCategoria(categoriaId: string, nome: string): Promise<Categoria>
  excluirCategoria(categoriaId: string): Promise<void>
  listarTransacoes(filtros?: FiltrosTransacao): Promise<PaginaTransacoes>
  criarTransacao(entrada: EntradaTransacao): Promise<Transacao>
  editarTransacao(transacaoId: string, entrada: EntradaTransacao): Promise<Transacao>
  excluirTransacao(transacaoId: string): Promise<void>
  obterDashboard(mes?: string): Promise<DashboardResumo>
  listarOrcamentos(mes?: string): Promise<ResumoOrcamentos>
  criarOrcamento(entrada: EntradaOrcamento): Promise<Orcamento>
  editarOrcamento(orcamentoId: string, entrada: EntradaOrcamento): Promise<Orcamento>
  excluirOrcamento(orcamentoId: string): Promise<void>
  analisarImportacao(arquivo: File): Promise<AnaliseImportacao>
  confirmarImportacao(entrada: EntradaConfirmacaoImportacao): Promise<ImportacaoArquivo>
  listarImportacoes(): Promise<ImportacaoArquivo[]>
  desfazerUltimaImportacao(): Promise<ImportacaoArquivo>
  obterRelatorio(filtros: FiltrosRelatorio): Promise<RelatorioResumo>
  exportarRelatorio(filtros: FiltrosRelatorio, formato: FormatoRelatorio): Promise<ArquivoDownload>
}
