export type PapelContexto = 'ADMINISTRADOR' | 'COLABORADOR' | 'DEPENDENTE'

export interface ContextoAtivo {
  id: string
  nome: string
  tipo: 'PESSOAL' | 'COMPARTILHADO'
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
  contextos: ContextoAtivo[]
  selecaoContextoNecessaria: boolean
}

export interface ContextoGerenciamento extends ContextoAtivo {
  quantidadeParticipantes: number
  ativo: boolean
}

export type StatusConvite = 'PENDENTE' | 'ACEITO' | 'RECUSADO' | 'EXPIRADO' | 'CANCELADO'

export interface ConviteContexto {
  id: string
  contextoId: string
  contextoNome: string
  convidadoPor: string
  papelProposto: PapelContexto
  status: StatusConvite
  dataCriacao: string
  dataExpiracao: string
  dataResposta?: string
}

export interface ConviteEnviado {
  id: string
  emailConvidado: string
  papelProposto: PapelContexto
  status: StatusConvite
  dependenteId?: string
  dataCriacao: string
  dataExpiracao: string
  dataResposta?: string
}

export interface ParticipanteContexto {
  id: string
  usuarioId: string
  nome: string
  email: string
  papel: PapelContexto
  dataIngresso: string
  dataSaida?: string
  ativo: boolean
}

export type TipoDependente = 'PASSIVO' | 'LEITURA'

export interface Dependente {
  id: string
  nome: string
  dataNascimento: string
  tipo: TipoDependente
  participanteId?: string
  usuarioVinculado?: string
  dataCriacao: string
  dataAtualizacao: string
}

export interface EntradaDependente {
  nome: string
  dataNascimento: string
  tipo: TipoDependente
  email?: string
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
  | 'CPF_EM_USO'
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
