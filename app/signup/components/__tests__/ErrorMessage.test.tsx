import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message when error is provided', () => {
    render(<ErrorMessage error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders nothing when error is falsy', () => {
    const { container } = render(<ErrorMessage error={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
}); 