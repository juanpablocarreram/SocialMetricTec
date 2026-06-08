/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Directory from './pages/Directory';
import Editor from './pages/Editor';
import Login from './pages/Login';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import AdminPanel from './pages/AdminPanel';
import TestimonyForm from './pages/TestimonyForm';
import Profile from './pages/Profile';
import ProjectReport from './pages/ProjectReport';
import {AuthProvider, useAuth} from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { loading } = useAuth();

  useEffect(() => {
    document.getElementById('main-content')?.focus();
  }, [location.pathname]);

  // Si todavía estamos preguntando a FastAPI quién es el usuario,
  // no mostramos nada de la app todavía.
  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex h-screen items-center justify-center">
        <div className="loader">Cargando SocialTec...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:text-sm"
      >
        Saltar al contenido principal
      </a>
      {!isLoginPage && <Navbar />}
      <main id="main-content" tabIndex={-1} className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/project/:projectId/testimonies" element={<TestimonyForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/project/:projectId/report" element={<ProjectReport />} />
        </Routes>
      </main>
      {!isLoginPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}
