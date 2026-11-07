import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Botao } from '../componentes/Botao'
import {
  IconeEditar,
  IconeEtiqueta,
  IconeExcluir,
  IconeFechar,
  IconeMais,
} from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { ModalConfirmacao } from '../componentes/ModalConfirmacao'
import { servicoFinanceiro } from '../servicos/instanciaAutenticacao'
import { ErroApi } from '../tipos/api'
import type { Categoria } from '../tipos/financeiro'
import {
  esquemaCategoria,
  type DadosCategoria,
} from '../validacoes/esquemasFinanceiro'
import estilos from './Financeiro.module.css'

type Feedback = { tom: 'sucesso' | 'erro' | 'informativa'; texto: string }

const coresCategoria = ['#475569', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#0ea5e9']

export function TelaCategorias() {
  const [categorias, definirCategorias] = useState<Categoria[]>([])
  const [carregando, definirCarregando] = useState(true)
  const [feedback, definirFeedback] = useState<Feedback | null>(null)
  const [modalAberto, definirModalAberto] = useState(false)
  const [categoriaEmEdicao, definirCategoriaEmEdicao] = useState<Categoria | null>(null)
  const [categoriaParaExcluir, definirCategoriaParaExcluir] = useState<Categoria | null>(null)
  const [excluindo, definirExcluindo] = useState(false)

  const formulario = useForm<DadosCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: { nome: '' },
  })

  async function carregarCategorias() {
    definirCarregando(true)
    try {
      definirCategorias(await servicoFinanceiro.listarCategorias())
    } catch {
      definirFeedback({ tom: 'erro', texto: 'Não foi possível carregar as categorias.' })
    } finally {
      definirCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    servicoFinanceiro.listarCategorias().then((dados) => {
      if (!ativo) return
      definirCategorias(dados)
      definirCarregando(false)
    }).catch(() => {
      if (!ativo) return
      definirFeedback({ tom: 'erro', texto: 'Não foi possível carregar as categorias.' })
      definirCarregando(false)
    })
    return () => { ativo = false }
  }, [])

  function abrirNovaCategoria() {
    definirCategoriaEmEdicao(null)
    formulario.reset({ nome: '' })
    definirModalAberto(true)
  }

  function abrirEdicao(categoria: Categoria) {
    definirCategoriaEmEdicao(categoria)
    formulario.reset({ nome: categoria.nome })
    definirModalAberto(true)
  }

  function fecharModal() {
    if (formulario.formState.isSubmitting) return
    definirModalAberto(false)
    definirCategoriaEmEdicao(null)
  }

  async function salvarCategoria(dados: DadosCategoria) {
    definirFeedback(null)
    const editando = Boolean(categoriaEmEdicao)
    try {
      if (categoriaEmEdicao) {
        await servicoFinanceiro.editarCategoria(categoriaEmEdicao.id, dados.nome)
      } else {
        await servicoFinanceiro.criarCategoria(dados.nome)
      }
      definirModalAberto(false)
      definirCategoriaEmEdicao(null)
      definirFeedback({
        tom: 'sucesso',
        texto: editando ? 'Categoria atualizada.' : 'Categoria criada.',
      })
      await carregarCategorias()
    } catch (erro) {
      if (erro instanceof ErroApi && erro.codigo === 'categoria-nome-em-uso') {
        formulario.setError('nome', { message: erro.message }, { shouldFocus: true })
        return
      }
      definirFeedback({ tom: 'erro', texto: 'Não foi possível salvar a categoria.' })
    }
  }

  async function excluirCategoria() {
    if (!categoriaParaExcluir) return
    definirExcluindo(true)
    try {
      await servicoFinanceiro.excluirCategoria(categoriaParaExcluir.id)
      definirCategoriaParaExcluir(null)
      definirFeedback({
        tom: 'sucesso',
        texto: 'Categoria excluída. Registros históricos continuam classificados.',
      })
      await carregarCategorias()
    } catch {
      definirFeedback({ tom: 'erro', texto: 'Não foi possível excluir a categoria.' })
      definirCategoriaParaExcluir(null)
    } finally {
      definirExcluindo(false)
    }
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <div>
          <p>Organização do contexto ativo</p>
          <h1>Categorias</h1>
          <span>Categorias padrão são globais; as personalizadas pertencem a este contexto.</span>
        </div>
        <Botao icone={<IconeMais tamanho={17} />} onClick={abrirNovaCategoria}>
          Nova categoria
        </Botao>
      </header>

      {feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}

      {carregando ? (
        <div className={estilos.estado} role="status">Carregando categorias…</div>
      ) : (
        <section className={estilos.listaCategorias} aria-label="Categorias disponíveis">
          <div className={estilos.cabecalhoCategorias}>
            <span>Categoria</span><span>Escopo</span><span>Ações</span>
          </div>
          {categorias.map((categoria, indice) => {
            const personalizada = categoria.tipo === 'PERSONALIZADA'
            const cor = coresCategoria[indice % coresCategoria.length]
            return (
              <article className={estilos.linhaCategoria} key={categoria.id}>
                <div className={estilos.identidadeCategoria}>
                  <span className={estilos.iconeCategoria} style={{ color: cor, background: `${cor}18` }}><IconeEtiqueta tamanho={16} /></span>
                  <strong>{categoria.nome}</strong>
                </div>
                <span className={`${estilos.distintivo} ${personalizada ? estilos.distintivoPersonalizado : ''}`}>
                  {personalizada ? 'Personalizada' : 'Padrão'}
                </span>
                <div className={estilos.acoesCategoria}>
                  {personalizada ? (
                    <>
                      <button type="button" aria-label={`Editar ${categoria.nome}`} onClick={() => abrirEdicao(categoria)}><IconeEditar tamanho={16} /></button>
                      <button type="button" aria-label={`Excluir ${categoria.nome}`} onClick={() => definirCategoriaParaExcluir(categoria)}><IconeExcluir tamanho={16} /></button>
                    </>
                  ) : <span>Protegida</span>}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {modalAberto ? (
        <div className={estilos.sobreposicao} onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) fecharModal()
        }}>
          <section className={`${estilos.modal} ${estilos.modalPequeno}`} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-categoria">
            <header className={estilos.cabecalhoModal}>
              <div>
                <h2 id="titulo-modal-categoria">{categoriaEmEdicao ? 'Editar categoria' : 'Nova categoria'}</h2>
                <p>Use um nome curto e fácil de reconhecer.</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={fecharModal}><IconeFechar tamanho={19} /></button>
            </header>
            <form onSubmit={formulario.handleSubmit(salvarCategoria)} noValidate>
              <div className={estilos.corpoModal}>
                <label className={estilos.campo}>
                  <span>Nome</span>
                  <input autoFocus placeholder="Ex.: Assinaturas" aria-invalid={Boolean(formulario.formState.errors.nome)} {...formulario.register('nome')} />
                  {formulario.formState.errors.nome ? <small>{formulario.formState.errors.nome.message}</small> : null}
                </label>
              </div>
              <footer className={estilos.rodapeModal}>
                <Botao type="button" variante="fantasma" onClick={fecharModal}>Cancelar</Botao>
                <Botao type="submit" carregando={formulario.formState.isSubmitting}>
                  {categoriaEmEdicao ? 'Salvar alterações' : 'Criar categoria'}
                </Botao>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {categoriaParaExcluir ? (
        <ModalConfirmacao
          titulo="Excluir categoria?"
          descricao={`“${categoriaParaExcluir.nome}” deixará de aparecer em novos lançamentos. Transações antigas continuarão classificadas.`}
          fechar={() => definirCategoriaParaExcluir(null)}
          acoes={<><Botao variante="secundario" onClick={() => definirCategoriaParaExcluir(null)}>Cancelar</Botao><Botao carregando={excluindo} onClick={excluirCategoria}>Excluir categoria</Botao></>}
        />
      ) : null}
    </div>
  )
}
