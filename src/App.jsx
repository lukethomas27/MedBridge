// HealthForge — Main App Shell (Supabase-backed)

import { useState, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { fetchFirstDoctor, fetchPatientsForDoctor, fetchPatient } from './lib/queries';
import LandingPage from './components/LandingPage';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDetailView from './components/PatientDetailView';
import PatientDashboard from './components/PatientDashboard';
import RoleSwitcherDock from './components/RoleSwitcherDock';
import InvitePage from './components/InvitePage';
import SettingsPage from './components/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';

const STYLES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F4EF' }}>
      <div className="text-center">
        <div
          className="w-8 h-8 border-3 border-gray-200 rounded-full mx-auto mb-4"
          style={{ borderTopColor: '#00C9A7', animation: 'spin 0.8s linear infinite' }}
        />
        <p className="text-gray-500" style={{ fontFamily: 'system-ui, sans-serif' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

  const navigate = useCallback((newPage, options = {}) => {
    if (options.patientId !== undefined) setSelectedPatientId(options.patientId);
    setPage(newPage);
  }, []);

  const handleRoleSelect = useCallback(async (role) => {
    setLoading(true);
    try {
      if (role === 'doctor') {
        const doctor = await fetchFirstDoctor();
        setCurrentUser(doctor);
        const pts = await fetchPatientsForDoctor(doctor.id);
        setPatients(pts);
        navigate('doctor-dashboard');
      } else {
        // Demo: log in as first patient of first doctor
        const doctor = await fetchFirstDoctor();
        const pts = await fetchPatientsForDoctor(doctor.id);
        setPatients(pts);
        const firstPatient = pts[0];
        setCurrentUser({ ...firstPatient, role: 'patient' });
        navigate('patient-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleSwitchRole = useCallback(async (role) => {
    setSwitchLoading(true);
    try {
      // Reuse already-loaded patients so locally-generated insights survive role switches.
      // Only fetch if we somehow have no data yet.
      let doctor = currentUser?.role === 'doctor' ? currentUser : null;
      let pts = patients;

      if (pts.length === 0) {
        doctor = await fetchFirstDoctor();
        pts = await fetchPatientsForDoctor(doctor.id);
        setPatients(pts);
      } else if (!doctor) {
        doctor = await fetchFirstDoctor();
      }

      setSelectedPatientId(null);

      if (role === 'doctor') {
        setCurrentUser(doctor);
        navigate('doctor-dashboard');
      } else {
        setCurrentUser({ ...pts[0], role: 'patient' });
        navigate('patient-dashboard');
      }
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setSwitchLoading(false);
    }
  }, [navigate, currentUser, patients]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setSelectedPatientId(null);
    setPatients([]);
    navigate('landing');
  }, [navigate]);

  const handleUpdatePatient = useCallback((updatedPatient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    // Also update currentUser if they are viewing as this patient
    setCurrentUser(prev => {
      if (prev && prev.role === 'patient' && prev.id === updatedPatient.id) {
        return { ...updatedPatient, role: 'patient' };
      }
      return prev;
    });
  }, []);

  // Refresh patient data when navigating to detail view
  const handleSelectPatient = useCallback(async (id) => {
    setLoading(true);
    try {
      const fresh = await fetchPatient(id);
      setPatients(prev => prev.map(p => p.id === id ? fresh : p));
      navigate('doctor-patient-detail', { patientId: id });
    } catch (err) {
      console.error('Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Guard: doctor can only see their patients
  const doctorPatients = currentUser?.role === 'doctor'
    ? patients.filter(p => p.doctorId === currentUser.id)
    : [];

  // Guard: patient can only see their own data
  const currentPatientData = currentUser?.role === 'patient'
    ? patients.find(p => p.id === currentUser.id)
    : null;

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // If selected patient invalid, redirect
  if (page === 'doctor-patient-detail' && !selectedPatient && !loading) {
    if (currentUser?.role === 'doctor') {
      setPage('doctor-dashboard');
    }
  }

  const showDock = page !== 'landing' && currentUser !== null;

  const renderPage = () => {
    if (loading) return <LoadingScreen />;

    switch (page) {
      case 'doctor-dashboard':
        return (
          <DoctorDashboard
            doctor={currentUser}
            patients={doctorPatients}
            onSelectPatient={handleSelectPatient}
            onLogout={handleLogout}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'doctor-patient-detail':
        return selectedPatient ? (
          <PatientDetailView
            patient={selectedPatient}
            onBack={() => navigate('doctor-dashboard')}
            onUpdatePatient={handleUpdatePatient}
            onLogout={handleLogout}
          />
        ) : null;
      case 'patient-dashboard':
        return currentPatientData ? (
          <PatientDashboard
            patient={currentPatientData}
            onLogout={handleLogout}
            onOpenSettings={() => navigate('settings')}
          />
        ) : null;
      case 'settings':
        return (
          <SettingsPage
            currentUser={currentUser}
            onBack={() => {
              if (currentUser?.role === 'doctor') navigate('doctor-dashboard');
              else navigate('patient-dashboard');
            }}
          />
        );
      default:
        return <LandingPage onNavigate={handleRoleSelect} />;
    }
  };

  return (
    <SettingsProvider>
      <style>{STYLES}</style>
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
        <Route
          path="*"
          element={
            <>
              <div key={page} style={{ animation: 'fadeIn 150ms ease' }}>
                {renderPage()}
              </div>
              {showDock && (
                <RoleSwitcherDock
                  currentUser={currentUser}
                  onSwitchRole={handleSwitchRole}
                  loading={switchLoading}
                />
              )}
            </>
          }
        />
      </Routes>
    </SettingsProvider>
  );
}
