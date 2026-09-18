import type {
  EntradaCadastroUsuario,
  EntradaLogin,
  EntradaRedefinicaoSenha,
  EstadoTokenRedefinicao,
  ResultadoSolicitacaoRecuperacao,
  SessaoAutenticada,
} from '../tipos/autenticacao'

export interface ServicoAutenticacao {
  cadastrarUsuario(entrada: EntradaCadastroUsuario): Promise<void>
  entrar(entrada: EntradaLogin): Promise<SessaoAutenticada>
  solicitarRecuperacao(email: string): Promise<ResultadoSolicitacaoRecuperacao>
  validarTokenRedefinicao(token: string): Promise<EstadoTokenRedefinicao>
  redefinirSenha(entrada: EntradaRedefinicaoSenha): Promise<void>
  recuperarSessao(): Promise<SessaoAutenticada | null>
  encerrarSessao(): Promise<void>
}
