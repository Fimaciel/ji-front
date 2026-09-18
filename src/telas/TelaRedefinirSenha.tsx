import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { IconeRelogio, IconeVoltar } from '../componentes/Icones'
import { IndicadorSenha } from '../componentes/IndicadorSenha'
import { LayoutAutenticacao } from '../componentes/LayoutAutenticacao'
import { Mensagem } from '../componentes/Mensagem'
import { servicoAutenticacao } from '../servicos/instanciaAutenticacao'
import type { EstadoTokenRedefinicao } from '../tipos/autenticacao'
import { esquemaRedefinicao, type DadosRedefinicao } from '../validacoes/esquemasAutenticacao'
import estilos from './Autenticacao.module.css'

export function TelaRedefinirSenha() {
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const token = parametros.get('token') ?? ''
  const [estadoToken, definirEstadoToken] = useState<EstadoTokenRedefinicao | null>(null)
  const [erroGeral, definirErroGeral] = useState('')
  const [instanteAbertura] = useState(() => Date.now())
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosRedefinicao>({
    resolver: zodResolver(esquemaRedefinicao),
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  })
  const senha = useWatch({ control, name: 'novaSenha' })

  useEffect(() => {
    let ativo = true
    servicoAutenticacao.validarTokenRedefinicao(token).then((estado) => {
      if (ativo) definirEstadoToken(estado)
    })
    return () => {
      ativo = false
    }
  }, [token])

  async function salvar(dados: DadosRedefinicao) {
    definirErroGeral('')
    try {
      await servicoAutenticacao.redefinirSenha({ token, novaSenha: dados.novaSenha })
      navegar('/entrar', {
        replace: true,
        state: { mensagem: 'Senha alterada. Entre com sua nova senha.' },
      })
    } catch {
      definirErroGeral('Este link não pode mais ser usado. Solicite uma nova recuperação.')
    }
  }

  if (!estadoToken) {
    return (
      <main className={estilos.paginaAutenticacao} aria-busy="true" aria-label="Validando link">
        <span className={estilos.carregandoPagina} aria-hidden="true" />
      </main>
    )
  }

  if (estadoToken.status !== 'valido') {
    const mensagem = estadoToken.status === 'expirado'
      ? 'Este link expirou. Solicite um novo link para continuar.'
      : estadoToken.status === 'utilizado'
        ? 'Este link já foi utilizado. Solicite um novo link se ainda precisar alterar a senha.'
        : 'Este link de recuperação não é válido.'

    return (
      <LayoutAutenticacao titulo="Link indisponível" subtitulo={mensagem}>
        <div className={estilos.centralizado}>
          <Link className={estilos.link} to="/recuperar-senha">Solicitar novo link</Link>
          <br />
          <Link className={`${estilos.link} ${estilos.linkVoltar}`} to="/entrar">
            <IconeVoltar tamanho={14} /> Voltar para o login
          </Link>
        </div>
      </LayoutAutenticacao>
    )
  }

  const minutosRestantes = Math.max(
    1,
    Math.ceil((Date.parse(estadoToken.expiraEm) - instanteAbertura) / 60_000),
  )

  return (
    <LayoutAutenticacao
      titulo="Defina uma nova senha"
      subtitulo={<>Conta: <strong>{estadoToken.email}</strong></>}
    >
      <div className={estilos.avisoExpiracao}>
        <IconeRelogio tamanho={14} />
        Este link expira em <strong>{minutosRestantes} minutos</strong>.
      </div>
      <form className={estilos.formulario} onSubmit={handleSubmit(salvar)} noValidate>
        {erroGeral ? <Mensagem tom="erro">{erroGeral}</Mensagem> : null}
        <CampoFormulario
          id="nova-senha"
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          erro={errors.novaSenha?.message}
          {...register('novaSenha')}
        />
        <CampoFormulario
          id="confirmar-senha"
          rotulo="Confirmar senha"
          type="password"
          autoComplete="new-password"
          erro={errors.confirmarSenha?.message}
          {...register('confirmarSenha')}
        />
        <IndicadorSenha senha={senha} />
        <Botao type="submit" larguraTotal carregando={isSubmitting}>
          Salvar nova senha
        </Botao>
      </form>
    </LayoutAutenticacao>
  )
}
