import { beforeEach, describe, expect, it } from 'vitest'
import {
  obterContaUsuarioMock,
  obterEventosAuditoriaMock,
  reiniciarAutenticacaoMock,
  ServicoAutenticacaoMock,
} from '../mocks/ServicoAutenticacaoMock'

const CHAVE_SESSAO = 'ji:sessao:v1'
const EMAIL_DEMONSTRACAO = 'filipe.lopes@email.com'
const SENHA_DEMONSTRACAO = 'Ji@12345'

const cadastroAna = {
  nome: 'Ana',
  sobrenome: 'Silva',
  cpf: '529.982.247-25',
  dataNascimento: '1990-01-01',
  email: 'ana@email.com',
  senha: 'Senha123!',
  aceitouTermos: true,
}

describe('ServicoAutenticacaoMock', () => {
  const servico = new ServicoAutenticacaoMock()

  beforeEach(() => {
    reiniciarAutenticacaoMock()
  })

  it('cria usuário, configuração padrão e contexto Pessoal somente em memória', async () => {
    await servico.cadastrarUsuario(cadastroAna)

    const conta = obterContaUsuarioMock(cadastroAna.email)
    expect(conta).toMatchObject({
      usuario: {
        nome: 'Ana',
        sobrenome: 'Silva',
        cpf: '52998224725',
        dataNascimento: '1990-01-01',
        ativo: true,
      },
      configuracao: {
        moeda: 'BRL',
        notificacoesAtivadas: true,
        tema: 'AUTOMATICO',
      },
      contextoPessoal: {
        nome: 'Pessoal',
        tipo: 'PESSOAL',
        papel: 'ADMINISTRADOR',
      },
    })
    expect(Date.parse(conta?.usuario.criadoEm ?? '')).not.toBeNaN()
    expect(conta?.usuario.atualizadoEm).toBe(conta?.usuario.criadoEm)
    expect(JSON.stringify(conta)).not.toContain(cadastroAna.senha)
  })

  it('rejeita e-mail e CPF já vinculados a contas ativas', async () => {
    await servico.cadastrarUsuario(cadastroAna)

    await expect(servico.cadastrarUsuario(cadastroAna)).rejects.toMatchObject({
      codigo: 'EMAIL_EM_USO',
    })
    await expect(
      servico.cadastrarUsuario({
        ...cadastroAna,
        email: 'outra-pessoa@email.com',
        cpf: '52998224725',
      }),
    ).rejects.toMatchObject({
      codigo: 'CPF_EM_USO',
      message: 'Este CPF já está vinculado a uma conta ativa.',
    })
  })

  it('aceita somente a senha cadastrada e devolve erro genérico para falhas', async () => {
    await servico.cadastrarUsuario(cadastroAna)

    await expect(
      servico.entrar({ email: cadastroAna.email, senha: 'senha-incorreta', lembrar: false }),
    ).rejects.toMatchObject({
      codigo: 'CREDENCIAIS_INVALIDAS',
      message: 'Não foi possível entrar. Confira o e-mail e a senha.',
    })
    await expect(
      servico.entrar({ email: 'nao-existe@email.com', senha: 'Senha123', lembrar: false }),
    ).rejects.toMatchObject({
      codigo: 'CREDENCIAIS_INVALIDAS',
      message: 'Não foi possível entrar. Confira o e-mail e a senha.',
    })
    await expect(
      servico.entrar({ email: cadastroAna.email, senha: cadastroAna.senha, lembrar: false }),
    ).resolves.toMatchObject({ usuario: { email: cadastroAna.email } })
  })

  it('guarda a sessão lembrada por sete dias sem senha ou CPF', async () => {
    const antes = Date.now()
    const sessao = await servico.entrar({
      email: EMAIL_DEMONSTRACAO,
      senha: SENHA_DEMONSTRACAO,
      lembrar: true,
    })
    const registro = localStorage.getItem(CHAVE_SESSAO)

    expect(registro).not.toBeNull()
    expect(sessionStorage.getItem(CHAVE_SESSAO)).toBeNull()
    expect(registro).not.toContain(SENHA_DEMONSTRACAO)
    expect(registro).not.toContain('cpf')
    expect(registro).not.toContain('dataNascimento')
    expect(Date.parse(sessao.expiraEm ?? '') - antes).toBeGreaterThan(6.99 * 24 * 60 * 60 * 1000)
  })

  it('usa somente sessionStorage quando Lembrar-me está desmarcado', async () => {
    const sessao = await servico.entrar({
      email: EMAIL_DEMONSTRACAO,
      senha: SENHA_DEMONSTRACAO,
      lembrar: false,
    })

    expect(sessao.expiraEm).toBeNull()
    expect(sessionStorage.getItem(CHAVE_SESSAO)).not.toBeNull()
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull()
  })

  it('remove e ignora uma sessão persistente expirada', async () => {
    await servico.entrar({ email: EMAIL_DEMONSTRACAO, senha: SENHA_DEMONSTRACAO, lembrar: true })
    const registro = JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? '{}') as {
      sessao: { expiraEm: string }
    }
    registro.sessao.expiraEm = new Date(Date.now() - 1000).toISOString()
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(registro))

    await expect(servico.recuperarSessao()).resolves.toBeNull()
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull()
  })

  it('não revela se o e-mail de recuperação existe', async () => {
    const existente = await servico.solicitarRecuperacao(EMAIL_DEMONSTRACAO)
    const inexistente = await servico.solicitarRecuperacao('ninguem@email.com')

    expect(Object.keys(existente).sort()).toEqual(Object.keys(inexistente).sort())
    expect(existente.tokenDemonstracao).toBe(inexistente.tokenDemonstracao)
  })

  it('distingue tokens válidos, expirados e utilizados e invalida após o uso', async () => {
    await servico.solicitarRecuperacao(EMAIL_DEMONSTRACAO)
    await expect(servico.validarTokenRedefinicao('token-demonstracao-valido')).resolves.toMatchObject({
      status: 'valido',
    })
    await expect(servico.validarTokenRedefinicao('token-demonstracao-expirado')).resolves.toEqual({
      status: 'expirado',
    })
    await expect(servico.validarTokenRedefinicao('token-demonstracao-utilizado')).resolves.toEqual({
      status: 'utilizado',
    })

    await servico.redefinirSenha({ token: 'token-demonstracao-valido', novaSenha: 'NovaSenha123' })
    await expect(servico.validarTokenRedefinicao('token-demonstracao-valido')).resolves.toEqual({
      status: 'utilizado',
    })
  })

  it('encerra a sessão e registra o logout na auditoria mockada', async () => {
    await servico.entrar({
      email: EMAIL_DEMONSTRACAO,
      senha: SENHA_DEMONSTRACAO,
      lembrar: false,
    })
    await servico.encerrarSessao()

    await expect(servico.recuperarSessao()).resolves.toBeNull()
    expect(obterEventosAuditoriaMock().at(-1)).toMatchObject({
      acao: 'LOGOUT',
      usuarioId: 'usuario-demonstracao',
    })
  })
})
