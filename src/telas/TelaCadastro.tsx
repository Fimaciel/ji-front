import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Botao } from '../componentes/Botao'
import { CampoFormulario } from '../componentes/CampoFormulario'
import { Checkbox } from '../componentes/Checkbox'
import { IndicadorSenha } from '../componentes/IndicadorSenha'
import { LayoutAutenticacao } from '../componentes/LayoutAutenticacao'
import { Mensagem } from '../componentes/Mensagem'
import { servicoAutenticacao } from '../servicos/instanciaAutenticacao'
import { ErroAutenticacao } from '../tipos/autenticacao'
import {
  esquemaCadastro,
  formatarCpf,
  type DadosCadastro,
} from '../validacoes/esquemasAutenticacao'
import estilos from './Autenticacao.module.css'

export function TelaCadastro() {
  const navegar = useNavigate()
  const [erroGeral, definirErroGeral] = useState('')
  const [avisoLegal, definirAvisoLegal] = useState('')
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosCadastro>({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: {
      nome: '',
      sobrenome: '',
      cpf: '',
      dataNascimento: '',
      email: '',
      senha: '',
      aceitouTermos: false,
    },
  })

  const senha = useWatch({ control, name: 'senha' })
  const aceitouTermos = useWatch({ control, name: 'aceitouTermos' })

  async function cadastrar(dados: DadosCadastro) {
    definirErroGeral('')
    try {
      await servicoAutenticacao.cadastrarUsuario(dados)
      navegar('/entrar', {
        replace: true,
        state: { mensagem: 'Conta criada. Entre para acessar seu contexto Pessoal.' },
      })
    } catch (erro) {
      if (erro instanceof ErroAutenticacao && erro.codigo === 'EMAIL_EM_USO') {
        setError('email', { message: erro.message }, { shouldFocus: true })
        return
      }
      definirErroGeral('Não foi possível criar a conta. Tente novamente.')
    }
  }

  function mostrarAvisoLegal(documento: 'Termos de uso' | 'Política de privacidade') {
    definirAvisoLegal(`${documento}: conteúdo será disponibilizado antes da versão final do sistema.`)
  }

  return (
    <LayoutAutenticacao
      titulo="Criar sua conta"
      subtitulo="Em 30 segundos. Seu contexto Pessoal já fica criado."
      largura="ampla"
    >
      <form className={estilos.formulario} onSubmit={handleSubmit(cadastrar)} noValidate>
        {erroGeral ? <Mensagem tom="erro">{erroGeral}</Mensagem> : null}
        <div className={estilos.gradeDupla}>
          <CampoFormulario
            id="nome"
            rotulo="Nome"
            autoComplete="given-name"
            erro={errors.nome?.message}
            {...register('nome')}
          />
          <CampoFormulario
            id="sobrenome"
            rotulo="Sobrenome"
            autoComplete="family-name"
            erro={errors.sobrenome?.message}
            {...register('sobrenome')}
          />
        </div>
        <div className={estilos.gradeDupla}>
          <Controller
            name="cpf"
            control={control}
            render={({ field }) => (
              <CampoFormulario
                id="cpf"
                rotulo="CPF (opcional)"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={field.value ?? ''}
                onBlur={field.onBlur}
                onChange={(evento) => field.onChange(formatarCpf(evento.target.value))}
                ref={field.ref}
                erro={errors.cpf?.message}
              />
            )}
          />
          <CampoFormulario
            id="data-nascimento"
            rotulo="Data de nascimento (opcional)"
            type="date"
            autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            erro={errors.dataNascimento?.message}
            {...register('dataNascimento')}
          />
        </div>
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
          autoComplete="new-password"
          ajuda="Mínimo 8 caracteres, com letra maiúscula e número."
          erro={errors.senha?.message}
          {...register('senha')}
        />
        {senha ? <IndicadorSenha senha={senha} /> : null}
        <div className={estilos.linhaTermos}>
          <Checkbox {...register('aceitouTermos')}>
            Li e aceito os{' '}
            <button
              type="button"
              className={`${estilos.botaoLink} ${estilos.botaoLinkInline}`}
              onClick={() => mostrarAvisoLegal('Termos de uso')}
            >
              Termos de uso
            </button>{' '}
            e a{' '}
            <button
              type="button"
              className={`${estilos.botaoLink} ${estilos.botaoLinkInline}`}
              onClick={() => mostrarAvisoLegal('Política de privacidade')}
            >
              Política de privacidade
            </button>.
          </Checkbox>
          {errors.aceitouTermos ? (
            <p className={estilos.erroTermos} role="alert">{errors.aceitouTermos.message}</p>
          ) : null}
        </div>
        {avisoLegal ? <Mensagem tom="informativa" aria-live="polite">{avisoLegal}</Mensagem> : null}
        <Botao type="submit" larguraTotal carregando={isSubmitting} disabled={!aceitouTermos}>
          Criar conta
        </Botao>
      </form>
      <div className={estilos.rodapeAutenticacao}>
        Já tem uma conta? <Link className={estilos.link} to="/entrar">Entrar</Link>
      </div>
    </LayoutAutenticacao>
  )
}
