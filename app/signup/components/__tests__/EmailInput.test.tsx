import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailInput } from '../EmailInput';

describe('EmailInput', () => {
  it('renders with value and label', () => {
    render(<EmailInput value="test@example.com" onChange={() => {}} required />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<EmailInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<EmailInput value="" onChange={() => {}} error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });
}); 