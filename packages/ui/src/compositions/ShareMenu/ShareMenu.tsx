import { Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import Icon from '../../primitives/Icon/Icon';
import styles from './ShareMenu.module.css';

interface ShareChannel {
  key: string;
  visible: boolean;
}

interface Props {
  url: string;
  title: string;
  channels: ShareChannel[];
  labels: {
    copyLink: string;
    copied: string;
  };
}

export default function ShareMenu({ url, title, channels, labels }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const visibleChannels = channels.filter((c) => c.visible);

  return (
    <div className={styles.row}>
      {visibleChannels.map((channel) => {
        if (channel.key === 'linkedin') {
          return (
            <a
              key="linkedin"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              aria-label="LinkedIn"
            >
              <Icon name="linkedin" size={14} strokeWidth={2} />
            </a>
          );
        }
        if (channel.key === 'x') {
          return (
            <a
              key="x"
              href={`https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              aria-label="X"
            >
              <Icon name="twitter" size={14} strokeWidth={2} />
            </a>
          );
        }
        if (channel.key === 'email') {
          return (
            <a
              key="email"
              href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
              className={styles.iconBtn}
              aria-label="Email"
            >
              <Icon name="mail" size={14} strokeWidth={2} />
            </a>
          );
        }
        if (channel.key === 'copyLink') {
          return (
            <button
              key="copyLink"
              type="button"
              className={`${styles.iconBtn} ${copied ? styles.iconBtnCopied : ''}`}
              onClick={handleCopy}
              aria-label={copied ? labels.copied : labels.copyLink}
              title={copied ? labels.copied : labels.copyLink}
            >
              <LinkIcon size={14} strokeWidth={2} />
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}
