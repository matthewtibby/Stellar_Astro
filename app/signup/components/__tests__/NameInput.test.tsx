import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInput } from '../NameInput';

describe('NameInput', () => {
  it('renders with value and label', () => {
    render(<NameInput value="John" onChange={() => {}} required label="First Name" name="firstName" />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<NameInput value="" onChange={handleChange} label="First Name" name="firstName" />);
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'a' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<NameInput value="" onChange={() => {}} label="First Name" name="firstName" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
}); 