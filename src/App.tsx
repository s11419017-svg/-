import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import {
  Navbar,
  HeroSection,
  StoryChronicleTrigger,
  JourneySection,
  CastSection,
  CastSectionSkeleton,
  RehearsalSectionSkeleton,
  TicketInfoSection,
  ScriptQuotesSection,
  MusicalShowcaseSection,
  VenueInfo,
  Footer,
  DataManagerBar,
  EditModeBanner,
  CurtainCallSecret,
  ScrollToTopButton,
} from './components';
import { CAST_MEMBERS as INITIAL_CAST, REHEARSAL_PHOTOS as INITIAL_PHOTOS } from './data/showData';
import { CastMember, RehearsalPhoto } from './types';
import { ambientSynth } from './utils/audioSynth';
import { safeDecodeSharePayload, sanitizeObjectToUtf8 } from './utils/textEncoding';

// Lazy-loaded Modals for Code Splitting & Ultra-Fast Initial Page Load
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
const ExportModal = lazy(() =>
  import('./components/modals/ExportModal').then((m) => ({ default: m.ExportModal }))
);
const AiLesMisLoungeModal = lazy(() =>
  import('./components/modals/AiLesMisLoungeModal').then((m) => ({ default: m.AiLesMisLoungeModal }))
);
const PlaceholderGuideModal = lazy(() =>
  import('./components/modals/PlaceholderGuideModal').then((m) => ({ default: m.PlaceholderGuideModal }))
);

const LOCAL_STORAGE_CAST_KEY = 'tcsh_les_mis_cast_custom_v1';
const LOCAL_STORAGE_PHOTOS_KEY = 'tcsh_les_mis_photos_custom_v1';

export default function App() {
  // UI Loading State (Simulate non-blocking async hydration from localStorage for smooth perceived performance)
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load cast members from localStorage if available, otherwise default
  const [castMembers, setCastMembers] = useState<CastMember[]>(INITIAL_CAST);
  const [rehearsalPhotos, setRehearsalPhotos] = useState<RehearsalPhoto[]>(INITIAL_PHOTOS);

  // Lazy hydration effect for non-blocking local storage reading & skeleton visual feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // 1. First check if URL contains shared roster_data encoded with encodeURIComponent
        const searchParams = new URLSearchParams(window.location.search);
        const sharedRosterParam = searchParams.get('roster_data');
        if (sharedRosterParam) {
          try {
            const decoded = safeDecodeSharePayload(sharedRosterParam);
            if (decoded && (Array.isArray(decoded.castMembers) || Array.isArray(decoded.rehearsalPhotos))) {
              if (decoded.castMembers) setCastMembers(decoded.castMembers);
              if (decoded.rehearsalPhotos) setRehearsalPhotos(decoded.rehearsalPhotos);
              console.log('Successfully hydrated from UTF-8 share link payload');
              setIsDataLoading(false);
              return;
            }
          } catch (urlErr) {
            console.warn('URL roster_data decode error:', urlErr);
          }
        }

        // 2. Otherwise load from localStorage and sanitize to strict UTF-8
        const savedCast = localStorage.getItem(LOCAL_STORAGE_CAST_KEY);
        if (savedCast) {
          const parsed = JSON.parse(savedCast);
          setCastMembers(sanitizeObjectToUtf8(parsed));
        }

        const savedPhotos = localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY);
        if (savedPhotos) {
          const parsed = JSON.parse(savedPhotos);
          setRehearsalPhotos(sanitizeObjectToUtf8(parsed));
        }
      } catch (e) {
        console.warn('Failed to parse saved data from localStorage:', e);
      } finally {
        setIsDataLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // UI Modals & Modes State
  const [selectedCastMember, setSelectedCastMember] = useState<CastMember | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<RehearsalPhoto | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);
  const [isAiLoungeOpen, setIsAiLoungeOpen] = useState(false);
  const [aiInitialCharId, setAiInitialCharId] = useState<string | undefined>(undefined);

  // Edit Mode & Customization Modals State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMember, setEditingMember] = useState<CastMember | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [castSnapshot, setCastSnapshot] = useState<CastMember[] | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<RehearsalPhoto | null>(null);
  const [isEditPhotoOpen, setIsEditPhotoOpen] = useState(false);
  const [photosSnapshot, setPhotosSnapshot] = useState<RehearsalPhoto[] | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Open Edit Member Modal with snapshot for cancel rollback
  const openMemberModal = (member: CastMember | null) => {
    setCastSnapshot(JSON.parse(JSON.stringify(castMembers)));
    setEditingMember(member);
    setIsEditMemberOpen(true);
  };

  // Open Edit Photo Modal with snapshot for cancel rollback
  const openPhotoModal = (photo: RehearsalPhoto | null) => {
    setPhotosSnapshot(JSON.parse(JSON.stringify(rehearsalPhotos)));
    setEditingPhoto(photo);
    setIsEditPhotoOpen(true);
  };

  // Live preview handlers (updates state as user types or uploads image)
  const handleLiveChangeMember = (updatedMember: CastMember) => {
    setCastMembers((prev) => {
      const exists = prev.some((m) => m.id === updatedMember.id);
      if (exists) {
        return prev.map((m) => (m.id === updatedMember.id ? updatedMember : m));
      }
      return [updatedMember, ...prev];
    });
  };

  const handleCancelMemberEdit = () => {
    if (castSnapshot) {
      setCastMembers(castSnapshot);
    }
  };

  const handleLiveChangePhoto = (updatedPhoto: RehearsalPhoto) => {
    setRehearsalPhotos((prev) => {
      const exists = prev.some((p) => p.id === updatedPhoto.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
      }
      return [updatedPhoto, ...prev];
    });
  };

  const handleCancelPhotoEdit = () => {
    if (photosSnapshot) {
      setRehearsalPhotos(photosSnapshot);
    }
  };

  const handleImportData = (newCast: CastMember[], newPhotos: RehearsalPhoto[]) => {
    setCastMembers(newCast);
    setRehearsalPhotos(newPhotos);
    try {
      localStorage.setItem(LOCAL_STORAGE_CAST_KEY, JSON.stringify(newCast));
      localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(newPhotos));
    } catch (e) {
      console.warn('LocalStorage save failed on import:', e);
    }
  };

  // Save changes to localStorage whenever cast or photos update
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CAST_KEY, JSON.stringify(castMembers));
    } catch (e) {
      console.error('LocalStorage write failed for cast members:', e);
    }
  }, [castMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(rehearsalPhotos));
    } catch (e) {
      console.error('LocalStorage write failed for photos:', e);
    }
  }, [rehearsalPhotos]);

  const toggleAudio = () => {
    const active = ambientSynth.toggle();
    setIsAudioActive(active);
  };

  // Cast Member CRUD Operations
  const handleSaveMember = (memberToSave: CastMember) => {
    setCastMembers((prev) => {
      const exists = prev.some((m) => m.id === memberToSave.id);
      if (exists) {
        return prev.map((m) => (m.id === memberToSave.id ? memberToSave : m));
      }
      return [memberToSave, ...prev];
    });
  };

  const handleDeleteMember = (id: string) => {
    setCastMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Rehearsal Photo CRUD Operations
  const handleSavePhoto = (photoToSave: RehearsalPhoto) => {
    setRehearsalPhotos((prev) => {
      const exists = prev.some((p) => p.id === photoToSave.id);
      if (exists) {
        return prev.map((p) => (p.id === photoToSave.id ? photoToSave : p));
      }
      return [photoToSave, ...prev];
    });
  };

  const handleDeletePhoto = (id: string) => {
    setRehearsalPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetData = () => {
    if (confirm('確定要還原為初始預設樣板資料嗎？您自行上傳的相片將被刪除。')) {
      localStorage.removeItem(LOCAL_STORAGE_CAST_KEY);
      localStorage.removeItem(LOCAL_STORAGE_PHOTOS_KEY);
      setCastMembers(INITIAL_CAST);
      setRehearsalPhotos(INITIAL_PHOTOS);
      setIsEditMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1c] text-[#f5f5f4] selection:bg-[#8c2d2d] selection:text-white font-sans relative">
      {/* GPU-Accelerated Fixed Background Canvas Layer */}
      <div id="bg-canvas-layer" />

      {/* Top Fixed Navbar */}
      <Navbar
        isMuted={!isAudioActive}
        toggleAudio={toggleAudio}
        onOpenChronicle={() => setIsChronicleOpen(true)}
        onOpenAiLounge={() => {
          setAiInitialCharId(undefined);
          setIsAiLoungeOpen(true);
        }}
      />

      {/* Prominent Edit Mode Placeholder Banner */}
      <EditModeBanner
        isEditMode={isEditMode}
        onExitEditMode={() => setIsEditMode(false)}
        onOpenQuickGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Page Sections */}
      <main id="main-content">
        {/* 1. Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <HeroSection
            onOpenChronicle={() => setIsChronicleOpen(true)}
            onOpenAiLounge={() => {
              setAiInitialCharId(undefined);
              setIsAiLoungeOpen(true);
            }}
          />
        </motion.div>

        {/* 2. Journey & Story Section (Behind the Scenes + Rehearsal Photos) */}
        <motion.div
          className="content-visibility-auto transform-gpu"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {isDataLoading ? (
            <RehearsalSectionSkeleton />
          ) : (
            <JourneySection
              photos={rehearsalPhotos}
              isEditMode={isEditMode}
              onSelectPhoto={(photo) => setSelectedPhoto(photo)}
              onEditPhoto={(photo) => openPhotoModal(photo)}
              onDeletePhoto={handleDeletePhoto}
              onAddPhoto={() => openPhotoModal(null)}
            />
          )}
        </motion.div>

        {/* 3. Cast & Crew Section */}
        <motion.div
          className="content-visibility-auto transform-gpu"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {isDataLoading ? (
            <CastSectionSkeleton />
          ) : (
            <CastSection
              members={castMembers}
              isEditMode={isEditMode}
              onSelectMember={(member) => setSelectedCastMember(member)}
              onEditMember={(member) => openMemberModal(member)}
              onDeleteMember={handleDeleteMember}
              onAddNewMember={() => openMemberModal(null)}
            />
          )}
        </motion.div>

        {/* 4. Script Quotes & Bilingual English Learning Section */}
        <motion.div
          className="content-visibility-auto transform-gpu"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ScriptQuotesSection />
        </motion.div>

        {/* 5. Musical Showcase & Song Themes Section */}
        <motion.div
          className="content-visibility-auto transform-gpu"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <MusicalShowcaseSection />
        </motion.div>

        {/* 6. Physical Ticket & Admission Guide */}
        <motion.div
          className="content-visibility-auto transform-gpu"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <TicketInfoSection />
        </motion.div>

        {/* 7. Venue Info & FAQ */}
        <motion.div
          className="content-visibility-auto transform-gpu"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <VenueInfo />
        </motion.div>
      </main>

      {/* Quick Floating Trigger Button on Screen Edge */}
      {!isChronicleOpen && (
        <StoryChronicleTrigger onOpen={() => setIsChronicleOpen(true)} />
      )}

      {/* Footer */}
      <Footer />

      {/* Smooth Scroll To Top Floating Button with Reading Progress Ring */}
      <ScrollToTopButton />

      {/* Easter Egg: Curtain Call & Secret Director's Note */}
      <CurtainCallSecret
        onOpenAiLounge={() => {
          ambientSynth.playButtonClickSFX();
          setAiInitialCharId(undefined);
          setIsAiLoungeOpen(true);
        }}
        onOpenChronicle={() => {
          ambientSynth.playPageFlipSFX();
          setIsChronicleOpen(true);
        }}
      />

      {/* Floating Manager Control Bar */}
      <DataManagerBar
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode(!isEditMode)}
        onAddCastMember={() => openMemberModal(null)}
        onAddRehearsalPhoto={() => openPhotoModal(null)}
        onExportJSON={() => setIsExportOpen(true)}
        onResetData={handleResetData}
      />

      {/* Lazy Loaded Modals & Drawers */}
      <Suspense fallback={null}>
        {/* Side Slide-Over Drawer for Vintage Story Manuscript */}
        <StoryChronicleDrawer
          isOpen={isChronicleOpen}
          onClose={() => setIsChronicleOpen(false)}
        />

        {/* Cast Member Detail Modal */}
        <CastModal
          member={selectedCastMember}
          onClose={() => setSelectedCastMember(null)}
        />

        {/* Rehearsal Photo Lightbox Modal */}
        <RehearsalModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />

        {/* Edit Cast Member Modal */}
        <EditMemberModal
          member={editingMember}
          isOpen={isEditMemberOpen}
          onClose={() => setIsEditMemberOpen(false)}
          onSave={handleSaveMember}
          onLiveChange={handleLiveChangeMember}
          onCancel={handleCancelMemberEdit}
        />

        {/* Edit Rehearsal Photo Modal */}
        <EditRehearsalModal
          photo={editingPhoto}
          isOpen={isEditPhotoOpen}
          onClose={() => setIsEditPhotoOpen(false)}
          onSave={handleSavePhoto}
          onLiveChange={handleLiveChangePhoto}
          onCancel={handleCancelPhotoEdit}
        />

        {/* Export / Backup Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          castMembers={castMembers}
          rehearsalPhotos={rehearsalPhotos}
          onImportData={handleImportData}
        />

        {/* AI Les Mis Lounge Modal */}
        <AiLesMisLoungeModal
          isOpen={isAiLoungeOpen}
          onClose={() => setIsAiLoungeOpen(false)}
          initialCharacterId={aiInitialCharId}
        />

        {/* Demo & Placeholder Guide Modal for Teachers/Directors */}
        <PlaceholderGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </Suspense>

      {/* Floating AI Launch Button */}
      {!isAiLoungeOpen && (
        <button
          onClick={() => {
            ambientSynth.playButtonClickSFX();
            setAiInitialCharId(undefined);
            setIsAiLoungeOpen(true);
          }}
          className="fixed bottom-24 right-5 z-40 bg-gradient-to-r from-[#8c2d2d] to-[#692020] text-amber-200 hover:text-white p-3.5 rounded-full shadow-2xl border-2 border-amber-400/60 hover:border-amber-400 transition-all hover:scale-110 active:scale-90 touch-active select-none cursor-pointer flex items-center gap-2 min-w-[48px] min-h-[48px]"
          title="開啟悲慘世界 AI 觀劇對話館"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-serif-tc font-bold">
            AI 靈魂對話館
          </span>
        </button>
      )}
    </div>
  );
}
