import { expect, test } from '@playwright/test'

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/entrar')
  await page.getByLabel('Senha').fill('Ji@12345')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
}

test.describe('importações e relatórios', () => {
  test('revisa uma planilha e consulta o relatório', async ({ page }) => {
    await entrar(page)
    await page.getByRole('link', { name: 'Importar transações' }).click()
    await page.getByLabel(/Selecionar arquivo/).setInputFiles({
      name: 'extrato.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('arquivo demonstrativo'),
    })
    await page.getByRole('button', { name: 'Analisar arquivo' }).click()
    await expect(page.getByText('Mercado importado')).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar importação' }).click()
    await expect(page.getByRole('status')).toContainText('2 transações importadas')

    await page.getByRole('link', { name: 'Relatórios' }).click()
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible()
    await expect(page.getByText('Movimentação por categoria')).toBeVisible()
    await expect(page.getByRole('button', { name: 'PDF' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'XLSX' })).toBeEnabled()
  })
})
