import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import BookDetails from './pages/BookDetails';
import PDFReader from './pages/PDFReader';
import AdminDashboard from './pages/AdminDashboard';
import UploadBook from './pages/UploadBook';
import Categories from './pages/Categories';
import Library from './pages/Library';
import Profile from './pages/Profile';
import AdminRoute from './components/AdminRoute';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
          <Route path="/book/:id" element={<ProtectedRoute><Layout><BookDetails /></Layout></ProtectedRoute>} />
          <Route path="/read/:id" element={<ProtectedRoute><PDFReader /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Layout><Library /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
          <Route path="/admin/upload" element={<AdminRoute><Layout><UploadBook /></Layout></AdminRoute>} />
          <Route path="/admin/edit/:id" element={<AdminRoute><Layout><UploadBook /></Layout></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
