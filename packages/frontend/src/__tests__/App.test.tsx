import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText(/E-commerce BI Dashboard/i);
    expect(heading).toBeInTheDocument();
  });

  it('shows development setup message', () => {
    render(<App />);
    const message = screen.getByText(/Development environment setup complete!/i);
    expect(message).toBeInTheDocument();
  });
});