import type { InputHTMLAttributes, ReactNode } from 'react'
import estilos from './Componentes.module.css'

interface PropriedadesCheckbox extends InputHTMLAttributes<HTMLInputElement> {
  children: ReactNode
}

export function Checkbox({ children, ...propriedades }: PropriedadesCheckbox) {
  return (
    <label className={estilos.checkboxRotulo}>
      <input type="checkbox" className={estilos.checkbox} {...propriedades} />
      <span>{children}</span>
    </label>
  )
}
