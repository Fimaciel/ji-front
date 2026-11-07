import { expect, test } from '@playwright/test'

const SENHA_DEMONSTRACAO = 'Ji@12345'

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/entrar')
  await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
}

test.describe('dashboard e orçamentos da Sprint 4', () => {
  test('apresenta o resumo e gerencia um limite mensal', async ({ page }) => {
    await entrar(page)
    await expect(page.getByText('R$ 3.315,50')).toBeVisible()
    await expect(page.getByRole('img', {
      name: 'Evolução acumulada de entradas e saídas no mês',
    })).toBeVisible()
    await expect(page.getByText('Supermercado Pão & Cia')).toBeVisible()

    await page.getByRole('link', { name: 'Orçamentos' }).click()
    await expect(page.getByRole('heading', { name: 'Orçamentos', exact: true })).toBeVisible()
    await expect(page.getByText('Atenção: 80% atingido')).toBeVisible()
    await page.getByRole('button', { name: 'Novo orçamento' }).click()
    let modal = page.getByRole('dialog', { name: 'Novo orçamento' })
    await modal.getByLabel('Categoria').selectOption({ label: 'Alimentação' })
    await modal.getByLabel('Limite mensal').fill('450,00')
    await modal.getByRole('button', { name: 'Criar orçamento' }).click()
    await expect(page.getByRole('status')).toContainText('Orçamento criado.')
    await expect(page.getByText('Alimentação')).toBeVisible()

    await page.getByRole('button', { name: 'Editar orçamento de Alimentação' }).click()
    modal = page.getByRole('dialog', { name: 'Editar orçamento' })
    await modal.getByLabel('Limite mensal').fill('500,00')
    await modal.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByRole('status')).toContainText('Orçamento atualizado.')

    await page.getByRole('button', { name: 'Excluir orçamento de Alimentação' }).click()
    modal = page.getByRole('dialog', { name: 'Excluir orçamento?' })
    await modal.getByRole('button', { name: 'Excluir orçamento' }).click()
    await expect(page.getByRole('status')).toContainText('Orçamento excluído.')
  })
})
