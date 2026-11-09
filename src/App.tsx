import { Navigate, Route, Routes } from 'react-router-dom'
import { RotaProtegida, RotaPublica } from './autenticacao/RotasAutenticacao'
import { LayoutApp } from './componentes/LayoutApp'
import { TelaApp } from './telas/TelaApp'
import { TelaCadastro } from './telas/TelaCadastro'
import { TelaEntrar } from './telas/TelaEntrar'
import { TelaRecuperarSenha } from './telas/TelaRecuperarSenha'
import { TelaRedefinirSenha } from './telas/TelaRedefinirSenha'
import { TelaConfiguracoes } from './telas/TelaConfiguracoes'
import { TelaCategorias } from './telas/TelaCategorias'
import { TelaTransacoes } from './telas/TelaTransacoes'
import { TelaOrcamentos } from './telas/TelaOrcamentos'
import { TelaSelecionarContexto } from './telas/TelaSelecionarContexto'
import { TelaContextos } from './telas/TelaContextos'
import { TelaConvites } from './telas/TelaConvites'
import { TelaConvitePublico } from './telas/TelaConvitePublico'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/entrar" replace />} />
      <Route path="/entrar" element={<RotaPublica><TelaEntrar /></RotaPublica>} />
      <Route path="/cadastro" element={<RotaPublica><TelaCadastro /></RotaPublica>} />
      <Route path="/recuperar-senha" element={<RotaPublica><TelaRecuperarSenha /></RotaPublica>} />
      <Route path="/redefinir-senha" element={<RotaPublica><TelaRedefinirSenha /></RotaPublica>} />
      <Route path="/convite/:token" element={<TelaConvitePublico />} />
      <Route path="/selecionar-contexto" element={<RotaProtegida><TelaSelecionarContexto /></RotaProtegida>} />
      <Route path="/app" element={<RotaProtegida><LayoutApp /></RotaProtegida>}>
        <Route index element={<TelaApp />} />
        <Route path="transacoes" element={<TelaTransacoes />} />
        <Route path="orcamentos" element={<TelaOrcamentos />} />
        <Route path="categorias" element={<TelaCategorias />} />
        <Route path="configuracoes" element={<TelaConfiguracoes />} />
        <Route path="contextos" element={<TelaContextos />} />
        <Route path="convites" element={<TelaConvites />} />
      </Route>
      <Route path="*" element={<Navigate to="/entrar" replace />} />
    </Routes>
  )
}
