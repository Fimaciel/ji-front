import { expect, test } from '@playwright/test'

const SENHA_DEMONSTRACAO = 'Ji@12345'

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/entrar')
  await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
}

test.describe('contextos e convites da Sprint 5', () => {
  test('cria, seleciona e acessa convite por link', async ({ page }) => {
    await entrar(page)
    await page.getByRole('link', { name: 'Contextos' }).click()
    await page.getByLabel('Nome do contexto').fill('Casa compartilhada')
    await page.getByRole('button', { name: 'Criar contexto' }).click()
    await expect(page.getByText('Casa compartilhada').last()).toBeVisible()

    await page.getByLabel('Abrir menu do usuário').click()
    await page.getByRole('button', { name: 'Sair' }).click()
    await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { name: 'Onde você quer entrar?' })).toBeVisible()
    await page.getByText('Casa compartilhada').click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByLabel('Contexto ativo')).toContainText('Casa compartilhada')

    await page.goto('/convite/convite-demonstracao')
    await expect(page.getByRole('heading', { name: 'Família Oliveira' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aceitar convite' })).toBeVisible()
  })
})
