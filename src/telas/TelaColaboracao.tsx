import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { IconeEditar, IconeExcluir, IconeMais } from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { servicoContextos } from '../servicos/instanciaAutenticacao'
import { ErroApi } from '../tipos/api'
import type {
  ConviteEnviado,
  Dependente,
  EntradaDependente,
  PapelContexto,
  ParticipanteContexto,
  TipoDependente,
} from '../tipos/autenticacao'
import estilos from './Contextos.module.css'

type Secao = 'participantes' | 'dependentes' | 'convites'

const entradaDependenteVazia: EntradaDependente = {
  nome: '',
  dataNascimento: '',
  tipo: 'PASSIVO',
  email: '',
}

function mensagemDoErro(erro: unknown, padrao: string) {
  return erro instanceof ErroApi ? erro.message : padrao
}

export function TelaColaboracao() {
  const { sessao, recarregarContextos } = useAutenticacao()
  const navegar = useNavigate()
  const [secao, definirSecao] = useState<Secao>('participantes')
  const [participantes, definirParticipantes] = useState<ParticipanteContexto[]>([])
  const [dependentes, definirDependentes] = useState<Dependente[]>([])
  const [convites, definirConvites] = useState<ConviteEnviado[]>([])
  const [emailConvite, definirEmailConvite] = useState('')
  const [entradaDependente, definirEntradaDependente] = useState<EntradaDependente>(entradaDependenteVazia)
  const [dependenteEmEdicao, definirDependenteEmEdicao] = useState<string | null>(null)
  const [processando, definirProcessando] = useState('')
  const [erro, definirErro] = useState('')
  const [sucesso, definirSucesso] = useState('')

  const contexto = sessao?.contextoAtivo
  const administrador = contexto?.papel === 'ADMINISTRADOR'
  const compartilhado = contexto?.tipo === 'COMPARTILHADO'
  const dependenteEditado = dependentes.find((dependente) => dependente.id === dependenteEmEdicao)

  const carregar = useCallback(async () => {
    if (!compartilhado) return
    try {
      const [novosParticipantes, novosDependentes, novosConvites] = await Promise.all([
        servicoContextos.listarParticipantes(),
        administrador ? servicoContextos.listarDependentes() : Promise.resolve([]),
        administrador ? servicoContextos.listarConvitesEnviados() : Promise.resolve([]),
      ])
      definirParticipantes(novosParticipantes)
      definirDependentes(novosDependentes)
      definirConvites(novosConvites)
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível carregar a colaboração deste contexto.'))
    }
  }, [administrador, compartilhado])

  useEffect(() => {
    if (!compartilhado) return
    let ativo = true
    Promise.all([
      servicoContextos.listarParticipantes(),
      administrador ? servicoContextos.listarDependentes() : Promise.resolve([]),
      administrador ? servicoContextos.listarConvitesEnviados() : Promise.resolve([]),
    ]).then(([novosParticipantes, novosDependentes, novosConvites]) => {
      if (!ativo) return
      definirParticipantes(novosParticipantes)
      definirDependentes(novosDependentes)
      definirConvites(novosConvites)
    }).catch((falha) => {
      if (ativo) definirErro(mensagemDoErro(falha, 'Não foi possível carregar a colaboração deste contexto.'))
    })
    return () => { ativo = false }
  }, [administrador, compartilhado])

  function prepararAcao(chave: string) {
    definirProcessando(chave)
    definirErro('')
    definirSucesso('')
  }

  async function enviarConvite(evento: FormEvent) {
    evento.preventDefault()
    prepararAcao('convidar')
    try {
      await servicoContextos.convidarColaborador(emailConvite)
      definirEmailConvite('')
      definirSucesso('Convite enviado com validade de sete dias.')
      await carregar()
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível enviar o convite.'))
    } finally {
      definirProcessando('')
    }
  }

  async function acaoConvite(convite: ConviteEnviado, acao: 'reenviar' | 'cancelar') {
    if (acao === 'cancelar' && !window.confirm(`Cancelar o convite enviado para ${convite.emailConvidado}?`)) return
    prepararAcao(`${acao}-${convite.id}`)
    try {
      if (acao === 'reenviar') await servicoContextos.reenviarConvite(convite.id)
      else await servicoContextos.cancelarConvite(convite.id)
      definirSucesso(acao === 'reenviar' ? 'Convite reenviado.' : 'Convite cancelado.')
      await carregar()
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível atualizar o convite.'))
    } finally {
      definirProcessando('')
    }
  }

  async function salvarDependente(evento: FormEvent) {
    evento.preventDefault()
    prepararAcao('salvar-dependente')
    try {
      if (dependenteEmEdicao) {
        await servicoContextos.atualizarDependente(dependenteEmEdicao, entradaDependente)
        definirSucesso('Dependente atualizado.')
      } else {
        await servicoContextos.criarDependente(entradaDependente)
        definirSucesso(entradaDependente.tipo === 'LEITURA'
          ? 'Dependente cadastrado e convite de leitura enviado.'
          : 'Dependente cadastrado.')
      }
      definirEntradaDependente(entradaDependenteVazia)
      definirDependenteEmEdicao(null)
      await carregar()
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível salvar o dependente.'))
    } finally {
      definirProcessando('')
    }
  }

  function editarDependente(dependente: Dependente) {
    definirDependenteEmEdicao(dependente.id)
    definirEntradaDependente({
      nome: dependente.nome,
      dataNascimento: dependente.dataNascimento,
      tipo: dependente.tipo,
      email: '',
    })
    definirErro('')
    definirSucesso('')
  }

  async function excluirDependente(dependente: Dependente) {
    if (!window.confirm(`Excluir o dependente ${dependente.nome}?`)) return
    prepararAcao(`excluir-dependente-${dependente.id}`)
    try {
      await servicoContextos.excluirDependente(dependente.id)
      definirSucesso('Dependente excluído.')
      await carregar()
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível excluir o dependente.'))
    } finally {
      definirProcessando('')
    }
  }

  async function alterarPapel(participante: ParticipanteContexto, papel: PapelContexto) {
    prepararAcao(`papel-${participante.id}`)
    try {
      await servicoContextos.alterarPapelParticipante(participante.id, papel)
      definirSucesso('Papel atualizado.')
      await carregar()
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível alterar o papel.'))
    } finally {
      definirProcessando('')
    }
  }

  async function removerParticipante(participante: ParticipanteContexto) {
    if (!window.confirm(`Remover ${participante.nome} deste contexto?`)) return
    prepararAcao(`remover-${participante.id}`)
    try {
      await servicoContextos.removerParticipante(participante.id)
      definirSucesso('Participante removido.')
      await carregar()
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível remover o participante.'))
    } finally {
      definirProcessando('')
    }
  }

  async function sairDoContexto() {
    if (!window.confirm(`Sair do contexto ${contexto?.nome}?`)) return
    prepararAcao('sair-contexto')
    try {
      await servicoContextos.sairDoContexto()
      await recarregarContextos()
      navegar('/app', { replace: true })
    } catch (falha) {
      definirErro(mensagemDoErro(falha, 'Não foi possível sair do contexto.'))
      definirProcessando('')
    }
  }

  if (!compartilhado) {
    return (
      <div className={estilos.pagina}>
        <header className={estilos.cabecalhoPagina}>
          <p>Colaboração</p><h1>Equipe do contexto</h1>
          <span>Participantes e dependentes são gerenciados somente em contextos compartilhados.</span>
        </header>
        <div className={estilos.estadoVazio}><Link to="/app/contextos">Selecionar ou criar um contexto compartilhado</Link></div>
      </div>
    )
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecalhoPagina}>
        <p>Colaboração · {contexto?.nome}</p><h1>Equipe do contexto</h1>
        <span>Gerencie acessos, dependentes e convites sem misturar os dados de outros contextos.</span>
      </header>
      {erro ? <Mensagem tom="erro">{erro}</Mensagem> : null}
      {sucesso ? <Mensagem tom="sucesso">{sucesso}</Mensagem> : null}
      <div className={estilos.abas} role="tablist" aria-label="Áreas de colaboração">
        <button type="button" role="tab" aria-selected={secao === 'participantes'} onClick={() => definirSecao('participantes')}>Participantes</button>
        {administrador ? <button type="button" role="tab" aria-selected={secao === 'dependentes'} onClick={() => definirSecao('dependentes')}>Dependentes</button> : null}
        {administrador ? <button type="button" role="tab" aria-selected={secao === 'convites'} onClick={() => definirSecao('convites')}>Convites enviados</button> : null}
      </div>

      {secao === 'participantes' ? (
        <section aria-label="Participantes do contexto">
          <div className={estilos.lista}>
            {participantes.map((participante) => {
              const proprioUsuario = participante.usuarioId === sessao?.usuario.id
              return (
                <article key={participante.id} className={`${estilos.itemLista} ${!participante.ativo ? estilos.itemInativo : ''}`}>
                  <span className={estilos.marcaContexto}>{participante.nome.slice(0, 1).toUpperCase()}</span>
                  <div className={estilos.conteudoItem}>
                    <strong>{participante.nome}{proprioUsuario ? ' (você)' : ''}</strong>
                    <span>{participante.email}</span>
                    <small>{participante.ativo ? `Desde ${new Date(participante.dataIngresso).toLocaleDateString('pt-BR')}` : `Saiu em ${new Date(participante.dataSaida!).toLocaleDateString('pt-BR')}`}</small>
                  </div>
                  {administrador && participante.ativo && participante.papel !== 'DEPENDENTE' ? (
                    <select
                      className={estilos.seletorCompacto}
                      aria-label={`Papel de ${participante.nome}`}
                      value={participante.papel}
                      disabled={processando === `papel-${participante.id}`}
                      onChange={(evento) => void alterarPapel(participante, evento.target.value as PapelContexto)}
                    >
                      <option value="ADMINISTRADOR">Administrador</option>
                      <option value="COLABORADOR">Colaborador</option>
                    </select>
                  ) : <span className={estilos.distintivo}>{participante.papel.toLocaleLowerCase('pt-BR')}</span>}
                  {administrador && participante.ativo && !proprioUsuario ? (
                    <Botao variante="fantasma" onClick={() => void removerParticipante(participante)}>Remover</Botao>
                  ) : null}
                </article>
              )
            })}
          </div>
          <div className={estilos.acaoPerigosa}>
            <div><strong>Sair deste contexto</strong><span>Seu histórico permanece registrado, mas o acesso é encerrado.</span></div>
            <Botao variante="secundario" carregando={processando === 'sair-contexto'} onClick={() => void sairDoContexto()}>Sair do contexto</Botao>
          </div>
        </section>
      ) : null}

      {secao === 'dependentes' && administrador ? (
        <section>
          <div className={estilos.painelFormularioVertical}>
            <div><h2>{dependenteEmEdicao ? 'Editar dependente' : 'Novo dependente'}</h2><p>O acesso de leitura envia um convite para o e-mail informado.</p></div>
            <form onSubmit={salvarDependente}>
              <CampoFormulario id="nome-dependente" rotulo="Nome" required value={entradaDependente.nome} onChange={(e) => definirEntradaDependente((atual) => ({ ...atual, nome: e.target.value }))} />
              <CampoFormulario id="nascimento-dependente" rotulo="Data de nascimento" type="date" required value={entradaDependente.dataNascimento} onChange={(e) => definirEntradaDependente((atual) => ({ ...atual, dataNascimento: e.target.value }))} />
              <label className={estilos.campoSelect} htmlFor="tipo-dependente">Tipo
                <select id="tipo-dependente" value={entradaDependente.tipo} onChange={(e) => definirEntradaDependente((atual) => ({ ...atual, tipo: e.target.value as TipoDependente }))}>
                  <option value="PASSIVO">Passivo, somente informativo</option>
                  <option value="LEITURA">Leitura, com acesso ao contexto</option>
                </select>
              </label>
              {entradaDependente.tipo === 'LEITURA' ? <CampoFormulario id="email-dependente" rotulo="E-mail para o convite" type="email" required={!dependenteEditado?.participanteId} value={entradaDependente.email} onChange={(e) => definirEntradaDependente((atual) => ({ ...atual, email: e.target.value }))} ajuda={dependenteEmEdicao ? 'Informe para gerar ou substituir um convite pendente.' : undefined} /> : null}
              <div className={estilos.acoesFormulario}>
                {dependenteEmEdicao ? <Botao type="button" variante="fantasma" onClick={() => { definirDependenteEmEdicao(null); definirEntradaDependente(entradaDependenteVazia) }}>Cancelar edição</Botao> : null}
                <Botao type="submit" carregando={processando === 'salvar-dependente'} icone={<IconeMais tamanho={17} />}>{dependenteEmEdicao ? 'Salvar alterações' : 'Cadastrar dependente'}</Botao>
              </div>
            </form>
          </div>
          <div className={estilos.lista} aria-label="Dependentes cadastrados">
            {dependentes.map((dependente) => (
              <article key={dependente.id} className={estilos.itemLista}>
                <span className={estilos.marcaContexto}>{dependente.nome.slice(0, 1).toUpperCase()}</span>
                <div className={estilos.conteudoItem}><strong>{dependente.nome}</strong><span>{dependente.tipo === 'PASSIVO' ? 'Passivo' : 'Acesso de leitura'}</span><small>Nascimento: {new Date(`${dependente.dataNascimento}T12:00:00`).toLocaleDateString('pt-BR')}{dependente.usuarioVinculado ? ` · ${dependente.usuarioVinculado}` : ''}</small></div>
                <div className={estilos.acoesItem}>
                  <Botao variante="fantasma" icone={<IconeEditar tamanho={16} />} onClick={() => editarDependente(dependente)}>Editar</Botao>
                  <Botao variante="fantasma" icone={<IconeExcluir tamanho={16} />} onClick={() => void excluirDependente(dependente)}>Excluir</Botao>
                </div>
              </article>
            ))}
            {dependentes.length === 0 ? <p className={estilos.estadoVazio}>Nenhum dependente cadastrado.</p> : null}
          </div>
        </section>
      ) : null}

      {secao === 'convites' && administrador ? (
        <section>
          <div className={estilos.painelCriacao}>
            <div><h2>Convidar colaborador</h2><p>O link expira em sete dias.</p></div>
            <form onSubmit={enviarConvite}>
              <CampoFormulario id="email-convite" rotulo="E-mail" type="email" required value={emailConvite} onChange={(e) => definirEmailConvite(e.target.value)} placeholder="pessoa@email.com" />
              <Botao type="submit" carregando={processando === 'convidar'}>Enviar convite</Botao>
            </form>
          </div>
          <div className={estilos.lista} aria-label="Convites enviados">
            {convites.map((convite) => (
              <article key={convite.id} className={estilos.itemLista}>
                <span className={estilos.marcaContexto}>{convite.emailConvidado.slice(0, 1).toUpperCase()}</span>
                <div className={estilos.conteudoItem}><strong>{convite.emailConvidado}</strong><span>{convite.papelProposto.toLocaleLowerCase('pt-BR')} · {convite.status.toLocaleLowerCase('pt-BR')}</span><small>Expira em {new Date(convite.dataExpiracao).toLocaleDateString('pt-BR')}</small></div>
                {convite.status === 'PENDENTE' ? <div className={estilos.acoesItem}><Botao variante="fantasma" carregando={processando === `reenviar-${convite.id}`} onClick={() => void acaoConvite(convite, 'reenviar')}>Reenviar</Botao><Botao variante="fantasma" onClick={() => void acaoConvite(convite, 'cancelar')}>Cancelar</Botao></div> : <span className={estilos.distintivo}>{convite.status.toLocaleLowerCase('pt-BR')}</span>}
              </article>
            ))}
            {convites.length === 0 ? <p className={estilos.estadoVazio}>Nenhum convite enviado.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
