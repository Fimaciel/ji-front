import type {
  ConfiguracaoConta,
  ContaUsuario,
  EntradaAtualizacaoConfiguracao,
  EntradaAtualizacaoPerfil,
  TemaUsuario,
} from '../tipos/conta'

export interface ServicoConta {
  obterConta(): Promise<ContaUsuario>
  atualizarPerfil(entrada: EntradaAtualizacaoPerfil): Promise<ContaUsuario>
  atualizarConfiguracao(entrada: EntradaAtualizacaoConfiguracao): Promise<ConfiguracaoConta>
  atualizarTema(tema: TemaUsuario): Promise<ConfiguracaoConta>
  restaurarConfiguracao(): Promise<ConfiguracaoConta>
  encerrarConta(): Promise<void>
}
