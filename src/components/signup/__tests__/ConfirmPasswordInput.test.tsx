import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmPasswordInput } from '../ConfirmPasswordInput';

describe('ConfirmPasswordInput', () => {
  it('renders with label and placeholder', () => {
    render(
      <ConfirmPasswordInput
        value=""
        onChange={() => {}}
        showPassword={false}
        setShowPassword={() => {}}
      />
    );
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/re-enter your password/i)).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(
      <ConfirmPasswordInput
        value="secret123"
        onChange={() => {}}
        showPassword={false}
        setShowPassword={() => {}}
      />
    );
    expect(screen.getByDisplayValue('secret123')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(
      <ConfirmPasswordInput
        value=""
        onChange={handleChange}
        showPassword={false}
        setShowPassword={() => {}}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/re-enter your password/i), { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(
      <ConfirmPasswordInput
        value=""
        onChange={() => {}}
        error="Passwords do not match"
        showPassword={false}
        setShowPassword={() => {}}
      />
    );
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    const setShowPassword = jest.fn();
    render(
      <ConfirmPasswordInput
        value=""
        onChange={() => {}}
        showPassword={false}
        setShowPassword={setShowPassword}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(setShowPassword).toHaveBeenCalledWith(true);
  });
}); 