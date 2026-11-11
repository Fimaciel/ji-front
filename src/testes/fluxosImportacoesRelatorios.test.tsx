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

function renderizar(caminho: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <ProvedorAutenticacao><ProvedorTema><App /></ProvedorTema></ProvedorAutenticacao>
    </MemoryRouter>,
  )
}

describe('importações e relatórios', () => {
  beforeEach(async () => {
    reiniciarAutenticacaoMock()
    reiniciarFinanceiroMock()
    await servicoAutenticacao.entrar({
      email: 'filipe.lopes@email.com', senha: 'Ji@12345', lembrar: false,
    })
  })

  it('revisa, confirma e desfaz uma importação', async () => {
    const pessoa = usuario.setup()
    renderizar('/app/importacoes')
    const entrada = await screen.findByLabelText(/Selecionar arquivo/i)
    await pessoa.upload(entrada, new File(['extrato'], 'extrato.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))
    await pessoa.click(screen.getByRole('button', { name: 'Analisar arquivo' }))

    expect(await screen.findByText('Mercado importado')).toBeInTheDocument()
    await pessoa.click(screen.getByRole('button', { name: 'Confirmar importação' }))
    expect(await screen.findByRole('status')).toHaveTextContent('2 transações importadas')
    expect(screen.getByText('extrato.xlsx')).toBeInTheDocument()

    await pessoa.click(screen.getByRole('button', { name: 'Desfazer última' }))
    const modal = await screen.findByRole('dialog', { name: 'Desfazer a última importação?' })
    await pessoa.click(within(modal).getByRole('button', { name: 'Desfazer importação' }))
    expect(await screen.findByRole('status')).toHaveTextContent('última importação foi desfeita')
  })

  it('aplica filtros e mostra o relatório financeiro', async () => {
    const pessoa = usuario.setup()
    renderizar('/app/relatorios')

    expect(await screen.findByText('Mercado · 1 registro(s)')).toBeInTheDocument()
    expect(screen.getByText((_, elemento) => elemento?.tagName === 'STRONG'
      && (elemento.textContent?.includes('3.315,50') ?? false)))
      .toBeInTheDocument()
    await pessoa.selectOptions(screen.getByLabelText('Tipo'), 'SAIDA')
    await pessoa.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    await waitFor(() => expect(screen.getAllByText((_, elemento) => elemento?.tagName === 'STRONG'
      && (elemento.textContent?.includes('184,50') ?? false)).length).toBeGreaterThan(0))
    expect(screen.getByRole('button', { name: 'PDF' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'XLSX' })).toBeEnabled()
  })
})
