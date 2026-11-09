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

test.describe('colaboração da Sprint 6', () => {
  test('gerencia convite e dependente no contexto compartilhado', async ({ page }) => {
    await entrar(page)
    await page.getByRole('link', { name: 'Contextos' }).click()
    await page.getByLabel('Nome do contexto').fill('Casa em conjunto')
    await page.getByRole('button', { name: 'Criar contexto' }).click()
    await page.getByRole('button', { name: 'Selecionar' }).click()
    await page.getByRole('link', { name: 'Equipe do contexto' }).click()

    await expect(page.getByText('Filipe Maciel Lopes (você)')).toBeVisible()
    await page.getByRole('tab', { name: 'Convites enviados' }).click()
    await page.getByLabel('E-mail').fill('colaborador@email.com')
    await page.getByRole('button', { name: 'Enviar convite' }).click()
    await expect(page.getByText('Convite enviado com validade de sete dias.')).toBeVisible()

    await page.getByRole('tab', { name: 'Dependentes' }).click()
    await page.getByLabel('Nome').fill('Ana Maciel')
    await page.getByLabel('Data de nascimento').fill('2015-04-10')
    await page.getByRole('button', { name: 'Cadastrar dependente' }).click()
    await expect(page.getByText('Dependente cadastrado.')).toBeVisible()
    await expect(page.getByText('Ana Maciel')).toBeVisible()
  })
})
