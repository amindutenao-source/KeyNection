import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';

describe('Home page', () => {
  it('renders the main heading and primary CTA', () => {
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Home />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /keynection/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commencer maintenant/i })).toBeInTheDocument();
  });

  it('navigates to signup when the CTA is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<div>Signup Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /commencer maintenant/i }));
    });
    expect(await screen.findByText(/signup page/i)).toBeInTheDocument();
  });
});
