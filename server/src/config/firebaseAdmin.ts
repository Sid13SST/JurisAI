import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load variables
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'jurisai-13ad0';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const storageBucket = `${projectId}.firebasestorage.app`;

if (clientEmail && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket
  });
  console.log('Firebase Admin SDK initialized using service account credential variables.');
} else {
  // Attempt default credentials fallback
  admin.initializeApp({
    projectId,
    storageBucket
  });
  console.log('Firebase Admin SDK initialized using default application configurations.');
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export const auth = admin.auth();
export default admin;
