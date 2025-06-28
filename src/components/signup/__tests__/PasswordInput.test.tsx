import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordInput } from '../PasswordInput';
import { PasswordCriteria, PasswordStrength } from '../../utils/signupValidation';

describe('PasswordInput', () => {
  const defaultCriteria: PasswordCriteria = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  };

  it('renders with label and placeholder', () => {
    render(
      <PasswordInput
        value=""
        onChange={() => {}}
        showPassword={false}
        setShowPassword={() => {}}
        passwordStrength="weak"
        passwordCriteria={defaultCriteria}
      />
    );
    expect(screen.getByPlaceholderText(/create a password/i)).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(
      <PasswordInput
        value="secret123"
        onChange={() => {}}
        showPassword={false}
        setShowPassword={() => {}}
        passwordStrength="medium"
        passwordCriteria={defaultCriteria}
      />
    );
    expect(screen.getByDisplayValue('secret123')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(
      <PasswordInput
        value=""
        onChange={handleChange}
        showPassword={false}
        setShowPassword={() => {}}
        passwordStrength="weak"
        passwordCriteria={defaultCriteria}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/create a password/i), { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(
      <PasswordInput
        value=""
        onChange={() => {}}
        error="Password is too weak"
        showPassword={false}
        setShowPassword={() => {}}
        passwordStrength="weak"
        passwordCriteria={defaultCriteria}
      />
    );
    expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    const setShowPassword = jest.fn();
    render(
      <PasswordInput
        value=""
        onChange={() => {}}
        showPassword={false}
        setShowPassword={setShowPassword}
        passwordStrength="weak"
        passwordCriteria={defaultCriteria}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(setShowPassword).toHaveBeenCalledWith(true);
  });

  it('shows password strength meter', () => {
    render(
      <PasswordInput
        value=""
        onChange={() => {}}
        showPassword={false}
        setShowPassword={() => {}}
        passwordStrength="strong"
        passwordCriteria={{ ...defaultCriteria, minLength: true, hasUppercase: true, hasLowercase: true, hasNumber: true, hasSpecial: true }}
      />
    );
    expect(screen.getByText(/strong password/i)).toBeInTheDocument();
  });
}); 