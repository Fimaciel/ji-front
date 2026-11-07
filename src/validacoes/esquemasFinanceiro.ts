import { z } from 'zod'
import { dataLocalIso } from '../servicos/dataLocal'

export const esquemaCategoria = z.object({
  nome: z.string().trim()
    .min(1, 'Informe o nome da categoria.')
    .max(60, 'Use no máximo 60 caracteres.'),
})

export const esquemaTransacao = z.object({
  tipo: z.enum(['ENTRADA', 'SAIDA']),
  valor: z.string().trim().refine((valor) => {
    const numero = Number(valor.replace(',', '.'))
    return Number.isFinite(numero) && numero > 0 && /^\d+(?:[.,]\d{1,2})?$/.test(valor)
  }, 'Informe um valor positivo com até duas casas decimais.'),
  data: z.string().min(1, 'Informe a data.').refine(
    (data) => data <= dataLocalIso(),
    'A data não pode ser futura.',
  ),
  categoriaId: z.string().min(1, 'Selecione uma categoria.'),
  descricao: z.string().trim()
    .min(1, 'Informe a descrição.')
    .max(255, 'Use no máximo 255 caracteres.'),
})

export const esquemaOrcamento = z.object({
  categoriaId: z.string().min(1, 'Selecione uma categoria.'),
  valorLimite: z.string().trim().refine((valor) => {
    const numero = Number(valor.replace(',', '.'))
    return Number.isFinite(numero) && numero > 0 && /^\d+(?:[.,]\d{1,2})?$/.test(valor)
  }, 'Informe um limite positivo com até duas casas decimais.'),
  mesReferencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe um mês válido.'),
})

export function converterValor(valor: string) {
  return Number(valor.replace(',', '.'))
}

export type DadosCategoria = z.infer<typeof esquemaCategoria>
export type DadosTransacao = z.infer<typeof esquemaTransacao>
export type DadosOrcamento = z.infer<typeof esquemaOrcamento>
