import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase.js';

/**
 * Hook genérico para suscribirse a una colección de Firestore en tiempo real.
 * @param {string} collectionName - Nombre de la colección
 * @param {string|null} orderByField - Campo por el que ordenar (opcional)
 * @param {string} orderDirection - 'asc' o 'desc'
 */
export const useFirestoreCollection = (collectionName, orderByField = null, orderDirection = 'asc') => {
  const [data,      setData]      = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!collectionName) return;
    const collRef = collection(db, collectionName);
    const q = orderByField
      ? query(collRef, orderBy(orderByField, orderDirection))
      : query(collRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName, orderByField, orderDirection]);

  return { data, isLoading };
};
