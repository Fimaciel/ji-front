import { useEffect, useMemo, useState } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { IconeDownload } from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { dataLocalIso } from '../servicos/dataLocal'
import { servicoFinanceiro } from '../servicos/instanciaAutenticacao'
import { ErroApi } from '../tipos/api'
import type { Categoria, FiltrosRelatorio, FormatoRelatorio, RelatorioResumo } from '../tipos/financeiro'
import estilos from './ImportacoesRelatorios.module.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
type Feedback = { tom: 'erro' | 'informativa'; texto: string }

function inicioDoMes() {
  return `${dataLocalIso().slice(0, 7)}-01`
}

const filtrosIniciais: FiltrosRelatorio = {
  dataInicial: inicioDoMes(),
  dataFinal: dataLocalIso(),
}

export function TelaRelatorios() {
  const { sessao } = useAutenticacao()
  const [categorias, definirCategorias] = useState<Categoria[]>([])
  const [filtros, definirFiltros] = useState<FiltrosRelatorio>(filtrosIniciais)
  const [consolidar, definirConsolidar] = useState(false)
  const [contextos, definirContextos] = useState<Set<string>>(new Set(sessao?.contextos.map((item) => item.id)))
  const [relatorio, definirRelatorio] = useState<RelatorioResumo | null>(null)
  const [carregando, definirCarregando] = useState(true)
  const [exportando, definirExportando] = useState<FormatoRelatorio | null>(null)
  const [feedback, definirFeedback] = useState<Feedback | null>(null)

  const filtrosAtuais = useMemo(() => ({
    ...filtros,
    contextoIds: consolidar ? [...contextos] : undefined,
  }), [filtros, consolidar, contextos])
  const selecaoContextoInvalida = consolidar && contextos.size === 0

  async function carregar(filtrosSelecionados = filtrosAtuais) {
    definirCarregando(true)
    definirFeedback(null)
    try {
      definirRelatorio(await servicoFinanceiro.obterRelatorio(filtrosSelecionados))
    } catch (erro) {
      definirRelatorio(null)
      definirFeedback({ tom: 'erro', texto: erro instanceof ErroApi ? erro.message : 'Não foi possível gerar o relatório.' })
    } finally {
      definirCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    Promise.all([
      servicoFinanceiro.listarCategorias(),
      servicoFinanceiro.obterRelatorio(filtrosIniciais),
    ]).then(([listaCategorias, resumo]) => {
      if (!ativo) return
      definirCategorias(listaCategorias)
      definirRelatorio(resumo)
    }).catch((erro) => {
      if (!ativo) return
      definirFeedback({
        tom: 'erro',
        texto: erro instanceof ErroApi ? erro.message : 'Não foi possível gerar o relatório.',
      })
    }).finally(() => {
      if (ativo) definirCarregando(false)
    })
    return () => { ativo = false }
  }, [])

  function alternarContexto(id: string, marcado: boolean) {
    definirContextos((atuais) => {
      const proximos = new Set(atuais)
      if (marcado) proximos.add(id)
      else proximos.delete(id)
      return proximos
    })
  }

  async function exportar(formato: FormatoRelatorio) {
    definirExportando(formato)
    definirFeedback(null)
    try {
      const arquivo = await servicoFinanceiro.exportarRelatorio(filtrosAtuais, formato)
      const url = URL.createObjectURL(arquivo.conteudo)
      const link = document.createElement('a')
      link.href = url
      link.download = arquivo.nome
      link.click()
      URL.revokeObjectURL(url)
    } catch (erro) {
      definirFeedback({ tom: 'erro', texto: erro instanceof ErroApi ? erro.message : 'Não foi possível exportar o relatório.' })
    } finally {
      definirExportando(null)
    }
  }

  const maiorCategoria = Math.max(...(relatorio?.categorias.map((item) => item.total) ?? [0]), 1)

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <div>
          <p>Análise financeira</p>
          <h1>Relatórios</h1>
          <span>Consulte o período e exporte os dados em PDF ou XLSX.</span>
        </div>
        <div className={estilos.acoesExportacao}>
          <Botao variante="secundario" icone={<IconeDownload tamanho={15} />} carregando={exportando === 'PDF'} disabled={!relatorio?.quantidadeTransacoes || selecaoContextoInvalida} onClick={() => exportar('PDF')}>PDF</Botao>
          <Botao variante="secundario" icone={<IconeDownload tamanho={15} />} carregando={exportando === 'XLSX'} disabled={!relatorio?.quantidadeTransacoes || selecaoContextoInvalida} onClick={() => exportar('XLSX')}>XLSX</Botao>
        </div>
      </header>

      {feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}

      <section className={estilos.filtros} aria-label="Filtros do relatório">
        <label className={estilos.campo}><span>De</span><input type="date" max={dataLocalIso()} value={filtros.dataInicial} onChange={(evento) => definirFiltros((atuais) => ({ ...atuais, dataInicial: evento.target.value }))} /></label>
        <label className={estilos.campo}><span>Até</span><input type="date" max={dataLocalIso()} value={filtros.dataFinal} onChange={(evento) => definirFiltros((atuais) => ({ ...atuais, dataFinal: evento.target.value }))} /></label>
        <label className={estilos.campo}><span>Tipo</span><select value={filtros.tipo ?? ''} onChange={(evento) => definirFiltros((atuais) => ({ ...atuais, tipo: evento.target.value as FiltrosRelatorio['tipo'] || undefined }))}><option value="">Todos</option><option value="ENTRADA">Entradas</option><option value="SAIDA">Saídas</option></select></label>
        <label className={estilos.campo}><span>Categoria</span><select value={filtros.categoriaId ?? ''} onChange={(evento) => definirFiltros((atuais) => ({ ...atuais, categoriaId: evento.target.value || undefined }))}><option value="">Todas</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label>
        <Botao carregando={carregando} disabled={selecaoContextoInvalida} onClick={() => carregar()}>Aplicar filtros</Botao>
        {sessao && sessao.contextos.length > 1 ? (
          <div className={estilos.contextos}>
            <label><input type="checkbox" checked={consolidar} onChange={(evento) => definirConsolidar(evento.target.checked)} /> Consolidar contextos</label>
            {consolidar ? sessao.contextos.map((contexto) => <label key={contexto.id}><input type="checkbox" checked={contextos.has(contexto.id)} onChange={(evento) => alternarContexto(contexto.id, evento.target.checked)} /> {contexto.nome}</label>) : null}
          </div>
        ) : null}
      </section>

      {carregando ? <div className={estilos.estado} role="status">Gerando relatório…</div> : relatorio ? (
        <>
          <section className={estilos.faixaResumo} aria-label="Resumo do relatório">
            <div className={estilos.saldo}><span>Saldo no período</span><strong className={relatorio.saldo < 0 ? estilos.negativo : ''}>{moeda.format(relatorio.saldo)}</strong></div>
            <div className={estilos.indicador}><span>Entradas</span><strong className={estilos.positivo}>{moeda.format(relatorio.totalEntradas)}</strong></div>
            <div className={estilos.indicador}><span>Saídas</span><strong className={estilos.negativo}>{moeda.format(relatorio.totalSaidas)}</strong></div>
            <div className={estilos.indicador}><span>Movimentações</span><strong>{relatorio.quantidadeTransacoes}</strong></div>
          </section>

          {relatorio.quantidadeTransacoes === 0 ? <div className={estilos.estado}>Nenhuma movimentação encontrada nesse período.</div> : (
            <div className={estilos.gradeRelatorio}>
              <section className={estilos.painel}>
                <header className={estilos.secaoTitulo}><p>Distribuição dos valores</p><h2>Movimentação por categoria</h2></header>
                <div className={estilos.barras}>{relatorio.categorias.map((item) => (
                  <article className={estilos.barra} key={item.categoria}>
                    <div><span>{item.categoria} · {item.quantidade} registro(s)</span><strong>{moeda.format(item.total)}</strong></div>
                    <span><i style={{ width: `${Math.max((item.total / maiorCategoria) * 100, 2)}%` }} /></span>
                  </article>
                ))}</div>
              </section>
              <aside className={estilos.historico}>
                <header className={estilos.secaoTitulo}><p>Escopo consultado</p><h2>Contextos</h2></header>
                <ol className={estilos.listaHistorico}>{relatorio.contextos.map((contexto) => <li key={contexto}><strong>{contexto}</strong></li>)}</ol>
              </aside>
            </div>
          )}

          {relatorio.transacoes.length > 0 ? (
            <section className={estilos.painel} style={{ marginTop: 28 }}>
              <header className={estilos.secaoTitulo}><p>Registros incluídos</p><h2>Detalhamento</h2></header>
              <div className={estilos.tabelaRolagem}><table className={estilos.tabela}><thead><tr><th>Data</th><th>Descrição</th><th>Contexto</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>{relatorio.transacoes.slice(0, 50).map((item) => <tr key={item.id}><td>{new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR')}</td><td><strong>{item.descricao}</strong></td><td>{item.contexto}</td><td>{item.categoria}</td><td>{item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</td><td>{moeda.format(item.valor)}</td></tr>)}</tbody></table></div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
