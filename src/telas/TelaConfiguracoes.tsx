import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { Checkbox } from '../componentes/Checkbox'
import {
  IconeAlerta,
  IconeCarteira,
  IconeEscudo,
  IconeLua,
  IconeMonitor,
  IconeRestaurar,
  IconeSol,
  IconeUsuario,
} from '../componentes/Icones'
import { Mensagem } from '../componentes/Mensagem'
import { ModalConfirmacao } from '../componentes/ModalConfirmacao'
import { servicoConta } from '../servicos/instanciaAutenticacao'
import { registrarAvisoEncerramento } from '../servicos/avisosNavegacao'
import { useTema } from '../tema/useTema'
import { ErroApi } from '../tipos/api'
import type { ContaUsuario, TemaUsuario } from '../tipos/conta'
import { formatarCpf } from '../validacoes/esquemasAutenticacao'
import {
  converterSalario,
  esquemaConfiguracao,
  esquemaPerfil,
  formatarEntradaSalario,
  formatarSalario,
  type DadosConfiguracao,
  type DadosPerfil,
} from '../validacoes/esquemasConta'
import estilos from './TelaConfiguracoes.module.css'

type ModalAtivo = 'configuracao' | 'restaurar' | 'encerrar' | null
type Feedback = { tom: 'sucesso' | 'erro' | 'informativa'; texto: string }

const temas: Array<{
  valor: TemaUsuario
  titulo: string
  descricao: string
  icone: typeof IconeSol
}> = [
  { valor: 'CLARO', titulo: 'Claro', descricao: 'Superfícies luminosas', icone: IconeSol },
  { valor: 'ESCURO', titulo: 'Escuro', descricao: 'Menor brilho à noite', icone: IconeLua },
  { valor: 'AUTOMATICO', titulo: 'Automático', descricao: 'Acompanha o dispositivo', icone: IconeMonitor },
]

export function TelaConfiguracoes() {
  const navegar = useNavigate()
  const { atualizarUsuario, encerrarConta } = useAutenticacao()
  const { tema, alterarTema, alterandoTema, restaurarTemaLocal } = useTema()
  const [conta, definirConta] = useState<ContaUsuario | null>(null)
  const [carregando, definirCarregando] = useState(true)
  const [feedback, definirFeedback] = useState<Feedback | null>(null)
  const [modal, definirModal] = useState<ModalAtivo>(null)
  const [configuracaoPendente, definirConfiguracaoPendente] = useState<DadosConfiguracao | null>(null)
  const [salvandoConfiguracao, definirSalvandoConfiguracao] = useState(false)
  const [confirmacaoExclusao, definirConfirmacaoExclusao] = useState('')
  const [encerrandoConta, definirEncerrandoConta] = useState(false)

  const formularioPerfil = useForm<DadosPerfil>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: {
      nome: '', sobrenome: '', email: '', dataNascimento: '',
      senhaAtual: '', novaSenha: '', confirmacaoNovaSenha: '',
    },
  })
  const formularioConfiguracao = useForm<DadosConfiguracao>({
    resolver: zodResolver(esquemaConfiguracao),
    defaultValues: { salarioMensal: '0,00', moeda: 'BRL', notificacoesAtivas: true },
  })

  useEffect(() => {
    let ativo = true
    servicoConta.obterConta().then((dados) => {
      if (!ativo) return
      definirConta(dados)
      formularioPerfil.reset({
        nome: dados.nome,
        sobrenome: dados.sobrenome,
        email: dados.email,
        dataNascimento: dados.dataNascimento ?? '',
        senhaAtual: '',
        novaSenha: '',
        confirmacaoNovaSenha: '',
      })
      formularioConfiguracao.reset({
        salarioMensal: formatarSalario(dados.configuracao.salarioMensal),
        moeda: 'BRL',
        notificacoesAtivas: dados.configuracao.notificacoesAtivas,
      })
      definirCarregando(false)
    }).catch(() => {
      if (!ativo) return
      definirFeedback({ tom: 'erro', texto: 'Não foi possível carregar as configurações. Atualize a página.' })
      definirCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [formularioConfiguracao, formularioPerfil])

  async function salvarPerfil(dados: DadosPerfil) {
    definirFeedback(null)
    try {
      const atualizada = await servicoConta.atualizarPerfil({
        ...dados,
        dataNascimento: dados.dataNascimento || undefined,
        novaSenha: dados.novaSenha || undefined,
        confirmacaoNovaSenha: dados.confirmacaoNovaSenha || undefined,
      })
      definirConta(atualizada)
      atualizarUsuario({
        id: atualizada.id,
        nome: atualizada.nome,
        sobrenome: atualizada.sobrenome,
        nomeCompleto: `${atualizada.nome} ${atualizada.sobrenome}`,
        email: atualizada.email,
      })
      formularioPerfil.reset({
        nome: atualizada.nome,
        sobrenome: atualizada.sobrenome,
        email: atualizada.email,
        dataNascimento: atualizada.dataNascimento ?? '',
        senhaAtual: '',
        novaSenha: '',
        confirmacaoNovaSenha: '',
      })
      definirFeedback({ tom: 'sucesso', texto: 'Perfil atualizado.' })
    } catch (erro) {
      if (erro instanceof ErroApi && erro.codigo === 'email-em-uso') {
        formularioPerfil.setError('email', { message: erro.message }, { shouldFocus: true })
        return
      }
      if (erro instanceof ErroApi && erro.codigo === 'senha-atual-invalida') {
        formularioPerfil.setError('senhaAtual', { message: erro.message }, { shouldFocus: true })
        return
      }
      definirFeedback({ tom: 'erro', texto: 'Não foi possível atualizar o perfil. Revise os dados e tente novamente.' })
    }
  }

  function solicitarSalvarConfiguracao(dados: DadosConfiguracao) {
    definirConfiguracaoPendente(dados)
    definirModal('configuracao')
  }

  async function confirmarConfiguracao() {
    if (!configuracaoPendente) return
    definirSalvandoConfiguracao(true)
    definirFeedback(null)
    try {
      const configuracao = await servicoConta.atualizarConfiguracao({
        salarioMensal: converterSalario(configuracaoPendente.salarioMensal),
        moeda: 'BRL',
        notificacoesAtivas: configuracaoPendente.notificacoesAtivas,
      })
      definirConta((atual) => atual ? { ...atual, configuracao } : atual)
      formularioConfiguracao.reset({
        salarioMensal: formatarSalario(configuracao.salarioMensal),
        moeda: 'BRL',
        notificacoesAtivas: configuracao.notificacoesAtivas,
      })
      definirModal(null)
      definirConfiguracaoPendente(null)
      definirFeedback({ tom: 'sucesso', texto: 'Configurações financeiras salvas.' })
    } catch {
      definirFeedback({ tom: 'erro', texto: 'Não foi possível salvar as configurações.' })
      definirModal(null)
    } finally {
      definirSalvandoConfiguracao(false)
    }
  }

  async function selecionarTema(novoTema: TemaUsuario) {
    definirFeedback(null)
    try {
      await alterarTema(novoTema)
      definirConta((atual) => atual ? {
        ...atual,
        configuracao: { ...atual.configuracao, tema: novoTema },
      } : atual)
      definirFeedback({ tom: 'sucesso', texto: 'Aparência atualizada.' })
    } catch {
      definirFeedback({ tom: 'erro', texto: 'Não foi possível salvar a aparência.' })
    }
  }

  async function restaurarConfiguracoes() {
    definirSalvandoConfiguracao(true)
    definirFeedback(null)
    try {
      const configuracao = await servicoConta.restaurarConfiguracao()
      definirConta((atual) => atual ? { ...atual, configuracao } : atual)
      formularioConfiguracao.reset({
        salarioMensal: formatarSalario(configuracao.salarioMensal),
        moeda: 'BRL',
        notificacoesAtivas: configuracao.notificacoesAtivas,
      })
      restaurarTemaLocal()
      definirModal(null)
      definirFeedback({ tom: 'sucesso', texto: 'Configurações restauradas para o padrão.' })
    } catch {
      definirModal(null)
      definirFeedback({ tom: 'erro', texto: 'Não foi possível restaurar as configurações.' })
    } finally {
      definirSalvandoConfiguracao(false)
    }
  }

  async function confirmarEncerramento() {
    if (confirmacaoExclusao !== 'EXCLUIR') return
    definirEncerrandoConta(true)
    try {
      await encerrarConta(() => {
        restaurarTemaLocal()
        registrarAvisoEncerramento()
        navegar('/entrar', { replace: true })
      })
    } catch {
      definirModal(null)
      definirFeedback({ tom: 'erro', texto: 'Não foi possível encerrar a conta. Tente novamente.' })
      definirEncerrandoConta(false)
    }
  }

  if (carregando) {
    return <div className={estilos.carregando} role="status">Carregando configurações…</div>
  }

  if (!conta) {
    return <div className={estilos.pagina}>{feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}</div>
  }

  return (
    <div className={estilos.pagina}>
      <header className={estilos.introducao}>
        <p>Conta e preferências</p>
        <h1>Configurações</h1>
        <span>Gerencie sua identidade, segurança e o comportamento do Ji em um só lugar.</span>
      </header>

      {feedback ? <Mensagem tom={feedback.tom}>{feedback.texto}</Mensagem> : null}

      <form onSubmit={formularioPerfil.handleSubmit(salvarPerfil)} noValidate>
        <section className={estilos.secao} aria-labelledby="titulo-dados-pessoais">
          <div className={estilos.cabecalhoSecao}>
            <span className={estilos.iconeSecao}><IconeUsuario tamanho={19} /></span>
            <div><h2 id="titulo-dados-pessoais">Dados pessoais</h2><p>Informações usadas para identificar sua conta.</p></div>
          </div>
          <div className={estilos.conteudoSecao}>
            <div className={estilos.gradeDupla}>
              <CampoFormulario id="perfil-nome" rotulo="Nome" autoComplete="given-name" erro={formularioPerfil.formState.errors.nome?.message} {...formularioPerfil.register('nome')} />
              <CampoFormulario id="perfil-sobrenome" rotulo="Sobrenome" autoComplete="family-name" erro={formularioPerfil.formState.errors.sobrenome?.message} {...formularioPerfil.register('sobrenome')} />
            </div>
            <div className={estilos.gradeDupla}>
              <CampoFormulario id="perfil-email" rotulo="E-mail" type="email" autoComplete="email" erro={formularioPerfil.formState.errors.email?.message} {...formularioPerfil.register('email')} />
              <CampoFormulario id="perfil-cpf" rotulo="CPF" value={conta.cpf ? formatarCpf(conta.cpf) : 'Não informado'} disabled ajuda="O CPF não pode ser alterado." readOnly />
            </div>
            <CampoFormulario id="perfil-nascimento" className={estilos.campoMetade} rotulo="Data de nascimento" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} erro={formularioPerfil.formState.errors.dataNascimento?.message} {...formularioPerfil.register('dataNascimento')} />
          </div>
        </section>

        <section className={estilos.secao} aria-labelledby="titulo-seguranca">
          <div className={estilos.cabecalhoSecao}>
            <span className={estilos.iconeSecao}><IconeEscudo tamanho={19} /></span>
            <div><h2 id="titulo-seguranca">Segurança</h2><p>Confirme sua identidade e altere a senha se desejar.</p></div>
          </div>
          <div className={estilos.conteudoSecao}>
            <CampoFormulario id="senha-atual" className={estilos.campoMetade} rotulo="Senha atual" type="password" autoComplete="current-password" ajuda="Obrigatória para salvar qualquer alteração de perfil." erro={formularioPerfil.formState.errors.senhaAtual?.message} {...formularioPerfil.register('senhaAtual')} />
            <div className={estilos.gradeDupla}>
              <CampoFormulario id="nova-senha" rotulo="Nova senha (opcional)" type="password" autoComplete="new-password" erro={formularioPerfil.formState.errors.novaSenha?.message} {...formularioPerfil.register('novaSenha')} />
              <CampoFormulario id="confirmar-nova-senha" rotulo="Confirmar nova senha" type="password" autoComplete="new-password" erro={formularioPerfil.formState.errors.confirmacaoNovaSenha?.message} {...formularioPerfil.register('confirmacaoNovaSenha')} />
            </div>
            <div className={estilos.acoesSecao}>
              <Botao type="submit" carregando={formularioPerfil.formState.isSubmitting}>Salvar perfil</Botao>
            </div>
          </div>
        </section>
      </form>

      <form onSubmit={formularioConfiguracao.handleSubmit(solicitarSalvarConfiguracao)} noValidate>
        <section className={estilos.secao} aria-labelledby="titulo-financeiro">
          <div className={estilos.cabecalhoSecao}>
            <span className={estilos.iconeSecao}><IconeCarteira tamanho={19} /></span>
            <div><h2 id="titulo-financeiro">Preferências financeiras</h2><p>Defina os valores usados como referência no contexto Pessoal.</p></div>
          </div>
          <div className={estilos.conteudoSecao}>
            <div className={estilos.gradeFinanceira}>
              <Controller name="salarioMensal" control={formularioConfiguracao.control} render={({ field }) => (
                <CampoFormulario id="salario-mensal" rotulo="Salário mensal" inputMode="numeric" value={field.value} onBlur={field.onBlur} onChange={(evento) => field.onChange(formatarEntradaSalario(evento.target.value))} ref={field.ref} erro={formularioConfiguracao.formState.errors.salarioMensal?.message} sufixo="BRL" />
              )} />
              <CampoFormulario id="moeda" rotulo="Moeda" value="Real brasileiro (BRL)" disabled readOnly {...formularioConfiguracao.register('moeda')} />
            </div>
            <div className={estilos.preferenciaLinha}>
              <div><strong>Notificações por e-mail</strong><span>Receba avisos importantes sobre sua conta.</span></div>
              <Checkbox aria-label="Ativar notificações por e-mail" {...formularioConfiguracao.register('notificacoesAtivas')}>Ativas</Checkbox>
            </div>
            <div className={estilos.acoesSecao}>
              <Botao type="submit">Revisar e salvar</Botao>
            </div>
          </div>
        </section>
      </form>

      <section className={estilos.secao} aria-labelledby="titulo-aparencia">
        <div className={estilos.cabecalhoSecao}>
          <span className={estilos.iconeSecao}><IconeSol tamanho={19} /></span>
          <div><h2 id="titulo-aparencia">Aparência</h2><p>A mudança é aplicada imediatamente e acompanha sua conta.</p></div>
        </div>
        <div className={estilos.conteudoSecao}>
          <div className={estilos.temas} role="radiogroup" aria-label="Tema da interface">
            {temas.map((opcao) => {
              const Icone = opcao.icone
              return (
                <button key={opcao.valor} type="button" role="radio" aria-checked={tema === opcao.valor} className={`${estilos.tema} ${tema === opcao.valor ? estilos.temaAtivo : ''}`} disabled={alterandoTema} onClick={() => selecionarTema(opcao.valor)}>
                  <span className={estilos.amostraTema}><Icone tamanho={21} /></span>
                  <strong>{opcao.titulo}</strong><small>{opcao.descricao}</small>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className={estilos.secao} aria-labelledby="titulo-restaurar">
        <div className={estilos.cabecalhoSecao}>
          <span className={estilos.iconeSecao}><IconeRestaurar tamanho={19} /></span>
          <div><h2 id="titulo-restaurar">Restaurar configurações</h2><p>Retorne salário, notificações, moeda e tema aos valores iniciais.</p></div>
        </div>
        <div className={`${estilos.conteudoSecao} ${estilos.acaoHorizontal}`}>
          <p>Seu perfil, CPF e histórico financeiro não serão alterados.</p>
          <Botao type="button" variante="secundario" onClick={() => definirModal('restaurar')}>Restaurar padrão</Botao>
        </div>
      </section>

      <section className={`${estilos.secao} ${estilos.zonaPerigo}`} aria-labelledby="titulo-encerrar">
        <div className={estilos.cabecalhoSecao}>
          <span className={estilos.iconePerigo}><IconeAlerta tamanho={19} /></span>
          <div><h2 id="titulo-encerrar">Zona de perigo</h2><p>Encerre o acesso à conta sem apagar seu histórico.</p></div>
        </div>
        <div className={`${estilos.conteudoSecao} ${estilos.acaoHorizontal}`}>
          <p>A conta deixará de aceitar login. Seus dados e contextos permanecerão preservados.</p>
          <Botao type="button" className={estilos.botaoPerigo} onClick={() => definirModal('encerrar')}>Encerrar conta</Botao>
        </div>
      </section>

      {modal === 'configuracao' ? (
        <ModalConfirmacao titulo="Salvar configurações?" descricao="Confira os valores antes de aplicar as preferências financeiras." fechar={() => definirModal(null)} acoes={<><Botao variante="secundario" onClick={() => definirModal(null)}>Cancelar</Botao><Botao carregando={salvandoConfiguracao} onClick={confirmarConfiguracao}>Salvar configurações</Botao></>}>
          <dl className={estilos.resumoModal}><div><dt>Salário mensal</dt><dd>R$ {configuracaoPendente?.salarioMensal}</dd></div><div><dt>Notificações</dt><dd>{configuracaoPendente?.notificacoesAtivas ? 'Ativas' : 'Desativadas'}</dd></div></dl>
        </ModalConfirmacao>
      ) : null}

      {modal === 'restaurar' ? (
        <ModalConfirmacao titulo="Restaurar configurações?" descricao="Salário voltará a zero, notificações serão ativadas e o tema ficará automático." fechar={() => definirModal(null)} acoes={<><Botao variante="secundario" onClick={() => definirModal(null)}>Cancelar</Botao><Botao carregando={salvandoConfiguracao} onClick={restaurarConfiguracoes}>Restaurar padrão</Botao></>} />
      ) : null}

      {modal === 'encerrar' ? (
        <ModalConfirmacao titulo="Encerrar sua conta?" descricao="Esta ação bloqueia novos acessos e não oferece reativação pelo aplicativo. Seus dados serão preservados, não removidos." fechar={() => definirModal(null)} acoes={<><Botao variante="secundario" onClick={() => definirModal(null)}>Cancelar</Botao><Botao className={estilos.botaoPerigo} disabled={confirmacaoExclusao !== 'EXCLUIR'} carregando={encerrandoConta} onClick={confirmarEncerramento}>Encerrar conta</Botao></>}>
          <CampoFormulario id="confirmacao-encerramento" rotulo="Digite EXCLUIR para confirmar" value={confirmacaoExclusao} onChange={(evento) => definirConfirmacaoExclusao(evento.target.value)} autoComplete="off" />
        </ModalConfirmacao>
      ) : null}
    </div>
  )
}
