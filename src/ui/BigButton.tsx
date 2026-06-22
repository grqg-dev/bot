import { useCallback, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import './BigButton.css';

interface BigButtonProps {
  onPress: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel: string;
}

export function BigButton({
  onPress,
  children,
  className = '',
  disabled = false,
  ariaLabel,
}: BigButtonProps) {
  const [pressed, setPressed] = useState(false);
  const activeRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    if (disabled) return;
    activeRef.current = true;
    setPressed(true);
  }, [disabled]);

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (!activeRef.current || disabled) return;
      activeRef.current = false;
      setPressed(false);
      if (e.currentTarget.contains(e.target as Node)) {
        onPress();
      }
    },
    [disabled, onPress],
  );

  const handlePointerLeave = useCallback(() => {
    activeRef.current = false;
    setPressed(false);
  }, []);

  return (
    <button
      type="button"
      className={`big-button ${pressed ? 'big-button--pressed' : ''} ${className}`}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </button>
  );
}
