import { beforeEach, describe, expect, it } from 'vitest'
import { ServicoFinanceiroMock, reiniciarFinanceiroMock } from '../mocks/ServicoFinanceiroMock'
import { dataLocalIso } from '../servicos/dataLocal'

const hoje = dataLocalIso()

describe('serviço financeiro mock', () => {
  const servico = new ServicoFinanceiroMock()

  beforeEach(() => reiniciarFinanceiroMock())

  it('gerencia categorias personalizadas e protege nomes já disponíveis', async () => {
    const iniciais = await servico.listarCategorias()
    expect(iniciais.filter((categoria) => categoria.tipo === 'PADRAO')).toHaveLength(6)

    const categoria = await servico.criarCategoria('  Assinaturas  ')
    expect(categoria).toMatchObject({ nome: 'Assinaturas', tipo: 'PERSONALIZADA' })
    await expect(servico.criarCategoria('alimentação')).rejects.toMatchObject({
      codigo: 'categoria-nome-em-uso',
    })

    const editada = await servico.editarCategoria(categoria.id, 'Serviços digitais')
    expect(editada.nome).toBe('Serviços digitais')
    await servico.excluirCategoria(categoria.id)
    expect(await servico.listarCategorias()).not.toContainEqual(expect.objectContaining({
      id: categoria.id,
    }))
  })

  it('cadastra, filtra, edita e exclui transações', async () => {
    const categoria = (await servico.listarCategorias()).find((item) => item.nome === 'Lazer')!
    const criada = await servico.criarTransacao({
      tipo: 'SAIDA', valor: 49.9, data: hoje,
      categoriaId: categoria.id, descricao: 'Cinema',
    })

    const filtradas = await servico.listarTransacoes({ tipo: 'SAIDA', busca: 'cinema' })
    expect(filtradas.itens).toContainEqual(expect.objectContaining({ id: criada.id }))

    const editada = await servico.editarTransacao(criada.id, {
      tipo: 'SAIDA', valor: 39.9, data: hoje,
      categoriaId: categoria.id, descricao: 'Cinema promocional',
    })
    expect(editada).toMatchObject({ valor: 39.9, descricao: 'Cinema promocional' })

    await servico.excluirTransacao(criada.id)
    expect((await servico.listarTransacoes({ busca: 'promocional' })).totalItens).toBe(0)
  })

  it('arquiva categoria usada para novos lançamentos e preserva o histórico', async () => {
    const categoria = (await servico.listarCategorias()).find((item) => item.nome === 'Mercado')!
    await servico.excluirCategoria(categoria.id)

    expect(await servico.listarCategorias()).not.toContainEqual(expect.objectContaining({
      id: categoria.id,
    }))
    expect((await servico.listarTransacoes({ busca: 'supermercado' })).itens[0].categoria.nome)
      .toBe('Mercado')
    await expect(servico.criarTransacao({
      tipo: 'SAIDA', valor: 10, data: hoje,
      categoriaId: categoria.id, descricao: 'Novo lançamento',
    })).rejects.toMatchObject({ codigo: 'categoria-indisponivel' })
  })

  it('calcula o dashboard a partir das transações do mês', async () => {
    const dashboard = await servico.obterDashboard(hoje.slice(0, 7))

    expect(dashboard.totalEntradas).toBe(3500)
    expect(dashboard.totalSaidas).toBe(184.5)
    expect(dashboard.saldo).toBe(3315.5)
    expect(dashboard.principaisCategorias[0]).toMatchObject({
      categoriaNome: 'Mercado', total: 184.5, percentual: 100,
    })
    expect(dashboard.transacoesRecentes[0].descricao).toBe('Supermercado Pão & Cia')
  })

  it('gerencia orçamentos e recalcula os alertas pelo consumo', async () => {
    const mes = hoje.slice(0, 7)
    const iniciais = await servico.listarOrcamentos(mes)
    expect(iniciais.itens.find((item) => item.categoria.nome === 'Mercado'))
      .toMatchObject({ valorConsumido: 184.5, situacao: 'ATENCAO' })

    const alimentacao = (await servico.listarCategorias())
      .find((categoria) => categoria.nome === 'Alimentação')!
    const criado = await servico.criarOrcamento({
      categoriaId: alimentacao.id, valorLimite: 100, mesReferencia: mes,
    })
    expect(criado).toMatchObject({ valorLimite: 100, situacao: 'NORMAL' })
    await expect(servico.criarOrcamento({
      categoriaId: alimentacao.id, valorLimite: 200, mesReferencia: mes,
    })).rejects.toMatchObject({ codigo: 'orcamento-duplicado' })

    await servico.criarTransacao({
      tipo: 'SAIDA', valor: 120, data: hoje,
      categoriaId: alimentacao.id, descricao: 'Feira',
    })
    expect((await servico.listarOrcamentos(mes)).itens
      .find((item) => item.id === criado.id)?.situacao).toBe('EXCEDIDO')

    const editado = await servico.editarOrcamento(criado.id, {
      categoriaId: alimentacao.id, valorLimite: 200, mesReferencia: mes,
    })
    expect(editado.situacao).toBe('NORMAL')
    await servico.excluirOrcamento(criado.id)
    expect((await servico.listarOrcamentos(mes)).itens)
      .not.toContainEqual(expect.objectContaining({ id: criado.id }))
  })

  it('analisa, confirma e desfaz importações e gera relatórios', async () => {
    const analise = await servico.analisarImportacao(new File(['extrato'], 'extrato.xlsx'))
    expect(analise).toMatchObject({ formato: 'XLSX', totalNovos: 2 })

    const importacao = await servico.confirmarImportacao({
      nomeArquivo: analise.nomeArquivo,
      formato: analise.formato,
      totalLidos: analise.totalLidos,
      totalDuplicados: analise.totalDuplicados,
      registros: analise.registros.map((item) => ({
        data: item.data,
        descricao: item.descricao,
        valor: item.valor,
        tipo: item.tipo,
        categoriaId: item.categoriaSugerida.id,
      })),
    })
    expect(importacao).toMatchObject({ status: 'CONCLUIDA', totalImportados: 2 })

    const relatorio = await servico.obterRelatorio({
      dataInicial: '2000-01-01', dataFinal: hoje,
    })
    expect(relatorio.quantidadeTransacoes).toBe(4)
    await expect(servico.exportarRelatorio({
      dataInicial: '2000-01-01', dataFinal: hoje,
    }, 'PDF')).resolves.toMatchObject({ nome: 'relatorio-ji.pdf' })

    await expect(servico.desfazerUltimaImportacao()).resolves.toMatchObject({ status: 'DESFEITA' })
    expect((await servico.listarTransacoes()).totalItens).toBe(2)
  })
})
