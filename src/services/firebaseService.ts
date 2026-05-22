/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const isDummy = firebaseConfig.apiKey === 'dummy-api-key' || firebaseConfig.projectId === 'dummy-project-id';

let db: any = null;
let auth: any = null;

if (!isDummy) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  isConfigured: (): boolean => {
    return !isDummy && db !== null;
  },

  testConnection: async (): Promise<boolean> => {
    if (!firebaseService.isConfigured()) return false;
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
      return false;
    }
  },

  // Retrieve global settings document from Firestore
  getGlobalSettings: async (): Promise<any | null> => {
    if (!firebaseService.isConfigured()) return null;
    const path = 'settings/global';
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Save global settings document to Firestore
  saveGlobalSettings: async (settings: any): Promise<void> => {
    if (!firebaseService.isConfigured()) return;
    const path = 'settings/global';
    try {
      const docRef = doc(db, 'settings', 'global');
      await setDoc(docRef, settings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
