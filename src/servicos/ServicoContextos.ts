import type {
  ContextoAtivo,
  ContextoGerenciamento,
  ConviteContexto,
  ConviteEnviado,
  Dependente,
  EntradaDependente,
  PapelContexto,
  ParticipanteContexto,
} from '../tipos/autenticacao'

export interface ServicoContextos {
  listarContextos(): Promise<ContextoGerenciamento[]>
  criarContexto(nome: string): Promise<ContextoGerenciamento>
  selecionarContexto(contextoId: string): Promise<ContextoAtivo>
  listarConvites(): Promise<ConviteContexto[]>
  detalharConvite(token: string): Promise<ConviteContexto>
  aceitarConvite(conviteId: string): Promise<ConviteContexto>
  recusarConvite(conviteId: string): Promise<ConviteContexto>
  listarConvitesEnviados(): Promise<ConviteEnviado[]>
  convidarColaborador(email: string): Promise<ConviteEnviado>
  reenviarConvite(conviteId: string): Promise<ConviteEnviado>
  cancelarConvite(conviteId: string): Promise<void>
  listarParticipantes(): Promise<ParticipanteContexto[]>
  alterarPapelParticipante(participanteId: string, papel: PapelContexto): Promise<ParticipanteContexto>
  removerParticipante(participanteId: string): Promise<void>
  sairDoContexto(): Promise<void>
  listarDependentes(): Promise<Dependente[]>
  criarDependente(entrada: EntradaDependente): Promise<Dependente>
  atualizarDependente(dependenteId: string, entrada: EntradaDependente): Promise<Dependente>
  excluirDependente(dependenteId: string): Promise<void>
}
