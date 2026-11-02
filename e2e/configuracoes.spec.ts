import { expect, test } from '@playwright/test'

const SENHA_DEMONSTRACAO = 'Ji@12345'

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/entrar')
  await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('link', { name: 'Configurações' }).first().click()
  await expect(page.getByRole('heading', { name: 'Configurações', exact: true })).toBeVisible()
}

test.describe('configurações da Sprint 2', () => {
  test('edita perfil, configura salário, tema e restaura o padrão', async ({ page }) => {
    await entrar(page)

    await page.getByLabel('Nome', { exact: true }).fill('Filipe atualizado')
    await page.getByLabel('Senha atual').fill(SENHA_DEMONSTRACAO)
    await page.getByRole('button', { name: 'Salvar perfil' }).click()
    await expect(page.getByRole('status')).toContainText('Perfil atualizado.')

    await page.getByLabel('Salário mensal').fill('528045')
    await page.getByLabel('Ativar notificações por e-mail').uncheck()
    await page.getByRole('button', { name: 'Revisar e salvar' }).click()
    const modalSalvar = page.getByRole('dialog', { name: 'Salvar configurações?' })
    await expect(modalSalvar).toContainText('R$ 5.280,45')
    await modalSalvar.getByRole('button', { name: 'Salvar configurações' }).click()
    await expect(page.getByRole('status')).toContainText('Configurações financeiras salvas.')

    await page.getByRole('radio', { name: /Escuro/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro')
    await page.getByRole('button', { name: 'Restaurar padrão' }).click()
    const modalRestaurar = page.getByRole('dialog', { name: 'Restaurar configurações?' })
    await modalRestaurar.getByRole('button', { name: 'Restaurar padrão' }).click()
    await expect(page.getByLabel('Salário mensal')).toHaveValue('0,00')
  })

  test('mantém o encerramento bloqueado até digitar EXCLUIR', async ({ page }) => {
    await entrar(page)

    await page.getByRole('button', { name: 'Encerrar conta' }).click()
    const modal = page.getByRole('dialog', { name: 'Encerrar sua conta?' })
    await expect(modal).toContainText('dados serão preservados, não removidos')
    await expect(modal.getByRole('button', { name: 'Encerrar conta' })).toBeDisabled()
    await modal.getByLabel('Digite EXCLUIR para confirmar').fill('EXCLUIR')
    await modal.getByRole('button', { name: 'Encerrar conta' }).click()

    await expect(page).toHaveURL(/\/entrar$/)
    await expect(page.getByRole('status')).toContainText('Conta encerrada')
    const chavesJi = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ].filter((chave) => chave.startsWith('ji:')))
    expect(chavesJi).toEqual([])
  })
})
