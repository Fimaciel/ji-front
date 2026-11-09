import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { LogoJi } from '../componentes/LogoJi'
import { Mensagem } from '../componentes/Mensagem'
import estilos from './Contextos.module.css'

export function TelaSelecionarContexto() {
  const { sessao, selecionarContexto, sair } = useAutenticacao()
  const navegar = useNavigate()
  const [selecionado, definirSelecionado] = useState(sessao?.contextoAtivo.id ?? '')
  const [salvando, definirSalvando] = useState(false)
  const [erro, definirErro] = useState('')

  if (!sessao) return null

  async function continuar() {
    definirSalvando(true)
    definirErro('')
    try {
      await selecionarContexto(selecionado)
      navegar('/app', { replace: true })
    } catch {
      definirErro('Não foi possível selecionar o contexto. Tente novamente.')
    } finally {
      definirSalvando(false)
    }
  }

  async function trocarConta() {
    await sair()
    navegar('/entrar', { replace: true })
  }

  return (
    <main className={estilos.selecaoPagina}>
      <section className={estilos.selecaoPainel} aria-labelledby="titulo-selecao-contexto">
        <LogoJi tamanho={44} />
        <div className={estilos.selecaoCabecalho}>
          <p>Olá, {sessao.usuario.nome}</p>
          <h1 id="titulo-selecao-contexto">Onde você quer entrar?</h1>
          <span>Escolha o contexto financeiro desta sessão.</span>
        </div>
        {erro ? <Mensagem tom="erro">{erro}</Mensagem> : null}
        <div className={estilos.opcoesContexto} role="radiogroup" aria-label="Contextos disponíveis">
          {sessao.contextos.map((contexto) => (
            <label key={contexto.id} className={selecionado === contexto.id ? estilos.contextoSelecionado : ''}>
              <input
                type="radio"
                name="contexto"
                value={contexto.id}
                checked={selecionado === contexto.id}
                onChange={() => definirSelecionado(contexto.id)}
              />
              <span className={estilos.marcaContexto}>{contexto.nome.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{contexto.nome}</strong>
                <small>{contexto.tipo === 'PESSOAL' ? 'Uso individual' : contexto.papel.toLocaleLowerCase('pt-BR')}</small>
              </span>
            </label>
          ))}
        </div>
        <Botao larguraTotal carregando={salvando} disabled={!selecionado} onClick={continuar}>
          Continuar
        </Botao>
        <button className={estilos.botaoTexto} type="button" onClick={trocarConta}>Entrar com outra conta</button>
      </section>
    </main>
  )
}
