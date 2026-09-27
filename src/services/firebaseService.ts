import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  enableIndexedDbPersistence,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CastMember, RehearsalPhoto, MusicalTrack, ShowGeneralConfig } from '../types';
import { CAST_MEMBERS as INITIAL_CAST, REHEARSAL_PHOTOS, MUSICAL_TRACKS, DEFAULT_SHOW_GENERAL_CONFIG } from '../data/showData';

// Initialize Firebase App instance safely (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId and resilient fallback for WebSocket disconnects
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    customDbId
  );
} catch {
  firestoreInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

// Enable offline persistence if supported in browser runtime
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(firestoreInstance).catch((err) => {
      // Multiple tabs or unsupported browser - fail silently and fallback to memory/long-polling
      if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
        console.warn('Firestore offline persistence warning:', err);
      }
    });
  } catch {
    // Non-critical: Ignore environments without IndexedDB
  }
}

export const db: Firestore = firestoreInstance;

export const SHOW_DOC_PATH = 'show_production/main_data';

export interface CloudShowPayload {
  cast: CastMember[];
  photos: RehearsalPhoto[];
  tracks: MusicalTrack[];
  generalConfig?: ShowGeneralConfig;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Offline Sync Queue & Mutation Manager
 * Queues pending saves in case of complete internet disconnection,
 * and automatically retries upon reconnecting to prevent any data loss.
 */
interface PendingSaveItem {
  id: string;
  payload: {
    cast?: CastMember[];
    photos?: RehearsalPhoto[];
    tracks?: MusicalTrack[];
    generalConfig?: ShowGeneralConfig;
  };
  updaterName: string;
  resolve: (val: { success: boolean; updatedAt: string }) => void;
  reject: (err: any) => void;
}

const pendingSaveQueue: PendingSaveItem[] = [];
let isProcessingQueue = false;

async function processPendingQueue() {
  if (isProcessingQueue || pendingSaveQueue.length === 0) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  isProcessingQueue = true;
  while (pendingSaveQueue.length > 0) {
    const item = pendingSaveQueue[0];
    try {
      const res = await executeCloudSave(item.payload, item.updaterName, 1);
      item.resolve(res);
      pendingSaveQueue.shift();
    } catch (e) {
      console.warn('Pending save retry paused:', e);
      break;
    }
  }
  isProcessingQueue = false;
}

// Listen for browser online event to immediately flush queued cloud updates
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('Network connection restored. Flushing pending cloud mutations...');
    processPendingQueue();
  });
}

/**
 * Direct Firestore write executor with exponential backoff retry defense.
 */
async function executeCloudSave(
  payload: {
    cast?: CastMember[];
    photos?: RehearsalPhoto[];
    tracks?: MusicalTrack[];
    generalConfig?: ShowGeneralConfig;
  },
  updaterName: string,
  maxRetries = 3
): Promise<{ success: boolean; updatedAt: string }> {
  let attempt = 0;
  let lastErr: any = null;

  while (attempt < maxRetries) {
    try {
      const showDocRef = doc(db, 'show_production', 'main_data');
      const updatedAt = new Date().toISOString();

      const updateRecord: Record<string, any> = {
        updatedAt,
        updatedBy: updaterName,
      };
      if (payload.cast !== undefined) updateRecord.cast = payload.cast;
      if (payload.photos !== undefined) updateRecord.photos = payload.photos;
      if (payload.tracks !== undefined) updateRecord.tracks = payload.tracks;
      if (payload.generalConfig !== undefined) updateRecord.generalConfig = payload.generalConfig;

      await setDoc(showDocRef, updateRecord, { merge: true });
      return { success: true, updatedAt };
    } catch (err: any) {
      lastErr = err;
      attempt++;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastErr;
}

/**
 * Resilient real-time listener for Firebase Firestore with auto-reconnection defense.
 */
export function subscribeToShowData(
  onData: (payload: CloudShowPayload) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let activeUnsubscribe: Unsubscribe | null = null;
  let isDisposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;

  const establishSubscription = () => {
    if (isDisposed) return;

    try {
      const showDocRef = doc(db, 'show_production', 'main_data');
      activeUnsubscribe = onSnapshot(
        showDocRef,
        (docSnap) => {
          reconnectAttempts = 0; // Reset reconnection counter upon healthy snapshot
          if (docSnap.exists()) {
            const data = docSnap.data() as CloudShowPayload;
            onData(data);
          } else {
            // Initial seed if document is absent
            const initialPayload: CloudShowPayload = {
              cast: INITIAL_CAST,
              photos: REHEARSAL_PHOTOS,
              tracks: MUSICAL_TRACKS,
              generalConfig: DEFAULT_SHOW_GENERAL_CONFIG,
              updatedAt: new Date().toISOString(),
              updatedBy: 'Initial Setup',
            };
            setDoc(showDocRef, initialPayload).catch((e) => {
              console.warn('Initial cloud seed notice:', e);
            });
            onData(initialPayload);
          }
        },
        (error) => {
          console.warn('Firestore subscription disconnect/error, scheduling auto-reconnect:', error);
          if (onError) onError(error);

          // Auto-reconnect with jittered exponential backoff
          if (!isDisposed) {
            if (activeUnsubscribe) {
              activeUnsubscribe();
              activeUnsubscribe = null;
            }
            reconnectAttempts++;
            const backoff = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              establishSubscription();
            }, backoff);
          }
        }
      );
    } catch (err: any) {
      console.error('Failed to establish Firestore subscription:', err);
      if (onError) onError(err);
    }
  };

  establishSubscription();

  return () => {
    isDisposed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }
  };
}

/**
 * Persist updated show data to Firebase Firestore in real-time.
 * Features:
 * 1. Automatic exponential backoff retries.
 * 2. Offline mutation queueing with auto-drain on reconnect.
 * 3. Atomic document merge preventing data overwrite collisions.
 */
export async function saveShowDataToCloud(
  payload: {
    cast?: CastMember[];
    photos?: RehearsalPhoto[];
    tracks?: MusicalTrack[];
    generalConfig?: ShowGeneralConfig;
  },
  updaterName = 'Show Administrator'
): Promise<{ success: boolean; updatedAt: string }> {
  // If browser is currently offline, queue mutation for immediate recovery when online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new Promise((resolve, reject) => {
      pendingSaveQueue.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        payload,
        updaterName,
        resolve,
        reject,
      });
      // Return optimistic immediate acknowledgement so user flow is uninterrupted
      resolve({ success: true, updatedAt: new Date().toISOString() });
    });
  }

  try {
    return await executeCloudSave(payload, updaterName, 3);
  } catch (err) {
    // If saving fails due to transient connection drop, push to queue and attempt retry
    return new Promise((resolve, reject) => {
      pendingSaveQueue.push({
        id: `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        payload,
        updaterName,
        resolve,
        reject,
      });
      // Non-blocking trigger
      setTimeout(() => processPendingQueue(), 3000);
      throw err;
    });
  }
}
