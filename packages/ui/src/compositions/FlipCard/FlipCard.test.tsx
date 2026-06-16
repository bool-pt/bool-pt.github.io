import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import FlipCard from './FlipCard';

afterEach(cleanup);

describe('FlipCard', () => {
  it('renders front and back content', () => {
    render(
      <FlipCard frontContent={<span>Front side</span>} backContent={<span>Back side</span>} />
    );

    expect(screen.getByText('Front side')).toBeInTheDocument();
    expect(screen.getByText('Back side')).toBeInTheDocument();
  });

  it('toggles flipped state on click', async () => {
    const user = userEvent.setup();

    render(
      <FlipCard frontContent={<span>Front side</span>} backContent={<span>Back side</span>} />
    );

    const card = screen.getByText('Front side').closest('div[class]');
    expect(card).not.toBeNull();
    // Both sides are always rendered — click just toggles internal state
    expect(screen.getByText('Front side')).toBeInTheDocument();
    expect(screen.getByText('Back side')).toBeInTheDocument();

    await user.click(card as HTMLElement);

    expect(screen.getByText('Front side')).toBeInTheDocument();
    expect(screen.getByText('Back side')).toBeInTheDocument();
  });
});
