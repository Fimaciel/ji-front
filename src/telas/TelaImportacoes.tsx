import { useEffect, useRef, useState } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { IconeRestaurar, IconeUpload } from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { ModalConfirmacao } from '../componentes/ModalConfirmacao'
import { servicoFinanceiro } from '../servicos/instanciaAutenticacao'
import { ErroApi } from '../tipos/api'
import type { AnaliseImportacao, Categoria, ImportacaoArquivo } from '../tipos/financeiro'
import estilos from './ImportacoesRelatorios.module.css'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
type Feedback = { tom: 'sucesso' | 'erro' | 'informativa'; texto: string }

export function TelaImportacoes() {
  const { sessao } = useAutenticacao()
  const entradaArquivo = useRef<HTMLInputElement>(null)
  const [arquivo, definirArquivo] = useState<File | null>(null)
  const [analise, definirAnalise] = useState<AnaliseImportacao | null>(null)
  const [categorias, definirCategorias] = useState<Categoria[]>([])
  const [historico, definirHistorico] = useState<ImportacaoArquivo[]>([])
  const [selecionados, definirSelecionados] = useState<Set<number>>(new Set())
  const [categoriasPorLinha, definirCategoriasPorLinha] = useState<Record<number, string>>({})
  const [analisando, definirAnalisando] = useState(false)
  const [salvando, definirSalvando] = useState(false)
  const [confirmarDesfazimento, definirConfirmarDesfazimento] = useState(false)
  const [feedback, definirFeedback] = useState<Feedback | null>(null)
  const podeEscrever = sessao?.contextoAtivo.papel !== 'DEPENDENTE'

  useEffect(() => {
    Promise.all([servicoFinanceiro.listarCategorias(), servicoFinanceiro.listarImportacoes()])
      .then(([listaCategorias, listaImportacoes]) => {
        definirCategorias(listaCategorias)
        definirHistorico(listaImportacoes)
      })
      .catch(() => definirFeedback({ tom: 'erro', texto: 'Não foi possível carregar os dados da importação.' }))
  }, [])

  function selecionarArquivo(novoArquivo?: File) {
    if (!podeEscrever) return
    if (!novoArquivo) return
    const nome = novoArquivo.name.toLocaleLowerCase('pt-BR')
    if (!nome.endsWith('.pdf') && !nome.endsWith('.xlsx')) {
      definirFeedback({ tom: 'erro', texto: 'Selecione um arquivo PDF ou XLSX.' })
      return
    }
    if (novoArquivo.size > 10 * 1024 * 1024) {
      definirFeedback({ tom: 'erro', texto: 'O arquivo deve ter no máximo 10 MB.' })
      return
    }
    definirArquivo(novoArquivo)
    definirAnalise(null)
    definirFeedback(null)
  }

  async function analisar() {
    if (!arquivo) return
    definirAnalisando(true)
    definirFeedback(null)
    try {
      const resultado = await servicoFinanceiro.analisarImportacao(arquivo)
      definirAnalise(resultado)
      definirSelecionados(new Set(resultado.registros.filter((item) => !item.duplicado).map((item) => item.linha)))
      definirCategoriasPorLinha(Object.fromEntries(
        resultado.registros.map((item) => [item.linha, item.categoriaSugerida.id]),
      ))
    } catch (erro) {
      definirFeedback({
        tom: 'erro',
        texto: erro instanceof ErroApi ? erro.message : 'Não foi possível analisar o arquivo.',
      })
    } finally {
      definirAnalisando(false)
    }
  }

  function alternarRegistro(linha: number, marcado: boolean) {
    definirSelecionados((atuais) => {
      const proximos = new Set(atuais)
      if (marcado) proximos.add(linha)
      else proximos.delete(linha)
      return proximos
    })
  }

  async function confirmarImportacao() {
    if (!analise) return
    const registros = analise.registros
      .filter((item) => selecionados.has(item.linha) && !item.duplicado)
      .map((item) => ({
        data: item.data,
        descricao: item.descricao,
        valor: item.valor,
        tipo: item.tipo,
        categoriaId: categoriasPorLinha[item.linha],
      }))
    if (registros.length === 0) {
      definirFeedback({ tom: 'erro', texto: 'Selecione ao menos um registro novo.' })
      return
    }
    definirSalvando(true)
    try {
      const resultado = await servicoFinanceiro.confirmarImportacao({
        nomeArquivo: analise.nomeArquivo,
        formato: analise.formato,
        totalLidos: analise.totalLidos,
        totalDuplicados: analise.totalDuplicados,
        registros,
      })
      definirHistorico((atuais) => [resultado, ...atuais])
      definirAnalise(null)
      definirArquivo(null)
      if (entradaArquivo.current) entradaArquivo.current.value = ''
      definirFeedback({ tom: 'sucesso', texto: `${resultado.totalImportados} transações importadas com sucesso.` })
    } catch (erro) {
      definirFeedback({ tom: 'erro', texto: erro instanceof ErroApi ? erro.message : 'Não foi possível concluir a importação.' })
    } finally {
      definirSalvando(false)
    }
  }

  async function desfazer() {
    definirSalvando(true)
    try {
      const resultado = await servicoFinanceiro.desfazerUltimaImportacao()
      definirHistorico((atuais) => atuais.map((item) => item.id === resultado.id ? resultado : item))
      definirFeedback({ tom: 'sucesso', texto: 'A última importação foi desfeita e as transações foram removidas.' })
    } catch (erro) {
      definirFeedback({ tom: 'erro', texto: erro instanceof ErroApi ? erro.message : 'Não foi possível desfazer a importação.' })
    } finally {
      definirSalvando(false)
      definirConfirmarDesfazimento(false)
    }
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalho}>
        <div>
          <p>Movimentação do contexto ativo</p>
          <h1>Importar transações</h1>
          <span>Revise os registros antes de adicioná-los ao Ji.</span>
        </div>
        {historico.some((item) => item.status === 'CONCLUIDA') && podeEscrever ? (
          <Botao variante="secundario" icone={<IconeRestaurar tamanho={16} />} onClick={() => definirConfirmarDesfazimento(true)}>
            Desfazer última
          </Botao>
        ) : null}
      </header>

      {feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}
      {!podeEscrever ? <Mensagem tom="informativa">Seu papel permite apenas consultar as transações deste contexto.</Mensagem> : null}

      <div className={estilos.gradeImportacao}>
        <section className={estilos.painel}>
          <header className={estilos.secaoTitulo}>
            <p>{analise ? 'Etapa 2 de 2' : 'Etapa 1 de 2'}</p>
            <h2>{analise ? 'Revisar registros' : 'Selecionar arquivo'}</h2>
          </header>

          {!analise ? (
            <>
              <div className={estilos.zonaArquivo} onDragOver={(evento) => evento.preventDefault()} onDrop={(evento) => {
                evento.preventDefault()
                selecionarArquivo(evento.dataTransfer.files[0])
              }}>
                <div>
                  <span className={estilos.iconeArquivo}><IconeUpload tamanho={21} /></span>
                  <strong>Arraste seu extrato para cá</strong>
                  <p>PDF com texto selecionável ou XLSX com as colunas data, descrição, valor e tipo. Limite de 10 MB.</p>
                  <label className={estilos.selecionarArquivo}>
                    <IconeUpload tamanho={15} /> Selecionar arquivo
                    <input ref={entradaArquivo} type="file" accept=".pdf,.xlsx" disabled={!podeEscrever}
                      onChange={(evento) => selecionarArquivo(evento.target.files?.[0])} />
                  </label>
                </div>
              </div>
              {arquivo ? (
                <div className={estilos.arquivoSelecionado}>
                  <div><strong>{arquivo.name}</strong><small>{(arquivo.size / 1024).toFixed(1)} KB</small></div>
                  <Botao carregando={analisando} onClick={analisar}>Analisar arquivo</Botao>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className={estilos.resumoAnalise}>
                <div><span>Lidos</span><strong>{analise.totalLidos}</strong></div>
                <div><span>Novos</span><strong>{analise.totalNovos}</strong></div>
                <div><span>Duplicados</span><strong>{analise.totalDuplicados}</strong></div>
              </div>
              <div className={estilos.tabelaRolagem}>
                <table className={estilos.tabela}>
                  <thead><tr><th>Importar</th><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Valor</th></tr></thead>
                  <tbody>{analise.registros.map((registro) => (
                    <tr key={registro.linha} className={registro.duplicado ? estilos.duplicada : ''}>
                      <td><input type="checkbox" aria-label={`Importar ${registro.descricao}`} checked={selecionados.has(registro.linha)} disabled={registro.duplicado}
                        onChange={(evento) => alternarRegistro(registro.linha, evento.target.checked)} /></td>
                      <td>{new Date(`${registro.data}T00:00:00`).toLocaleDateString('pt-BR')}</td>
                      <td><strong>{registro.descricao}</strong>{registro.duplicado ? ' · duplicado' : ''}</td>
                      <td>{registro.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</td>
                      <td><select aria-label={`Categoria de ${registro.descricao}`} value={categoriasPorLinha[registro.linha]}
                        disabled={registro.duplicado} onChange={(evento) => definirCategoriasPorLinha((atuais) => ({ ...atuais, [registro.linha]: evento.target.value }))}>
                        {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}
                      </select></td>
                      <td>{moeda.format(registro.valor)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <footer className={estilos.rodapeAnalise}>
                <span>{selecionados.size} registro(s) selecionado(s)</span>
                <div className={estilos.acoesCabecalho}>
                  <Botao variante="fantasma" onClick={() => definirAnalise(null)}>Voltar</Botao>
                  <Botao carregando={salvando} onClick={confirmarImportacao}>Confirmar importação</Botao>
                </div>
              </footer>
            </>
          )}
        </section>

        <aside className={estilos.historico}>
          <header className={estilos.secaoTitulo}><p>Auditoria do contexto</p><h2>Importações recentes</h2></header>
          {historico.length === 0 ? <div className={estilos.estado}>Nenhuma importação realizada.</div> : (
            <ol className={estilos.listaHistorico}>{historico.map((item) => (
              <li key={item.id}>
                <strong title={item.nomeArquivo}>{item.nomeArquivo}</strong>
                <div><span>{item.totalImportados} importadas</span><time>{dataHora.format(new Date(item.dataCriacao))}</time></div>
                <span className={`${estilos.status} ${item.status === 'DESFEITA' ? estilos.statusDesfeita : ''}`}>
                  {item.status === 'CONCLUIDA' ? 'Concluída' : 'Desfeita'}
                </span>
              </li>
            ))}</ol>
          )}
        </aside>
      </div>

      {confirmarDesfazimento ? <ModalConfirmacao
        titulo="Desfazer a última importação?"
        descricao="As transações criadas por ela serão removidas. Registros feitos manualmente não serão alterados."
        fechar={() => definirConfirmarDesfazimento(false)}
        acoes={<><Botao variante="secundario" onClick={() => definirConfirmarDesfazimento(false)}>Cancelar</Botao><Botao carregando={salvando} onClick={desfazer}>Desfazer importação</Botao></>}
      /> : null}
    </div>
  )
}
