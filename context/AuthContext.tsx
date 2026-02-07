import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../services/firebase"; // Il va chercher le fichier que tu as créé juste avant
import { onAuthStateChanged, User } from "firebase/auth";

// Création du contexte
const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

// Le composant qui entoure l'application
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifie si l'utilisateur est connecté via Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Le petit crochet pour utiliser le contexte partout
export const useAuth = () => {
  return useContext(AuthContext);
};
