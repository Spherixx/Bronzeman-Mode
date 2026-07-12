import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCCJJcebfEGU-30NVNRQdPRWQK-VxmOO-E",
  authDomain: "bronzeman-mode-92e21.firebaseapp.com",
  projectId: "bronzeman-mode-92e21",
  storageBucket: "bronzeman-mode-92e21.firebasestorage.app",
  messagingSenderId: "648123215246",
  appId: "1:648123215246:web:82190b7dd128fe8c4b88df"
};

const TRACKER_COLLECTION = "trackers";
const TRACKER_DOCUMENT_ID = "bronzeman-default";

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function trackerDoc() {
  return doc(db, TRACKER_COLLECTION, TRACKER_DOCUMENT_ID);
}

export async function saveTrackerState(state) {
  await setDoc(trackerDoc(), {
    ...state,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadTrackerState() {
  const snapshot = await getDoc(trackerDoc());
  return snapshot.exists() ? snapshot.data() : null;
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutCurrentUser() {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
