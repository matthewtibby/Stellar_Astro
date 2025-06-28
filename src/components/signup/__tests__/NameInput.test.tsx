import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInput } from '../NameInput';

describe('NameInput', () => {
  it('renders with label and placeholder', () => {
    render(<NameInput label="First Name" id="firstName" name="firstName" value="" onChange={() => {}} />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(<NameInput label="Last Name" id="lastName" name="lastName" value="Smith" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<NameInput label="First Name" id="firstName" name="firstName" value="" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<NameInput label="First Name" id="firstName" name="firstName" value="" onChange={() => {}} error="First name is required" />);
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
  });
}); 