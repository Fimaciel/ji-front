import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { IconeEmail, IconeVoltar } from '../componentes/Icones'
import { LayoutAutenticacao } from '../componentes/LayoutAutenticacao'
import { Mensagem } from '../componentes/Mensagem'
import { servicoAutenticacao } from '../servicos/instanciaAutenticacao'
import { esquemaRecuperacao, type DadosRecuperacao } from '../validacoes/esquemasAutenticacao'
import estilos from './Autenticacao.module.css'

interface RecuperacaoSolicitada {
  email: string
  tokenDemonstracao?: string
}

export function TelaRecuperarSenha() {
  const [solicitacao, definirSolicitacao] = useState<RecuperacaoSolicitada | null>(null)
  const [contador, definirContador] = useState(60)
  const [reenviando, definirReenviando] = useState(false)
  const [erroGeral, definirErroGeral] = useState('')
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<DadosRecuperacao>({
    resolver: zodResolver(esquemaRecuperacao),
    defaultValues: { email: 'filipe.lopes@email.com' },
  })

  useEffect(() => {
    if (!solicitacao) return
    const temporizador = window.setInterval(() => {
      definirContador((valor) => {
        if (valor <= 1) {
          window.clearInterval(temporizador)
          return 0
        }
        return valor - 1
      })
    }, 1000)
    return () => window.clearInterval(temporizador)
  }, [solicitacao])

  async function solicitar(dados: DadosRecuperacao) {
    definirErroGeral('')
    try {
      const resultado = await servicoAutenticacao.solicitarRecuperacao(dados.email)
      definirSolicitacao({ email: dados.email, tokenDemonstracao: resultado.tokenDemonstracao })
      definirContador(60)
    } catch {
      definirErroGeral('Não foi possível enviar o link. Tente novamente.')
    }
  }

  async function reenviar() {
    definirReenviando(true)
    definirErroGeral('')
    try {
      const email = getValues('email')
      const resultado = await servicoAutenticacao.solicitarRecuperacao(email)
      definirSolicitacao({ email, tokenDemonstracao: resultado.tokenDemonstracao })
      definirContador(60)
    } catch {
      definirErroGeral('Não foi possível reenviar o link. Tente novamente.')
    } finally {
      definirReenviando(false)
    }
  }

  if (solicitacao) {
    return (
      <LayoutAutenticacao
        titulo="Link enviado"
        elementoAntesTitulo={
          <div className={estilos.iconeConfirmacao}><IconeEmail tamanho={22} /></div>
        }
      >
        <div className={estilos.centralizado}>
          <p className={estilos.textoEstado}>
            Enviamos um e-mail para <strong>{solicitacao.email}</strong> com instruções para criar
            uma nova senha. O link expira em <strong>30 minutos</strong>.
          </p>
          {erroGeral ? <Mensagem tom="erro">{erroGeral}</Mensagem> : null}
          <div className={estilos.areaReenvio} aria-live="polite">
            Não chegou? Verifique a caixa de spam ou{' '}
            <button
              type="button"
              className={estilos.botaoLink}
              onClick={reenviar}
              disabled={contador > 0 || reenviando}
            >
              {reenviando ? 'reenviando…' : contador > 0 ? `reenviar em ${contador}s` : 'reenviar agora'}
            </button>.
          </div>
          {solicitacao.tokenDemonstracao ? (
            <div className={estilos.demonstracao}>
              <strong>Modo demonstração</strong><br />
              O e-mail não é enviado de verdade.{' '}
              <Link to={`/redefinir-senha?token=${solicitacao.tokenDemonstracao}`}>
                Simular abertura do link recebido
              </Link>
            </div>
          ) : null}
          <Link className={`${estilos.link} ${estilos.linkVoltar}`} to="/entrar">
            <IconeVoltar tamanho={14} /> Voltar para o login
          </Link>
        </div>
      </LayoutAutenticacao>
    )
  }

  return (
    <LayoutAutenticacao
      titulo="Esqueceu a senha?"
      subtitulo="Digite o e-mail da sua conta. Enviaremos um link para redefinir."
    >
      <form className={estilos.formulario} onSubmit={handleSubmit(solicitar)} noValidate>
        {erroGeral ? <Mensagem tom="erro">{erroGeral}</Mensagem> : null}
        <CampoFormulario
          id="email"
          rotulo="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          erro={errors.email?.message}
          {...register('email')}
        />
        <Botao type="submit" larguraTotal carregando={isSubmitting}>
          Enviar link de recuperação
        </Botao>
      </form>
      <div className={estilos.centralizado}>
        <Link className={`${estilos.link} ${estilos.linkVoltar}`} to="/entrar">
          <IconeVoltar tamanho={14} /> Voltar para o login
        </Link>
      </div>
    </LayoutAutenticacao>
  )
}
