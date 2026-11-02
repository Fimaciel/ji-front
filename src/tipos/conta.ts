export type TemaUsuario = 'CLARO' | 'ESCURO' | 'AUTOMATICO'

export interface ConfiguracaoConta {
  salarioMensal: number
  moeda: 'BRL'
  notificacoesAtivas: boolean
  tema: TemaUsuario
}

export interface ContaUsuario {
  id: string
  nome: string
  sobrenome: string
  cpf?: string
  dataNascimento?: string
  email: string
  dataCriacao: string
  dataAtualizacao: string
  configuracao: ConfiguracaoConta
}

export interface EntradaAtualizacaoPerfil {
  nome: string
  sobrenome: string
  email: string
  dataNascimento?: string
  senhaAtual: string
  novaSenha?: string
  confirmacaoNovaSenha?: string
}

export interface EntradaAtualizacaoConfiguracao {
  salarioMensal: number
  moeda: 'BRL'
  notificacoesAtivas: boolean
}
