import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import TeamCreate from './pages/teams/TeamCreate';
import TeamList from './pages/teams/TeamList';
import TeamDetail from './pages/teams/TeamDetail';
import ProjectCreate from './pages/projects/ProjectCreate';
import ProjectDetail from './pages/projects/ProjectDetail';
import EvaluationCreate from './pages/evaluations/EvaluationCreate';
import EvaluationDetail from './pages/evaluations/EvaluationDetail';
import EvaluationList from './pages/evaluations/EvaluationList';
import ExcelEvaluationCreate from './pages/evaluations/ExcelEvaluationCreate';
import ExcelEvaluationView from './pages/evaluations/ExcelEvaluationView';
import MultiProjectEvaluations from './pages/evaluations/MultiProjectEvaluations';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />

              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />

              <Route path="/teams" element={
                <PrivateRoute>
                  <TeamList />
                </PrivateRoute>
              } />

              <Route path="/teams/create" element={
                <PrivateRoute roles={['student']}>
                  <TeamCreate />
                </PrivateRoute>
              } />

              <Route path="/teams/:id" element={
                <PrivateRoute>
                  <TeamDetail />
                </PrivateRoute>
              } />

              <Route path="/projects/create" element={
                <PrivateRoute roles={['student']}>
                  <ProjectCreate />
                </PrivateRoute>
              } />

              <Route path="/projects/:id" element={
                <PrivateRoute>
                  <ProjectDetail />
                </PrivateRoute>
              } />

              <Route path="/evaluations" element={
                <PrivateRoute roles={['faculty', 'reviewer']}>
                  <EvaluationList />
                </PrivateRoute>
              } />

              <Route path="/evaluations/create" element={
                <PrivateRoute roles={['faculty']}>
                  <EvaluationCreate />
                </PrivateRoute>
              } />

              <Route path="/evaluations/:id" element={
                <PrivateRoute>
                  <EvaluationDetail />
                </PrivateRoute>
              } />

              <Route path="/evaluations/excel-create" element={
                <PrivateRoute roles={['faculty']}>
                  <ExcelEvaluationCreate />
                </PrivateRoute>
              } />

              <Route path="/evaluations/excel/:id" element={
                <PrivateRoute roles={['faculty', 'reviewer']}>
                  <ExcelEvaluationView />
                </PrivateRoute>
              } />

              <Route path="/evaluations/excel-projects" element={
                <PrivateRoute roles={['faculty', 'reviewer']}>
                  <MultiProjectEvaluations />
                </PrivateRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {/* <Footer /> */}
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;