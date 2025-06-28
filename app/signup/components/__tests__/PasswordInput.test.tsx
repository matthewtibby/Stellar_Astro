import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('renders with value and label', () => {
    render(<PasswordInput value="secret" onChange={() => {}} required label="Password" />);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('secret')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<PasswordInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'a' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<PasswordInput value="" onChange={() => {}} error="Password is too weak" />);
    expect(screen.getByText('Password is too weak')).toBeInTheDocument();
  });
}); 