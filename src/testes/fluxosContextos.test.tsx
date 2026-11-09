import { render, screen } from '@testing-library/react'
import usuario from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import { ProvedorAutenticacao } from '../autenticacao/ProvedorAutenticacao'
import { reiniciarAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import { ProvedorTema } from '../tema/ProvedorTema'

const SENHA_DEMONSTRACAO = 'Ji@12345'

function renderizar(rota = '/entrar') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <ProvedorAutenticacao>
        <ProvedorTema><App /></ProvedorTema>
      </ProvedorAutenticacao>
    </MemoryRouter>,
  )
}

async function entrar(pessoa: ReturnType<typeof usuario.setup>) {
  await pessoa.type(await screen.findByLabelText('Senha'), SENHA_DEMONSTRACAO)
  await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByRole('heading', { name: 'Visão geral' })
}

describe('fluxos de contextos e convites', () => {
  beforeEach(reiniciarAutenticacaoMock)

  it('cria um contexto e exige seleção no próximo login', async () => {
    const pessoa = usuario.setup()
    renderizar()
    await entrar(pessoa)

    await pessoa.click(screen.getByRole('link', { name: 'Contextos' }))
    await screen.findByRole('heading', { name: 'Meus contextos' })
    await pessoa.type(screen.getByLabelText('Nome do contexto'), 'Casa compartilhada')
    await pessoa.click(screen.getByRole('button', { name: 'Criar contexto' }))
    expect((await screen.findAllByText('Casa compartilhada')).length).toBeGreaterThan(0)

    await pessoa.click(screen.getByLabelText('Abrir menu do usuário'))
    await pessoa.click(screen.getByRole('button', { name: 'Sair' }))
    await pessoa.type(await screen.findByLabelText('Senha'), SENHA_DEMONSTRACAO)
    await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Onde você quer entrar?' })).toBeInTheDocument()
    await pessoa.click(screen.getByText('Casa compartilhada'))
    await pessoa.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByLabelText('Contexto ativo')).toHaveTextContent('Casa compartilhada')
  })

  it('aceita convite pendente e adiciona o contexto recebido', async () => {
    const pessoa = usuario.setup()
    renderizar()
    await entrar(pessoa)

    await pessoa.click(screen.getByRole('link', { name: 'Meus convites' }))
    expect(await screen.findByText('Família Oliveira')).toBeInTheDocument()
    await pessoa.click(screen.getByRole('button', { name: 'Aceitar' }))
    expect(await screen.findByText('aceito')).toBeInTheDocument()

    await pessoa.click(screen.getByLabelText('Contexto ativo'))
    expect(await screen.findByRole('button', { name: /Família Oliveira/i })).toBeInTheDocument()
  })

  it('mostra o convite por link antes da autenticação', async () => {
    renderizar('/convite/convite-demonstracao')
    expect(await screen.findByRole('heading', { name: 'Família Oliveira' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar para responder' })).toBeInTheDocument()
  })
})
