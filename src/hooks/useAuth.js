import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';

/**
 * Hook que gestiona el estado de autenticación del usuario.
 * Devuelve: currentUser, currentUserProfile, isLoading, login, logout
 */
export const useAuth = () => {
  const [currentUser,        setCurrentUser]        = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isLoading,          setIsLoading]          = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(collection(db, 'userProfiles'), where('email', '==', user.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setCurrentUserProfile({ id: doc.id, ...doc.data() });
        } else {
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
