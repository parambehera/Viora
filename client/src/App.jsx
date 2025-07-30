import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Room from "./pages/Room";
import NotFound from "./pages/NotFound";

import { SocketProvider } from "./providers/Sockets";
import { PeerProvider } from "./providers/peer";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound/>} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <PeerProvider>
                <SocketProvider>
                  <Home />
                </SocketProvider>
              </PeerProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <PrivateRoute>
            <PeerProvider>
              <SocketProvider>
                <Room />
              </SocketProvider>
            </PeerProvider>
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
