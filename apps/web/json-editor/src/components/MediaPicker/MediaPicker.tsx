import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/cn.ts';
import {
  defaultFolderForField,
  entriesInFolder,
  findByPath,
  folders,
  SECTION_FOLDER_NAMES,
} from '../../mediaManifest.ts';
import styles from './MediaPicker.module.css';

interface Props {
  fieldKey: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export default function MediaPicker({ fieldKey, value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<string>(() => {
    const existing = findByPath(value);
    return existing?.folder ?? defaultFolderForField(fieldKey);
  });
  const [search, setSearch] = useState('');

  // When the field's stored value changes externally, snap the picker's folder to it.
  useEffect(() => {
    const existing = findByPath(value);
    if (existing) setFolder(existing.folder);
  }, [value]);

  const currentEntry = findByPath(value);
  const isMissing = value.trim() !== '' && !currentEntry;

  const sectionFolders = useMemo(() => folders.filter((f) => SECTION_FOLDER_NAMES.has(f)), []);
  const sharedFolders = useMemo(() => folders.filter((f) => !SECTION_FOLDER_NAMES.has(f)), []);

  const visibleEntries = useMemo(() => {
    const all = entriesInFolder(folder);
    if (!search.trim()) return all;
    const needle = search.trim().toLowerCase();
    return all.filter((e) => e.filename.toLowerCase().includes(needle));
  }, [folder, search]);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={cn(styles.trigger, isMissing && styles.triggerInvalid)}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title={isMissing ? `Missing in repo: ${value}` : value || 'Pick an image'}
      >
        {currentEntry ? (
          currentEntry.isSvg ? (
            <object
              type="image/svg+xml"
              data={currentEntry.url}
              className={styles.thumb}
              aria-hidden="true"
            />
          ) : (
            <img
              src={currentEntry.url}
              alt=""
              className={styles.thumb}
              width={36}
              height={36}
              decoding="async"
            />
          )
        ) : (
          <span className={styles.thumbMissing} aria-hidden="true">
            {isMissing ? '!' : '+'}
          </span>
        )}
        <span className={styles.label}>{value || 'Pick an image'}</span>
        <span className={styles.changeButton}>Change</span>
      </button>

      {open && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className={styles.modal} role="dialog" aria-label="Pick a media file">
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Pick a file</span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Close picker"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <aside className={styles.sidebar}>
                {sectionFolders.length > 0 && (
                  <div className={styles.folderGroup}>
                    <div className={styles.folderGroupLabel}>Section folders</div>
                    {sectionFolders.map((f) => (
                      <FolderButton
                        key={f}
                        folder={f}
                        active={f === folder}
                        onClick={() => setFolder(f)}
                      />
                    ))}
                  </div>
                )}
                <div className={styles.folderGroup}>
                  <div className={styles.folderGroupLabel}>Shared folders</div>
                  {sharedFolders.map((f) => (
                    <FolderButton
                      key={f}
                      folder={f}
                      active={f === folder}
                      onClick={() => setFolder(f)}
                    />
                  ))}
                </div>
              </aside>

              <section className={styles.gallery}>
                <div className={styles.searchRow}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder={`Search in ${folder || 'folder'}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {visibleEntries.length === 0 ? (
                  <p className={styles.empty}>No files in this folder.</p>
                ) : (
                  <div className={styles.grid}>
                    {visibleEntries.map((entry) => {
                      const isActive = entry.relativePath === value;
                      return (
                        <button
                          key={entry.relativePath}
                          type="button"
                          className={cn(styles.tile, isActive && styles.tileActive)}
                          onClick={() => {
                            onChange(entry.relativePath);
                            setOpen(false);
                          }}
                          title={entry.relativePath}
                        >
                          {entry.isSvg ? (
                            <object
                              type="image/svg+xml"
                              data={entry.url}
                              className={styles.tileThumb}
                              aria-hidden="true"
                            />
                          ) : (
                            <img
                              src={entry.url}
                              alt=""
                              className={styles.tileThumb}
                              loading="lazy"
                              decoding="async"
                              width={144}
                              height={108}
                            />
                          )}
                          <span className={styles.tileLabel}>{entry.filename}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className={styles.footerNote}>
                  Need a new image? Save it locally with a clean filename and send it to the
                  developer with your exported JSON.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FolderButtonProps {
  folder: string;
  active: boolean;
  onClick: () => void;
}

function FolderButton({ folder, active, onClick }: FolderButtonProps) {
  return (
    <button
      type="button"
      className={cn(styles.folderButton, active && styles.folderButtonActive)}
      onClick={onClick}
    >
      {folder || '(root)'}
    </button>
  );
}
