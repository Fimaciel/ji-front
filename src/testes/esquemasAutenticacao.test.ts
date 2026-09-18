import { describe, expect, it } from 'vitest'
import {
  esquemaCadastro,
  esquemaRedefinicao,
  formatarCpf,
  senhaAtendeRequisitos,
  senhaTemCaractereEspecial,
} from '../validacoes/esquemasAutenticacao'

const cadastroValido = {
  nome: 'Ana',
  sobrenome: 'Silva',
  cpf: '',
  dataNascimento: '',
  email: 'ana@email.com',
  senha: 'Senha123',
  aceitouTermos: true,
}

describe('validações de autenticação', () => {
  it('aceita CPF e data de nascimento vazios por serem opcionais', () => {
    expect(esquemaCadastro.safeParse(cadastroValido).success).toBe(true)
  })

  it('valida campos obrigatórios, CPF e data futura', () => {
    const obrigatorios = esquemaCadastro.safeParse({
      ...cadastroValido,
      nome: '',
      sobrenome: '',
      email: '',
      senha: '',
      aceitouTermos: false,
    })
    expect(obrigatorios.success).toBe(false)

    const opcionaisInvalidos = esquemaCadastro.safeParse({
      ...cadastroValido,
      cpf: '111.111.111-11',
      dataNascimento: '2999-01-01',
    })
    expect(opcionaisInvalidos.success).toBe(false)
  })

  it('aplica a máscara de CPF sem aceitar mais de onze dígitos', () => {
    expect(formatarCpf('52998224725123')).toBe('529.982.247-25')
  })

  it('exige oito caracteres, maiúscula e número e apenas recomenda caractere especial', () => {
    expect(senhaAtendeRequisitos('Senha123')).toBe(true)
    expect(senhaTemCaractereEspecial('Senha123')).toBe(false)
    expect(senhaTemCaractereEspecial('Senha123!')).toBe(true)
  })

  it('confere a confirmação da nova senha', () => {
    const resultado = esquemaRedefinicao.safeParse({
      novaSenha: 'Senha123',
      confirmarSenha: 'Outra123',
    })
    expect(resultado.success).toBe(false)
  })
})
