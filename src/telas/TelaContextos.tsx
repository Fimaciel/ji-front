import { useEffect, useState, type FormEvent } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { IconeMais } from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { servicoContextos } from '../servicos/instanciaAutenticacao'
import type { ContextoGerenciamento } from '../tipos/autenticacao'
import estilos from './Contextos.module.css'

export function TelaContextos() {
  const { criarContexto, selecionarContexto } = useAutenticacao()
  const [contextos, definirContextos] = useState<ContextoGerenciamento[]>([])
  const [nome, definirNome] = useState('')
  const [criando, definirCriando] = useState(false)
  const [carregando, definirCarregando] = useState(true)
  const [erro, definirErro] = useState('')

  async function carregar() {
    definirCarregando(true)
    try {
      definirContextos(await servicoContextos.listarContextos())
    } catch {
      definirErro('Não foi possível carregar os contextos.')
    } finally {
      definirCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    servicoContextos.listarContextos()
      .then((itens) => { if (ativo) definirContextos(itens) })
      .catch(() => { if (ativo) definirErro('Não foi possível carregar os contextos.') })
      .finally(() => { if (ativo) definirCarregando(false) })
    return () => { ativo = false }
  }, [])

  async function adicionar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    definirCriando(true)
    definirErro('')
    try {
      await criarContexto(nome)
      definirNome('')
      await carregar()
    } catch {
      definirErro('Não foi possível criar o contexto.')
    } finally {
      definirCriando(false)
    }
  }

  async function ativar(contextoId: string) {
    await selecionarContexto(contextoId)
    await carregar()
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <div><p>Organização</p><h1>Meus contextos</h1><span>Separe as finanças pessoais das que você administra com outras pessoas.</span></div>
      </header>
      {erro ? <Mensagem tom="erro">{erro}</Mensagem> : null}
      <section className={estilos.painelCriacao} aria-labelledby="titulo-novo-contexto">
        <div><h2 id="titulo-novo-contexto">Novo contexto compartilhado</h2><p>Você será o administrador inicial.</p></div>
        <form onSubmit={adicionar}>
          <CampoFormulario
            id="nome-contexto"
            rotulo="Nome do contexto"
            value={nome}
            maxLength={80}
            placeholder="Ex.: Casa, Viagem ou Família"
            onChange={(evento) => definirNome(evento.target.value)}
          />
          <Botao type="submit" carregando={criando} disabled={!nome.trim()} icone={<IconeMais tamanho={17} />}>Criar contexto</Botao>
        </form>
      </section>
      <section className={estilos.lista} aria-label="Contextos cadastrados" aria-busy={carregando}>
        {contextos.map((contexto) => (
          <article key={contexto.id} className={estilos.itemLista}>
            <span className={estilos.marcaContexto}>{contexto.nome.slice(0, 1).toUpperCase()}</span>
            <div className={estilos.conteudoItem}>
              <strong>{contexto.nome}</strong>
              <span>{contexto.tipo === 'PESSOAL' ? 'Pessoal' : `${contexto.quantidadeParticipantes} participante(s)`} · {contexto.papel.toLocaleLowerCase('pt-BR')}</span>
            </div>
            {contexto.ativo
              ? <span className={estilos.distintivoAtivo}>Ativo</span>
              : <Botao variante="secundario" onClick={() => ativar(contexto.id)}>Selecionar</Botao>}
          </article>
        ))}
        {!carregando && contextos.length === 0 ? <p className={estilos.estadoVazio}>Nenhum contexto encontrado.</p> : null}
      </section>
    </div>
  )
}
