import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type TextSizeMode = 'normal' | 'medium' | 'large' | 'xlarge';

export interface AccessibilitySettings {
  spotlightIntensity: number; // 0.0 to 1.0 (0 = disabled)
  spotlightRadiusScale: number; // 0.6 to 1.4
  useTheatricalCursor: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  textSize: TextSizeMode;
  focusReadingMode: boolean; // Dims peripheral distractions for pure storytelling focus
  accessibilityFriendlyMode: boolean; // Master one-click WCAG preset mode
  seniorFriendlyMode: boolean; // Dedicated preset for elders/seniors (large text, large tap areas, calm reading)
}

interface AccessibilityContextType extends AccessibilitySettings {
  setSpotlightIntensity: (val: number) => void;
  setSpotlightRadiusScale: (val: number) => void;
  setUseTheatricalCursor: (val: boolean) => void;
  setReduceMotion: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
  setTextSize: (val: TextSizeMode) => void;
  setFocusReadingMode: (val: boolean) => void;
  setAccessibilityFriendlyMode: (val: boolean) => void;
  toggleAccessibilityFriendlyMode: () => void;
  setSeniorFriendlyMode: (val: boolean) => void;
  toggleSeniorFriendlyMode: () => void;
  toggleSpotlight: () => void;
  stepTextSize: (direction: 'up' | 'down') => void;
  resetToDefaults: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  isResearchModalOpen: boolean;
  openResearchModal: () => void;
  closeResearchModal: () => void;
  isSideDockExpanded: boolean;
  setIsSideDockExpanded: (val: boolean) => void;
  toggleSideDock: () => void;
  announcement: string;
  announce: (message: string) => void;
}

const STORAGE_KEY = 'tcsh_a11y_settings_v1';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  spotlightIntensity: 0.75,
  spotlightRadiusScale: 1.0,
  useTheatricalCursor: true,
  reduceMotion: false,
  highContrast: false,
  textSize: 'normal',
  focusReadingMode: false,
  accessibilityFriendlyMode: false,
  seniorFriendlyMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      const sysReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        reduceMotion: parsed.reduceMotion !== undefined ? parsed.reduceMotion : sysReducedMotion,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [isSideDockExpanded, setIsSideDockExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Announce messages to screen readers (safely scheduled outside render stack)
  const announce = useCallback((message: string) => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
    }
    // Schedule state update to macrotask so it never executes during render/reconciliation
    setTimeout(() => {
      setAnnouncement(message);
    }, 0);
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement('');
    }, 3200);
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Apply DOM classes and CSS variables
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Senior / Elder Friendly Mode class
    if (settings.seniorFriendlyMode) {
      root.classList.add('senior-friendly-mode');
    } else {
      root.classList.remove('senior-friendly-mode');
    }

    // Accessibility Friendly Master Mode class
    if (settings.accessibilityFriendlyMode) {
      root.classList.add('accessibility-friendly-mode');
    } else {
      root.classList.remove('accessibility-friendly-mode');
    }

    // High Contrast class
    if (settings.highContrast || settings.accessibilityFriendlyMode || settings.seniorFriendlyMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced Motion class
    if (settings.reduceMotion || settings.accessibilityFriendlyMode || settings.seniorFriendlyMode) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus Reading Mode class
    if (settings.focusReadingMode) {
      root.classList.add('focus-reading-mode');
    } else {
      root.classList.remove('focus-reading-mode');
    }

    // Text Size classes
    root.classList.remove('text-size-medium', 'text-size-large', 'text-size-xlarge');
    const effectiveSize = settings.seniorFriendlyMode
      ? 'xlarge'
      : settings.accessibilityFriendlyMode && settings.textSize === 'normal'
      ? 'large'
      : settings.textSize;

    if (effectiveSize === 'medium') {
      root.classList.add('text-size-medium');
    } else if (effectiveSize === 'large') {
      root.classList.add('text-size-large');
    } else if (effectiveSize === 'xlarge') {
      root.classList.add('text-size-xlarge');
    }

    // Spotlight intensity CSS variable
    const effectiveSpotlight = (settings.accessibilityFriendlyMode || settings.seniorFriendlyMode) ? 0 : settings.spotlightIntensity;
    root.style.setProperty('--spotlight-intensity', effectiveSpotlight.toString());
  }, [settings]);

  const setSpotlightIntensity = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, Math.round(val * 100) / 100));
    setSettings((prev) => ({ ...prev, spotlightIntensity: clamped }));
  }, []);

  const toggleSpotlight = useCallback(() => {
    setSettings((prev) => {
      const next = prev.spotlightIntensity > 0 ? 0 : 0.75;
      setTimeout(() => {
        announce(next > 0 ? '已開啟劇場追光燈' : '已關閉劇場追光燈');
      }, 0);
      return { ...prev, spotlightIntensity: next };
    });
  }, [announce]);

  const setSpotlightRadiusScale = useCallback((val: number) => {
    setSettings((prev) => ({ ...prev, spotlightRadiusScale: val }));
  }, []);

  const setUseTheatricalCursor = useCallback((val: boolean) => {
    setSettings((prev) => ({ ...prev, useTheatricalCursor: val }));
  }, []);

  const setReduceMotion = useCallback((val: boolean) => {
    setSettings((prev) => ({ ...prev, reduceMotion: val }));
  }, []);

  const setHighContrast = useCallback((val: boolean) => {
    setSettings((prev) => ({ ...prev, highContrast: val }));
  }, []);

  const setTextSize = useCallback((val: TextSizeMode) => {
    setSettings((prev) => ({ ...prev, textSize: val }));
  }, []);

  const setAccessibilityFriendlyMode = useCallback((val: boolean) => {
    setTimeout(() => {
      if (val) {
        announce('已開啟無障礙友善模式：已啟用高對比色彩、舒適放大字體與靜態防眩光保護');
      } else {
        announce('已關閉無障礙友善模式，恢復自訂顯示偏好');
      }
    }, 0);
    setSettings((prev) => {
      if (val) {
        return {
          ...prev,
          accessibilityFriendlyMode: true,
          highContrast: true,
          textSize: prev.textSize === 'normal' ? 'large' : prev.textSize,
          reduceMotion: true,
          useTheatricalCursor: false,
          spotlightIntensity: 0,
        };
      } else {
        return {
          ...prev,
          accessibilityFriendlyMode: false,
          highContrast: false,
          useTheatricalCursor: true,
          spotlightIntensity: 0.75,
        };
      }
    });
  }, [announce]);

  const toggleAccessibilityFriendlyMode = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.accessibilityFriendlyMode;
      setTimeout(() => {
        if (next) {
          announce('已開啟無障礙友善模式：已啟用高對比色彩、舒適放大字體與靜態防眩光保護');
        } else {
          announce('已關閉無障礙友善模式，恢復自訂顯示偏好');
        }
      }, 0);
      if (next) {
        return {
          ...prev,
          accessibilityFriendlyMode: true,
          highContrast: true,
          textSize: prev.textSize === 'normal' ? 'large' : prev.textSize,
          reduceMotion: true,
          useTheatricalCursor: false,
          spotlightIntensity: 0,
        };
      } else {
        return {
          ...prev,
          accessibilityFriendlyMode: false,
          highContrast: false,
          useTheatricalCursor: true,
          spotlightIntensity: 0.75,
        };
      }
    });
  }, [announce]);

  const setSeniorFriendlyMode = useCallback((val: boolean) => {
    setTimeout(() => {
      if (val) {
        announce('已開啟銀髮長輩尊榮閱讀模式：已啟用樂齡大字體、放大觸控按鈕與安定防眩光保護');
      } else {
        announce('已關閉長輩尊榮閱讀模式，恢復標準顯示');
      }
    }, 0);
    setSettings((prev) => {
      if (val) {
        return {
          ...prev,
          seniorFriendlyMode: true,
          highContrast: true,
          textSize: 'xlarge',
          reduceMotion: true,
          useTheatricalCursor: false,
          spotlightIntensity: 0,
        };
      } else {
        return {
          ...prev,
          seniorFriendlyMode: false,
          textSize: 'normal',
          highContrast: false,
          useTheatricalCursor: true,
          spotlightIntensity: 0.75,
        };
      }
    });
  }, [announce]);

  const toggleSeniorFriendlyMode = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.seniorFriendlyMode;
      setTimeout(() => {
        if (next) {
          announce('已開啟銀髮長輩尊榮閱讀模式：已啟用樂齡大字體、放大觸控按鈕與安定防眩光保護');
        } else {
          announce('已關閉長輩尊榮閱讀模式，恢復標準顯示');
        }
      }, 0);
      if (next) {
        return {
          ...prev,
          seniorFriendlyMode: true,
          highContrast: true,
          textSize: 'xlarge',
          reduceMotion: true,
          useTheatricalCursor: false,
          spotlightIntensity: 0,
        };
      } else {
        return {
          ...prev,
          seniorFriendlyMode: false,
          textSize: 'normal',
          highContrast: false,
          useTheatricalCursor: true,
          spotlightIntensity: 0.75,
        };
      }
    });
  }, [announce]);

  const stepTextSize = useCallback((direction: 'up' | 'down') => {
    setSettings((prev) => {
      const modes: TextSizeMode[] = ['normal', 'medium', 'large', 'xlarge'];
      const currentIndex = modes.indexOf(prev.textSize);
      let nextIndex = currentIndex;
      if (direction === 'up' && currentIndex < modes.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (direction === 'down' && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }
      const nextMode = modes[nextIndex];
      const labelMap: Record<TextSizeMode, string> = {
        normal: '標準 (100%)',
        medium: '舒適微調 (110%)',
        large: '清晰大字 (122%)',
        xlarge: '樂齡尊榮 (135%)',
      };
      setTimeout(() => {
        announce(`字體調整為：${labelMap[nextMode]}`);
      }, 0);
      return { ...prev, textSize: nextMode };
    });
  }, [announce]);

  const setFocusReadingMode = useCallback((val: boolean) => {
    setTimeout(() => {
      announce(val ? '已開啟專注沈浸閱讀模式' : '已關閉專注閱讀模式');
    }, 0);
    setSettings((prev) => ({ ...prev, focusReadingMode: val }));
  }, [announce]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setTimeout(() => {
      announce('已還原為預設顯示設定');
    }, 0);
  }, [announce]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const openResearchModal = useCallback(() => setIsResearchModalOpen(true), []);
  const closeResearchModal = useCallback(() => setIsResearchModalOpen(false), []);
  const toggleSideDock = useCallback(() => setIsSideDockExpanded((prev) => !prev), []);

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setSpotlightIntensity,
        setSpotlightRadiusScale,
        setUseTheatricalCursor,
        setReduceMotion,
        setHighContrast,
        setTextSize,
        setFocusReadingMode,
        setAccessibilityFriendlyMode,
        toggleAccessibilityFriendlyMode,
        setSeniorFriendlyMode,
        toggleSeniorFriendlyMode,
        toggleSpotlight,
        stepTextSize,
        resetToDefaults,
        isSettingsOpen,
        openSettings,
        closeSettings,
        isResearchModalOpen,
        openResearchModal,
        closeResearchModal,
        isSideDockExpanded,
        setIsSideDockExpanded,
        toggleSideDock,
        announcement,
        announce,
      }}
    >
      {children}
      {/* Screen Reader Live Region for WCAG Announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
};
