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

describe('transações e categorias da Sprint 3', () => {
  beforeEach(async () => {
    reiniciarAutenticacaoMock()
    reiniciarFinanceiroMock()
    await autenticar()
  })

  it('cadastra, edita, filtra e exclui uma transação', async () => {
    const pessoa = usuario.setup()
    renderizar('/app/transacoes')
    await screen.findByText('Supermercado Pão & Cia')

    await pessoa.click(screen.getByRole('button', { name: 'Nova transação' }))
    const modalNovo = await screen.findByRole('dialog', { name: 'Nova transação' })
    await pessoa.click(within(modalNovo).getByText('Entrada'))
    await pessoa.type(within(modalNovo).getByPlaceholderText('0,00'), '650,00')
    await pessoa.selectOptions(within(modalNovo).getByLabelText('Categoria'), '5')
    await pessoa.type(within(modalNovo).getByLabelText('Descrição'), 'Freela teste')
    await pessoa.click(within(modalNovo).getByRole('button', { name: 'Salvar transação' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Transação cadastrada.')
    expect(await screen.findByText('Freela teste')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Editar Freela teste' }))
    const modalEditar = await screen.findByRole('dialog', { name: 'Editar transação' })
    const descricao = within(modalEditar).getByLabelText('Descrição')
    await pessoa.clear(descricao)
    await pessoa.type(descricao, 'Freela atualizado')
    await pessoa.click(within(modalEditar).getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Freela atualizado')).toBeInTheDocument()

    await pessoa.type(screen.getByRole('searchbox', { name: 'Buscar transações' }), 'Freela')
    await waitFor(() => expect(screen.queryByText('Supermercado Pão & Cia')).not.toBeInTheDocument())
    await pessoa.click(screen.getByRole('button', { name: 'Excluir Freela atualizado' }))
    const modalExcluir = await screen.findByRole('dialog', { name: 'Excluir transação?' })
    await pessoa.click(within(modalExcluir).getByRole('button', { name: 'Excluir transação' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Transação excluída.')
  })

  it('cria, renomeia e exclui uma categoria personalizada', async () => {
    const pessoa = usuario.setup()
    renderizar('/app/categorias')
    await screen.findByText('Mercado')

    await pessoa.click(screen.getByRole('button', { name: 'Nova categoria' }))
    let modal = await screen.findByRole('dialog', { name: 'Nova categoria' })
    await pessoa.type(within(modal).getByLabelText('Nome'), 'Assinaturas')
    await pessoa.click(within(modal).getByRole('button', { name: 'Criar categoria' }))
    expect(await screen.findByText('Assinaturas')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Editar Assinaturas' }))
    modal = await screen.findByRole('dialog', { name: 'Editar categoria' })
    const nome = within(modal).getByLabelText('Nome')
    await pessoa.clear(nome)
    await pessoa.type(nome, 'Serviços digitais')
    await pessoa.click(within(modal).getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('Serviços digitais')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Excluir Serviços digitais' }))
    modal = await screen.findByRole('dialog', { name: 'Excluir categoria?' })
    await pessoa.click(within(modal).getByRole('button', { name: 'Excluir categoria' }))
    await waitFor(() => expect(screen.queryByText('Serviços digitais')).not.toBeInTheDocument())
  })
})
