import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import GlobalCall from './components/Chat/GlobalCall';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import Register from './pages/Register/Register';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import Messaging from './pages/Messaging/Messaging';
import Friends from './pages/Friends/Friends';
import Search from './pages/Search/Search';
import Settings from './pages/Settings/Settings';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RandomChat from './pages/Chat/RandomChat';
import PaymentResult from './pages/Payment/PaymentResult';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MentalLetterModal from './components/Common/MentalLetterModal';
import { useState, useEffect } from 'react';

import Maintenance from './pages/Maintenance/Maintenance';
import adminService from './services/adminService';

const PrivateRoute = ({ children, isMaintenance }) => {
  const { user, isAdmin } = useAuth();
  if (isMaintenance && !isAdmin) return <Navigate to="/maintenance" />;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return isAdmin ? children : <Navigate to="/" />;
};

function App() {
  const [showMentalLetter, setShowMentalLetter] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await adminService.getMaintenanceStatus();
        setIsMaintenance(response.isMaintenance); // Lấy boolean thay vì object
      } catch (error) {
        // If 503, it means maintenance is active
        if (error.response?.status === 503) {
          setIsMaintenance(true);
        }
      }
    };
    checkMaintenance();

    const hasSeenLetter = localStorage.getItem('hasSeenMentalLetterV1');
    if (!hasSeenLetter) {
      setShowMentalLetter(true);
    }
  }, []);

  const handleCloseLetter = () => {
    localStorage.setItem('hasSeenMentalLetterV1', 'true');
    setShowMentalLetter(false);
  };

  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <GlobalCall />
          <Routes>
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<PrivateRoute isMaintenance={isMaintenance}><Home /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute isMaintenance={isMaintenance}><Profile /></PrivateRoute>} />
            <Route path="/profile/:userId" element={<PrivateRoute isMaintenance={isMaintenance}><Profile /></PrivateRoute>} />
            <Route path="/messaging" element={<PrivateRoute isMaintenance={isMaintenance}><Messaging /></PrivateRoute>} />
            <Route path="/friends" element={<PrivateRoute isMaintenance={isMaintenance}><Friends /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute isMaintenance={isMaintenance}><Search /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute isMaintenance={isMaintenance}><Settings /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/chat-random" element={<PrivateRoute isMaintenance={isMaintenance}><RandomChat /></PrivateRoute>} />
            <Route path="/payment-result" element={<PaymentResult />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme="colored"
          />
          <MentalLetterModal 
            isOpen={showMentalLetter} 
            onClose={handleCloseLetter} 
          />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}
export default App;