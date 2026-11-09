import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import { Botao } from '../componentes/Botao'
import { LogoJi } from '../componentes/LogoJi'
import { Mensagem } from '../componentes/Mensagem'
import { servicoContextos } from '../servicos/instanciaAutenticacao'
import type { ConviteContexto } from '../tipos/autenticacao'
import estilos from './Contextos.module.css'

export function TelaConvitePublico() {
  const { token = '' } = useParams()
  const { sessao, recarregarContextos } = useAutenticacao()
  const navegar = useNavigate()
  const [convite, definirConvite] = useState<ConviteContexto | null>(null)
  const [erro, definirErro] = useState('')
  const [processando, definirProcessando] = useState(false)

  useEffect(() => {
    servicoContextos.detalharConvite(token)
      .then(definirConvite)
      .catch(() => definirErro('Este convite é inválido, expirou ou já foi respondido.'))
  }, [token])

  async function aceitar() {
    if (!convite) return
    definirProcessando(true)
    try {
      await servicoContextos.aceitarConvite(convite.id)
      await recarregarContextos()
      navegar('/app/contextos', { replace: true })
    } catch {
      definirErro('Não foi possível aceitar este convite.')
    } finally {
      definirProcessando(false)
    }
  }

  return (
    <main className={estilos.selecaoPagina}>
      <section className={estilos.convitePainel}>
        <LogoJi tamanho={44} />
        {erro ? <Mensagem tom="erro">{erro}</Mensagem> : convite ? (
          <>
            <div className={estilos.selecaoCabecalho}>
              <p>Convite para colaborar</p>
              <h1>{convite.contextoNome}</h1>
              <span>{convite.convidadoPor} convidou você como {convite.papelProposto.toLocaleLowerCase('pt-BR')}.</span>
            </div>
            {sessao ? (
              <Botao larguraTotal carregando={processando} onClick={aceitar}>Aceitar convite</Botao>
            ) : (
              <Link
                className={estilos.linkPrimario}
                to="/entrar"
                state={{ de: `/convite/${token}` }}
              >Entrar para responder</Link>
            )}
            <small className={estilos.validade}>Válido até {new Date(convite.dataExpiracao).toLocaleString('pt-BR')}</small>
          </>
        ) : <p className={estilos.estadoVazio}>Carregando convite…</p>}
      </section>
    </main>
  )
}
