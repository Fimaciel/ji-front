import { render, screen } from '@testing-library/react'
import usuario from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import { ProvedorAutenticacao } from '../autenticacao/ProvedorAutenticacao'
import { reiniciarAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import { ProvedorTema } from '../tema/ProvedorTema'

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/entrar']}>
      <ProvedorAutenticacao>
        <ProvedorTema><App /></ProvedorTema>
      </ProvedorAutenticacao>
    </MemoryRouter>,
  )
}

async function entrarECriarContexto(pessoa: ReturnType<typeof usuario.setup>) {
  await pessoa.type(await screen.findByLabelText('Senha'), 'Ji@12345')
  await pessoa.click(screen.getByRole('button', { name: 'Entrar' }))
  await pessoa.click(await screen.findByRole('link', { name: 'Contextos' }))
  await pessoa.type(screen.getByLabelText('Nome do contexto'), 'Casa em conjunto')
  await pessoa.click(screen.getByRole('button', { name: 'Criar contexto' }))
  await pessoa.click(await screen.findByRole('button', { name: 'Selecionar' }))
  await pessoa.click(screen.getByRole('link', { name: 'Equipe do contexto' }))
  await screen.findByRole('heading', { name: 'Equipe do contexto' })
}

describe('colaboração do contexto compartilhado', () => {
  beforeEach(() => {
    reiniciarAutenticacaoMock()
    vi.restoreAllMocks()
  })

  it('envia, reenvia e cancela convite de colaborador', async () => {
    const pessoa = usuario.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderizar()
    await entrarECriarContexto(pessoa)

    await pessoa.click(screen.getByRole('tab', { name: 'Convites enviados' }))
    await pessoa.type(screen.getByLabelText('E-mail'), 'colaborador@email.com')
    await pessoa.click(screen.getByRole('button', { name: 'Enviar convite' }))
    expect(await screen.findByText('Convite enviado com validade de sete dias.')).toBeInTheDocument()
    expect(screen.getByText('colaborador@email.com')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Reenviar' }))
    expect(await screen.findByText('Convite reenviado.')).toBeInTheDocument()
    await pessoa.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByText('Convite cancelado.')).toBeInTheDocument()
    expect(screen.getAllByText(/cancelado/i).length).toBeGreaterThan(1)
  })

  it('cadastra dependentes passivo e com acesso de leitura', async () => {
    const pessoa = usuario.setup()
    renderizar()
    await entrarECriarContexto(pessoa)

    expect(await screen.findByText(/Filipe Maciel Lopes \(você\)/)).toBeInTheDocument()
    await pessoa.click(screen.getByRole('tab', { name: 'Dependentes' }))
    await pessoa.type(screen.getByLabelText('Nome'), 'Ana Maciel')
    await pessoa.type(screen.getByLabelText('Data de nascimento'), '2015-04-10')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar dependente' }))
    expect(await screen.findByText('Dependente cadastrado.')).toBeInTheDocument()
    expect(screen.getByText('Ana Maciel')).toBeInTheDocument()

    await pessoa.type(screen.getByLabelText('Nome'), 'João Maciel')
    await pessoa.type(screen.getByLabelText('Data de nascimento'), '2012-08-21')
    await pessoa.selectOptions(screen.getByLabelText('Tipo'), 'LEITURA')
    await pessoa.type(screen.getByLabelText('E-mail para o convite'), 'joao@email.com')
    await pessoa.click(screen.getByRole('button', { name: 'Cadastrar dependente' }))
    expect(await screen.findByText('Dependente cadastrado e convite de leitura enviado.')).toBeInTheDocument()
    expect(screen.getByText('João Maciel')).toBeInTheDocument()
  })
})
