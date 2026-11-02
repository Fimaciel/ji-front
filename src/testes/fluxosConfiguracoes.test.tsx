import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import usuario from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import { ProvedorAutenticacao } from '../autenticacao/ProvedorAutenticacao'
import { obterContaUsuarioMock, reiniciarAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import { servicoAutenticacao, servicoConta } from '../servicos/instanciaAutenticacao'
import { ProvedorTema } from '../tema/ProvedorTema'
import { ErroApi } from '../tipos/api'

const EMAIL_DEMONSTRACAO = 'filipe.lopes@email.com'
const SENHA_DEMONSTRACAO = 'Ji@12345'

function renderizarConfiguracoes() {
  return render(
    <MemoryRouter initialEntries={['/app/configuracoes']}>
      <ProvedorAutenticacao>
        <ProvedorTema>
          <App />
        </ProvedorTema>
      </ProvedorAutenticacao>
    </MemoryRouter>,
  )
}

async function autenticar() {
  await servicoAutenticacao.entrar({
    email: EMAIL_DEMONSTRACAO,
    senha: SENHA_DEMONSTRACAO,
    lembrar: false,
  })
}

describe('configurações da Sprint 2', () => {
  beforeEach(async () => {
    reiniciarAutenticacaoMock()
    await autenticar()
  })

  it('edita o perfil, exige a senha atual e atualiza a sessão exibida', async () => {
    const pessoa = usuario.setup()
    renderizarConfiguracoes()
    await screen.findByRole('heading', { name: 'Configurações' })

    await pessoa.clear(screen.getByLabelText('Nome'))
    await pessoa.type(screen.getByLabelText('Nome'), 'Felipe atualizado')
    await pessoa.clear(screen.getByLabelText('E-mail'))
    await pessoa.type(screen.getByLabelText('E-mail'), 'felipe.novo@email.com')
    await pessoa.type(screen.getByLabelText('Senha atual'), SENHA_DEMONSTRACAO)
    await pessoa.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Perfil atualizado.')
    expect(screen.getByLabelText('Abrir menu do usuário')).toHaveTextContent('Felipe atualizado')
    expect(obterContaUsuarioMock('felipe.novo@email.com')?.usuario).toMatchObject({
      nome: 'Felipe atualizado',
    })
  })

  it('confirma antes de salvar e restaurar preferências financeiras', async () => {
    const pessoa = usuario.setup()
    renderizarConfiguracoes()
    await screen.findByRole('heading', { name: 'Configurações' })

    fireEvent.change(screen.getByLabelText('Salário mensal'), { target: { value: '528045' } })
    await pessoa.click(screen.getByLabelText('Ativar notificações por e-mail'))
    await pessoa.click(screen.getByRole('button', { name: 'Revisar e salvar' }))

    const modalSalvar = await screen.findByRole('dialog', { name: 'Salvar configurações?' })
    expect(modalSalvar).toHaveTextContent('R$ 5.280,45')
    await pessoa.click(screen.getByRole('button', { name: 'Salvar configurações' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Configurações financeiras salvas.')
    expect(obterContaUsuarioMock(EMAIL_DEMONSTRACAO)?.configuracao).toMatchObject({
      salarioMensal: 5280.45,
      notificacoesAtivas: false,
    })

    await pessoa.click(screen.getByRole('button', { name: 'Restaurar padrão' }))
    const modalRestaurar = await screen.findByRole('dialog', { name: 'Restaurar configurações?' })
    await pessoa.click(within(modalRestaurar).getByRole('button', { name: 'Restaurar padrão' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Configurações restauradas para o padrão.')
    expect(screen.getByLabelText('Salário mensal')).toHaveValue('0,00')
  })

  it('aplica os temas imediatamente e acompanha o sistema no modo automático', async () => {
    let escuroNoSistema = false
    const ouvintes = new Set<() => void>()
    vi.mocked(window.matchMedia).mockImplementation((consulta: string) => ({
      get matches() { return escuroNoSistema },
      media: consulta,
      onchange: null,
      addEventListener: (_tipo: string, ouvinte: EventListenerOrEventListenerObject) => {
        if (typeof ouvinte === 'function') ouvintes.add(ouvinte as () => void)
      },
      removeEventListener: (_tipo: string, ouvinte: EventListenerOrEventListenerObject) => {
        if (typeof ouvinte === 'function') ouvintes.delete(ouvinte as () => void)
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    const pessoa = usuario.setup()
    renderizarConfiguracoes()
    await screen.findByRole('heading', { name: 'Configurações' })

    await pessoa.click(screen.getByRole('radio', { name: /Escuro/ }))
    expect(document.documentElement).toHaveAttribute('data-tema', 'escuro')
    await pessoa.click(screen.getByRole('radio', { name: /Automático/ }))
    expect(document.documentElement).toHaveAttribute('data-tema', 'claro')

    await act(async () => {
      escuroNoSistema = true
      ouvintes.forEach((ouvinte) => ouvinte())
    })
    expect(document.documentElement).toHaveAttribute('data-tema', 'escuro')
  })

  it('mostra falha da API sem descartar os dados digitados', async () => {
    const pessoa = usuario.setup()
    vi.spyOn(servicoConta, 'atualizarPerfil').mockRejectedValueOnce(
      new ErroApi('erro-inesperado', 'Falha simulada.'),
    )
    renderizarConfiguracoes()
    await screen.findByRole('heading', { name: 'Configurações' })

    await pessoa.clear(screen.getByLabelText('Nome'))
    await pessoa.type(screen.getByLabelText('Nome'), 'Nome preservado')
    await pessoa.type(screen.getByLabelText('Senha atual'), SENHA_DEMONSTRACAO)
    await pessoa.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível atualizar o perfil')
    expect(screen.getByLabelText('Nome')).toHaveValue('Nome preservado')
  })

  it('exige EXCLUIR, encerra logicamente e limpa o armazenamento Ji', async () => {
    const pessoa = usuario.setup()
    localStorage.setItem('ji:tema:v1', 'ESCURO')
    renderizarConfiguracoes()
    await screen.findByRole('heading', { name: 'Configurações' })

    await pessoa.click(screen.getByRole('button', { name: 'Encerrar conta' }))
    const modal = await screen.findByRole('dialog', { name: 'Encerrar sua conta?' })
    expect(modal).toHaveTextContent('dados serão preservados, não removidos')
    expect(within(modal).getByRole('button', { name: 'Encerrar conta' })).toBeDisabled()
    const campoConfirmacao = screen.getByLabelText('Digite EXCLUIR para confirmar')
    await pessoa.type(campoConfirmacao, 'EXCLUIR')
    expect(campoConfirmacao).toHaveValue('EXCLUIR')
    const botaoConfirmar = within(modal).getByRole('button', { name: 'Encerrar conta' })
    expect(botaoConfirmar).toBeEnabled()
    await pessoa.click(botaoConfirmar)

    await waitFor(() => expect(obterContaUsuarioMock(EMAIL_DEMONSTRACAO)?.usuario.ativo).toBe(false))
    expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
    expect([...Array(localStorage.length)].map((_, indice) => localStorage.key(indice)))
      .not.toEqual(expect.arrayContaining([expect.stringMatching(/^ji:/)]))
    expect([...Array(sessionStorage.length)].map((_, indice) => sessionStorage.key(indice)))
      .not.toEqual(expect.arrayContaining([expect.stringMatching(/^ji:/)]))
  })
})
