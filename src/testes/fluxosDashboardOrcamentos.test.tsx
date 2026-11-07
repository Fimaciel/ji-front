import { render, screen, waitFor, within } from '@testing-library/react'
import usuario from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../App'
import { ProvedorAutenticacao } from '../autenticacao/ProvedorAutenticacao'
import { reiniciarAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import { reiniciarFinanceiroMock } from '../mocks/ServicoFinanceiroMock'
import { servicoAutenticacao } from '../servicos/instanciaAutenticacao'
import { ProvedorTema } from '../tema/ProvedorTema'

const EMAIL_DEMONSTRACAO = 'filipe.lopes@email.com'
const SENHA_DEMONSTRACAO = 'Ji@12345'

function renderizar(caminho: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
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

describe('dashboard e orçamentos da Sprint 4', () => {
  beforeEach(async () => {
    reiniciarAutenticacaoMock()
    reiniciarFinanceiroMock()
    await autenticar()
  })

  it('exibe saldo, fluxo, categorias e transações recentes no dashboard', async () => {
    renderizar('/app')

    expect(await screen.findByRole('heading', { name: 'Visão geral' })).toBeInTheDocument()
    expect(await screen.findByText('R$ 3.315,50')).toBeInTheDocument()
    expect(screen.getByRole('img', {
      name: 'Evolução acumulada de entradas e saídas no mês',
    })).toBeInTheDocument()
    expect(screen.getByText('Principais categorias')).toBeInTheDocument()
    expect(screen.getAllByText('Mercado').length).toBeGreaterThan(0)
    expect(screen.getByText('Supermercado Pão & Cia')).toBeInTheDocument()
  })

  it('cria, edita e exclui um orçamento mensal', async () => {
    const pessoa = usuario.setup()
    renderizar('/app/orcamentos')
    expect(await screen.findByRole('heading', { name: 'Orçamentos' })).toBeInTheDocument()
    expect(await screen.findByText('Atenção: 80% atingido')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Novo orçamento' }))
    let modal = await screen.findByRole('dialog', { name: 'Novo orçamento' })
    await pessoa.selectOptions(within(modal).getByLabelText('Categoria'), '1')
    await pessoa.type(within(modal).getByPlaceholderText('0,00'), '450,00')
    await pessoa.click(within(modal).getByRole('button', { name: 'Criar orçamento' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Orçamento criado.')
    expect(await screen.findByText('Alimentação')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Editar orçamento de Alimentação' }))
    modal = await screen.findByRole('dialog', { name: 'Editar orçamento' })
    const limite = within(modal).getByPlaceholderText('0,00')
    await pessoa.clear(limite)
    await pessoa.type(limite, '500,00')
    await pessoa.click(within(modal).getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Orçamento atualizado.')

    await pessoa.click(screen.getByRole('button', { name: 'Excluir orçamento de Alimentação' }))
    modal = await screen.findByRole('dialog', { name: 'Excluir orçamento?' })
    await pessoa.click(within(modal).getByRole('button', { name: 'Excluir orçamento' }))
    await waitFor(() => expect(screen.queryByText('Alimentação')).not.toBeInTheDocument())
  })
})
