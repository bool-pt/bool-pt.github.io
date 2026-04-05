import { X } from 'lucide-react';
import { useEditor } from '../../context/EditorContext.tsx';
import { l } from '../../locales/index.ts';
import styles from './PreviewPanel.module.css';

export default function PreviewPanel() {
  const { state, dispatch } = useEditor();

  if (!state.showPreview) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <span className={styles.title}>{l('preview.title')}</span>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
        >
          <X size={16} />
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.instructions}>
          <h2 className={styles.instructionsTitle}>
            {l('preview.heading')}
          </h2>

          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <p className={styles.stepText}>
              {l('preview.step1.before')}<strong>{l('preview.step1.bold')}</strong>{l('preview.step1.after')}
            </p>
          </div>

          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <p className={styles.stepText}>{l('preview.step2')}</p>
          </div>

          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <p className={styles.stepText}>{l('preview.step3')}</p>
          </div>

          <div className={styles.note}>
            <strong>Tip:</strong> {l('preview.tip')}
          </div>
        </div>
      </div>
    </div>
  );
}
