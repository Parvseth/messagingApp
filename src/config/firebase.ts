import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBYq8oehUE0D4-xCvWsPi1bACxhIXI5DSs",
  authDomain: "msging-f95d0.firebaseapp.com",
  projectId: "msging-f95d0",
  storageBucket: "msging-f95d0.firebasestorage.app",
  messagingSenderId: "361386435752",
  appId: "1:361386435752:web:148ef8b055b124810c8e9d",
  measurementId: "G-05B7RCHKYR"
};

// Prevent Firebase from initializing multiple times and crashing
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const firestore = db;
export const storage = getStorage(app);

// Use native phone storage, not web cookies
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;