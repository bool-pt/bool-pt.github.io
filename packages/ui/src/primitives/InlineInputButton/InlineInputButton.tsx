import { useId } from 'react';
import { cn } from '@bool/shared';
import styles from './InlineInputButton.module.css';

interface InlineInputButtonProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  label: string;
  placeholder?: string;
  buttonText: string;
  disabled?: boolean;
  type?: 'email' | 'text' | 'search';
  variant?: 'light' | 'dark';
  className?: string;
}

export function InlineInputButton({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  buttonText,
  disabled = false,
  type = 'email',
  _variant = 'light',
  className,
}: InlineInputButtonProps) {
  const inputId = useId();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value || disabled) return;
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className={cn(styles.wrapper, styles.wrapperVariant, className)}>
      <label htmlFor={inputId} className={styles.srOnly}>
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        disabled={disabled}
        className={styles.input}
      />
      <button
        type="submit"
        disabled={disabled}
        className={cn(styles.button, styles.buttonVariant, disabled && styles.buttonDisabled)}
      >
        {buttonText}
      </button>
    </form>
  );
}
