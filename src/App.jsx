import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Login from './components/Login';
import Feed from './components/Feed';
import AddEntry from './components/AddEntry';
import Progress from './components/Progress';
import Profile from './components/Profile';
import Navbar from './components/Navbar';

function Private({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/"         element={<Private><Feed /></Private>} />
        <Route path="/add"      element={<Private><AddEntry /></Private>} />
        <Route path="/progress" element={<Private><Progress /></Private>} />
        <Route path="/profile"  element={<Private><Profile /></Private>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      {user && <Navbar />}
    </>
  );
}
