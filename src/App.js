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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MentalLetterModal from './components/Common/MentalLetterModal';
import { useState, useEffect } from 'react';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [showMentalLetter, setShowMentalLetter] = useState(false);

  useEffect(() => {
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/messaging" element={<PrivateRoute><Messaging /></PrivateRoute>} />
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
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