import type { ServicoAutenticacao } from '../servicos/ServicoAutenticacao'
import {
  ErroAutenticacao,
  type EntradaCadastroUsuario,
  type EntradaLogin,
  type EntradaRedefinicaoSenha,
  type EstadoTokenRedefinicao,
  type ResultadoSolicitacaoRecuperacao,
  type SessaoAutenticada,
  type UsuarioResumo,
} from '../tipos/autenticacao'

const CHAVE_SESSAO = 'ji:sessao:v1'
const DURACAO_SESSAO_PERSISTENTE = 7 * 24 * 60 * 60 * 1000
const DURACAO_TOKEN_REDEFINICAO = 30 * 60 * 1000
const TOKEN_VALIDO = 'token-demonstracao-valido'

interface RegistroToken {
  email: string
  expiraEm: number
  utilizado: boolean
}

interface EventoAuditoria {
  acao: 'LOGIN' | 'REDEFINICAO_SENHA' | 'LOGOUT'
  dataHora: string
  usuarioId?: string
}

interface RegistroSessao {
  versao: 1
  sessao: SessaoAutenticada
}

const usuarioDemonstracao: UsuarioResumo = {
  id: 'usuario-demonstracao',
  nome: 'Filipe',
  sobrenome: 'Maciel Lopes',
  nomeCompleto: 'Filipe Maciel Lopes',
  email: 'filipe.lopes@email.com',
}

let usuarios = new Map<string, UsuarioResumo>()
let tokens = new Map<string, RegistroToken>()
let eventosAuditoria: EventoAuditoria[] = []

function normalizarEmail(email: string) {
  return email.trim().toLocaleLowerCase('pt-BR')
}

function criarDadosIniciais() {
  usuarios = new Map([[usuarioDemonstracao.email, usuarioDemonstracao]])
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

function criarSessao(usuario: UsuarioResumo, lembrar: boolean): SessaoAutenticada {
  const expiraEm = lembrar
    ? new Date(Date.now() + DURACAO_SESSAO_PERSISTENTE).toISOString()
    : null

  return {
    token: `sessao-mock-${usuario.id}`,
    expiraEm,
    usuario,
    contextoAtivo: {
      id: `contexto-pessoal-${usuario.id}`,
      nome: 'Pessoal',
      tipo: 'PESSOAL',
      papel: 'ADMINISTRADOR',
    },
  }
}

function persistirSessao(sessao: SessaoAutenticada, lembrar: boolean) {
  localStorage.removeItem(CHAVE_SESSAO)
  sessionStorage.removeItem(CHAVE_SESSAO)

  const registro: RegistroSessao = { versao: 1, sessao }
  const armazenamento = lembrar ? localStorage : sessionStorage
  armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(registro))
}

function lerSessao(armazenamento: Storage): SessaoAutenticada | null {
  const valor = armazenamento.getItem(CHAVE_SESSAO)
  if (!valor) return null

  try {
    const registro = JSON.parse(valor) as RegistroSessao
    if (registro.versao !== 1 || !registro.sessao?.token || !registro.sessao.usuario?.email) {
      armazenamento.removeItem(CHAVE_SESSAO)
      return null
    }

    if (registro.sessao.expiraEm && Date.parse(registro.sessao.expiraEm) <= Date.now()) {
      armazenamento.removeItem(CHAVE_SESSAO)
      return null
    }

    return registro.sessao
  } catch {
    armazenamento.removeItem(CHAVE_SESSAO)
    return null
  }
}

export class ServicoAutenticacaoMock implements ServicoAutenticacao {
  async cadastrarUsuario(entrada: EntradaCadastroUsuario) {
    await aguardarLatencia()
    const email = normalizarEmail(entrada.email)
    if (usuarios.has(email)) {
      throw new ErroAutenticacao('EMAIL_EM_USO', 'Já existe uma conta ativa com este e-mail.')
    }

    const usuario: UsuarioResumo = {
      id: `usuario-${usuarios.size + 1}`,
      nome: entrada.nome.trim(),
      sobrenome: entrada.sobrenome.trim(),
      nomeCompleto: `${entrada.nome.trim()} ${entrada.sobrenome.trim()}`,
      email,
    }
    usuarios.set(email, usuario)
  }

  async entrar(entrada: EntradaLogin) {
    await aguardarLatencia()
    const usuario = usuarios.get(normalizarEmail(entrada.email))
    if (!usuario || entrada.senha.length === 0) {
      throw new ErroAutenticacao(
        'CREDENCIAIS_INVALIDAS',
        'Não foi possível entrar. Confira o e-mail e a senha.',
      )
    }

    const sessao = criarSessao(usuario, entrada.lembrar)
    persistirSessao(sessao, entrada.lembrar)
    eventosAuditoria.push({ acao: 'LOGIN', dataHora: new Date().toISOString(), usuarioId: usuario.id })
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
    const usuario = usuarios.get(estado.email)
    eventosAuditoria.push({
      acao: 'REDEFINICAO_SENHA',
      dataHora: new Date().toISOString(),
      usuarioId: usuario?.id,
    })
  }

  async recuperarSessao() {
    await aguardarLatencia()
    return lerSessao(sessionStorage) ?? lerSessao(localStorage)
  }

  async encerrarSessao() {
    await aguardarLatencia()
    const sessao = lerSessao(sessionStorage) ?? lerSessao(localStorage)
    eventosAuditoria.push({
      acao: 'LOGOUT',
      dataHora: new Date().toISOString(),
      usuarioId: sessao?.usuario.id,
    })
    sessionStorage.removeItem(CHAVE_SESSAO)
    localStorage.removeItem(CHAVE_SESSAO)
  }
}

export function reiniciarAutenticacaoMock() {
  criarDadosIniciais()
  sessionStorage.removeItem(CHAVE_SESSAO)
  localStorage.removeItem(CHAVE_SESSAO)
}

export function obterEventosAuditoriaMock() {
  return [...eventosAuditoria]
}
