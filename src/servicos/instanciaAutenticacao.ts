import { ServicoAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import type { ServicoAutenticacao } from './ServicoAutenticacao'
import type { ServicoConta } from './ServicoConta'
import { ServicoRest } from './ServicoRest'

const usarMock = import.meta.env.MODE === 'test' || import.meta.env.VITE_USAR_MOCK === 'true'
const urlApi = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const adaptador = usarMock ? new ServicoAutenticacaoMock() : new ServicoRest(urlApi)

export const servicoAutenticacao: ServicoAutenticacao = adaptador
export const servicoConta: ServicoConta = adaptador
