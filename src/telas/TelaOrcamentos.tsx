import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Botao } from '../componentes/Botao'
import {
  IconeAlerta,
  IconeCarteira,
  IconeEditar,
  IconeExcluir,
  IconeFechar,
  IconeMais,
} from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { ModalConfirmacao } from '../componentes/ModalConfirmacao'
import { dataLocalIso } from '../servicos/dataLocal'
import { servicoFinanceiro } from '../servicos/instanciaAutenticacao'
import { ErroApi } from '../tipos/api'
import type { Categoria, Orcamento, ResumoOrcamentos } from '../tipos/financeiro'
import {
  converterValor,
  esquemaOrcamento,
  type DadosOrcamento,
} from '../validacoes/esquemasFinanceiro'
import estilos from './Orcamentos.module.css'

type Feedback = { tom: 'sucesso' | 'erro' | 'informativa'; texto: string }

const resumoVazio: ResumoOrcamentos = {
  mesReferencia: '', totalLimite: 0, totalConsumido: 0, percentualConsumido: 0, itens: [],
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
})

function mesAtual() {
  return dataLocalIso().slice(0, 7)
}

function textoSituacao(orcamento: Orcamento) {
  if (orcamento.situacao === 'EXCEDIDO') return 'Limite excedido'
  if (orcamento.situacao === 'ATENCAO') return 'Atenção: 80% atingido'
  return 'Dentro do limite'
}

export function TelaOrcamentos() {
  const [mes, definirMes] = useState(mesAtual)
  const [resumo, definirResumo] = useState(resumoVazio)
  const [categorias, definirCategorias] = useState<Categoria[]>([])
  const [carregando, definirCarregando] = useState(true)
  const [feedback, definirFeedback] = useState<Feedback | null>(null)
  const [modalAberto, definirModalAberto] = useState(false)
  const [orcamentoEmEdicao, definirOrcamentoEmEdicao] = useState<Orcamento | null>(null)
  const [orcamentoParaExcluir, definirOrcamentoParaExcluir] = useState<Orcamento | null>(null)
  const [excluindo, definirExcluindo] = useState(false)

  const formulario = useForm<DadosOrcamento>({
    resolver: zodResolver(esquemaOrcamento),
    defaultValues: { categoriaId: '', valorLimite: '', mesReferencia: mesAtual() },
  })

  useEffect(() => {
    let ativo = true
    Promise.all([
      servicoFinanceiro.listarOrcamentos(mes),
      servicoFinanceiro.listarCategorias(),
    ]).then(([dados, categoriasDisponiveis]) => {
      if (!ativo) return
      definirResumo(dados)
      definirCategorias(categoriasDisponiveis)
      definirCarregando(false)
    }).catch(() => {
      if (!ativo) return
      definirFeedback({ tom: 'erro', texto: 'Não foi possível carregar os orçamentos.' })
      definirCarregando(false)
    })
    return () => { ativo = false }
  }, [mes])

  async function recarregar() {
    definirResumo(await servicoFinanceiro.listarOrcamentos(mes))
  }

  function alterarMes(novoMes: string) {
    if (!novoMes) return
    definirCarregando(true)
    definirMes(novoMes)
  }

  function abrirNovo() {
    definirOrcamentoEmEdicao(null)
    const categoriasUsadas = new Set(resumo.itens.map((item) => item.categoria.id))
    const primeiraDisponivel = categorias.find((categoria) => !categoriasUsadas.has(categoria.id))
    formulario.reset({
      categoriaId: primeiraDisponivel?.id ?? '',
      valorLimite: '',
      mesReferencia: mes,
    })
    definirModalAberto(true)
  }

  function abrirEdicao(orcamento: Orcamento) {
    definirOrcamentoEmEdicao(orcamento)
    formulario.reset({
      categoriaId: orcamento.categoria.id,
      valorLimite: orcamento.valorLimite.toFixed(2).replace('.', ','),
      mesReferencia: orcamento.mesReferencia,
    })
    definirModalAberto(true)
  }

  function fecharModal() {
    if (formulario.formState.isSubmitting) return
    definirModalAberto(false)
    definirOrcamentoEmEdicao(null)
  }

  async function salvar(dados: DadosOrcamento) {
    definirFeedback(null)
    const editando = Boolean(orcamentoEmEdicao)
    try {
      const entrada = {
        categoriaId: dados.categoriaId,
        valorLimite: converterValor(dados.valorLimite),
        mesReferencia: dados.mesReferencia,
      }
      if (orcamentoEmEdicao) {
        await servicoFinanceiro.editarOrcamento(orcamentoEmEdicao.id, entrada)
      } else {
        await servicoFinanceiro.criarOrcamento(entrada)
      }
      definirModalAberto(false)
      definirOrcamentoEmEdicao(null)
      if (dados.mesReferencia !== mes) alterarMes(dados.mesReferencia)
      else await recarregar()
      definirFeedback({
        tom: 'sucesso',
        texto: editando ? 'Orçamento atualizado.' : 'Orçamento criado.',
      })
    } catch (erro) {
      if (erro instanceof ErroApi && erro.codigo === 'orcamento-duplicado') {
        formulario.setError('categoriaId', { message: erro.message }, { shouldFocus: true })
        return
      }
      definirFeedback({
        tom: 'erro',
        texto: erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o orçamento.',
      })
    }
  }

  async function excluir() {
    if (!orcamentoParaExcluir) return
    definirExcluindo(true)
    try {
      await servicoFinanceiro.excluirOrcamento(orcamentoParaExcluir.id)
      definirOrcamentoParaExcluir(null)
      definirFeedback({ tom: 'sucesso', texto: 'Orçamento excluído.' })
      await recarregar()
    } catch {
      definirFeedback({ tom: 'erro', texto: 'Não foi possível excluir o orçamento.' })
      definirOrcamentoParaExcluir(null)
    } finally {
      definirExcluindo(false)
    }
  }

  const situacaoGeral = resumo.percentualConsumido >= 100
    ? 'EXCEDIDO'
    : resumo.percentualConsumido >= 80 ? 'ATENCAO' : 'NORMAL'

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <div>
          <p>Planejamento do contexto ativo</p>
          <h1>Orçamentos</h1>
          <span>Defina limites mensais e acompanhe o consumo por categoria.</span>
        </div>
        <div className={estilos.acoesCabecalho}>
          <label><span>Mês</span><input aria-label="Mês dos orçamentos" type="month" value={mes}
            onChange={(evento) => alterarMes(evento.target.value)} /></label>
          <Botao icone={<IconeMais tamanho={17} />} onClick={abrirNovo}>Novo orçamento</Botao>
        </div>
      </header>

      {feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}

      {carregando ? (
        <div className={estilos.estado} role="status">Carregando orçamentos…</div>
      ) : (
        <>
          <section className={`${estilos.resumo} ${estilos[`resumo${situacaoGeral}`]}`}>
            <div className={estilos.medidorGeral}>
              <span className={estilos.anel} style={{ '--progresso': `${Math.min(resumo.percentualConsumido, 100) * 3.6}deg` } as React.CSSProperties}>
                <strong>{resumo.percentualConsumido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</strong>
              </span>
              <div><small>Consumo planejado</small><h2>{moeda.format(resumo.totalConsumido)}</h2><p>de {moeda.format(resumo.totalLimite)} definidos</p></div>
            </div>
            <dl>
              <div><dt>Disponível</dt><dd>{moeda.format(resumo.totalLimite - resumo.totalConsumido)}</dd></div>
              <div><dt>Categorias acompanhadas</dt><dd>{resumo.itens.length}</dd></div>
              <div><dt>Em atenção ou excedidas</dt><dd>{resumo.itens.filter((item) => item.situacao !== 'NORMAL').length}</dd></div>
            </dl>
          </section>

          {resumo.itens.length === 0 ? (
            <div className={estilos.estado}>
              <IconeCarteira tamanho={26} />
              <strong>Nenhum limite definido para este mês</strong>
              <span>Crie um orçamento para acompanhar uma categoria.</span>
              <Botao variante="secundario" onClick={abrirNovo}>Criar primeiro orçamento</Botao>
            </div>
          ) : (
            <section className={estilos.lista} aria-label="Orçamentos por categoria">
              <header><span>Categoria</span><span>Consumo</span><span>Situação</span><span>Ações</span></header>
              {resumo.itens.map((orcamento) => (
                <article key={orcamento.id} className={estilos[`linha${orcamento.situacao}`]}>
                  <div className={estilos.categoria}>
                    <span><IconeCarteira tamanho={16} /></span>
                    <div><strong>{orcamento.categoria.nome}</strong><small>Limite {moeda.format(orcamento.valorLimite)}</small></div>
                  </div>
                  <div className={estilos.consumo}>
                    <div><strong>{moeda.format(orcamento.valorConsumido)}</strong><span>{orcamento.percentualConsumido.toLocaleString('pt-BR')}%</span></div>
                    <span className={estilos.trilho}><i style={{ width: `${Math.min(orcamento.percentualConsumido, 100)}%` }} /></span>
                  </div>
                  <span className={estilos.situacao}>
                    {orcamento.situacao !== 'NORMAL' ? <IconeAlerta tamanho={14} /> : null}
                    {textoSituacao(orcamento)}
                  </span>
                  <div className={estilos.acoesLinha}>
                    <button type="button" aria-label={`Editar orçamento de ${orcamento.categoria.nome}`} onClick={() => abrirEdicao(orcamento)}><IconeEditar tamanho={16} /></button>
                    <button type="button" aria-label={`Excluir orçamento de ${orcamento.categoria.nome}`} onClick={() => definirOrcamentoParaExcluir(orcamento)}><IconeExcluir tamanho={16} /></button>
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      {modalAberto ? (
        <div className={estilos.sobreposicao} onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) fecharModal()
        }}>
          <section className={estilos.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-orcamento">
            <header className={estilos.cabecalhoModal}>
              <div><h2 id="titulo-modal-orcamento">{orcamentoEmEdicao ? 'Editar orçamento' : 'Novo orçamento'}</h2><p>Um limite por categoria em cada mês.</p></div>
              <button type="button" aria-label="Fechar" onClick={fecharModal}><IconeFechar tamanho={19} /></button>
            </header>
            <form onSubmit={formulario.handleSubmit(salvar)} noValidate>
              <div className={estilos.corpoModal}>
                <label className={estilos.campo}><span>Categoria</span>
                  <select autoFocus aria-invalid={Boolean(formulario.formState.errors.categoriaId)} {...formulario.register('categoriaId')}>
                    <option value="">Selecione</option>
                    {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                  </select>
                  {formulario.formState.errors.categoriaId ? <small>{formulario.formState.errors.categoriaId.message}</small> : null}
                </label>
                <div className={estilos.gradeCampos}>
                  <label className={estilos.campo}><span>Limite mensal</span><div className={estilos.valor}><span>R$</span><input inputMode="decimal" placeholder="0,00" aria-invalid={Boolean(formulario.formState.errors.valorLimite)} {...formulario.register('valorLimite')} /></div>{formulario.formState.errors.valorLimite ? <small>{formulario.formState.errors.valorLimite.message}</small> : null}</label>
                  <label className={estilos.campo}><span>Mês de referência</span><input type="month" aria-invalid={Boolean(formulario.formState.errors.mesReferencia)} {...formulario.register('mesReferencia')} />{formulario.formState.errors.mesReferencia ? <small>{formulario.formState.errors.mesReferencia.message}</small> : null}</label>
                </div>
              </div>
              <footer className={estilos.rodapeModal}><Botao type="button" variante="fantasma" onClick={fecharModal}>Cancelar</Botao><Botao type="submit" carregando={formulario.formState.isSubmitting}>{orcamentoEmEdicao ? 'Salvar alterações' : 'Criar orçamento'}</Botao></footer>
            </form>
          </section>
        </div>
      ) : null}

      {orcamentoParaExcluir ? (
        <ModalConfirmacao
          titulo="Excluir orçamento?"
          descricao={`O limite de “${orcamentoParaExcluir.categoria.nome}” será removido deste mês. As transações permanecem inalteradas.`}
          fechar={() => definirOrcamentoParaExcluir(null)}
          acoes={<><Botao variante="secundario" onClick={() => definirOrcamentoParaExcluir(null)}>Cancelar</Botao><Botao carregando={excluindo} onClick={excluir}>Excluir orçamento</Botao></>}
        />
      ) : null}
    </div>
  )
}
