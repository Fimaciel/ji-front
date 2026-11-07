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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/entrar" replace />} />
      <Route path="/entrar" element={<RotaPublica><TelaEntrar /></RotaPublica>} />
      <Route path="/cadastro" element={<RotaPublica><TelaCadastro /></RotaPublica>} />
      <Route path="/recuperar-senha" element={<RotaPublica><TelaRecuperarSenha /></RotaPublica>} />
      <Route path="/redefinir-senha" element={<RotaPublica><TelaRedefinirSenha /></RotaPublica>} />
      <Route path="/app" element={<RotaProtegida><LayoutApp /></RotaProtegida>}>
        <Route index element={<TelaApp />} />
        <Route path="transacoes" element={<TelaTransacoes />} />
        <Route path="orcamentos" element={<TelaOrcamentos />} />
        <Route path="categorias" element={<TelaCategorias />} />
        <Route path="configuracoes" element={<TelaConfiguracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/entrar" replace />} />
    </Routes>
  )
}
