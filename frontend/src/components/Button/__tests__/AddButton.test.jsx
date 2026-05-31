import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddButton } from '../AddButton'

describe('AddButton', () => {
  it('renders with default plus icon', () => {
    render(<AddButton />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600')
  })
  
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<AddButton onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies custom aria-label', () => {
    render(<AddButton ariaLabel="Add new item" />)
    
    expect(screen.getByLabelText('Add new item')).toBeInTheDocument()
  })
})