import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

const Ctx = createContext(null);
export function useAuth() {
  return useContext(Ctx);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // keep user & token in sync
  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (u) => {
      setUser(u);
      setToken(u ? await u.getIdToken() : null);
    });
    return unsub;
  }, []);

  const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
  const loginGithub = () => signInWithPopup(auth, new GithubAuthProvider());
  const logout = () => auth.signOut();

  return (
    <Ctx.Provider value={{ user, token, loginGoogle, loginGithub, logout }}>
      {children}
    </Ctx.Provider>
  );
}
