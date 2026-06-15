import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ShareMenu from './ShareMenu';

const channels = [
  { key: 'linkedin', visible: true },
  { key: 'x', visible: true },
  { key: 'email', visible: true },
  { key: 'copyLink', visible: true },
];
const labels = { copyLink: 'Copy link', copied: 'Copied!' };
const url = 'https://bool.pt/a b';
const title = 'Hi & Bye';

afterEach(cleanup);

describe('ShareMenu', () => {
  it('builds share links with encoded url and title', () => {
    render(<ShareMenu url={url} title={title} channels={channels} labels={labels} />);
    expect(screen.getByLabelText('LinkedIn').getAttribute('href')).toContain(
      encodeURIComponent(url)
    );
    expect(screen.getByLabelText('X').getAttribute('href')).toContain(encodeURIComponent(title));
    expect(screen.getByLabelText('Email').getAttribute('href')).toContain('mailto:');
  });

  it('hides channels that are not visible', () => {
    render(
      <ShareMenu
        url={url}
        title={title}
        channels={[
          { key: 'linkedin', visible: true },
          { key: 'x', visible: false },
        ]}
        labels={labels}
      />
    );
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    expect(screen.queryByLabelText('X')).not.toBeInTheDocument();
  });

  it('copies the url and reflects the copied state', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ShareMenu url={url} title={title} channels={channels} labels={labels} />);
    fireEvent.click(screen.getByLabelText('Copy link'));

    expect(writeText).toHaveBeenCalledWith(url);
    expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
  });
});
