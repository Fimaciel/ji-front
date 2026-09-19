import { expect, test } from '@playwright/test'

const SENHA_DEMONSTRACAO = 'Ji@12345'

test.describe('autenticação da Sprint 1', () => {
  test('faz um cadastro completo e entra com a conta criada', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByLabel('Nome', { exact: true }).fill('Ana')
    await page.getByLabel('Sobrenome', { exact: true }).fill('Silva')
    await page.getByLabel('CPF (opcional)').fill('52998224725')
    await page.getByLabel('Data de nascimento (opcional)').fill('1994-06-15')
    await page.getByLabel('E-mail').fill('ana.silva@email.com')
    await page.getByLabel('Senha').fill('Senha123')
    await page.getByRole('checkbox', { name: /Li e aceito os/i }).check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByRole('status')).toContainText('Conta criada.')
    await page.getByLabel('E-mail').fill('ana.silva@email.com')
    await page.getByLabel('Senha').fill('Senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('heading', { name: 'Sua conta está pronta' })).toBeVisible()
    await expect(page.getByLabel('Contexto ativo')).toContainText('Pessoal')
  })

  test('bloqueia cadastro inválido com mensagens por campo', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByRole('button', { name: 'Termos de uso' }).click()
    await expect(page.getByRole('status')).toContainText('conteúdo será disponibilizado')
    await expect(page.getByRole('checkbox', { name: /Li e aceito os/i })).not.toBeChecked()
    await page.getByRole('checkbox', { name: /Li e aceito os/i }).check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Informe seu nome.')).toBeVisible()
    await expect(page.getByText('Informe seu sobrenome.')).toBeVisible()
    await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
    await expect(page.getByText('Use pelo menos 8 caracteres.')).toBeVisible()
    await expect(page.getByLabel('Nome', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })

  test('trata login válido e inválido sem revelar qual credencial falhou', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel('E-mail').fill('ninguem@email.com')
    await page.getByLabel('Senha').fill('Senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toHaveText(
      'Não foi possível entrar. Confira o e-mail e a senha.',
    )

    await page.getByLabel('E-mail').fill('filipe.lopes@email.com')
    await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { name: 'Sua conta está pronta' })).toBeVisible()
  })

  test('recupera, redefine e invalida o link utilizado', async ({ page }) => {
    await page.goto('/recuperar-senha')
    await page.getByLabel('E-mail').fill('filipe.lopes@email.com')
    await page.getByRole('button', { name: 'Enviar link de recuperação' }).click()

    await expect(page.getByRole('heading', { name: 'Link enviado' })).toBeVisible()
    await expect(page.getByText('Modo demonstração')).toBeVisible()
    await page.getByRole('link', { name: 'Simular abertura do link recebido' }).click()

    await expect(page.getByRole('heading', { name: 'Defina uma nova senha' })).toBeVisible()
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123')
    await page.getByLabel('Confirmar senha', { exact: true }).fill('NovaSenha123')
    await page.getByRole('button', { name: 'Salvar nova senha' }).click()
    await expect(page.getByRole('status')).toContainText('Senha alterada.')

    await page.evaluate(() => {
      window.history.pushState({}, '', '/redefinir-senha?token=token-demonstracao-valido')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.getByText(/Este link já foi utilizado/)).toBeVisible()
  })

  test('habilita o reenvio depois de sessenta segundos', async ({ page }) => {
    await page.clock.install()
    await page.goto('/recuperar-senha')
    await page.getByRole('button', { name: 'Enviar link de recuperação' }).click()
    await page.clock.runFor(200)

    const botaoReenvio = page.getByRole('button', { name: /reenviar em/i })
    await expect(botaoReenvio).toBeDisabled()
    await page.clock.runFor(60_000)
    await expect(page.getByRole('button', { name: 'reenviar agora' })).toBeEnabled()
    await page.getByRole('button', { name: 'reenviar agora' }).click()
    await page.clock.runFor(200)
    await expect(page.getByRole('button', { name: /reenviar em 60s/i })).toBeDisabled()
  })

  test('mostra um link expirado sem exibir o formulário', async ({ page }) => {
    await page.goto('/redefinir-senha?token=token-demonstracao-expirado')
    await expect(page.getByText(/Este link expirou/)).toBeVisible()
    await expect(page.getByLabel('Nova senha')).toHaveCount(0)
  })

  test('protege a área interna e faz logout', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL(/\/entrar$/)

    await page.getByLabel('Senha').fill(SENHA_DEMONSTRACAO)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/app$/)
    await page.getByLabel('Abrir menu do usuário').click()
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/entrar$/)

    await page.goto('/app')
    await expect(page).toHaveURL(/\/entrar$/)
  })

  test('permite navegação por teclado, mostra foco e anuncia erros', async ({ page }) => {
    await page.goto('/entrar')
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('E-mail')).toBeFocused()
    await expect(page.getByLabel('E-mail')).toHaveCSS('outline-style', 'solid')

    await page.getByLabel('E-mail').fill('ninguem@email.com')
    await page.getByLabel('Senha').fill('Senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.locator('[role="alert"]')).toContainText(
      'Não foi possível entrar. Confira o e-mail e a senha.',
    )
  })
})
