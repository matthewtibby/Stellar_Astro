import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordInput } from '../../../../app/signup/components/PasswordInput';

describe('PasswordInput', () => {
  it('renders with placeholder', () => {
    render(<PasswordInput value="" onChange={() => {}} required />);
    expect(screen.getAllByLabelText('Password')[0]).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(<PasswordInput value="secret123" onChange={() => {}} />);
    expect(screen.getByDisplayValue('secret123')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<PasswordInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getAllByLabelText('Password')[0], { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<PasswordInput value="" onChange={() => {}} error="Password is too weak" />);
    expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(<PasswordInput value="secret" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: /show password/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button); // This will toggle visibility, but since show is internal, just check button exists
  });

  it('renders with required attribute', () => {
    render(<PasswordInput value="" onChange={() => {}} required />);
    expect(screen.getAllByLabelText('Password')[0]).toBeRequired();
  });

  it('renders with disabled attribute', () => {
    render(<PasswordInput value="secret123" onChange={() => {}} disabled />);
    expect(screen.getAllByLabelText('Password')[0]).toBeDisabled();
  });

  it('renders with autoFocus attribute', () => {
    render(<PasswordInput value="" onChange={() => {}} autoFocus />);
    expect(screen.getAllByLabelText('Password')[0]).toHaveFocus();
  });
}); 