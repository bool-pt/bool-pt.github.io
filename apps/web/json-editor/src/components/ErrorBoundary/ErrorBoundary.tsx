import { Component, type ReactNode } from 'react';
import { l } from '../../locales/index.ts';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[JsonEditor] uncaught render error:', error, info.componentStack);
    void import('@bool/analytics').then(({ captureError }) => {
      captureError(error, { componentStack: info.componentStack });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="alert">
          <h1 className={styles.heading}>{l('error.heading')}</h1>
          <p className={styles.message}>{l('error.message')}</p>
          <button
            type="button"
            className={styles.button}
            onClick={() => globalThis.location.reload()}
          >
            {l('error.reload')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
