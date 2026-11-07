import { expect, test } from '@playwright/test'

const SENHA_DEMONSTRACAO = 'Ji@12345'

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/entrar')
  await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
}

test.describe('transações e categorias da Sprint 3', () => {
  test('gerencia uma categoria e uma transação no contexto ativo', async ({ page }) => {
    await entrar(page)

    await page.getByRole('link', { name: 'Categorias' }).click()
    await expect(page.getByRole('heading', { name: 'Categorias', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Nova categoria' }).click()
    let modal = page.getByRole('dialog', { name: 'Nova categoria' })
    await modal.getByLabel('Nome').fill('Cursos')
    await modal.getByRole('button', { name: 'Criar categoria' }).click()
    await expect(page.getByText('Cursos', { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Transações' }).click()
    await expect(page.getByRole('heading', { name: 'Transações', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Nova transação' }).click()
    modal = page.getByRole('dialog', { name: 'Nova transação' })
    await modal.getByText('Saída', { exact: true }).click()
    await modal.getByLabel('Valor').fill('120,50')
    await modal.getByLabel('Categoria').selectOption({ label: 'Cursos' })
    await modal.getByLabel('Descrição').fill('Curso de Java')
    await modal.getByRole('button', { name: 'Salvar transação' }).click()
    await expect(page.getByRole('status')).toContainText('Transação cadastrada.')
    await expect(page.getByText('Curso de Java')).toBeVisible()

    await page.getByRole('button', { name: 'Editar Curso de Java' }).click()
    modal = page.getByRole('dialog', { name: 'Editar transação' })
    await modal.getByLabel('Descrição').fill('Curso de Java atualizado')
    await modal.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByText('Curso de Java atualizado')).toBeVisible()

    await page.getByRole('button', { name: 'Excluir Curso de Java atualizado' }).click()
    modal = page.getByRole('dialog', { name: 'Excluir transação?' })
    await modal.getByRole('button', { name: 'Excluir transação' }).click()
    await expect(page.getByRole('status')).toContainText('Transação excluída.')
  })
})
