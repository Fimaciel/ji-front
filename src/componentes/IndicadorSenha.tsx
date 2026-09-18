import { IconeCheck } from './Icones'
import { senhaAtendeRequisitos, senhaTemCaractereEspecial } from '../validacoes/esquemasAutenticacao'
import estilos from '../telas/Autenticacao.module.css'

export function IndicadorSenha({ senha }: { senha: string }) {
  const requisitos = [
    { rotulo: 'Pelo menos 8 caracteres', atendido: senha.length >= 8 },
    { rotulo: 'Uma letra maiúscula', atendido: /[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(senha) },
    { rotulo: 'Um número', atendido: /\d/.test(senha) },
    { rotulo: 'Um caractere especial (recomendado)', atendido: senhaTemCaractereEspecial(senha) },
  ]
  const baseAtendida = senhaAtendeRequisitos(senha)
  const quantidadeAtendida = requisitos.filter((requisito) => requisito.atendido).length

  return (
    <div className={estilos.indicadorSenha} aria-label="Requisitos da senha">
      <div className={estilos.barrasSenha} aria-hidden="true">
        {requisitos.map((requisito, indice) => (
          <span
            key={requisito.rotulo}
            className={indice < quantidadeAtendida ? estilos.barraAtiva : ''}
          />
        ))}
      </div>
      <ul>
        {requisitos.map((requisito, indice) => (
          <li key={requisito.rotulo} className={requisito.atendido ? estilos.requisitoAtendido : ''}>
            <span className={estilos.marcaRequisito} aria-hidden="true">
              {requisito.atendido ? <IconeCheck tamanho={9} /> : '○'}
            </span>
            {requisito.rotulo}
            {indice === 2 && baseAtendida ? <span className={estilos.somenteLeitor}>Senha válida</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
