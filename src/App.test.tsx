import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(cleanup)

describe('PABLO APP', () => {
  it('muestra la página inicial y el contador en cero', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Tu idea')
    expect(screen.getByRole('status', { name: 'Contador' }).textContent).toBe('0')
    expect((screen.getByRole('button', { name: 'Reiniciar' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('permite sumar varias veces y reiniciar el contador', async () => {
    const user = userEvent.setup()
    render(<App />)
    const add = screen.getByRole('button', { name: 'Sumar uno' })
    await user.click(add)
    await user.click(add)
    expect(screen.getByRole('status', { name: 'Contador' }).textContent).toBe('2')
    const reset = screen.getByRole('button', { name: 'Reiniciar' }) as HTMLButtonElement
    expect(reset.disabled).toBe(false)
    await user.click(reset)
    expect(screen.getByRole('status', { name: 'Contador' }).textContent).toBe('0')
    expect(reset.disabled).toBe(true)
  })
})
