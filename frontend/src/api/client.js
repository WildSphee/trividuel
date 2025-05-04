import axios from "axios";
import { auth } from "@/firebase";

// Helper that ALWAYS resolves with a (possibly refreshed) token string
async function getIdToken(force = false) {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(force);
}

const client = axios.create({
    baseURL: "http://localhost:5678",
    timeout: 5000,
});

// add ?token=ID_TOKEN
client.interceptors.request.use(async (config) => {
    const token = await getIdToken();
    if (token) {
        // don’t clobber existing params
        config.params = { ...(config.params || {}), token };
    }
    return config;
});

// refresh token on 401 once
client.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (
            error.response?.status === 401 &&
            !error.config.__isRetry) {
            error.config.__isRetry = true;
            await getIdToken(true);
            // repeat original call
            return client(error.config);
        }
        return Promise.reject(error);
    }
);

export default client;
