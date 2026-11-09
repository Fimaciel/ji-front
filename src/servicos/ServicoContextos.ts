import type {
  ContextoAtivo,
  ContextoGerenciamento,
  ConviteContexto,
} from '../tipos/autenticacao'

export interface ServicoContextos {
  listarContextos(): Promise<ContextoGerenciamento[]>
  criarContexto(nome: string): Promise<ContextoGerenciamento>
  selecionarContexto(contextoId: string): Promise<ContextoAtivo>
  listarConvites(): Promise<ConviteContexto[]>
  detalharConvite(token: string): Promise<ConviteContexto>
  aceitarConvite(conviteId: string): Promise<ConviteContexto>
  recusarConvite(conviteId: string): Promise<ConviteContexto>
}
