import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmPasswordInput } from '../ConfirmPasswordInput';

describe('ConfirmPasswordInput', () => {
  it('renders with value and label', () => {
    render(<ConfirmPasswordInput value="secret" onChange={() => {}} required />);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('secret')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<ConfirmPasswordInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'a' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<ConfirmPasswordInput value="" onChange={() => {}} error="Passwords do not match" />);
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });
}); 