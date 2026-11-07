import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Botao } from '../componentes/Botao'
import {
  IconeBusca,
  IconeEditar,
  IconeExcluir,
  IconeFechar,
  IconeMais,
  IconeSetaBaixo,
  IconeSetaCima,
} from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { ModalConfirmacao } from '../componentes/ModalConfirmacao'
import { servicoFinanceiro } from '../servicos/instanciaAutenticacao'
import { dataLocalIso } from '../servicos/dataLocal'
import { ErroApi } from '../tipos/api'
import type {
  Categoria,
  FiltrosTransacao,
  PaginaTransacoes,
  Transacao,
  TipoTransacao,
} from '../tipos/financeiro'
import {
  converterValor,
  esquemaTransacao,
  type DadosTransacao,
} from '../validacoes/esquemasFinanceiro'
import estilos from './Financeiro.module.css'

type Feedback = { tom: 'sucesso' | 'erro' | 'informativa'; texto: string }

const paginaVazia: PaginaTransacoes = {
  itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0,
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
})

function hoje() {
  return dataLocalIso()
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
    .format(new Date(`${data}T00:00:00Z`))
}

export function TelaTransacoes() {
  const [categorias, definirCategorias] = useState<Categoria[]>([])
  const [pagina, definirPagina] = useState(paginaVazia)
  const [filtros, definirFiltros] = useState<FiltrosTransacao>({ pagina: 0 })
  const [carregando, definirCarregando] = useState(true)
  const [feedback, definirFeedback] = useState<Feedback | null>(null)
  const [modalAberto, definirModalAberto] = useState(false)
  const [transacaoEmEdicao, definirTransacaoEmEdicao] = useState<Transacao | null>(null)
  const [transacaoParaExcluir, definirTransacaoParaExcluir] = useState<Transacao | null>(null)
  const [excluindo, definirExcluindo] = useState(false)
  const [revisao, definirRevisao] = useState(0)

  const formulario = useForm<DadosTransacao>({
    resolver: zodResolver(esquemaTransacao),
    defaultValues: {
      tipo: 'SAIDA', valor: '', data: hoje(), categoriaId: '', descricao: '',
    },
  })
  const tipoSelecionado = useWatch({ control: formulario.control, name: 'tipo' })

  useEffect(() => {
    let ativo = true
    servicoFinanceiro.listarCategorias().then((dados) => {
      if (ativo) definirCategorias(dados)
    }).catch(() => {
      if (ativo) definirFeedback({ tom: 'erro', texto: 'Não foi possível carregar as categorias.' })
    })
    return () => { ativo = false }
  }, [revisao])

  useEffect(() => {
    let ativo = true
    servicoFinanceiro.listarTransacoes(filtros).then((resultado) => {
      if (!ativo) return
      definirPagina(resultado)
      definirCarregando(false)
    }).catch((erro) => {
      if (!ativo) return
      definirFeedback({
        tom: 'erro',
        texto: erro instanceof ErroApi ? erro.message : 'Não foi possível carregar as transações.',
      })
      definirCarregando(false)
    })
    return () => { ativo = false }
  }, [filtros, revisao])

  function alterarFiltro(chave: keyof FiltrosTransacao, valor?: string) {
    definirFiltros((atuais) => ({
      ...atuais,
      pagina: 0,
      [chave]: valor || undefined,
    }))
  }

  function abrirNovaTransacao() {
    definirTransacaoEmEdicao(null)
    formulario.reset({
      tipo: 'SAIDA',
      valor: '',
      data: hoje(),
      categoriaId: categorias[0]?.id ?? '',
      descricao: '',
    })
    definirModalAberto(true)
  }

  function abrirEdicao(transacao: Transacao) {
    definirTransacaoEmEdicao(transacao)
    formulario.reset({
      tipo: transacao.tipo,
      valor: transacao.valor.toFixed(2).replace('.', ','),
      data: transacao.data,
      categoriaId: transacao.categoria.id,
      descricao: transacao.descricao,
    })
    definirModalAberto(true)
  }

  function fecharModal() {
    if (formulario.formState.isSubmitting) return
    definirModalAberto(false)
    definirTransacaoEmEdicao(null)
  }

  async function salvarTransacao(dados: DadosTransacao) {
    definirFeedback(null)
    const editando = Boolean(transacaoEmEdicao)
    try {
      const entrada = {
        tipo: dados.tipo,
        valor: converterValor(dados.valor),
        data: dados.data,
        categoriaId: dados.categoriaId,
        descricao: dados.descricao.trim(),
      }
      if (transacaoEmEdicao) {
        await servicoFinanceiro.editarTransacao(transacaoEmEdicao.id, entrada)
      } else {
        await servicoFinanceiro.criarTransacao(entrada)
      }
      definirModalAberto(false)
      definirTransacaoEmEdicao(null)
      definirFeedback({
        tom: 'sucesso',
        texto: editando ? 'Transação atualizada.' : 'Transação cadastrada.',
      })
      definirRevisao((valor) => valor + 1)
    } catch (erro) {
      definirFeedback({
        tom: 'erro',
        texto: erro instanceof ErroApi
          ? erro.message
          : 'Não foi possível salvar a transação. Revise os dados.',
      })
    }
  }

  async function excluirTransacao() {
    if (!transacaoParaExcluir) return
    definirExcluindo(true)
    try {
      await servicoFinanceiro.excluirTransacao(transacaoParaExcluir.id)
      definirTransacaoParaExcluir(null)
      definirFeedback({ tom: 'sucesso', texto: 'Transação excluída.' })
      definirRevisao((valor) => valor + 1)
    } catch {
      definirFeedback({ tom: 'erro', texto: 'Não foi possível excluir a transação.' })
      definirTransacaoParaExcluir(null)
    } finally {
      definirExcluindo(false)
    }
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <div>
          <p>Movimentação do contexto ativo</p>
          <h1>Transações</h1>
          <span>{pagina.totalItens} {pagina.totalItens === 1 ? 'registro encontrado' : 'registros encontrados'}</span>
        </div>
        <Botao icone={<IconeMais tamanho={17} />} onClick={abrirNovaTransacao}>
          Nova transação
        </Botao>
      </header>

      {feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}

      <section className={estilos.filtros} aria-label="Filtros das transações">
        <label className={estilos.busca}>
          <IconeBusca tamanho={16} />
          <span className={estilos.somenteLeitorTela}>Buscar transações</span>
          <input
            type="search"
            placeholder="Buscar por descrição ou categoria"
            value={filtros.busca ?? ''}
            onChange={(evento) => alterarFiltro('busca', evento.target.value)}
          />
        </label>
        <label className={estilos.filtroCampo}>
          <span>De</span>
          <input type="date" max={hoje()} value={filtros.dataInicial ?? ''}
            onChange={(evento) => alterarFiltro('dataInicial', evento.target.value)} />
        </label>
        <label className={estilos.filtroCampo}>
          <span>Até</span>
          <input type="date" max={hoje()} value={filtros.dataFinal ?? ''}
            onChange={(evento) => alterarFiltro('dataFinal', evento.target.value)} />
        </label>
        <label className={estilos.filtroCampo}>
          <span>Tipo</span>
          <select value={filtros.tipo ?? ''}
            onChange={(evento) => alterarFiltro('tipo', evento.target.value)}>
            <option value="">Todos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SAIDA">Saídas</option>
          </select>
        </label>
        <label className={estilos.filtroCampo}>
          <span>Categoria</span>
          <select value={filtros.categoriaId ?? ''}
            onChange={(evento) => alterarFiltro('categoriaId', evento.target.value)}>
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
            ))}
          </select>
        </label>
      </section>

      {carregando ? (
        <div className={estilos.estado} role="status">Carregando transações…</div>
      ) : pagina.itens.length === 0 ? (
        <div className={estilos.estado}>
          <strong>Nenhuma transação encontrada</strong>
          <span>Ajuste os filtros ou registre a primeira movimentação.</span>
          <Botao variante="secundario" onClick={abrirNovaTransacao}>Cadastrar transação</Botao>
        </div>
      ) : (
        <>
          <div className={estilos.tabelaRolagem}>
            <table className={estilos.tabela}>
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th><span className={estilos.somenteLeitorTela}>Ações</span></th></tr></thead>
              <tbody>
                {pagina.itens.map((transacao) => (
                  <tr key={transacao.id}>
                    <td data-label="Data">{formatarData(transacao.data)}</td>
                    <td data-label="Descrição"><strong>{transacao.descricao}</strong></td>
                    <td data-label="Categoria"><span className={estilos.categoriaPill}>{transacao.categoria.nome}</span></td>
                    <td data-label="Valor" className={transacao.tipo === 'ENTRADA' ? estilos.valorPositivo : estilos.valorNegativo}>
                      <span className={estilos.tipoMovimento} aria-hidden="true">
                        {transacao.tipo === 'ENTRADA' ? <IconeSetaCima tamanho={13} /> : <IconeSetaBaixo tamanho={13} />}
                      </span>
                      {transacao.tipo === 'ENTRADA' ? '+' : '−'} {formatadorMoeda.format(transacao.valor)}
                    </td>
                    <td className={estilos.acoesLinha}>
                      <button type="button" aria-label={`Editar ${transacao.descricao}`} onClick={() => abrirEdicao(transacao)}><IconeEditar tamanho={16} /></button>
                      <button type="button" aria-label={`Excluir ${transacao.descricao}`} onClick={() => definirTransacaoParaExcluir(transacao)}><IconeExcluir tamanho={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className={estilos.paginacao} aria-label="Paginação das transações">
            <span>Página {pagina.pagina + 1} de {Math.max(pagina.totalPaginas, 1)}</span>
            <div>
              <button type="button" disabled={pagina.pagina === 0} onClick={() => definirFiltros((atuais) => ({ ...atuais, pagina: (atuais.pagina ?? 0) - 1 }))}>Anterior</button>
              <button type="button" disabled={pagina.pagina + 1 >= pagina.totalPaginas} onClick={() => definirFiltros((atuais) => ({ ...atuais, pagina: (atuais.pagina ?? 0) + 1 }))}>Próxima</button>
            </div>
          </nav>
        </>
      )}

      {modalAberto ? (
        <div className={estilos.sobreposicao} onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) fecharModal()
        }}>
          <section className={estilos.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-transacao">
            <header className={estilos.cabecalhoModal}>
              <div>
                <h2 id="titulo-modal-transacao">{transacaoEmEdicao ? 'Editar transação' : 'Nova transação'}</h2>
                <p>{transacaoEmEdicao ? 'Atualize os dados do registro.' : 'Registre uma entrada ou saída.'}</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={fecharModal}><IconeFechar tamanho={19} /></button>
            </header>
            <form onSubmit={formulario.handleSubmit(salvarTransacao)} noValidate>
              <div className={estilos.corpoModal}>
                <fieldset className={estilos.seletorTipo}>
                  <legend>Tipo da transação</legend>
                  {(['ENTRADA', 'SAIDA'] as TipoTransacao[]).map((tipo) => (
                    <label key={tipo} className={tipoSelecionado === tipo ? estilos.tipoAtivo : ''}>
                      <input type="radio" value={tipo} {...formulario.register('tipo')} />
                      {tipo === 'ENTRADA' ? <IconeSetaCima tamanho={15} /> : <IconeSetaBaixo tamanho={15} />}
                      {tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                    </label>
                  ))}
                </fieldset>
                <div className={estilos.gradeFormulario}>
                  <label className={estilos.campo}>
                    <span>Valor</span>
                    <div className={estilos.campoComPrefixo}><span>R$</span><input aria-label="Valor" inputMode="decimal" placeholder="0,00" aria-invalid={Boolean(formulario.formState.errors.valor)} {...formulario.register('valor')} /></div>
                    {formulario.formState.errors.valor ? <small>{formulario.formState.errors.valor.message}</small> : null}
                  </label>
                  <label className={estilos.campo}>
                    <span>Data</span>
                    <input type="date" max={hoje()} aria-invalid={Boolean(formulario.formState.errors.data)} {...formulario.register('data')} />
                    {formulario.formState.errors.data ? <small>{formulario.formState.errors.data.message}</small> : null}
                  </label>
                </div>
                <label className={estilos.campo}>
                  <span>Categoria</span>
                  <select aria-invalid={Boolean(formulario.formState.errors.categoriaId)} {...formulario.register('categoriaId')}>
                    <option value="">Selecione</option>
                    {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                  </select>
                  {formulario.formState.errors.categoriaId ? <small>{formulario.formState.errors.categoriaId.message}</small> : null}
                </label>
                <label className={estilos.campo}>
                  <span>Descrição</span>
                  <input placeholder="Ex.: Supermercado do mês" aria-invalid={Boolean(formulario.formState.errors.descricao)} {...formulario.register('descricao')} />
                  {formulario.formState.errors.descricao ? <small>{formulario.formState.errors.descricao.message}</small> : null}
                </label>
              </div>
              <footer className={estilos.rodapeModal}>
                <Botao type="button" variante="fantasma" onClick={fecharModal}>Cancelar</Botao>
                <Botao type="submit" carregando={formulario.formState.isSubmitting}>
                  {transacaoEmEdicao ? 'Salvar alterações' : 'Salvar transação'}
                </Botao>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {transacaoParaExcluir ? (
        <ModalConfirmacao
          titulo="Excluir transação?"
          descricao={`O registro “${transacaoParaExcluir.descricao}” será removido do contexto ativo.`}
          fechar={() => definirTransacaoParaExcluir(null)}
          acoes={<><Botao variante="secundario" onClick={() => definirTransacaoParaExcluir(null)}>Cancelar</Botao><Botao carregando={excluindo} onClick={excluirTransacao}>Excluir transação</Botao></>}
        />
      ) : null}
    </div>
  )
}
