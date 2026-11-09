import { useEffect, useState } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { Mensagem } from '../componentes/Mensagem'
import { servicoContextos } from '../servicos/instanciaAutenticacao'
import type { ConviteContexto } from '../tipos/autenticacao'
import estilos from './Contextos.module.css'

export function TelaConvites() {
  const { recarregarContextos } = useAutenticacao()
  const [convites, definirConvites] = useState<ConviteContexto[]>([])
  const [processando, definirProcessando] = useState('')
  const [erro, definirErro] = useState('')

  async function carregar() {
    try { definirConvites(await servicoContextos.listarConvites()) }
    catch { definirErro('Não foi possível carregar os convites.') }
  }

  useEffect(() => {
    let ativo = true
    servicoContextos.listarConvites()
      .then((itens) => { if (ativo) definirConvites(itens) })
      .catch(() => { if (ativo) definirErro('Não foi possível carregar os convites.') })
    return () => { ativo = false }
  }, [])

  async function responder(convite: ConviteContexto, aceitar: boolean) {
    definirProcessando(convite.id)
    definirErro('')
    try {
      if (aceitar) {
        await servicoContextos.aceitarConvite(convite.id)
        await recarregarContextos()
      } else {
        await servicoContextos.recusarConvite(convite.id)
      }
      await carregar()
    } catch {
      definirErro('O convite não está mais disponível.')
    } finally {
      definirProcessando('')
    }
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <div><p>Colaboração</p><h1>Meus convites</h1><span>Aceite ou recuse participações em contextos compartilhados.</span></div>
      </header>
      {erro ? <Mensagem tom="erro">{erro}</Mensagem> : null}
      <section className={estilos.lista} aria-label="Convites recebidos">
        {convites.map((convite) => (
          <article key={convite.id} className={estilos.itemLista}>
            <span className={estilos.marcaContexto}>{convite.contextoNome.slice(0, 1).toUpperCase()}</span>
            <div className={estilos.conteudoItem}>
              <strong>{convite.contextoNome}</strong>
              <span>Convite de {convite.convidadoPor} · {convite.papelProposto.toLocaleLowerCase('pt-BR')}</span>
              <small>Expira em {new Date(convite.dataExpiracao).toLocaleDateString('pt-BR')}</small>
            </div>
            {convite.status === 'PENDENTE' ? (
              <div className={estilos.acoesItem}>
                <Botao variante="fantasma" disabled={Boolean(processando)} onClick={() => responder(convite, false)}>Recusar</Botao>
                <Botao carregando={processando === convite.id} onClick={() => responder(convite, true)}>Aceitar</Botao>
              </div>
            ) : <span className={estilos.distintivo}>{convite.status.toLocaleLowerCase('pt-BR')}</span>}
          </article>
        ))}
        {convites.length === 0 ? <p className={estilos.estadoVazio}>Você não possui convites.</p> : null}
      </section>
    </div>
  )
}
