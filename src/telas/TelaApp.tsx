import { Link } from 'react-router-dom'
import { useAutenticacao } from '../autenticacao/useAutenticacao'
import estilos from './TelaApp.module.css'

export function TelaApp() {
  const { sessao } = useAutenticacao()

  if (!sessao) return null

  return (
    <div className={estilos.conteudo}>
        <div className={estilos.saudacao}>Olá, {sessao.usuario.nomeCompleto}</div>
        <h1>Sua conta está pronta</h1>
        <p className={estilos.introducao}>
          Seu contexto Pessoal está ativo. Ajuste seus dados, preferências financeiras e aparência
          para deixar o Ji do seu jeito.
        </p>
        <dl className={estilos.resumo}>
          <div>
            <dt>Contexto ativo</dt>
            <dd>{sessao.contextoAtivo.nome}</dd>
          </div>
          <div>
            <dt>Seu papel</dt>
            <dd>Administrador</dd>
          </div>
          <div>
            <dt>Sessão</dt>
            <dd>{sessao.expiraEm ? 'Ativa e protegida' : 'Até fechar a aba'}</dd>
          </div>
        </dl>
        <div className={estilos.proximoPasso}>
          <span aria-hidden="true" />
          <Link to="/app/configuracoes">Revisar configurações da conta</Link>
        </div>
    </div>
  )
}
