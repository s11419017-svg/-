import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { CastMember, RehearsalPhoto, MusicalTrack, ChangeRecord, ShowGeneralConfig } from '../types';
import {
  CAST_MEMBERS as INITIAL_CAST,
  REHEARSAL_PHOTOS as INITIAL_PHOTOS,
  MUSICAL_TRACKS as INITIAL_TRACKS,
  DEFAULT_SHOW_GENERAL_CONFIG,
} from '../data/showData';
import { subscribeToShowData, saveShowDataToCloud } from '../services/firebaseService';
import { safeDecodeSharePayload, sanitizeObjectToUtf8 } from '../utils/textEncoding';
import { runNonBlocking } from '../utils/asyncScheduler';

const LOCAL_STORAGE_CAST_KEY = 'tcsh_les_mis_cast_custom_v1';
const LOCAL_STORAGE_PHOTOS_KEY = 'tcsh_les_mis_photos_custom_v1';
const LOCAL_STORAGE_TRACKS_KEY = 'tcsh_les_mis_tracks_custom_v1';
const LOCAL_STORAGE_CONFIG_KEY = 'tcsh_les_mis_config_custom_v1';

function getInitialRosterData(): {
  cast: CastMember[];
  photos: RehearsalPhoto[];
  tracks: MusicalTrack[];
  config: ShowGeneralConfig;
} {
  try {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const sharedRosterParam = searchParams.get('roster_data');
      if (sharedRosterParam) {
        const decoded = safeDecodeSharePayload(sharedRosterParam);
        if (
          decoded &&
          (Array.isArray(decoded.cast) ||
            Array.isArray(decoded.castMembers) ||
            Array.isArray(decoded.photos) ||
            Array.isArray(decoded.rehearsalPhotos) ||
            Array.isArray(decoded.tracks))
        ) {
          return {
            cast: decoded.cast || decoded.castMembers || INITIAL_CAST,
            photos: decoded.photos || decoded.rehearsalPhotos || INITIAL_PHOTOS,
            tracks: decoded.tracks || INITIAL_TRACKS,
            config: decoded.generalConfig || decoded.config || DEFAULT_SHOW_GENERAL_CONFIG,
          };
        }
      }

      const savedCast = localStorage.getItem(LOCAL_STORAGE_CAST_KEY);
      const savedPhotos = localStorage.getItem(LOCAL_STORAGE_PHOTOS_KEY);
      const savedTracks = localStorage.getItem(LOCAL_STORAGE_TRACKS_KEY);
      const savedConfig = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);

      const cast = savedCast ? sanitizeObjectToUtf8(JSON.parse(savedCast)) : INITIAL_CAST;
      const photos = savedPhotos ? sanitizeObjectToUtf8(JSON.parse(savedPhotos)) : INITIAL_PHOTOS;
      const tracks = savedTracks ? sanitizeObjectToUtf8(JSON.parse(savedTracks)) : INITIAL_TRACKS;
      const config = savedConfig
        ? { ...DEFAULT_SHOW_GENERAL_CONFIG, ...sanitizeObjectToUtf8(JSON.parse(savedConfig)) }
        : DEFAULT_SHOW_GENERAL_CONFIG;

      return { cast, photos, tracks, config };
    }
  } catch (e) {
    console.warn('Initial data load warning:', e);
  }
  return {
    cast: INITIAL_CAST,
    photos: INITIAL_PHOTOS,
    tracks: INITIAL_TRACKS,
    config: DEFAULT_SHOW_GENERAL_CONFIG,
  };
}

// 1. Data State Context
export interface ShowCoreData {
  castMembers: CastMember[];
  rehearsalPhotos: RehearsalPhoto[];
  tracks: MusicalTrack[];
  generalConfig: ShowGeneralConfig;
  isEditMode: boolean;
}

export interface ShowCloudStatus {
  isCloudSynced: boolean;
  isCloudSaving: boolean;
  isOnline: boolean;
  lastCloudUpdate?: string;
  recentChanges: ChangeRecord[];
}

export interface ShowDataState extends ShowCoreData, ShowCloudStatus {}

// 2. Actions Context (Stable Callbacks)
export interface ShowDataActions {
  setIsEditMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleEditMode: () => void;
  retryPendingSync: () => void;
  saveCastMember: (member: CastMember) => void;
  deleteCastMember: (id: string) => void;
  liveUpdateCastMember: (member: CastMember) => void;
  rollbackCastMembers: (snapshot: CastMember[]) => void;
  saveRehearsalPhoto: (photo: RehearsalPhoto) => void;
  deleteRehearsalPhoto: (id: string) => void;
  liveUpdateRehearsalPhoto: (photo: RehearsalPhoto) => void;
  rollbackRehearsalPhotos: (snapshot: RehearsalPhoto[]) => void;
  saveMusicalTrack: (track: MusicalTrack) => void;
  deleteMusicalTrack: (id: string) => void;
  liveUpdateMusicalTrack: (track: MusicalTrack) => void;
  rollbackMusicalTracks: (snapshot: MusicalTrack[]) => void;
  saveGeneralConfig: (newConfig: ShowGeneralConfig) => void;
  updateGeneralConfig: (newConfig: ShowGeneralConfig) => void;
  resetGeneralConfig: () => void;
  importData: (
    newCast: CastMember[],
    newPhotos: RehearsalPhoto[],
    newTracks?: MusicalTrack[],
    newConfig?: ShowGeneralConfig
  ) => void;
  resetAllData: () => void;
  undoChange: (recordId: string) => void;
  logChange: (
    description: string,
    targetType: 'cast' | 'photo' | 'track' | 'bulk',
    previousState: {
      cast?: CastMember[];
      photos?: RehearsalPhoto[];
      tracks?: MusicalTrack[];
      generalConfig?: ShowGeneralConfig;
    }
  ) => void;
  saveSpreadsheetCast: (newCast: CastMember[]) => void;
  resetSpreadsheetCast: () => void;
}

const ShowCoreDataContext = createContext<ShowCoreData | null>(null);
const ShowCloudStatusContext = createContext<ShowCloudStatus | null>(null);
const ShowDataStateContext = createContext<ShowDataState | null>(null);
const ShowDataActionsContext = createContext<ShowDataActions | null>(null);

export const ShowDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = useMemo(() => getInitialRosterData(), []);
  const [castMembers, setCastMembers] = useState<CastMember[]>(initial.cast);
  const [rehearsalPhotos, setRehearsalPhotos] = useState<RehearsalPhoto[]>(initial.photos);
  const [tracks, setTracks] = useState<MusicalTrack[]>(initial.tracks);
  const [generalConfig, setGeneralConfig] = useState<ShowGeneralConfig>(initial.config);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(true);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastCloudUpdate, setLastCloudUpdate] = useState<string | undefined>(undefined);
  const [recentChanges, setRecentChanges] = useState<ChangeRecord[]>([]);

  // Network online/offline event listener for real-time resilience
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setIsCloudSynced(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsCloudSynced(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep references to latest data for stable callbacks and preventing state tearing
  const castMembersRef = useRef(castMembers);
  castMembersRef.current = castMembers;
  const rehearsalPhotosRef = useRef(rehearsalPhotos);
  rehearsalPhotosRef.current = rehearsalPhotos;
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const generalConfigRef = useRef(generalConfig);
  generalConfigRef.current = generalConfig;

  // Track local save timestamp to avoid circular echoing from realtime onSnapshot
  const lastLocalSaveTimeRef = useRef<number>(0);

  // Real-time Firestore Cloud Listener
  useEffect(() => {
    const unsubscribe = subscribeToShowData(
      (cloudData) => {
        // Prevent echo if a local save was made very recently (< 2000ms)
        if (Date.now() - lastLocalSaveTimeRef.current < 2000) {
          return;
        }

        if (Array.isArray(cloudData.cast) && cloudData.cast.length > 0) {
          setCastMembers(cloudData.cast);
          runNonBlocking(() => {
            try {
              localStorage.setItem(LOCAL_STORAGE_CAST_KEY, JSON.stringify(cloudData.cast));
            } catch {}
          });
        }
        if (Array.isArray(cloudData.photos) && cloudData.photos.length > 0) {
          setRehearsalPhotos(cloudData.photos);
          runNonBlocking(() => {
            try {
              localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(cloudData.photos));
            } catch {}
          });
        }
        if (Array.isArray(cloudData.tracks) && cloudData.tracks.length > 0) {
          setTracks(cloudData.tracks);
          runNonBlocking(() => {
            try {
              localStorage.setItem(LOCAL_STORAGE_TRACKS_KEY, JSON.stringify(cloudData.tracks));
            } catch {}
          });
        }
        if (cloudData.generalConfig) {
          setGeneralConfig((prev) => ({ ...prev, ...cloudData.generalConfig }));
          runNonBlocking(() => {
            try {
              localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(cloudData.generalConfig));
            } catch {}
          });
        }
        if (cloudData.updatedAt) {
          setLastCloudUpdate(cloudData.updatedAt);
        }
        setIsCloudSynced(true);
      },
      (error) => {
        console.warn('Firebase live listener notice:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const logChange = useCallback(
    (
      description: string,
      targetType: 'cast' | 'photo' | 'track' | 'bulk',
      previousState: {
        cast?: CastMember[];
        photos?: RehearsalPhoto[];
        tracks?: MusicalTrack[];
        generalConfig?: ShowGeneralConfig;
      }
    ) => {
      const newRecord: ChangeRecord = {
        id: `change-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        description,
        targetType,
        previousState,
      };
      setRecentChanges((prev) => [newRecord, ...prev].slice(0, 3));
    },
    []
  );

  const persistGeneralConfig = useCallback(
    (newConfig: ShowGeneralConfig, actionDesc: string) => {
      lastLocalSaveTimeRef.current = Date.now();
      runNonBlocking(() => {
        try {
          localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }
      });

      setIsCloudSaving(true);
      saveShowDataToCloud({ generalConfig: newConfig }, actionDesc)
        .then((res) => {
          setLastCloudUpdate(res.updatedAt);
          setIsCloudSynced(true);
        })
        .catch((e) => {
          console.error('Cloud save failed:', e);
          setIsCloudSynced(false);
        })
        .finally(() => {
          setIsCloudSaving(false);
        });
    },
    []
  );

  const saveGeneralConfig = useCallback(
    (newConfig: ShowGeneralConfig) => {
      logChange('修改全站基本資訊與日程文案', 'bulk', {
        generalConfig: structuredClone(generalConfigRef.current),
      });
      setGeneralConfig(newConfig);
      persistGeneralConfig(newConfig, '更新全站日程與文案');
    },
    [logChange, persistGeneralConfig]
  );

  const resetGeneralConfig = useCallback(() => {
    logChange('還原全站基本資訊與日程為預設值', 'bulk', {
      generalConfig: structuredClone(generalConfigRef.current),
    });
    setGeneralConfig(DEFAULT_SHOW_GENERAL_CONFIG);
    persistGeneralConfig(DEFAULT_SHOW_GENERAL_CONFIG, '還原全站日程與文案');
  }, [logChange, persistGeneralConfig]);

  const persistCast = useCallback(
    (newCast: CastMember[], actionDesc: string) => {
      lastLocalSaveTimeRef.current = Date.now();
      runNonBlocking(() => {
        try {
          localStorage.setItem(LOCAL_STORAGE_CAST_KEY, JSON.stringify(newCast));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }
      });

      setIsCloudSaving(true);
      saveShowDataToCloud({ cast: newCast }, actionDesc)
        .then((res) => {
          setLastCloudUpdate(res.updatedAt);
          setIsCloudSynced(true);
        })
        .catch((e) => {
          console.error('Cloud save failed:', e);
          setIsCloudSynced(false);
        })
        .finally(() => {
          setIsCloudSaving(false);
        });
    },
    []
  );

  const persistPhotos = useCallback(
    (newPhotos: RehearsalPhoto[], actionDesc: string) => {
      lastLocalSaveTimeRef.current = Date.now();
      runNonBlocking(() => {
        try {
          localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(newPhotos));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }
      });

      setIsCloudSaving(true);
      saveShowDataToCloud({ photos: newPhotos }, actionDesc)
        .then((res) => {
          setLastCloudUpdate(res.updatedAt);
          setIsCloudSynced(true);
        })
        .catch((e) => {
          console.error('Cloud save failed:', e);
          setIsCloudSynced(false);
        })
        .finally(() => {
          setIsCloudSaving(false);
        });
    },
    []
  );

  const persistTracks = useCallback(
    (newTracks: MusicalTrack[], actionDesc: string) => {
      lastLocalSaveTimeRef.current = Date.now();
      runNonBlocking(() => {
        try {
          localStorage.setItem(LOCAL_STORAGE_TRACKS_KEY, JSON.stringify(newTracks));
        } catch (e) {
          console.warn('LocalStorage save failed:', e);
        }
      });

      setIsCloudSaving(true);
      saveShowDataToCloud({ tracks: newTracks }, actionDesc)
        .then((res) => {
          setLastCloudUpdate(res.updatedAt);
          setIsCloudSynced(true);
        })
        .catch((e) => {
          console.error('Cloud save failed:', e);
          setIsCloudSynced(false);
        })
        .finally(() => {
          setIsCloudSaving(false);
        });
    },
    []
  );

  const undoChange = useCallback(
    (recordId: string) => {
      setRecentChanges((prev) => {
        const record = prev.find((r) => r.id === recordId);
        if (!record) return prev;

        if (record.previousState.cast) {
          const restored = record.previousState.cast;
          setCastMembers(restored);
          persistCast(restored, '復原演職變更');
        }
        if (record.previousState.photos) {
          const restored = record.previousState.photos;
          setRehearsalPhotos(restored);
          persistPhotos(restored, '復原照片變更');
        }
        if (record.previousState.tracks) {
          const restored = record.previousState.tracks;
          setTracks(restored);
          persistTracks(restored, '復原曲目變更');
        }
        if (record.previousState.generalConfig) {
          const restored = record.previousState.generalConfig;
          setGeneralConfig(restored);
          persistGeneralConfig(restored, '復原總體文案變更');
        }

        return prev.filter((r) => r.id !== recordId);
      });
    },
    [persistCast, persistPhotos, persistTracks, persistGeneralConfig]
  );

  // Cast CRUD operations
  const saveCastMember = useCallback(
    (member: CastMember) => {
      logChange(`儲存演職人員：${member.name} (${member.roleName})`, 'cast', {
        cast: structuredClone(castMembersRef.current),
      });

      const updated = (() => {
        const exists = castMembersRef.current.some((m) => m.id === member.id);
        if (exists) {
          return castMembersRef.current.map((m) => (m.id === member.id ? member : m));
        }
        return [member, ...castMembersRef.current];
      })();

      setCastMembers(updated);
      persistCast(updated, `更新演職人員 ${member.name}`);
    },
    [logChange, persistCast]
  );

  const deleteCastMember = useCallback(
    (id: string) => {
      const target = castMembersRef.current.find((m) => m.id === id);
      const name = target ? target.name : id;
      logChange(`刪除演職人員：${name}`, 'cast', {
        cast: structuredClone(castMembersRef.current),
      });

      const updated = castMembersRef.current.filter((m) => m.id !== id);
      setCastMembers(updated);
      persistCast(updated, `刪除演職人員 ${name}`);
    },
    [logChange, persistCast]
  );

  const liveUpdateCastMember = useCallback((member: CastMember) => {
    setCastMembers((prev) => {
      const exists = prev.some((m) => m.id === member.id);
      if (exists) {
        return prev.map((m) => (m.id === member.id ? member : m));
      }
      return [member, ...prev];
    });
  }, []);

  const rollbackCastMembers = useCallback((snapshot: CastMember[]) => {
    setCastMembers(snapshot);
  }, []);

  // Photos CRUD operations
  const saveRehearsalPhoto = useCallback(
    (photo: RehearsalPhoto) => {
      logChange(`儲存排練側拍：${photo.title}`, 'photo', {
        photos: structuredClone(rehearsalPhotosRef.current),
      });

      const updatedPhotos = (() => {
        const exists = rehearsalPhotosRef.current.some((p) => p.id === photo.id);
        if (exists) {
          return rehearsalPhotosRef.current.map((p) => (p.id === photo.id ? photo : p));
        }
        return [photo, ...rehearsalPhotosRef.current];
      })();

      setRehearsalPhotos(updatedPhotos);
      persistPhotos(updatedPhotos, `更新排練照 ${photo.title}`);
    },
    [logChange, persistPhotos]
  );

  const deleteRehearsalPhoto = useCallback(
    (id: string) => {
      const target = rehearsalPhotosRef.current.find((p) => p.id === id);
      const title = target ? target.title : id;
      logChange(`刪除排練側拍：${title}`, 'photo', {
        photos: structuredClone(rehearsalPhotosRef.current),
      });

      const updatedPhotos = rehearsalPhotosRef.current.filter((p) => p.id !== id);
      setRehearsalPhotos(updatedPhotos);
      persistPhotos(updatedPhotos, `刪除排練照 ${title}`);
    },
    [logChange, persistPhotos]
  );

  const liveUpdateRehearsalPhoto = useCallback((photo: RehearsalPhoto) => {
    setRehearsalPhotos((prev) => {
      const exists = prev.some((p) => p.id === photo.id);
      if (exists) {
        return prev.map((p) => (p.id === photo.id ? photo : p));
      }
      return [photo, ...prev];
    });
  }, []);

  const rollbackRehearsalPhotos = useCallback((snapshot: RehearsalPhoto[]) => {
    setRehearsalPhotos(snapshot);
  }, []);

  // Tracks CRUD operations
  const saveMusicalTrack = useCallback(
    (track: MusicalTrack) => {
      logChange(`儲存曲目：${track.titleZh} (${track.titleEn})`, 'track', {
        tracks: structuredClone(tracksRef.current),
      });

      const updatedTracks = (() => {
        const exists = tracksRef.current.some((t) => t.id === track.id);
        if (exists) {
          return tracksRef.current.map((t) => (t.id === track.id ? track : t));
        }
        return [track, ...tracksRef.current];
      })();

      setTracks(updatedTracks);
      persistTracks(updatedTracks, `更新曲目 ${track.titleZh}`);
    },
    [logChange, persistTracks]
  );

  const deleteMusicalTrack = useCallback(
    (id: string) => {
      const target = tracksRef.current.find((t) => t.id === id);
      const title = target ? target.titleZh : id;
      logChange(`刪除曲目：${title}`, 'track', {
        tracks: structuredClone(tracksRef.current),
      });

      const updatedTracks = tracksRef.current.filter((t) => t.id !== id);
      setTracks(updatedTracks);
      persistTracks(updatedTracks, `刪除曲目 ${title}`);
    },
    [logChange, persistTracks]
  );

  const liveUpdateMusicalTrack = useCallback((updatedTrack: MusicalTrack) => {
    setTracks((prev) => {
      const exists = prev.some((t) => t.id === updatedTrack.id);
      if (exists) {
        return prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t));
      }
      return [...prev, updatedTrack];
    });
  }, []);

  const rollbackMusicalTracks = useCallback((snapshot: MusicalTrack[]) => {
    setTracks(snapshot);
  }, []);

  // Import / Export Bulk actions
  const importData = useCallback(
    (
      newCast: CastMember[],
      newPhotos: RehearsalPhoto[],
      newTracks?: MusicalTrack[],
      newConfig?: ShowGeneralConfig
    ) => {
      logChange('匯入外部備份資料檔', 'bulk', {
        cast: structuredClone(castMembersRef.current),
        photos: structuredClone(rehearsalPhotosRef.current),
        tracks: structuredClone(tracksRef.current),
        generalConfig: structuredClone(generalConfigRef.current),
      });

      setCastMembers(newCast);
      setRehearsalPhotos(newPhotos);
      if (newTracks && newTracks.length > 0) {
        setTracks(newTracks);
      }
      if (newConfig) {
        setGeneralConfig(newConfig);
      }

      lastLocalSaveTimeRef.current = Date.now();
      runNonBlocking(() => {
        try {
          localStorage.setItem(LOCAL_STORAGE_CAST_KEY, JSON.stringify(newCast));
          localStorage.setItem(LOCAL_STORAGE_PHOTOS_KEY, JSON.stringify(newPhotos));
          if (newTracks && newTracks.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_TRACKS_KEY, JSON.stringify(newTracks));
          }
          if (newConfig) {
            localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
          }
        } catch (e) {
          console.warn('LocalStorage save failed on import:', e);
        }
      });

      setIsCloudSaving(true);
      saveShowDataToCloud(
        {
          cast: newCast,
          photos: newPhotos,
          ...(newTracks && newTracks.length > 0 ? { tracks: newTracks } : {}),
          ...(newConfig ? { generalConfig: newConfig } : {}),
        },
        '匯入外部備份'
      )
        .then((res) => {
          setLastCloudUpdate(res.updatedAt);
          setIsCloudSynced(true);
        })
        .catch((e) => console.error('Cloud save failed on import:', e))
        .finally(() => setIsCloudSaving(false));
    },
    [logChange]
  );

  const resetAllData = useCallback(() => {
    if (confirm('確定要還原為初始預設樣板資料嗎？您自訂的成員、照片、曲目與全站文案將被重設，並同步至雲端。')) {
      logChange('重置全站資料為初始範例', 'bulk', {
        cast: structuredClone(castMembersRef.current),
        photos: structuredClone(rehearsalPhotosRef.current),
        tracks: structuredClone(tracksRef.current),
        generalConfig: structuredClone(generalConfigRef.current),
      });

      setCastMembers(INITIAL_CAST);
      setRehearsalPhotos(INITIAL_PHOTOS);
      setTracks(INITIAL_TRACKS);
      setGeneralConfig(DEFAULT_SHOW_GENERAL_CONFIG);
      setIsEditMode(false);

      lastLocalSaveTimeRef.current = Date.now();
      runNonBlocking(() => {
        try {
          localStorage.removeItem(LOCAL_STORAGE_CAST_KEY);
          localStorage.removeItem(LOCAL_STORAGE_PHOTOS_KEY);
          localStorage.removeItem(LOCAL_STORAGE_TRACKS_KEY);
          localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
        } catch {}
      });

      setIsCloudSaving(true);
      saveShowDataToCloud(
        {
          cast: INITIAL_CAST,
          photos: INITIAL_PHOTOS,
          tracks: INITIAL_TRACKS,
          generalConfig: DEFAULT_SHOW_GENERAL_CONFIG,
        },
        '全站重置'
      )
        .then((res) => {
          setLastCloudUpdate(res.updatedAt);
          setIsCloudSynced(true);
        })
        .catch((e) => console.error('Cloud save failed:', e))
        .finally(() => setIsCloudSaving(false));
    }
  }, [logChange]);

  const saveSpreadsheetCast = useCallback(
    (newCast: CastMember[]) => {
      logChange(`透過試算表更新演職名冊（共 ${newCast.length} 人）`, 'bulk', {
        cast: structuredClone(castMembersRef.current),
      });
      setCastMembers(newCast);
      persistCast(newCast, `試算表更新 (${newCast.length}人)`);
    },
    [logChange, persistCast]
  );

  const resetSpreadsheetCast = useCallback(() => {
    logChange('一鍵還原演職名冊為官方示範資料', 'bulk', {
      cast: structuredClone(castMembersRef.current),
    });
    setCastMembers(INITIAL_CAST);
    persistCast(INITIAL_CAST, '試算表重置');
  }, [logChange, persistCast]);

  const retryPendingSync = useCallback(() => {
    setIsCloudSaving(true);
    saveShowDataToCloud(
      {
        cast: castMembersRef.current,
        photos: rehearsalPhotosRef.current,
        tracks: tracksRef.current,
        generalConfig: generalConfigRef.current,
      },
      '手動重試雲端同步'
    )
      .then((res) => {
        setLastCloudUpdate(res.updatedAt);
        setIsCloudSynced(true);
      })
      .catch((e) => {
        console.error('Manual retry failed:', e);
        setIsCloudSynced(false);
      })
      .finally(() => {
        setIsCloudSaving(false);
      });
  }, []);

  // Memoized Granular Core Data Value
  const coreDataValue = useMemo<ShowCoreData>(
    () => ({
      castMembers,
      rehearsalPhotos,
      tracks,
      generalConfig,
      isEditMode,
    }),
    [castMembers, rehearsalPhotos, tracks, generalConfig, isEditMode]
  );

  // Memoized Granular Cloud Status Value
  const cloudStatusValue = useMemo<ShowCloudStatus>(
    () => ({
      isCloudSynced,
      isCloudSaving,
      isOnline,
      lastCloudUpdate,
      recentChanges,
    }),
    [isCloudSynced, isCloudSaving, isOnline, lastCloudUpdate, recentChanges]
  );

  // Memoized Combined State Value
  const stateValue = useMemo<ShowDataState>(
    () => ({
      ...coreDataValue,
      ...cloudStatusValue,
    }),
    [coreDataValue, cloudStatusValue]
  );

  // Memoized Actions Value
  const actionsValue = useMemo<ShowDataActions>(
    () => ({
      setIsEditMode,
      toggleEditMode,
      retryPendingSync,
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
      saveGeneralConfig,
      updateGeneralConfig: saveGeneralConfig,
      resetGeneralConfig,
      importData,
      resetAllData,
      undoChange,
      logChange,
      saveSpreadsheetCast,
      resetSpreadsheetCast,
    }),
    [
      toggleEditMode,
      retryPendingSync,
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
      saveGeneralConfig,
      resetGeneralConfig,
      importData,
      resetAllData,
      undoChange,
      logChange,
      saveSpreadsheetCast,
      resetSpreadsheetCast,
    ]
  );

  return (
    <ShowCoreDataContext.Provider value={coreDataValue}>
      <ShowCloudStatusContext.Provider value={cloudStatusValue}>
        <ShowDataStateContext.Provider value={stateValue}>
          <ShowDataActionsContext.Provider value={actionsValue}>
            {children}
          </ShowDataActionsContext.Provider>
        </ShowDataStateContext.Provider>
      </ShowCloudStatusContext.Provider>
    </ShowCoreDataContext.Provider>
  );
};

export const useShowCoreData = (): ShowCoreData => {
  const context = useContext(ShowCoreDataContext);
  if (!context) {
    throw new Error('useShowCoreData must be used within a ShowDataProvider');
  }
  return context;
};

export const useShowGeneralConfig = (): ShowGeneralConfig => {
  const context = useContext(ShowCoreDataContext);
  if (!context) {
    throw new Error('useShowGeneralConfig must be used within a ShowDataProvider');
  }
  return context.generalConfig;
};

export const useShowCloudStatus = (): ShowCloudStatus => {
  const context = useContext(ShowCloudStatusContext);
  if (!context) {
    throw new Error('useShowCloudStatus must be used within a ShowDataProvider');
  }
  return context;
};

export const useShowData = (): ShowDataState => {
  const context = useContext(ShowDataStateContext);
  if (!context) {
    throw new Error('useShowData must be used within a ShowDataProvider');
  }
  return context;
};

export const useShowDataActions = (): ShowDataActions => {
  const context = useContext(ShowDataActionsContext);
  if (!context) {
    throw new Error('useShowDataActions must be used within a ShowDataProvider');
  }
  return context;
};
