import { z } from 'zod'

const regexMaiuscula = /[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/
const regexNumero = /\d/
const regexEspecial = /[^\p{L}\d\s]/u

export function senhaAtendeRequisitos(senha: string) {
  return senha.length >= 8 && regexMaiuscula.test(senha) && regexNumero.test(senha)
}

export function senhaTemCaractereEspecial(senha: string) {
  return regexEspecial.test(senha)
}

export function formatarCpf(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function cpfValido(cpfFormatado: string) {
  const cpf = cpfFormatado.replace(/\D/g, '')
  if (!cpf) return true
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  const calcularDigito = (base: string, fatorInicial: number) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + Number(digito) * (fatorInicial - indice),
      0,
    )
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const primeiro = calcularDigito(cpf.slice(0, 9), 10)
  const segundo = calcularDigito(cpf.slice(0, 10), 11)
  return primeiro === Number(cpf[9]) && segundo === Number(cpf[10])
}

const esquemaEmail = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Digite um e-mail válido.')

const esquemaSenha = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres.')
  .refine((senha) => regexMaiuscula.test(senha), 'Inclua uma letra maiúscula.')
  .refine((senha) => regexNumero.test(senha), 'Inclua pelo menos um número.')

export const esquemaCadastro = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome.'),
  sobrenome: z.string().trim().min(1, 'Informe seu sobrenome.'),
  cpf: z.string().refine(cpfValido, 'Digite um CPF válido.').optional(),
  dataNascimento: z
    .string()
    .optional()
    .refine((data) => !data || (!Number.isNaN(Date.parse(data)) && Date.parse(data) <= Date.now()), {
      message: 'Digite uma data de nascimento válida.',
    }),
  email: esquemaEmail,
  senha: esquemaSenha,
  aceitouTermos: z.boolean().refine(Boolean, 'Aceite os Termos de uso e a Política de privacidade.'),
})

export const esquemaLogin = z.object({
  email: esquemaEmail,
  senha: z.string().min(1, 'Informe sua senha.'),
  lembrar: z.boolean(),
})

export const esquemaRecuperacao = z.object({ email: esquemaEmail })

export const esquemaRedefinicao = z
  .object({
    novaSenha: esquemaSenha,
    confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmarSenha'],
  })

export type DadosCadastro = z.infer<typeof esquemaCadastro>
export type DadosLogin = z.infer<typeof esquemaLogin>
export type DadosRecuperacao = z.infer<typeof esquemaRecuperacao>
export type DadosRedefinicao = z.infer<typeof esquemaRedefinicao>
