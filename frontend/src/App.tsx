import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatDrawer from './components/ChatDrawer';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import CreateTripPage from './pages/CreateTripPage';
import TripsListPage from './pages/TripsListPage';
import ItineraryViewPage from './pages/ItineraryViewPage';
import ChatPage from './pages/ChatPage';
import SavedPage from './pages/SavedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/components.css';

const AppLayout: React.FC = () => {
  const location = useLocation();
  // Homepage embeds top navigation directly into the photographic hero frame per DESIGN.md
  const isHome = location.pathname === '/';
  const isItineraryView = location.pathname.startsWith('/itineraries/');
  const isDedicatedChat = location.pathname === '/chat';

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes - No login required */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/plan-trip" element={<CreateTripPage />} />
        <Route path="/create" element={<CreateTripPage />} />
        <Route path="/trips/create" element={<CreateTripPage />} />
        <Route path="/itineraries/:itineraryId" element={<ItineraryViewPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Account Routes - Redirect unauthenticated visitors to /login */}
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <TripsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favourites"
          element={
            <ProtectedRoute>
              <SavedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      {/* Global Floating AI Chat Drawer (rendered on all pages except dedicated /chat and ItineraryViewPage) */}
      {!isItineraryView && !isDedicatedChat && <ChatDrawer />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
