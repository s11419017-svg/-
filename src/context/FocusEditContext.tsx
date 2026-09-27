import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface FocusEditConfig {
  /**
   * Whether the user has global focus edit mode enabled (defaults to true)
   */
  isFocusModeActive: boolean;
  /**
   * The level of background dimming/blurring: 'deep' (95% blackout), 'medium' (85% theatrical), 'soft' (70%)
   */
  dimIntensity: 'deep' | 'medium' | 'soft';
  /**
   * The optical enlargement/scale factor of the modal window: 'comfortable' (max-w-4xl / 1.05x), 'standard' (max-w-3xl), 'compact'
   */
  zoomScale: 'comfortable' | 'standard' | 'compact';
  /**
   * Atmospheric audio tone when entering focus mode
   */
  ambientSound: boolean;
}

interface FocusEditContextType extends FocusEditConfig {
  setIsFocusModeActive: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleFocusMode: () => void;
  setDimIntensity: (val: 'deep' | 'medium' | 'soft') => void;
  setZoomScale: (val: 'comfortable' | 'standard' | 'compact') => void;
  setAmbientSound: (val: boolean) => void;
}

const STORAGE_KEY = 'tcsh_focus_edit_config_v1';

const DEFAULT_CONFIG: FocusEditConfig = {
  isFocusModeActive: true,
  dimIntensity: 'deep',
  zoomScale: 'comfortable',
  ambientSound: true,
};

const FocusEditContext = createContext<FocusEditContextType | undefined>(undefined);

export const FocusEditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<FocusEditConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn('Focus edit config load warning:', e);
      }
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  const setIsFocusModeActive = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setConfig((prev) => ({
      ...prev,
      isFocusModeActive: typeof val === 'function' ? val(prev.isFocusModeActive) : val,
    }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      isFocusModeActive: !prev.isFocusModeActive,
    }));
  }, []);

  const setDimIntensity = useCallback((val: 'deep' | 'medium' | 'soft') => {
    setConfig((prev) => ({ ...prev, dimIntensity: val }));
  }, []);

  const setZoomScale = useCallback((val: 'comfortable' | 'standard' | 'compact') => {
    setConfig((prev) => ({ ...prev, zoomScale: val }));
  }, []);

  const setAmbientSound = useCallback((val: boolean) => {
    setConfig((prev) => ({ ...prev, ambientSound: val }));
  }, []);

  const value = {
    ...config,
    setIsFocusModeActive,
    toggleFocusMode,
    setDimIntensity,
    setZoomScale,
    setAmbientSound,
  };

  return <FocusEditContext.Provider value={value}>{children}</FocusEditContext.Provider>;
};

export const useFocusEdit = (): FocusEditContextType => {
  const context = useContext(FocusEditContext);
  if (!context) {
    throw new Error('useFocusEdit must be used within a FocusEditProvider');
  }
  return context;
};
