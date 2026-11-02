let avisoEncerramentoPendente = false

export function registrarAvisoEncerramento() {
  avisoEncerramentoPendente = true
}

export function obterAvisoEncerramento() {
  if (!avisoEncerramentoPendente) return null
  return 'Conta encerrada. Seus dados foram preservados conforme as regras do Ji.'
}

export function limparAvisoEncerramento() {
  avisoEncerramentoPendente = false
}
