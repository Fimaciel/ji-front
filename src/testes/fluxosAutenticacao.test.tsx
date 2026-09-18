import { render, screen } from '@testing-library/react'
import usuario from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import { ProvedorAutenticacao } from '../autenticacao/ProvedorAutenticacao'
import { reiniciarAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'

function renderizarRota(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <ProvedorAutenticacao>
        <App />
      </ProvedorAutenticacao>
    </MemoryRouter>,
  )
}

describe('fluxos de autenticação', () => {
  beforeEach(() => {
    reiniciarAutenticacaoMock()
  })

  it('protege a área autenticada e redireciona para entrar', async () => {
    renderizarRota('/app')
    expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  })

  it('mostra uma mensagem genérica para login inválido', async () => {
    const pessoa = usuario.setup()
    renderizarRota('/entrar')

    const email = await screen.findByLabelText('E-mail')
    await pessoa.clear(email)
    await pessoa.type(email, 'desconhecido@email.com')
    await pessoa.type(screen.getByLabelText('Senha'), 'Senha123')
    await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar. Confira o e-mail e a senha.',
    )
  })

  it('entra, ativa o contexto Pessoal e encerra a sessão', async () => {
    const pessoa = usuario.setup()
    renderizarRota('/entrar')

    await pessoa.type(await screen.findByLabelText('Senha'), 'Senha123')
    await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Sua conta está pronta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Contexto ativo')).toHaveTextContent('Pessoal')

    await pessoa.click(screen.getByLabelText('Abrir menu do usuário'))
    await pessoa.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('heading', { name: 'Entrar na sua conta' })).toBeInTheDocument()
  })

  it('valida os campos do cadastro e permite deixar CPF e data vazios', async () => {
    const pessoa = usuario.setup()
    renderizarRota('/cadastro')

    await screen.findByRole('heading', { name: 'Criar sua conta' })
    await pessoa.click(screen.getByRole('checkbox', { name: /Li e aceito os/i }))
    await pessoa.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument()

    await pessoa.type(screen.getByLabelText('Nome'), 'Ana')
    await pessoa.type(screen.getByLabelText('Sobrenome'), 'Silva')
    await pessoa.type(screen.getByLabelText('E-mail'), 'ana@email.com')
    await pessoa.type(screen.getByLabelText('Senha'), 'Senha123')
    await pessoa.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Conta criada.')
  })

  it('associa o erro de e-mail duplicado ao campo de cadastro', async () => {
    const pessoa = usuario.setup()
    renderizarRota('/cadastro')

    await pessoa.type(await screen.findByLabelText('Nome'), 'Filipe')
    await pessoa.type(screen.getByLabelText('Sobrenome'), 'Lopes')
    await pessoa.type(screen.getByLabelText('E-mail'), 'filipe.lopes@email.com')
    await pessoa.type(screen.getByLabelText('Senha'), 'Senha123')
    await pessoa.click(screen.getByRole('checkbox', { name: /Li e aceito os/i }))
    await pessoa.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Já existe uma conta ativa com este e-mail.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  it('mantém a confirmação da recuperação igual para e-mails distintos', async () => {
    const pessoa = usuario.setup()
    const primeira = renderizarRota('/recuperar-senha')
    const campo = await screen.findByLabelText('E-mail')
    await pessoa.clear(campo)
    await pessoa.type(campo, 'desconhecido@email.com')
    await pessoa.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }))

    expect(await screen.findByRole('heading', { name: 'Link enviado' })).toBeInTheDocument()
    expect(screen.getByText(/O link expira em/)).toBeInTheDocument()
    expect(screen.getByText('Modo demonstração')).toBeInTheDocument()
    primeira.unmount()
  })

  it('exibe os estados de token expirado e utilizado', async () => {
    const expirado = renderizarRota('/redefinir-senha?token=token-demonstracao-expirado')
    expect(await screen.findByText(/Este link expirou/)).toBeInTheDocument()
    expirado.unmount()

    renderizarRota('/redefinir-senha?token=token-demonstracao-utilizado')
    expect(await screen.findByText(/Este link já foi utilizado/)).toBeInTheDocument()
  })

  it('redireciona rota desconhecida conforme o estado da sessão', async () => {
    const pessoa = usuario.setup()
    const primeiraNavegacao = renderizarRota('/rota-inexistente')
    await screen.findByRole('heading', { name: 'Entrar na sua conta' })
    await pessoa.type(screen.getByLabelText('Senha'), 'Senha123')
    await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByRole('heading', { name: 'Sua conta está pronta' })
    primeiraNavegacao.unmount()

    renderizarRota('/outra-rota')
    expect(await screen.findByRole('heading', { name: 'Sua conta está pronta' })).toBeInTheDocument()
  })
})
