import React, { useState, useEffect, useCallback, lazy, Suspense, memo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Navbar,
  Footer,
  HeroSection,
  JourneySection,
  CastSection,
  ScriptQuotesSection,
  MusicalShowcaseSection,
  TicketInfoSection,
  VenueInfo,
  DataManagerBar,
  EditModeBanner,
  CurtainCallSecret,
  ScrollToTopButton,
  StoryChronicleTrigger,
} from './components';
import { CastMember, RehearsalPhoto, MusicalTrack } from './types';
import { ambientSynth, theatreAudio, TheatreAudioEngine } from './utils/audioSynth';
import { executeViewTransition } from './utils/viewTransitions';
import { usePassiveScrollPhysics } from './hooks/usePassiveScrollPhysics';
import { ShowDataProvider, useShowCoreData, useShowDataActions, useShowGeneralConfig } from './context/ShowDataContext';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { FocusEditProvider } from './context/FocusEditContext';
import { TheatricalLightingCanvas, TheatricalCursor, TheatricalQuickDock, AccessibleAudioTour } from './components';
import { CinematicCurtainIntro } from './components/effects/CinematicCurtainIntro';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy-loaded Views and Modals for Code Splitting & Ultra-Fast Initial Page Load
const AccessibilitySettingsModal = lazy(() =>
  import('./components/modals/AccessibilitySettingsModal').then((m) => ({ default: m.AccessibilitySettingsModal }))
);
const AccessibilityResearchModal = lazy(() =>
  import('./components/modals/AccessibilityResearchModal').then((m) => ({ default: m.AccessibilityResearchModal }))
);
const SimpleGuideView = lazy(() =>
  import('./components/views/SimpleGuideView').then((m) => ({ default: m.SimpleGuideView }))
);
const GrandConfigModal = lazy(() =>
  import('./components/modals/GrandConfigModal').then((m) => ({ default: m.GrandConfigModal }))
);
const QuickTableEditModal = lazy(() =>
  import('./components/modals/QuickTableEditModal').then((m) => ({ default: m.QuickTableEditModal }))
);
const StoryChronicleDrawer = lazy(() =>
  import('./components/sections/StoryChronicle').then((m) => ({ default: m.StoryChronicleDrawer }))
);
const CastModal = lazy(() =>
  import('./components/modals/CastModal').then((m) => ({ default: m.CastModal }))
);
const RehearsalModal = lazy(() =>
  import('./components/modals/RehearsalModal').then((m) => ({ default: m.RehearsalModal }))
);
const EditMemberModal = lazy(() =>
  import('./components/modals/EditMemberModal').then((m) => ({ default: m.EditMemberModal }))
);
const EditRehearsalModal = lazy(() =>
  import('./components/modals/EditRehearsalModal').then((m) => ({ default: m.EditRehearsalModal }))
);
const EditTrackModal = lazy(() =>
  import('./components/modals/EditTrackModal').then((m) => ({ default: m.EditTrackModal }))
);
const ExportModal = lazy(() =>
  import('./components/modals/ExportModal').then((m) => ({ default: m.ExportModal }))
);
const AiLesMisLoungeModal = lazy(() =>
  import('./components/modals/AiLesMisLoungeModal').then((m) => ({ default: m.AiLesMisLoungeModal }))
);
const PlaceholderGuideModal = lazy(() =>
  import('./components/modals/PlaceholderGuideModal').then((m) => ({ default: m.PlaceholderGuideModal }))
);
const ValjeanEscapeGameModal = lazy(() =>
  import('./components/game/ValjeanEscapeGameModal').then((m) => ({ default: m.ValjeanEscapeGameModal }))
);

const AppContent: React.FC = memo(() => {
  // 100% Non-blocking Native Inertial & Damped Smooth Scrolling
  usePassiveScrollPhysics();

  // Granular Core Data from ShowDataContext (Isolated from cloud sync heartbeats)
  const {
    castMembers,
    rehearsalPhotos,
    tracks,
    isEditMode,
  } = useShowCoreData();

  // Stable references for handler snapshots to eliminate callback re-instantiations
  const castMembersRef = useRef(castMembers);
  castMembersRef.current = castMembers;
  const rehearsalPhotosRef = useRef(rehearsalPhotos);
  rehearsalPhotosRef.current = rehearsalPhotos;
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;

  // Actions from ShowDataContext
  const {
    setIsEditMode,
    toggleEditMode,
    saveCastMember,
    deleteCastMember,
    liveUpdateCastMember,
    rollbackCastMembers,
    saveRehearsalPhoto,
    deleteRehearsalPhoto,
    liveUpdateRehearsalPhoto,
    rollbackRehearsalPhotos,
    saveMusicalTrack,
    deleteMusicalTrack,
    liveUpdateMusicalTrack,
    rollbackMusicalTracks,
    importData,
    resetAllData,
    undoChange,
    saveSpreadsheetCast,
    resetSpreadsheetCast,
    updateGeneralConfig,
    resetGeneralConfig,
  } = useShowDataActions();

  // Show-wide General Configuration (Countdown, dates, tickets, taglines)
  const generalConfig = useShowGeneralConfig();
  const [isGrandConfigOpen, setIsGrandConfigOpen] = useState(false);

  // Display & Lighting Accessibility Preferences
  const {
    spotlightIntensity,
    spotlightRadiusScale,
    useTheatricalCursor,
    reduceMotion,
    openSettings,
    setIsSideDockExpanded,
    announce,
  } = useAccessibility();

  const handleOpenAccessibility = () => {
    openSettings();
  };

  // Theme State (Dark Charcoal Velvet <-> Light Antique Parchment)
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tcsh_theme_mode');
      if (savedTheme === 'light') return true;
      if (savedTheme === 'dark') return false;
      return false; // Default to dark immersive theatre atmosphere
    }
    return false;
  });

  // View Mode: 'rich' (90分沉浸旗艦版) vs 'simple' (老師/家長留白簡約手冊)
  const [viewMode, setViewMode] = useState<'rich' | 'simple'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('tcsh_view_mode');
      if (savedMode === 'simple' || savedMode === 'rich') return savedMode;
    }
    return 'rich';
  });

  const [isQuickTableOpen, setIsQuickTableOpen] = useState(false);
  const [isAudioTourOpen, setIsAudioTourOpen] = useState(false);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === 'rich' ? 'simple' : 'rich';
      try {
        localStorage.setItem('tcsh_view_mode', next);
      } catch {}
      setTimeout(() => {
        announce(next === 'simple' ? '已切換至留白極簡・觀演手冊模式' : '已切換回典藏劇院・沉浸全景模式');
        const mainEl = document.getElementById('main-content');
        if (mainEl) {
          mainEl.focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return next;
    });
  }, [announce]);

  // Apply theme class to <html> root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isLightMode) {
        root.classList.add('light');
        root.classList.remove('dark');
        localStorage.setItem('tcsh_theme_mode', 'light');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
        localStorage.setItem('tcsh_theme_mode', 'dark');
      }
    }
  }, [isLightMode]);

  // Initialize 2026 TheatreAudioEngine on first user interaction for zero-latency theatre acoustics
  useEffect(() => {
    const handleFirstGesture = () => {
      theatreAudio.initAudio();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setIsLightMode((prev) => {
      const next = !prev;
      ambientSynth.playThemeSwitchSFX(next);
      return next;
    });
  }, []);

  // UI Modals & Modes State
  const [forceShowCurtainIntro, setForceShowCurtainIntro] = useState(false);
  const [selectedCastMember, setSelectedCastMember] = useState<CastMember | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<RehearsalPhoto | null>(null);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);
  const [isAiLoungeOpen, setIsAiLoungeOpen] = useState(false);
  const [aiInitialCharId, setAiInitialCharId] = useState<string | undefined>(undefined);

  // Edit Mode & Customization Modals State
  const [editingMember, setEditingMember] = useState<CastMember | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [castSnapshot, setCastSnapshot] = useState<CastMember[] | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<RehearsalPhoto | null>(null);
  const [isEditPhotoOpen, setIsEditPhotoOpen] = useState(false);
  const [photosSnapshot, setPhotosSnapshot] = useState<RehearsalPhoto[] | null>(null);

  const [editingTrack, setEditingTrack] = useState<MusicalTrack | null>(null);
  const [isEditTrackOpen, setIsEditTrackOpen] = useState(false);
  const [tracksSnapshot, setTracksSnapshot] = useState<MusicalTrack[] | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);

  // 2026 Spatial Ambient Audio Soundscape State & Dynamic Scroll Modulation
  const [isSoundscapeOn, setIsSoundscapeOn] = useState(false);

  const toggleSoundscape = useCallback(() => {
    const active = theatreAudio.toggleSpatialSoundscape();
    setIsSoundscapeOn(active);
    announce(active ? '已開啟巴黎1832多軌沉浸式動態聲景' : '已關閉動態聲景');
  }, [announce]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const total = Math.max(1, (document.documentElement?.scrollHeight || 1) - window.innerHeight);
          const progress = Math.min(1, Math.max(0, window.scrollY / total));
          theatreAudio.updateScrollSpatialAcoustics(progress);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenGame = useCallback(() => {
    ambientSynth.playButtonClickSFX();
    executeViewTransition(() => {
      setIsGameOpen(true);
    });
  }, []);

  const handleCloseGame = useCallback(() => {
    executeViewTransition(() => {
      setIsGameOpen(false);
    });
  }, []);

  // Global Easter Egg Keyboard Listener: typing "24601", "mario", or Alt+G anywhere opens the mini-game
  useEffect(() => {
    let keyBuffer = '';
    const handleGlobalKey = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        ambientSynth.playSuccessSFX();
        setIsGameOpen(true);
        return;
      }
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);
      if (keyBuffer.endsWith('24601') || keyBuffer.endsWith('escape') || keyBuffer.endsWith('mario')) {
        ambientSynth.playSuccessSFX();
        setIsGameOpen(true);
        keyBuffer = '';
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Modal open handlers with state snapshotting
  const openMemberModal = useCallback((member: CastMember | null) => {
    setCastSnapshot(member ? castMembersRef.current : null);
    setEditingMember(member);
    setIsEditMemberOpen(true);
  }, []);

  const openPhotoModal = useCallback((photo: RehearsalPhoto | null) => {
    setPhotosSnapshot(photo ? rehearsalPhotosRef.current : null);
    setEditingPhoto(photo);
    setIsEditPhotoOpen(true);
  }, []);

  const openTrackModal = useCallback((track: MusicalTrack | null) => {
    setTracksSnapshot(track ? tracksRef.current : null);
    setEditingTrack(track);
    setIsEditTrackOpen(true);
  }, []);

  // Cancel handlers
  const handleCancelMemberEdit = useCallback(() => {
    if (castSnapshot) {
      rollbackCastMembers(castSnapshot);
    }
    setCastSnapshot(null);
  }, [castSnapshot, rollbackCastMembers]);

  const handleCancelPhotoEdit = useCallback(() => {
    if (photosSnapshot) {
      rollbackRehearsalPhotos(photosSnapshot);
    }
    setPhotosSnapshot(null);
  }, [photosSnapshot, rollbackRehearsalPhotos]);

  const handleCancelTrackEdit = useCallback(() => {
    if (tracksSnapshot) {
      rollbackMusicalTracks(tracksSnapshot);
    }
    setTracksSnapshot(null);
  }, [tracksSnapshot, rollbackMusicalTracks]);

  const handleOpenAiLoungeWithChar = useCallback((charId?: string) => {
    setAiInitialCharId(charId);
    setIsAiLoungeOpen(true);
  }, []);

  const handleOpenChronicle = useCallback(() => {
    setIsChronicleOpen(true);
  }, []);

  const handleExitEditMode = useCallback(() => {
    setIsEditMode(false);
  }, [setIsEditMode]);

  const handleOpenGuide = useCallback(() => {
    setIsGuideOpen(true);
  }, []);

  const handleCloseGuide = useCallback(() => {
    setIsGuideOpen(false);
  }, []);

  const handleCloseQuickTable = useCallback(() => {
    setIsQuickTableOpen(false);
  }, []);

  const handleOpenQuickTable = useCallback(() => {
    setIsQuickTableOpen(true);
  }, []);

  const handleCloseChronicle = useCallback(() => {
    setIsChronicleOpen(false);
  }, []);

  const handleCloseAiLounge = useCallback(() => {
    setIsAiLoungeOpen(false);
  }, []);

  const handleCloseCastModal = useCallback(() => {
    setSelectedCastMember(null);
  }, []);

  const handleClosePhotoModal = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setIsExportOpen(false);
  }, []);

  const handleOpenExportModal = useCallback(() => {
    setIsExportOpen(true);
  }, []);

  const handleOpenAiLoungeDefault = useCallback(() => {
    handleOpenAiLoungeWithChar(undefined);
  }, [handleOpenAiLoungeWithChar]);

  const handleAddNewPhoto = useCallback(() => {
    openPhotoModal(null);
  }, [openPhotoModal]);

  const handleAddNewMember = useCallback(() => {
    openMemberModal(null);
  }, [openMemberModal]);

  const handleAddNewTrack = useCallback(() => {
    openTrackModal(null);
  }, [openTrackModal]);

  const handleChatWithCharacter = useCallback((charId?: string) => {
    setSelectedCastMember(null);
    handleOpenAiLoungeWithChar(charId);
  }, [handleOpenAiLoungeWithChar]);

  const handleCloseEditMemberModal = useCallback(() => {
    handleCancelMemberEdit();
    setIsEditMemberOpen(false);
  }, [handleCancelMemberEdit]);

  const handleSaveEditMemberModal = useCallback((saved: CastMember) => {
    setCastSnapshot(null);
    saveCastMember(saved);
    setIsEditMemberOpen(false);
  }, [saveCastMember]);

  const handleCloseEditPhotoModal = useCallback(() => {
    handleCancelPhotoEdit();
    setIsEditPhotoOpen(false);
  }, [handleCancelPhotoEdit]);

  const handleSaveEditPhotoModal = useCallback((saved: RehearsalPhoto) => {
    setPhotosSnapshot(null);
    saveRehearsalPhoto(saved);
    setIsEditPhotoOpen(false);
  }, [saveRehearsalPhoto]);

  const handleCloseEditTrackModal = useCallback(() => {
    handleCancelTrackEdit();
    setIsEditTrackOpen(false);
  }, [handleCancelTrackEdit]);

  const handleSaveEditTrackModal = useCallback((saved: MusicalTrack) => {
    setTracksSnapshot(null);
    saveMusicalTrack(saved);
    setIsEditTrackOpen(false);
  }, [saveMusicalTrack]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg-main)] text-[var(--theme-text-primary)] selection:bg-[#8c2d2d] selection:text-white font-sans relative transition-colors duration-400">
      {/* WCAG 2.4.1 Accessible Skip-to-Main-Content Link for Keyboard & Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[9999] px-4 py-2 bg-[#8c2d2d] text-white font-medium rounded shadow-2xl ring-2 ring-amber-400 text-sm focus:outline-none"
      >
        跳至主要內容 (Skip to Main Content)
      </a>

      {/* GPU-Accelerated Fixed Background Canvas Layer */}
      <div id="bg-canvas-layer" />

      {/* 60 FPS Theatrical Dynamic Follow-Spotlight & Tyndall Dust Motes Canvas */}
      <TheatricalLightingCanvas 
        isLightMode={isLightMode}
        spotlightIntensity={spotlightIntensity}
        spotlightRadiusScale={spotlightRadiusScale}
        reduceMotion={reduceMotion}
      />

      {/* Theatrical Specular Interactive Cursor & Focus Reticle */}
      <TheatricalCursor 
        isLightMode={isLightMode} 
        enabled={useTheatricalCursor}
        reduceMotion={reduceMotion}
      />

      {/* Hardware-Accelerated Viewport Theatrical Ambient Glow Plane */}
      <div className="theatrical-glow-plane fixed inset-0 pointer-events-none -z-10 overflow-hidden transform-gpu transition-opacity duration-500" aria-hidden="true">
        {/* Top-Center French Crimson, Gilded Amber & Velvet Spotlight (Dark Mode) */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[48rem] sm:w-[68rem] h-[36rem] bg-gradient-to-b from-[#8c2d2d]/35 via-[#4a1d2e]/25 to-transparent blur-[85px] rounded-full animate-ambient-pulse dark:block hidden" />
        
        {/* Top-Center Warm Champagne & French Rose Glow (Light Mode) */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-[48rem] sm:w-[68rem] h-[36rem] bg-gradient-to-b from-[#d4b589]/25 via-[#8c2d2d]/10 to-transparent blur-[85px] rounded-full dark:hidden block" />

        {/* Mid-Screen Parisian Barricade Navy & Sapphire Light (Dark Mode) */}
        <div className="absolute top-[32%] -left-20 w-[36rem] sm:w-[50rem] h-[36rem] bg-gradient-to-br from-indigo-900/30 via-[#1e293b]/40 to-transparent blur-[85px] rounded-full animate-ambient-pulse-slow dark:block hidden" />
        
        {/* Mid-Screen Subtle French Blue & Antique Cream (Light Mode) */}
        <div className="absolute top-[32%] -left-20 w-[36rem] sm:w-[50rem] h-[36rem] bg-gradient-to-br from-sky-200/35 via-amber-100/25 to-transparent blur-[85px] rounded-full dark:hidden block" />

        {/* Lower-Screen Warm Footlight Antique Gold & Crimson Ember (Dark Mode) */}
        <div className="absolute top-[65%] -right-20 w-[36rem] sm:w-[52rem] h-[36rem] bg-gradient-to-tl from-[#c4a77d]/30 via-[#8c2d2d]/25 to-transparent blur-[85px] rounded-full dark:block hidden" />
        
        {/* Lower-Screen Warm Gilded Ivory & Terracotta (Light Mode) */}
        <div className="absolute top-[65%] -right-20 w-[36rem] sm:w-[52rem] h-[36rem] bg-gradient-to-tl from-[#d4b589]/30 via-rose-200/20 to-transparent blur-[85px] rounded-full dark:hidden block" />
      </div>

      {/* Top Fixed Navbar */}
      <Navbar
        isLightMode={isLightMode}
        toggleTheme={toggleTheme}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        onOpenQuickTable={handleOpenQuickTable}
        onOpenChronicle={handleOpenChronicle}
        onOpenAiLounge={handleOpenAiLoungeDefault}
        onOpenAccessibility={handleOpenAccessibility}
        onOpenAudioTour={() => setIsAudioTourOpen(true)}
        isAudioTourActive={isAudioTourOpen}
        onReplayCurtainIntro={() => setForceShowCurtainIntro(true)}
        onToggleSpatialSoundscape={toggleSoundscape}
        isSpatialSoundscapeActive={isSoundscapeOn}
        onOpenGame={handleOpenGame}
      />

      {/* Prominent Edit Mode Placeholder Banner */}
      <EditModeBanner
        isEditMode={isEditMode}
        onExitEditMode={handleExitEditMode}
        onOpenQuickGuide={handleOpenGuide}
      />

      {/* Main Content Landmark (WCAG 2.1 AA Compliant - Unified across both View Modes) */}
      <main id="main-content" tabIndex={-1} className="relative z-10 outline-none">
        <ErrorBoundary fallbackTitle="公演導覽畫面維護中">
          {/* VIEW MODE 1: Clean, Highly-Spacious Editorial Guide for Teachers & Parents */}
          {viewMode === 'simple' ? (
            <Suspense
              fallback={
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-stone-400">
                  <div className="w-8 h-8 border-2 border-stone-700 border-t-[#8c2d2d] rounded-full animate-spin" />
                  <span className="text-xs font-sans">正在載入簡約手冊檢視...</span>
                </div>
              }
            >
              <SimpleGuideView
                castMembers={castMembers}
                tracks={tracks}
                onOpenCastDetail={setSelectedCastMember}
                onOpenQuickTableEdit={handleOpenQuickTable}
              />
            </Suspense>
          ) : (
            /* VIEW MODE 2: 90% Complete Theatrical Flagship Immersive Experience */
            <>
              {/* 1. Hero Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <HeroSection
                  onOpenChronicle={handleOpenChronicle}
                  onOpenAiLounge={handleOpenAiLoungeDefault}
                  onOpenGame={handleOpenGame}
                />
              </motion.div>

              {/* 2. Journey & Story Section (Behind the Scenes + Rehearsal Photos) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '200px 0px 0px 0px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="section-render-optimized"
              >
                <JourneySection
                  photos={rehearsalPhotos}
                  isEditMode={isEditMode}
                  onSelectPhoto={setSelectedPhoto}
                  onEditPhoto={openPhotoModal}
                  onDeletePhoto={deleteRehearsalPhoto}
                  onAddPhoto={handleAddNewPhoto}
                />
              </motion.div>

              {/* 3. Cast & Crew Section */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '200px 0px 0px 0px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="section-render-optimized"
              >
                <CastSection
                  members={castMembers}
                  isEditMode={isEditMode}
                  onSelectMember={setSelectedCastMember}
                  onEditMember={openMemberModal}
                  onDeleteMember={deleteCastMember}
                  onAddNewMember={handleAddNewMember}
                  onConsultAi={handleOpenAiLoungeWithChar}
                />
              </motion.div>

              {/* 4. Famous Script Quotes & Bilingual Dialogues */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '200px 0px 0px 0px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="section-render-optimized"
              >
                <ScriptQuotesSection />
              </motion.div>

              {/* 5. Iconic Musical Showcase & Audio Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '200px 0px 0px 0px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="section-render-optimized"
              >
                <MusicalShowcaseSection
                  tracks={tracks}
                  isEditMode={isEditMode}
                  onEditTrack={openTrackModal}
                  onAddTrack={handleAddNewTrack}
                  onDeleteTrack={deleteMusicalTrack}
                />
              </motion.div>

              {/* 6. Ticket Information & Reservation Details */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '200px 0px 0px 0px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="section-render-optimized"
              >
                <TicketInfoSection />
              </motion.div>

              {/* 7. Venue & Campus Map */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '200px 0px 0px 0px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="section-render-optimized"
              >
                <VenueInfo />
              </motion.div>

              {/* 8. Easter Egg: Curtain Call Backstage Special Section */}
              <CurtainCallSecret
                onOpenAiLounge={handleOpenAiLoungeDefault}
                onOpenChronicle={handleOpenChronicle}
                onOpenGame={handleOpenGame}
              />
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Footer (Accessible across both view modes) */}
      <Footer onOpenChronicle={handleOpenChronicle} />

      {/* Floating Story Chronicle Quick Trigger (Bottom-Right, only in rich mode) */}
      {viewMode === 'rich' && (
        <StoryChronicleTrigger onOpen={handleOpenChronicle} onClick={handleOpenChronicle} />
      )}

      {/* Scroll To Top Button with Circular Reading Progress Ring (Bottom-Left) */}
      <ScrollToTopButton />

      {/* Bottom Floating Data Manager Bar (PIN Protected) */}
      <DataManagerBar
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onAddCastMember={handleAddNewMember}
        onAddRehearsalPhoto={handleAddNewPhoto}
        onAddTrack={handleAddNewTrack}
        onOpenGrandConfig={() => setIsGrandConfigOpen(true)}
        onOpenQuickTable={handleOpenQuickTable}
        onExportJSON={handleOpenExportModal}
        onResetData={resetAllData}
        onUndoChange={undoChange}
      />

      {/* Grand CMS Modal (Dates, Countdown, Tickets, Taglines & Accessibility) */}
      <Suspense fallback={null}>
        {isGrandConfigOpen && (
          <GrandConfigModal
            isOpen={isGrandConfigOpen}
            onClose={() => setIsGrandConfigOpen(false)}
            config={generalConfig}
            onSaveConfig={updateGeneralConfig}
            onResetConfig={resetGeneralConfig}
          />
        )}
      </Suspense>

      {/* Quick Table Spreadsheet Editor Modal (for non-technical teachers & students) */}
      <Suspense fallback={null}>
        {isQuickTableOpen && (
          <QuickTableEditModal
            isOpen={isQuickTableOpen}
            onClose={handleCloseQuickTable}
            castMembers={castMembers}
            onSaveCast={saveSpreadsheetCast}
            onResetCast={resetSpreadsheetCast}
          />
        )}
      </Suspense>

      {/* ------------------------------------------------------------- */}
      {/* Dynamic / Lazy Loaded Modals wrapped in Suspense for Fast Load */}
      {/* ------------------------------------------------------------- */}

      {/* Interactive Story Chronicle Drawer */}
      <Suspense fallback={null}>
        {isChronicleOpen && (
          <StoryChronicleDrawer
            isOpen={isChronicleOpen}
            onClose={handleCloseChronicle}
          />
        )}
      </Suspense>

      {/* Cast Member Detail Bio Modal */}
      <Suspense fallback={null}>
        {selectedCastMember && (
          <CastModal
            member={selectedCastMember}
            onClose={handleCloseCastModal}
            onChatWithCharacter={handleChatWithCharacter}
          />
        )}
      </Suspense>

      {/* Rehearsal Photo Detail Modal */}
      <Suspense fallback={null}>
        {selectedPhoto && (
          <RehearsalModal
            photo={selectedPhoto}
            onClose={handleClosePhotoModal}
          />
        )}
      </Suspense>

      {/* Edit / Add Cast Member Modal */}
      <Suspense fallback={null}>
        {isEditMemberOpen && (
          <EditMemberModal
            isOpen={isEditMemberOpen}
            member={editingMember}
            onClose={handleCloseEditMemberModal}
            onCancel={handleCancelMemberEdit}
            onSave={handleSaveEditMemberModal}
            onLiveChange={liveUpdateCastMember}
          />
        )}
      </Suspense>

      {/* Edit / Add Rehearsal Photo Modal */}
      <Suspense fallback={null}>
        {isEditPhotoOpen && (
          <EditRehearsalModal
            isOpen={isEditPhotoOpen}
            photo={editingPhoto}
            onClose={handleCloseEditPhotoModal}
            onCancel={handleCancelPhotoEdit}
            onSave={handleSaveEditPhotoModal}
            onLiveChange={liveUpdateRehearsalPhoto}
          />
        )}
      </Suspense>

      {/* Edit / Add Musical Track Modal */}
      <Suspense fallback={null}>
        {isEditTrackOpen && (
          <EditTrackModal
            isOpen={isEditTrackOpen}
            track={editingTrack}
            onClose={handleCloseEditTrackModal}
            onCancel={handleCancelTrackEdit}
            onSave={handleSaveEditTrackModal}
            onLiveChange={liveUpdateMusicalTrack}
          />
        )}
      </Suspense>

      {/* JSON Import/Export & Deployment Backup Modal */}
      <Suspense fallback={null}>
        {isExportOpen && (
          <ExportModal
            isOpen={isExportOpen}
            onClose={handleCloseExportModal}
            castMembers={castMembers}
            rehearsalPhotos={rehearsalPhotos}
            tracks={tracks}
            onImportData={importData}
          />
        )}
      </Suspense>

      {/* Educational Literary Lounge & Character Dialogue Modal */}
      <Suspense fallback={null}>
        {isAiLoungeOpen && (
          <AiLesMisLoungeModal
            isOpen={isAiLoungeOpen}
            onClose={handleCloseAiLounge}
            initialCharacterId={aiInitialCharId}
          />
        )}
      </Suspense>

      {/* Placeholder Quick Guide Modal */}
      <Suspense fallback={null}>
        {isGuideOpen && (
          <PlaceholderGuideModal
            isOpen={isGuideOpen}
            onClose={handleCloseGuide}
          />
        )}
      </Suspense>

      {/* Display & Lighting Accessibility Settings Modal */}
      <AccessibilitySettingsModal isLightMode={isLightMode} />

      {/* WCAG 2.1 AA Accessibility Research & Verification Manual Modal */}
      <AccessibilityResearchModal />

      {/* Accessible Audio Tour (Microsoft Azure Neural TTS & WCAG 2.1 AA) */}
      <AccessibleAudioTour
        isOpen={isAudioTourOpen}
        onClose={() => setIsAudioTourOpen(false)}
        onOpen={() => setIsAudioTourOpen(true)}
      />

      {/* Prominent Theatrical Quick Dock & Practical Side Rail */}
      <TheatricalQuickDock
        isLightMode={isLightMode}
        toggleTheme={toggleTheme}
        onOpenChronicle={handleOpenChronicle}
        onReplayCurtainIntro={() => setForceShowCurtainIntro(true)}
        onOpenGame={handleOpenGame}
      />

      {/* Hidden Easter Egg 2D Platformer Mini-Game: Valjean's Escape (Run 24601) */}
      <Suspense fallback={null}>
        {isGameOpen && (
          <ValjeanEscapeGameModal
            isOpen={isGameOpen}
            onClose={handleCloseGame}
          />
        )}
      </Suspense>

      {/* Cinematic Theatrical Curtain Opening & Hero Flare Intro */}
      <CinematicCurtainIntro
        forceShow={forceShowCurtainIntro}
        onCloseForceShow={() => setForceShowCurtainIntro(false)}
        isLightMode={isLightMode}
      />
    </div>
  );
});

export default function App() {
  return (
    <AccessibilityProvider>
      <ShowDataProvider>
        <FocusEditProvider>
          <AppContent />
        </FocusEditProvider>
      </ShowDataProvider>
    </AccessibilityProvider>
  );
}
