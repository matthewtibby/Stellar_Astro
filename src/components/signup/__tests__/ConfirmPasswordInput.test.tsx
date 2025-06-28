import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmPasswordInput } from '../../../../app/signup/components/ConfirmPasswordInput';

describe('ConfirmPasswordInput', () => {
  it('renders with label and placeholder', () => {
    render(<ConfirmPasswordInput value="" onChange={() => {}} required />);
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(<ConfirmPasswordInput value="secret123" onChange={() => {}} />);
    expect(screen.getByDisplayValue('secret123')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<ConfirmPasswordInput value="" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<ConfirmPasswordInput value="" onChange={() => {}} error="Passwords do not match" />);
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });
}); 