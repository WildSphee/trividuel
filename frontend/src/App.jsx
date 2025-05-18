import { Routes, Route } from "react-router-dom";
import Loader from "./components/Loader";
import { Suspense, lazy } from "react";

import Login from "./pages/Login";
import Game from "./pages/Game";
import GameRoom from "./pages/GameRoom";
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game" element={<Game />} />
        <Route path="/room/:sessionId" element={<GameRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}