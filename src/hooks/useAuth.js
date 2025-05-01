// src/hooks/useAuth.js
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]             = useState(null);         // <-- nuevo
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const authInstance = getAuth();

    let unsubscribeSnapshot = () => {};
    const unsubscribeAuth = onAuthStateChanged(authInstance, (fbUser) => {
      // limpia listener anterior
      unsubscribeSnapshot();

      if (!fbUser) {
        setUser(null);                  // <-- reseteamos user
        setIsAuthenticated(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // guardamos user
      setUser(fbUser);                  // <-- aquí cargamos el user
      setIsAuthenticated(true);

      // escuchamos el documento para el role
      const userRef = doc(db, "users", fbUser.uid);
      unsubscribeSnapshot = onSnapshot(
        userRef,
        (snap) => {
          setUserRole(snap.exists() ? snap.data().role : null);
          setLoading(false);
        },
        (err) => {
          console.error("Error leyendo rol de Firestore:", err);
          setUserRole(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    // lee rol inmediatamente
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    const rol = snap.exists() ? snap.data().role : null;

    setUser(fbUser);                  // <-- actualiza user tras login
    setIsAuthenticated(true);
    setUserRole(rol);
    setLoading(false);
    return rol;
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);                    // <-- limpia user al logout
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,                         // <-- exponemos user
        isAuthenticated,
        userRole,
        loading,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook para consumir el contexto
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
