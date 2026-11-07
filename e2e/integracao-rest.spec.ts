import { expect, test, type APIRequestContext } from '@playwright/test'

const executarIntegrado = process.env.E2E_REST === 'true'
const urlMailpit = process.env.MAILPIT_URL ?? 'http://127.0.0.1:8025'

async function aguardarTokenEmail(request: APIRequestContext, email: string) {
  await expect.poll(async () => {
    const resposta = await request.get(`${urlMailpit}/api/v1/messages`)
    if (!resposta.ok()) return ''
    const dados = await resposta.json() as {
      messages?: Array<{ ID: string; To?: Array<{ Address?: string }> }>
    }
    return dados.messages?.find((mensagem) =>
      mensagem.To?.some((destinatario) => destinatario.Address === email),
    )?.ID ?? ''
  }, { timeout: 15_000 }).not.toBe('')

  const lista = await (await request.get(`${urlMailpit}/api/v1/messages`)).json() as {
    messages: Array<{ ID: string; To?: Array<{ Address?: string }> }>
  }
  const id = lista.messages.find((mensagem) =>
    mensagem.To?.some((destinatario) => destinatario.Address === email),
  )?.ID
  if (!id) throw new Error('Mensagem de recuperação não encontrada no Mailpit.')
  const mensagem = await (await request.get(`${urlMailpit}/api/v1/message/${id}`)).json() as {
    Text?: string
    HTML?: string
  }
  const conteudo = `${mensagem.Text ?? ''}\n${mensagem.HTML ?? ''}`
  const correspondencia = conteudo.match(/token=([^\s"'<>]+)/)
  if (!correspondencia) throw new Error('Token de recuperação não encontrado na mensagem.')
  return decodeURIComponent(correspondencia[1])
}

test.describe('fluxo REST integrado com back-end e Mailpit', () => {
  test.skip(!executarIntegrado, 'Execute com E2E_REST=true e o ambiente Docker ativo.')

  test('cadastra, configura a conta e valida recuperação por e-mail', async ({ page, request }, testInfo) => {
    const sufixo = `${testInfo.project.name.replace(/\W/g, '-')}-${Date.now()}`
    const email = `e2e-${sufixo}@example.com`
    const senha = 'SenhaSegura123'

    await page.goto('/cadastro')
    await page.getByLabel('Nome', { exact: true }).fill('Pessoa')
    await page.getByLabel('Sobrenome', { exact: true }).fill('E2E')
    await page.getByLabel('E-mail', { exact: true }).fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(senha)
    await page.getByRole('checkbox', { name: /Li e aceito os/i }).check()
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible()
    await page.getByLabel('E-mail', { exact: true }).fill(email)
    await page.getByLabel('Senha', { exact: true }).fill(senha)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.getByRole('link', { name: 'Configurações' }).first().click()

    await page.getByLabel('Salário mensal').fill('725050')
    await page.getByRole('button', { name: 'Revisar e salvar' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Salvar configurações' }).click()
    await expect(page.getByRole('status')).toContainText('Configurações financeiras salvas.')
    await page.getByRole('radio', { name: /Escuro/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro')

    const categoria = `Cursos ${Date.now()}`
    await page.getByRole('link', { name: 'Categorias' }).click()
    await page.getByRole('button', { name: 'Nova categoria' }).click()
    let modal = page.getByRole('dialog', { name: 'Nova categoria' })
    await modal.getByLabel('Nome').fill(categoria)
    await modal.getByRole('button', { name: 'Criar categoria' }).click()
    await expect(page.getByText(categoria, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Transações' }).click()
    await page.getByRole('button', { name: 'Nova transação' }).click()
    modal = page.getByRole('dialog', { name: 'Nova transação' })
    await modal.getByLabel('Valor').fill('120,50')
    await modal.getByLabel('Categoria').selectOption({ label: categoria })
    await modal.getByLabel('Descrição').fill('Curso integrado')
    await modal.getByRole('button', { name: 'Salvar transação' }).click()
    await expect(page.getByText('Curso integrado')).toBeVisible()

    await page.getByRole('link', { name: 'Orçamentos' }).click()
    await page.getByRole('button', { name: 'Novo orçamento' }).click()
    modal = page.getByRole('dialog', { name: 'Novo orçamento' })
    await modal.getByLabel('Categoria').selectOption({ label: categoria })
    await modal.getByLabel('Limite mensal').fill('100,00')
    await modal.getByRole('button', { name: 'Criar orçamento' }).click()
    await expect(page.getByText('Limite excedido')).toBeVisible()

    await page.getByRole('link', { name: 'Visão geral' }).click()
    await expect(page.getByText('Curso integrado')).toBeVisible()
    await expect(page.getByText('R$ 120,50').last()).toBeVisible()

    await page.getByLabel('Abrir menu do usuário').click()
    await page.getByRole('button', { name: 'Sair' }).click()
    await page.goto('/recuperar-senha')
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: 'Enviar link de recuperação' }).click()
    await expect(page.getByRole('heading', { name: 'Link enviado' })).toBeVisible()

    const token = await aguardarTokenEmail(request, email)
    await page.goto(`/redefinir-senha?token=${encodeURIComponent(token)}`)
    await expect(page.getByRole('heading', { name: 'Defina uma nova senha' })).toBeVisible()
  })
})
