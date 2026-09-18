import { beforeEach, describe, expect, it } from 'vitest'
import {
  obterEventosAuditoriaMock,
  reiniciarAutenticacaoMock,
  ServicoAutenticacaoMock,
} from '../mocks/ServicoAutenticacaoMock'

const CHAVE_SESSAO = 'ji:sessao:v1'
const EMAIL_DEMONSTRACAO = 'filipe.lopes@email.com'

describe('ServicoAutenticacaoMock', () => {
  const servico = new ServicoAutenticacaoMock()

  beforeEach(() => {
    reiniciarAutenticacaoMock()
  })

  it('mantém usuários cadastrados em memória e rejeita e-mail duplicado', async () => {
    const cadastro = {
      nome: 'Ana',
      sobrenome: 'Silva',
      cpf: '529.982.247-25',
      dataNascimento: '1990-01-01',
      email: 'ana@email.com',
      senha: 'Senha123!',
      aceitouTermos: true,
    }
    await servico.cadastrarUsuario(cadastro)

    await expect(servico.cadastrarUsuario(cadastro)).rejects.toMatchObject({
      codigo: 'EMAIL_EM_USO',
    })
    await expect(
      servico.entrar({ email: cadastro.email, senha: 'qualquer', lembrar: false }),
    ).resolves.toMatchObject({ usuario: { email: cadastro.email } })
  })

  it('retorna mensagem genérica para credenciais inválidas', async () => {
    await expect(
      servico.entrar({ email: 'nao-existe@email.com', senha: 'Senha123', lembrar: false }),
    ).rejects.toMatchObject({
      codigo: 'CREDENCIAIS_INVALIDAS',
      message: 'Não foi possível entrar. Confira o e-mail e a senha.',
    })
  })

  it('guarda a sessão lembrada por sete dias sem senha ou CPF', async () => {
    const antes = Date.now()
    const sessao = await servico.entrar({
      email: EMAIL_DEMONSTRACAO,
      senha: 'Segredo123!',
      lembrar: true,
    })
    const registro = localStorage.getItem(CHAVE_SESSAO)

    expect(registro).not.toBeNull()
    expect(sessionStorage.getItem(CHAVE_SESSAO)).toBeNull()
    expect(registro).not.toContain('Segredo123!')
    expect(registro).not.toContain('cpf')
    expect(Date.parse(sessao.expiraEm ?? '') - antes).toBeGreaterThan(6.99 * 24 * 60 * 60 * 1000)
  })

  it('usa somente sessionStorage quando Lembrar-me está desmarcado', async () => {
    const sessao = await servico.entrar({
      email: EMAIL_DEMONSTRACAO,
      senha: 'Senha123',
      lembrar: false,
    })

    expect(sessao.expiraEm).toBeNull()
    expect(sessionStorage.getItem(CHAVE_SESSAO)).not.toBeNull()
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull()
  })

  it('remove e ignora uma sessão persistente expirada', async () => {
    await servico.entrar({ email: EMAIL_DEMONSTRACAO, senha: 'Senha123', lembrar: true })
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
    await servico.entrar({ email: EMAIL_DEMONSTRACAO, senha: 'Senha123', lembrar: false })
    await servico.encerrarSessao()

    await expect(servico.recuperarSessao()).resolves.toBeNull()
    expect(obterEventosAuditoriaMock().at(-1)).toMatchObject({
      acao: 'LOGOUT',
      usuarioId: 'usuario-demonstracao',
    })
  })
})
