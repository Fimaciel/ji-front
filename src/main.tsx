import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ProvedorAutenticacao } from './autenticacao/ProvedorAutenticacao'
import './estilos/globais.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorAutenticacao>
        <App />
      </ProvedorAutenticacao>
    </BrowserRouter>
  </StrictMode>,
)
