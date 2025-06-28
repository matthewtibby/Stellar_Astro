import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailInput } from '../EmailInput';

describe('EmailInput', () => {
  it('renders with label and placeholder', () => {
    render(<EmailInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(<EmailInput value="test@example.com" onChange={() => {}} />);
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<EmailInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'a@b.com' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<EmailInput value="" onChange={() => {}} error="Email is invalid" />);
    expect(screen.getByText(/email is invalid/i)).toBeInTheDocument();
  });
}); 