import { render, screen } from '@testing-library/react'
import CenteredSpinner from '../CenteredSpinner'

describe('CenteredSpinner', () => {
  it('renders spinner element', () => {
    const { container } = render(<CenteredSpinner />)
    
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })
  
  it('renders with correct styling', () => {
    const { container } = render(<CenteredSpinner />)
    
    expect(container.firstChild).toHaveClass('text-center', 'mt-10')
  })
})