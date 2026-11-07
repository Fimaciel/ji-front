import { ServicoAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import { ServicoFinanceiroMock } from '../mocks/ServicoFinanceiroMock'
import type { ServicoAutenticacao } from './ServicoAutenticacao'
import type { ServicoConta } from './ServicoConta'
import type { ServicoFinanceiro } from './ServicoFinanceiro'
import { ServicoRest } from './ServicoRest'

const usarMock = import.meta.env.MODE === 'test' || import.meta.env.VITE_USAR_MOCK === 'true'
const urlApi = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const adaptadorRest = new ServicoRest(urlApi)
const adaptador = usarMock ? new ServicoAutenticacaoMock() : adaptadorRest
const adaptadorFinanceiro = usarMock ? new ServicoFinanceiroMock() : adaptadorRest

export const servicoAutenticacao: ServicoAutenticacao = adaptador
export const servicoConta: ServicoConta = adaptador
export const servicoFinanceiro: ServicoFinanceiro = adaptadorFinanceiro
