export type PapelContexto = 'ADMINISTRADOR'

export interface ContextoAtivo {
  id: string
  nome: string
  tipo: 'PESSOAL'
  papel: PapelContexto
}

export interface UsuarioResumo {
  id: string
  nome: string
  sobrenome: string
  nomeCompleto: string
  email: string
}

export interface SessaoAutenticada {
  token: string
  expiraEm: string | null
  usuario: UsuarioResumo
  contextoAtivo: ContextoAtivo
}

export interface EntradaCadastroUsuario {
  nome: string
  sobrenome: string
  cpf?: string
  dataNascimento?: string
  email: string
  senha: string
  aceitouTermos: boolean
}

export interface EntradaLogin {
  email: string
  senha: string
  lembrar: boolean
}

export interface ResultadoSolicitacaoRecuperacao {
  tokenDemonstracao?: string
  expiraEm: string
}

export type EstadoTokenRedefinicao =
  | { status: 'valido'; email: string; expiraEm: string }
  | { status: 'expirado' }
  | { status: 'utilizado' }
  | { status: 'invalido' }

export interface EntradaRedefinicaoSenha {
  token: string
  novaSenha: string
}

export type CodigoErroAutenticacao =
  | 'EMAIL_EM_USO'
  | 'CREDENCIAIS_INVALIDAS'
  | 'TOKEN_EXPIRADO'
  | 'TOKEN_UTILIZADO'
  | 'TOKEN_INVALIDO'

export class ErroAutenticacao extends Error {
  constructor(
    public readonly codigo: CodigoErroAutenticacao,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = 'ErroAutenticacao'
  }
}
