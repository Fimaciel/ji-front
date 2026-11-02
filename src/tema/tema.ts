import type { TemaUsuario } from '../tipos/conta'

export const CHAVE_TEMA = 'ji:tema:v1'

function temaValido(valor: string | null): valor is TemaUsuario {
  return valor === 'CLARO' || valor === 'ESCURO' || valor === 'AUTOMATICO'
}

export function obterTemaLocal(): TemaUsuario {
  const valor = localStorage.getItem(CHAVE_TEMA)
  return temaValido(valor) ? valor : 'AUTOMATICO'
}

export function aplicarTema(tema: TemaUsuario) {
  const escuro = tema === 'ESCURO'
    || (tema === 'AUTOMATICO' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro'
  document.documentElement.style.colorScheme = escuro ? 'dark' : 'light'
}

export function persistirTema(tema: TemaUsuario) {
  localStorage.setItem(CHAVE_TEMA, tema)
  aplicarTema(tema)
}

export function inicializarTema() {
  aplicarTema(obterTemaLocal())
}
