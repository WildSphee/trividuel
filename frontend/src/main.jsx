import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./styles/index.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { AudioProvider } from '@/audio/AudioProvider';
import SoundControlButton from '@/components/SoundControlButton';


const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AudioProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster position="bottom-center" />
        </QueryClientProvider>
      </AudioProvider>
    </AuthProvider>
  </React.StrictMode>
);
