import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';

/**
 * Manages authentication state.
 * userProfiles documents are stored with the Firebase UID as the document ID,
 * which allows Firestore Security Rules to do efficient single-document lookups.
 *
 * Returns: currentUser, currentUserProfile, isLoading, login, logout
 */
export const useAuth = () => {
  const [currentUser,        setCurrentUser]        = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isLoading,          setIsLoading]          = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'userProfiles', user.uid));
          if (snap.exists()) {
            setCurrentUserProfile({ id: snap.id, ...snap.data() });
          } else {
            // Profile not found — grant minimal access so the user can at least log in
            setCurrentUserProfile({ email: user.email, role: 'user' });
          }
        } catch {
          setCurrentUserProfile({ email: user.email, role: 'user' });
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login  = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return { currentUser, currentUserProfile, isLoading, login, logout };
};
