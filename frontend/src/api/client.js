import axios from "axios";
import { auth } from "@/firebase";

/* ── 1.  wait until Firebase knows whether a user is signed in ────────── */
let authReady; // cached promise

function waitForAuth() {
  if (authReady) return authReady;

  authReady = new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged(() => {
      unsub(); // 1-shot listener
      resolve();
    });
  });
  return authReady;
}

/* ── 2.  helper that always resolves to a token *or* null ─────────────── */
async function getIdTokenSafe(force = false) {
  await waitForAuth();
  const user = auth.currentUser;
  return user ? user.getIdToken(force) : null;
}

/* ── 3.  axios instance with the two interceptors you already had ─────── */
const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_IP,
  timeout: 5000,
});

/* attach ?token=… */
client.interceptors.request.use(async (config) => {
  const token = await getIdTokenSafe();
  if (token) {
    config.params = { ...(config.params || {}), token };
  }
  return config;
});

/* refresh once on 401, then retry */
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config.__isRetry) {
      error.config.__isRetry = true;
      await getIdTokenSafe(true); // force refresh
      return client(error.config); // replay request
    }
    return Promise.reject(error);
  }
);

export default client;
