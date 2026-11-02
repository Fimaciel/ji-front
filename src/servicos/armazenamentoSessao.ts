import type { SessaoAutenticada, UsuarioResumo } from '../tipos/autenticacao'

export const CHAVE_SESSAO = 'ji:sessao:v1'

interface RegistroSessao {
  versao: 1
  sessao: SessaoAutenticada
}

export function persistirSessao(sessao: SessaoAutenticada, lembrar: boolean) {
  limparSessao()
  const registro: RegistroSessao = { versao: 1, sessao }
  const armazenamento = lembrar ? localStorage : sessionStorage
  armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(registro))
}

function lerSessao(armazenamento: Storage): SessaoAutenticada | null {
  const valor = armazenamento.getItem(CHAVE_SESSAO)
  if (!valor) return null

  try {
    const registro = JSON.parse(valor) as RegistroSessao
    if (registro.versao !== 1 || !registro.sessao?.token || !registro.sessao.usuario?.email) {
      armazenamento.removeItem(CHAVE_SESSAO)
      return null
    }
    if (registro.sessao.expiraEm && Date.parse(registro.sessao.expiraEm) <= Date.now()) {
      armazenamento.removeItem(CHAVE_SESSAO)
      return null
    }
    return registro.sessao
  } catch {
    armazenamento.removeItem(CHAVE_SESSAO)
    return null
  }
}

export function lerSessaoAtual() {
  return lerSessao(sessionStorage) ?? lerSessao(localStorage)
}

export function atualizarUsuarioPersistido(usuario: UsuarioResumo) {
  for (const armazenamento of [sessionStorage, localStorage]) {
    const sessao = lerSessao(armazenamento)
    if (!sessao) continue
    armazenamento.setItem(
      CHAVE_SESSAO,
      JSON.stringify({ versao: 1, sessao: { ...sessao, usuario } } satisfies RegistroSessao),
    )
  }
}

export function limparSessao() {
  sessionStorage.removeItem(CHAVE_SESSAO)
  localStorage.removeItem(CHAVE_SESSAO)
}

export function limparArmazenamentoJi() {
  for (const armazenamento of [sessionStorage, localStorage]) {
    for (let indice = armazenamento.length - 1; indice >= 0; indice -= 1) {
      const chave = armazenamento.key(indice)
      if (chave?.startsWith('ji:')) armazenamento.removeItem(chave)
    }
  }
}
