import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServicoRest } from '../servicos/ServicoRest'

const respostaAutenticacao = {
  tokenAcesso: 'jwt-teste',
  tipoToken: 'Bearer',
  expiraEm: '2099-01-01T00:00:00Z',
  usuario: {
    id: 1,
    nome: 'Filipe',
    sobrenome: 'Lopes',
    email: 'filipe@example.com',
    dataCriacao: '2026-01-01T00:00:00Z',
  },
  contextoAtivoId: 10,
  contextos: [{ id: 10, nome: 'Pessoal', tipo: 'PESSOAL', papel: 'ADMINISTRADOR' }],
}

const respostaConta = {
  ...respostaAutenticacao.usuario,
  cpf: '52998224725',
  dataNascimento: '1994-06-15',
  dataAtualizacao: '2026-01-02T00:00:00Z',
  configuracao: {
    salarioMensal: 3500.5,
    moeda: 'BRL',
    notificacoesAtivas: true,
    tema: 'AUTOMATICO',
  },
}

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ServicoRest', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const servico = new ServicoRest('http://api.ji.test/')

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
    sessionStorage.clear()
  })

  it('mapeia login REST e persiste apenas o resumo da sessão', async () => {
    fetchMock.mockResolvedValueOnce(respostaJson(respostaAutenticacao))

    const sessao = await servico.entrar({
      email: 'filipe@example.com',
      senha: 'senha-segura',
      lembrar: true,
    })

    expect(sessao).toMatchObject({
      token: 'jwt-teste',
      usuario: { id: '1', nomeCompleto: 'Filipe Lopes' },
      contextoAtivo: { id: '10', nome: 'Pessoal' },
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.ji.test/api/v1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(localStorage.getItem('ji:sessao:v1')).toContain('jwt-teste')
    expect(localStorage.getItem('ji:sessao:v1')).not.toContain('senha-segura')
  })

  it('envia bearer nos contratos de conta e atualiza o usuário persistido', async () => {
    fetchMock
      .mockResolvedValueOnce(respostaJson(respostaAutenticacao))
      .mockResolvedValueOnce(respostaJson(respostaConta))
      .mockResolvedValueOnce(respostaJson({
        ...respostaConta,
        nome: 'Filipe atualizado',
        email: 'novo@example.com',
      }))
    await servico.entrar({ email: 'filipe@example.com', senha: 'senha-segura', lembrar: false })

    await expect(servico.obterConta()).resolves.toMatchObject({
      id: '1',
      cpf: '52998224725',
      configuracao: { salarioMensal: 3500.5, tema: 'AUTOMATICO' },
    })
    await expect(servico.atualizarPerfil({
      nome: 'Filipe atualizado',
      sobrenome: 'Lopes',
      email: 'novo@example.com',
      senhaAtual: 'senha-segura',
    })).resolves.toMatchObject({ email: 'novo@example.com' })

    const chamadaConta = fetchMock.mock.calls[1]
    expect(chamadaConta[0]).toBe('http://api.ji.test/api/v1/usuarios/me')
    expect((chamadaConta[1]?.headers as Headers).get('Authorization')).toBe('Bearer jwt-teste')
    expect(sessionStorage.getItem('ji:sessao:v1')).toContain('novo@example.com')
  })

  it('mapeia Problem Details e integra validação pública de token', async () => {
    fetchMock
      .mockResolvedValueOnce(respostaJson({
        status: 'valido',
        email: 'filipe@example.com',
        expiraEm: '2099-01-01T00:00:00Z',
      }))
      .mockResolvedValueOnce(respostaJson({
        codigo: 'email-em-uso',
        detail: 'O e-mail informado já está em uso.',
      }, 409))

    await expect(servico.validarTokenRedefinicao('token com espaço')).resolves.toEqual({
      status: 'valido',
      email: 'filipe@example.com',
      expiraEm: '2099-01-01T00:00:00Z',
    })
    expect(fetchMock.mock.calls[0][0]).toContain('token=token%20com%20espa%C3%A7o')

    await expect(servico.cadastrarUsuario({
      nome: 'Filipe',
      sobrenome: 'Lopes',
      email: 'filipe@example.com',
      senha: 'Senha123',
      aceitouTermos: true,
    })).rejects.toMatchObject({ codigo: 'EMAIL_EM_USO' })
  })

  it('mapeia dashboard e contratos de orçamento com bearer', async () => {
    fetchMock
      .mockResolvedValueOnce(respostaJson(respostaAutenticacao))
      .mockResolvedValueOnce(respostaJson({
        mesReferencia: '2026-11',
        totalEntradas: 3500,
        totalSaidas: 184.5,
        saldo: 3315.5,
        fluxoDiario: [{
          data: '2026-11-02', entradas: 3500, saidas: 0, saldoAcumulado: 3500,
        }],
        principaisCategorias: [{
          categoriaId: 6, categoriaNome: 'Mercado', total: 184.5, percentual: 100,
        }],
        transacoesRecentes: [],
        geradoEm: '2026-11-06T12:00:00Z',
      }))
      .mockResolvedValueOnce(respostaJson({
        mesReferencia: '2026-11',
        totalLimite: 220,
        totalConsumido: 184.5,
        percentualConsumido: 83.86,
        itens: [{
          id: 9,
          categoria: { id: 6, nome: 'Mercado', tipo: 'PERSONALIZADA' },
          valorLimite: 220,
          valorConsumido: 184.5,
          percentualConsumido: 83.86,
          situacao: 'ATENCAO',
          mesReferencia: '2026-11',
        }],
      }))
    await servico.entrar({ email: 'filipe@example.com', senha: 'senha-segura', lembrar: false })

    await expect(servico.obterDashboard('2026-11')).resolves.toMatchObject({
      saldo: 3315.5,
      principaisCategorias: [{ categoriaId: '6', categoriaNome: 'Mercado' }],
    })
    await expect(servico.listarOrcamentos('2026-11')).resolves.toMatchObject({
      totalLimite: 220,
      itens: [{ id: '9', situacao: 'ATENCAO' }],
    })

    expect(fetchMock.mock.calls[1][0]).toBe('http://api.ji.test/api/v1/dashboard?mes=2026-11')
    expect(fetchMock.mock.calls[2][0]).toBe('http://api.ji.test/api/v1/orcamentos?mes=2026-11')
    expect((fetchMock.mock.calls[2][1]?.headers as Headers).get('Authorization'))
      .toBe('Bearer jwt-teste')
  })
})
