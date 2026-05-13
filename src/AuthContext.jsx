import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { DEMO_MODE, MOCK_USER, MOCK_USER_DATA } from './mockData';

const AuthContext = createContext(null);

const USER_COLORS = ['#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? MOCK_USER : null);
  const [userData, setUserData] = useState(DEMO_MODE ? MOCK_USER_DATA : null);
  const [loading, setLoading] = useState(!DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUserData(snap.data());
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
  }, []);

  async function signup(email, password, name) {
    if (DEMO_MODE) return;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const data = { displayName: name, email, uid: cred.user.uid, color, weeklyGoalMinutes: 150 };
    await setDoc(doc(db, 'users', cred.user.uid), data);
    setUserData(data);
  }

  const login = (email, password) =>
    DEMO_MODE ? Promise.resolve() : signInWithEmailAndPassword(auth, email, password);

  const logout = () =>
    DEMO_MODE ? Promise.resolve() : signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, setUserData, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
