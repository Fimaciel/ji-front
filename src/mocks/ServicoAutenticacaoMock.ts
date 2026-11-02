import type { ServicoAutenticacao } from '../servicos/ServicoAutenticacao'
import type { ServicoConta } from '../servicos/ServicoConta'
import {
  atualizarUsuarioPersistido,
  lerSessaoAtual,
  limparArmazenamentoJi,
  limparSessao,
  persistirSessao,
} from '../servicos/armazenamentoSessao'
import { ErroApi } from '../tipos/api'
import {
  ErroAutenticacao,
  type EntradaCadastroUsuario,
  type EntradaLogin,
  type EntradaRedefinicaoSenha,
  type EstadoTokenRedefinicao,
  type ContextoAtivo,
  type ResultadoSolicitacaoRecuperacao,
  type SessaoAutenticada,
  type UsuarioResumo,
} from '../tipos/autenticacao'
import type {
  ConfiguracaoConta,
  ContaUsuario,
  EntradaAtualizacaoConfiguracao,
  EntradaAtualizacaoPerfil,
  TemaUsuario,
} from '../tipos/conta'

const DURACAO_SESSAO_PERSISTENTE = 7 * 24 * 60 * 60 * 1000
const DURACAO_TOKEN_REDEFINICAO = 30 * 60 * 1000
const TOKEN_VALIDO = 'token-demonstracao-valido'
const SAL_CREDENCIAL_DEMONSTRACAO = 'ji-demo-v1'
const RESUMO_CREDENCIAL_DEMONSTRACAO =
  'e593c2f01fe6de2b984033b8292aac163e40197f2e66dcb5766a1c3b9a0fb2f7'

interface UsuarioMock extends UsuarioResumo {
  cpf?: string
  dataNascimento?: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

interface CredencialMock {
  sal: string
  resumoSenha: string
}

interface ConfiguracaoUsuarioMock extends ConfiguracaoConta {
  salarioMensal: number
  moeda: 'BRL'
  notificacoesAtivas: boolean
  tema: TemaUsuario
}

interface ContaUsuarioMock {
  usuario: UsuarioMock
  credencial: CredencialMock
  configuracao: ConfiguracaoUsuarioMock
  contextoPessoal: ContextoAtivo
}

interface RegistroToken {
  email: string
  expiraEm: number
  utilizado: boolean
}

interface EventoAuditoria {
  acao:
    | 'LOGIN'
    | 'REDEFINICAO_SENHA'
    | 'LOGOUT'
    | 'ATUALIZACAO_PERFIL'
    | 'ATUALIZACAO_CONFIGURACAO'
    | 'ALTERACAO_TEMA'
    | 'RESTAURACAO_CONFIGURACAO'
    | 'ENCERRAMENTO_CONTA'
  dataHora: string
  usuarioId?: string
}

let usuarios = new Map<string, ContaUsuarioMock>()
let tokens = new Map<string, RegistroToken>()
let eventosAuditoria: EventoAuditoria[] = []

function normalizarEmail(email: string) {
  return email.trim().toLocaleLowerCase('pt-BR')
}

function normalizarCpf(cpf?: string) {
  const cpfNormalizado = cpf?.replace(/\D/g, '')
  return cpfNormalizado || undefined
}

function converterParaHexadecimal(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function resumirSenha(senha: string, sal: string) {
  const dados = new TextEncoder().encode(`${sal}:${senha}`)
  const resumo = await globalThis.crypto.subtle.digest('SHA-256', dados)
  return converterParaHexadecimal(new Uint8Array(resumo))
}

function criarSalCredencial() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return converterParaHexadecimal(bytes)
}

function criarContextoPessoal(usuarioId: string): ContextoAtivo {
  return {
    id: `contexto-pessoal-${usuarioId}`,
    nome: 'Pessoal',
    tipo: 'PESSOAL',
    papel: 'ADMINISTRADOR',
  }
}

function criarConfiguracaoPadrao(): ConfiguracaoUsuarioMock {
  return {
    salarioMensal: 0,
    moeda: 'BRL',
    notificacoesAtivas: true,
    tema: 'AUTOMATICO',
  }
}

function criarDadosIniciais() {
  const agora = new Date().toISOString()
  const usuarioDemonstracao: UsuarioMock = {
    id: 'usuario-demonstracao',
    nome: 'Filipe',
    sobrenome: 'Maciel Lopes',
    nomeCompleto: 'Filipe Maciel Lopes',
    email: 'filipe.lopes@email.com',
    ativo: true,
    criadoEm: agora,
    atualizadoEm: agora,
  }

  usuarios = new Map([
    [
      usuarioDemonstracao.email,
      {
        usuario: usuarioDemonstracao,
        credencial: {
          sal: SAL_CREDENCIAL_DEMONSTRACAO,
          resumoSenha: RESUMO_CREDENCIAL_DEMONSTRACAO,
        },
        configuracao: criarConfiguracaoPadrao(),
        contextoPessoal: criarContextoPessoal(usuarioDemonstracao.id),
      },
    ],
  ])
  tokens = new Map([
    [
      'token-demonstracao-expirado',
      { email: usuarioDemonstracao.email, expiraEm: Date.now() - 1, utilizado: false },
    ],
    [
      'token-demonstracao-utilizado',
      { email: usuarioDemonstracao.email, expiraEm: Date.now() + DURACAO_TOKEN_REDEFINICAO, utilizado: true },
    ],
  ])
  eventosAuditoria = []
}

criarDadosIniciais()

function aguardarLatencia() {
  const atraso = import.meta.env.MODE === 'test' ? 0 : 180
  return new Promise<void>((resolver) => window.setTimeout(resolver, atraso))
}

function criarSessao(conta: ContaUsuarioMock, lembrar: boolean): SessaoAutenticada {
  const expiraEm = lembrar
    ? new Date(Date.now() + DURACAO_SESSAO_PERSISTENTE).toISOString()
    : null

  return {
    token: `sessao-mock-${conta.usuario.id}`,
    expiraEm,
    usuario: {
      id: conta.usuario.id,
      nome: conta.usuario.nome,
      sobrenome: conta.usuario.sobrenome,
      nomeCompleto: conta.usuario.nomeCompleto,
      email: conta.usuario.email,
    },
    contextoAtivo: { ...conta.contextoPessoal },
  }
}

export class ServicoAutenticacaoMock implements ServicoAutenticacao, ServicoConta {
  async cadastrarUsuario(entrada: EntradaCadastroUsuario) {
    await aguardarLatencia()
    const email = normalizarEmail(entrada.email)
    const contaExistente = usuarios.get(email)
    if (contaExistente?.usuario.ativo) {
      throw new ErroAutenticacao('EMAIL_EM_USO', 'Já existe uma conta ativa com este e-mail.')
    }

    const cpf = normalizarCpf(entrada.cpf)
    const cpfEmUso = cpf
      ? Array.from(usuarios.values()).some(
          (conta) => conta.usuario.ativo && conta.usuario.cpf === cpf,
        )
      : false
    if (cpfEmUso) {
      throw new ErroAutenticacao('CPF_EM_USO', 'Este CPF já está vinculado a uma conta ativa.')
    }

    const agora = new Date().toISOString()
    const usuario: UsuarioMock = {
      id: `usuario-${usuarios.size + 1}`,
      nome: entrada.nome.trim(),
      sobrenome: entrada.sobrenome.trim(),
      nomeCompleto: `${entrada.nome.trim()} ${entrada.sobrenome.trim()}`,
      email,
      cpf,
      dataNascimento: entrada.dataNascimento || undefined,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const sal = criarSalCredencial()
    usuarios.set(email, {
      usuario,
      credencial: {
        sal,
        resumoSenha: await resumirSenha(entrada.senha, sal),
      },
      configuracao: criarConfiguracaoPadrao(),
      contextoPessoal: criarContextoPessoal(usuario.id),
    })
  }

  async entrar(entrada: EntradaLogin) {
    await aguardarLatencia()
    const conta = usuarios.get(normalizarEmail(entrada.email))
    const senhaCorreta = conta
      ? (await resumirSenha(entrada.senha, conta.credencial.sal)) === conta.credencial.resumoSenha
      : false
    if (!conta?.usuario.ativo || !senhaCorreta) {
      throw new ErroAutenticacao(
        'CREDENCIAIS_INVALIDAS',
        'Não foi possível entrar. Confira o e-mail e a senha.',
      )
    }

    const sessao = criarSessao(conta, entrada.lembrar)
    persistirSessao(sessao, entrada.lembrar)
    eventosAuditoria.push({
      acao: 'LOGIN',
      dataHora: new Date().toISOString(),
      usuarioId: conta.usuario.id,
    })
    return sessao
  }

  async solicitarRecuperacao(emailInformado: string): Promise<ResultadoSolicitacaoRecuperacao> {
    await aguardarLatencia()
    const email = normalizarEmail(emailInformado)
    const expiraEm = Date.now() + DURACAO_TOKEN_REDEFINICAO
    tokens.set(TOKEN_VALIDO, { email, expiraEm, utilizado: false })
    return {
      tokenDemonstracao: TOKEN_VALIDO,
      expiraEm: new Date(expiraEm).toISOString(),
    }
  }

  async validarTokenRedefinicao(token: string): Promise<EstadoTokenRedefinicao> {
    await aguardarLatencia()
    const registro = tokens.get(token)
    if (!registro) return { status: 'invalido' }
    if (registro.utilizado) return { status: 'utilizado' }
    if (registro.expiraEm <= Date.now()) return { status: 'expirado' }
    return {
      status: 'valido',
      email: registro.email,
      expiraEm: new Date(registro.expiraEm).toISOString(),
    }
  }

  async redefinirSenha(entrada: EntradaRedefinicaoSenha) {
    const estado = await this.validarTokenRedefinicao(entrada.token)
    if (estado.status === 'expirado') {
      throw new ErroAutenticacao('TOKEN_EXPIRADO', 'Este link de recuperação expirou.')
    }
    if (estado.status === 'utilizado') {
      throw new ErroAutenticacao('TOKEN_UTILIZADO', 'Este link já foi utilizado.')
    }
    if (estado.status === 'invalido') {
      throw new ErroAutenticacao('TOKEN_INVALIDO', 'Este link de recuperação não é válido.')
    }

    const registro = tokens.get(entrada.token)
    if (registro) registro.utilizado = true
    const conta = usuarios.get(estado.email)
    if (conta) {
      const sal = criarSalCredencial()
      conta.credencial = {
        sal,
        resumoSenha: await resumirSenha(entrada.novaSenha, sal),
      }
      conta.usuario.atualizadoEm = new Date().toISOString()
    }
    eventosAuditoria.push({
      acao: 'REDEFINICAO_SENHA',
      dataHora: new Date().toISOString(),
      usuarioId: conta?.usuario.id,
    })
  }

  async recuperarSessao() {
    await aguardarLatencia()
    const sessao = lerSessaoAtual()
    if (!sessao) return null
    const conta = usuarios.get(sessao.usuario.email)
    return conta?.usuario.ativo ? sessao : null
  }

  async encerrarSessao() {
    await aguardarLatencia()
    const sessao = lerSessaoAtual()
    eventosAuditoria.push({
      acao: 'LOGOUT',
      dataHora: new Date().toISOString(),
      usuarioId: sessao?.usuario.id,
    })
    limparSessao()
  }

  async obterConta(): Promise<ContaUsuario> {
    await aguardarLatencia()
    const conta = this.obterContaAutenticada()
    return this.mapearConta(conta)
  }

  async atualizarPerfil(entrada: EntradaAtualizacaoPerfil): Promise<ContaUsuario> {
    await aguardarLatencia()
    const conta = this.obterContaAutenticada()
    const senhaCorreta = (await resumirSenha(entrada.senhaAtual, conta.credencial.sal))
      === conta.credencial.resumoSenha
    if (!senhaCorreta) {
      throw new ErroApi('senha-atual-invalida', 'A senha atual informada não confere.')
    }

    const novoEmail = normalizarEmail(entrada.email)
    const emailEmUso = usuarios.get(novoEmail)
    if (emailEmUso && emailEmUso !== conta && emailEmUso.usuario.ativo) {
      throw new ErroApi('email-em-uso', 'O e-mail informado já está em uso.', {}, 409)
    }
    if (entrada.novaSenha && entrada.novaSenha !== entrada.confirmacaoNovaSenha) {
      throw new ErroApi('senhas-divergentes', 'A nova senha e a confirmação devem ser iguais.')
    }

    const emailAnterior = conta.usuario.email
    conta.usuario.nome = entrada.nome.trim()
    conta.usuario.sobrenome = entrada.sobrenome.trim()
    conta.usuario.nomeCompleto = `${conta.usuario.nome} ${conta.usuario.sobrenome}`
    conta.usuario.email = novoEmail
    conta.usuario.dataNascimento = entrada.dataNascimento || undefined
    conta.usuario.atualizadoEm = new Date().toISOString()
    if (entrada.novaSenha) {
      const sal = criarSalCredencial()
      conta.credencial = { sal, resumoSenha: await resumirSenha(entrada.novaSenha, sal) }
    }
    if (emailAnterior !== novoEmail) {
      usuarios.delete(emailAnterior)
      usuarios.set(novoEmail, conta)
    }
    const resumo = this.criarResumo(conta.usuario)
    atualizarUsuarioPersistido(resumo)
    eventosAuditoria.push({
      acao: 'ATUALIZACAO_PERFIL',
      dataHora: new Date().toISOString(),
      usuarioId: conta.usuario.id,
    })
    return this.mapearConta(conta)
  }

  async atualizarConfiguracao(
    entrada: EntradaAtualizacaoConfiguracao,
  ): Promise<ConfiguracaoConta> {
    await aguardarLatencia()
    const conta = this.obterContaAutenticada()
    if (entrada.salarioMensal < 0 || !Number.isFinite(entrada.salarioMensal)) {
      throw new ErroApi('dados-invalidos', 'O salário mensal não pode ser negativo.')
    }
    conta.configuracao.salarioMensal = entrada.salarioMensal
    conta.configuracao.notificacoesAtivas = entrada.notificacoesAtivas
    conta.usuario.atualizadoEm = new Date().toISOString()
    eventosAuditoria.push({
      acao: 'ATUALIZACAO_CONFIGURACAO',
      dataHora: new Date().toISOString(),
      usuarioId: conta.usuario.id,
    })
    return { ...conta.configuracao }
  }

  async atualizarTema(tema: TemaUsuario): Promise<ConfiguracaoConta> {
    await aguardarLatencia()
    const conta = this.obterContaAutenticada()
    conta.configuracao.tema = tema
    conta.usuario.atualizadoEm = new Date().toISOString()
    eventosAuditoria.push({
      acao: 'ALTERACAO_TEMA',
      dataHora: new Date().toISOString(),
      usuarioId: conta.usuario.id,
    })
    return { ...conta.configuracao }
  }

  async restaurarConfiguracao(): Promise<ConfiguracaoConta> {
    await aguardarLatencia()
    const conta = this.obterContaAutenticada()
    conta.configuracao = criarConfiguracaoPadrao()
    conta.usuario.atualizadoEm = new Date().toISOString()
    eventosAuditoria.push({
      acao: 'RESTAURACAO_CONFIGURACAO',
      dataHora: new Date().toISOString(),
      usuarioId: conta.usuario.id,
    })
    return { ...conta.configuracao }
  }

  async encerrarConta() {
    await aguardarLatencia()
    const conta = this.obterContaAutenticada()
    conta.usuario.ativo = false
    conta.usuario.atualizadoEm = new Date().toISOString()
    eventosAuditoria.push({
      acao: 'ENCERRAMENTO_CONTA',
      dataHora: new Date().toISOString(),
      usuarioId: conta.usuario.id,
    })
    limparArmazenamentoJi()
  }

  private obterContaAutenticada() {
    const sessao = lerSessaoAtual()
    const conta = sessao ? usuarios.get(sessao.usuario.email) : undefined
    if (!conta?.usuario.ativo) {
      throw new ErroApi('sessao-invalida', 'Faça login novamente.', {}, 401)
    }
    return conta
  }

  private criarResumo(usuario: UsuarioMock): UsuarioResumo {
    return {
      id: usuario.id,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      nomeCompleto: usuario.nomeCompleto,
      email: usuario.email,
    }
  }

  private mapearConta(conta: ContaUsuarioMock): ContaUsuario {
    return {
      id: conta.usuario.id,
      nome: conta.usuario.nome,
      sobrenome: conta.usuario.sobrenome,
      cpf: conta.usuario.cpf,
      dataNascimento: conta.usuario.dataNascimento,
      email: conta.usuario.email,
      dataCriacao: conta.usuario.criadoEm,
      dataAtualizacao: conta.usuario.atualizadoEm,
      configuracao: { ...conta.configuracao },
    }
  }
}

export function reiniciarAutenticacaoMock() {
  criarDadosIniciais()
  limparArmazenamentoJi()
}

export function obterEventosAuditoriaMock() {
  return [...eventosAuditoria]
}

export function obterContaUsuarioMock(email: string) {
  const conta = usuarios.get(normalizarEmail(email))
  if (!conta) return null

  return {
    usuario: { ...conta.usuario },
    configuracao: { ...conta.configuracao },
    contextoPessoal: { ...conta.contextoPessoal },
  }
}
