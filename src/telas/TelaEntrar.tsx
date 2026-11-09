import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { Checkbox } from '../componentes/Checkbox'
import { LayoutAutenticacao } from '../componentes/LayoutAutenticacao'
import { Mensagem } from '../componentes/Mensagem'
import type { DadosLogin } from '../validacoes/esquemasAutenticacao'
import { esquemaLogin } from '../validacoes/esquemasAutenticacao'
import { limparAvisoEncerramento, obterAvisoEncerramento } from '../servicos/avisosNavegacao'
import estilos from './Autenticacao.module.css'

interface EstadoNavegacao {
  mensagem?: string
  de?: string
}

export function TelaEntrar() {
  const { entrar } = useAutenticacao()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const estado = localizacao.state as EstadoNavegacao | null
  const [avisoEncerramento] = useState(obterAvisoEncerramento)
  const mensagemNavegacao = avisoEncerramento ?? estado?.mensagem
  const [erroGeral, definirErroGeral] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: {
      email: 'filipe.lopes@email.com',
      senha: '',
      lembrar: false,
    },
  })

  useEffect(() => {
    if (avisoEncerramento) limparAvisoEncerramento()
  }, [avisoEncerramento])

  async function autenticar(dados: DadosLogin) {
    definirErroGeral('')
    try {
      const sessao = await entrar(dados)
      navegar(
        sessao.selecaoContextoNecessaria
          ? '/selecionar-contexto'
          : estado?.de?.startsWith('/') ? estado.de : '/app',
        { replace: true },
      )
    } catch {
      definirErroGeral('Não foi possível entrar. Confira o e-mail e a senha.')
    }
  }

  return (
    <LayoutAutenticacao
      titulo="Entrar na sua conta"
      subtitulo="Bem-vinda de volta. Continue de onde parou."
      tamanhoLogo={44}
    >
      <form className={estilos.formulario} onSubmit={handleSubmit(autenticar)} noValidate>
        {mensagemNavegacao ? <Mensagem tom="sucesso">{mensagemNavegacao}</Mensagem> : null}
        {erroGeral ? <Mensagem tom="erro">{erroGeral}</Mensagem> : null}
        <CampoFormulario
          id="email"
          rotulo="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="você@email.com"
          erro={errors.email?.message}
          {...register('email')}
        />
        <CampoFormulario
          id="senha"
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        <div className={estilos.linhaOpcoes}>
          <Checkbox {...register('lembrar')}>Lembrar-me</Checkbox>
          <Link className={estilos.link} to="/recuperar-senha">Esqueci minha senha</Link>
        </div>
        <Botao type="submit" larguraTotal carregando={isSubmitting}>
          Entrar
        </Botao>
      </form>
      <div className={estilos.rodapeAutenticacao}>
        Não tem uma conta? <Link className={estilos.link} to="/cadastro">Criar conta</Link>
      </div>
    </LayoutAutenticacao>
  )
}
