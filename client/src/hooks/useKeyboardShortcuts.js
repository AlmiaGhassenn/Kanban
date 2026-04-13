import { useEffect, useCallback } from 'react';

export default function useKeyboardShortcuts({ 
  onNewTask, 
  onFocusSearch, 
  onCloseModal,
  onNavigateLeft,
  onNavigateRight,
}) {
  const handleKeyDown = useCallback((e) => {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if (e.key === 'Escape') {
      onCloseModal?.();
      return;
    }
    
    if (isInput) return;
    
    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        onNewTask?.();
        break;
      case 'f':
        e.preventDefault();
        onFocusSearch?.();
        break;
      case 'arrowleft':
        e.preventDefault();
        onNavigateLeft?.();
        break;
      case 'arrowright':
        e.preventDefault();
        onNavigateRight?.();
        break;
      default:
        break;
    }
  }, [onNewTask, onFocusSearch, onCloseModal, onNavigateLeft, onNavigateRight]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}