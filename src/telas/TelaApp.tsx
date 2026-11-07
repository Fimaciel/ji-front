import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import {
  IconeCarteira,
  IconeMais,
  IconeSetaBaixo,
  IconeSetaCima,
  IconeTransacoes,
} from '../componentes/Icones'
import { servicoFinanceiro } from '../servicos/instanciaAutenticacao'
import { dataLocalIso } from '../servicos/dataLocal'
import type { DashboardResumo, FluxoDiario } from '../tipos/financeiro'
import estilos from './TelaApp.module.css'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
})

const dataCurta = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'short', timeZone: 'UTC',
})

function mesAtual() {
  return dataLocalIso().slice(0, 7)
}

function formatarMes(mes: string) {
  const [ano, numeroMes] = mes.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(ano, numeroMes - 1, 1))
}

function formatarData(data: string) {
  return dataCurta.format(new Date(`${data}T00:00:00Z`)).replace('.', '')
}

function GraficoFluxo({ dados }: { dados: FluxoDiario[] }) {
  if (dados.length === 0) {
    return (
      <div className={estilos.estadoGrafico}>
        <IconeTransacoes tamanho={22} />
        <strong>O fluxo aparece com as primeiras movimentações</strong>
        <span>Registre uma entrada ou saída neste mês.</span>
      </div>
    )
  }

  const acumulados = dados.reduce<Array<FluxoDiario & {
    entradasAcumuladas: number
    saidasAcumuladas: number
  }>>((anteriores, dia) => {
    const anterior = anteriores.at(-1)
    return [...anteriores, {
      ...dia,
      entradasAcumuladas: (anterior?.entradasAcumuladas ?? 0) + dia.entradas,
      saidasAcumuladas: (anterior?.saidasAcumuladas ?? 0) + dia.saidas,
    }]
  }, [])
  const entradasAcumuladas = acumulados.at(-1)?.entradasAcumuladas ?? 0
  const saidasAcumuladas = acumulados.at(-1)?.saidasAcumuladas ?? 0
  const maior = Math.max(entradasAcumuladas, saidasAcumuladas, 1)
  const largura = 720
  const altura = 224
  const margem = 18
  const pontos = (chave: 'entradasAcumuladas' | 'saidasAcumuladas') => acumulados
    .map((dia, indice) => {
      const x = dados.length === 1
        ? largura / 2
        : margem + (indice / (dados.length - 1)) * (largura - margem * 2)
      const y = altura - margem - (dia[chave] / maior) * (altura - margem * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className={estilos.grafico}>
      <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label="Evolução acumulada de entradas e saídas no mês">
        {[0.25, 0.5, 0.75].map((proporcao) => (
          <line key={proporcao} x1="0" x2={largura} y1={altura * proporcao} y2={altura * proporcao} />
        ))}
        <polyline className={estilos.linhaEntradas} points={pontos('entradasAcumuladas')} />
        <polyline className={estilos.linhaSaidas} points={pontos('saidasAcumuladas')} />
      </svg>
      <div className={estilos.legendaGrafico}>
        <span><i className={estilos.marcaEntradas} />Entradas acumuladas</span>
        <span><i className={estilos.marcaSaidas} />Saídas acumuladas</span>
        <small>{formatarData(dados[0].data)} — {formatarData(dados.at(-1)!.data)}</small>
      </div>
    </div>
  )
}

export function TelaApp() {
  const { sessao } = useAutenticacao()
  const [mes, definirMes] = useState(mesAtual)
  const [dashboard, definirDashboard] = useState<DashboardResumo | null>(null)
  const [carregando, definirCarregando] = useState(true)
  const [erro, definirErro] = useState(false)

  useEffect(() => {
    let ativo = true

    async function carregar(primeiraCarga = false) {
      if (primeiraCarga) definirCarregando(true)
      try {
        const resumo = await servicoFinanceiro.obterDashboard(mes)
        if (!ativo) return
        definirDashboard(resumo)
        definirErro(false)
      } catch {
        if (ativo) definirErro(true)
      } finally {
        if (ativo && primeiraCarga) definirCarregando(false)
      }
    }

    void carregar(true)
    const atualizacao = window.setInterval(() => void carregar(), 2_000)
    return () => {
      ativo = false
      window.clearInterval(atualizacao)
    }
  }, [mes])

  if (!sessao) return null

  const taxaDisponivel = dashboard && dashboard.totalEntradas > 0
    ? (dashboard.saldo / dashboard.totalEntradas) * 100
    : 0

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <div>
          <p>Olá, {sessao.usuario.nome}</p>
          <h1>Visão geral</h1>
          <span>{sessao.contextoAtivo.nome} · atualizado automaticamente a cada 2 segundos</span>
        </div>
        <div className={estilos.acoesCabecalho}>
          <label>
            <span>Mês de referência</span>
            <input aria-label="Mês de referência" type="month" value={mes}
              onChange={(evento) => {
                if (evento.target.value) definirMes(evento.target.value)
              }} />
          </label>
          <Link className={estilos.acaoPrimaria} to="/app/transacoes">
            <IconeMais tamanho={16} /> Nova transação
          </Link>
        </div>
      </header>

      {erro ? (
        <div className={estilos.avisoErro} role="alert">
          Não foi possível atualizar os dados. A última leitura continua visível.
        </div>
      ) : null}

      {carregando || !dashboard ? (
        <div className={estilos.carregando} role="status">Montando sua visão financeira…</div>
      ) : (
        <>
          <section className={estilos.faixaResumo} aria-label={`Resumo de ${formatarMes(mes)}`}>
            <div className={estilos.saldoPrincipal}>
              <span>Saldo do mês</span>
              <strong className={dashboard.saldo < 0 ? estilos.negativo : ''}>
                {moeda.format(dashboard.saldo)}
              </strong>
              <small>{formatarMes(mes)}</small>
            </div>
            <div className={estilos.indicador}>
              <span><i className={estilos.iconeEntrada}><IconeSetaCima tamanho={14} /></i>Entradas</span>
              <strong>{moeda.format(dashboard.totalEntradas)}</strong>
            </div>
            <div className={estilos.indicador}>
              <span><i className={estilos.iconeSaida}><IconeSetaBaixo tamanho={14} /></i>Saídas</span>
              <strong>{moeda.format(dashboard.totalSaidas)}</strong>
            </div>
            <div className={estilos.indicador}>
              <span><i className={estilos.iconeTaxa}>%</i>Disponível</span>
              <strong>{taxaDisponivel.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong>
            </div>
          </section>

          <div className={estilos.gradeAnalise}>
            <section className={estilos.painelFluxo}>
              <header>
                <div><p>Movimento acumulado</p><h2>Fluxo do mês</h2></div>
                <span>{dashboard.fluxoDiario.length} dias com registros</span>
              </header>
              <GraficoFluxo dados={dashboard.fluxoDiario} />
            </section>

            <section className={estilos.painelCategorias}>
              <header><p>Concentração das saídas</p><h2>Principais categorias</h2></header>
              {dashboard.principaisCategorias.length === 0 ? (
                <div className={estilos.estadoCategorias}>Nenhuma saída registrada no período.</div>
              ) : (
                <ol>
                  {dashboard.principaisCategorias.map((categoria, indice) => (
                    <li key={categoria.categoriaId}>
                      <div>
                        <span><b>{String(indice + 1).padStart(2, '0')}</b>{categoria.categoriaNome}</span>
                        <strong>{moeda.format(categoria.total)}</strong>
                      </div>
                      <span className={estilos.trilhoCategoria}>
                        <i style={{ width: `${Math.min(categoria.percentual, 100)}%` }} />
                      </span>
                      <small>{categoria.percentual.toLocaleString('pt-BR')}% das saídas</small>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <section className={estilos.recentes}>
            <header>
              <div><p>Últimos lançamentos</p><h2>Transações recentes</h2></div>
              <Link to="/app/transacoes">Ver todas</Link>
            </header>
            {dashboard.transacoesRecentes.length === 0 ? (
              <div className={estilos.estadoVazio}>
                <IconeCarteira tamanho={24} />
                <strong>Comece registrando sua primeira transação</strong>
                <Link to="/app/transacoes">Ir para transações</Link>
              </div>
            ) : (
              <div className={estilos.listaRecentes}>
                {dashboard.transacoesRecentes.map((transacao) => (
                  <article key={transacao.id}>
                    <span className={transacao.tipo === 'ENTRADA' ? estilos.movimentoEntrada : estilos.movimentoSaida}>
                      {transacao.tipo === 'ENTRADA' ? <IconeSetaCima tamanho={14} /> : <IconeSetaBaixo tamanho={14} />}
                    </span>
                    <div><strong>{transacao.descricao}</strong><small>{transacao.categoria.nome}</small></div>
                    <time dateTime={transacao.data}>{formatarData(transacao.data)}</time>
                    <b className={transacao.tipo === 'ENTRADA' ? estilos.valorEntrada : ''}>
                      {transacao.tipo === 'ENTRADA' ? '+' : '−'} {moeda.format(transacao.valor)}
                    </b>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
