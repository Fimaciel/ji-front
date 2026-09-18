import { ServicoAutenticacaoMock } from '../mocks/ServicoAutenticacaoMock'
import type { ServicoAutenticacao } from './ServicoAutenticacao'

// Ponto único de composição: a UI conhece somente o contrato e pode receber um adaptador REST.
export const servicoAutenticacao: ServicoAutenticacao = new ServicoAutenticacaoMock()
