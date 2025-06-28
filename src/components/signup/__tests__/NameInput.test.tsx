import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInput } from '../../../../app/signup/components/NameInput';

describe('NameInput', () => {
  it('renders with label and placeholder', () => {
    render(<NameInput label="First Name" name="firstName" value="" onChange={() => {}} required />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });

  it('shows the value', () => {
    render(<NameInput label="Last Name" name="lastName" value="Smith" onChange={() => {}} />);
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const handleChange = jest.fn();
    render(<NameInput label="First Name" name="firstName" value="" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<NameInput label="First Name" name="firstName" value="" onChange={() => {}} error="First name is required" />);
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
  });
}); 