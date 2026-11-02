import { z } from 'zod'
import { senhaAtendeRequisitos } from './esquemasAutenticacao'

const email = z.string().trim().min(1, 'Informe seu e-mail.').email('Digite um e-mail válido.')

export const esquemaPerfil = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome.').max(60, 'Use no máximo 60 caracteres.'),
  sobrenome: z.string().trim().min(1, 'Informe seu sobrenome.').max(80, 'Use no máximo 80 caracteres.'),
  email,
  dataNascimento: z.string().refine(
    (data) => !data || (!Number.isNaN(Date.parse(data)) && Date.parse(data) <= Date.now()),
    'Digite uma data de nascimento válida.',
  ),
  senhaAtual: z.string().min(1, 'Informe sua senha atual para salvar.'),
  novaSenha: z.string(),
  confirmacaoNovaSenha: z.string(),
}).superRefine((dados, contexto) => {
  if (!dados.novaSenha && !dados.confirmacaoNovaSenha) return
  if (!senhaAtendeRequisitos(dados.novaSenha)) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['novaSenha'],
      message: 'Use 8 caracteres, uma letra maiúscula e um número.',
    })
  }
  if (dados.novaSenha !== dados.confirmacaoNovaSenha) {
    contexto.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmacaoNovaSenha'],
      message: 'As senhas precisam ser iguais.',
    })
  }
})

export function converterSalario(valor: string) {
  if (!valor.trim()) return Number.NaN
  return Number(valor.replace(/\./g, '').replace(',', '.'))
}

export function formatarSalario(valor: string | number) {
  const numero = typeof valor === 'number' ? valor : converterSalario(valor)
  if (!Number.isFinite(numero)) return ''
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero)
}

export function formatarEntradaSalario(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 12)
  if (!digitos) return ''
  return formatarSalario(Number(digitos) / 100)
}

export const esquemaConfiguracao = z.object({
  salarioMensal: z.string().min(1, 'Informe o salário mensal.').refine((valor) => {
    const numero = converterSalario(valor)
    return Number.isFinite(numero) && numero >= 0 && numero <= 9_999_999_999.99
  }, 'Informe um valor válido, igual ou maior que zero.'),
  moeda: z.literal('BRL'),
  notificacoesAtivas: z.boolean(),
})

export type DadosPerfil = z.infer<typeof esquemaPerfil>
export type DadosConfiguracao = z.infer<typeof esquemaConfiguracao>
