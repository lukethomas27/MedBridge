// HealthForge — Main App Shell
// Components will be built by parallel agents and imported here.
// This file will be finalized in the integration pass.

import { useState, useCallback } from 'react';
import { SEED_DATA } from './data/seedData';
import LandingPage from './components/LandingPage';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDetailView from './components/PatientDetailView';
import PatientDashboard from './components/PatientDashboard';

const STYLES = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export default function App() {
  const [page, setPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patients, setPatients] = useState(SEED_DATA.patients);

  const navigate = useCallback((newPage, options = {}) => {
    if (options.patientId !== undefined) setSelectedPatientId(options.patientId);
    setPage(newPage);
  }, []);

  const handleRoleSelect = useCallback((role) => {
    if (role === 'doctor') {
      setCurrentUser(SEED_DATA.doctor);
      navigate('doctor-dashboard');
    } else {
      setCurrentUser(SEED_DATA.patients[0]);
      navigate('patient-dashboard');
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setSelectedPatientId(null);
    navigate('landing');
  }, [navigate]);

  const handleUpdatePatient = useCallback((updatedPatient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  }, []);

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
  if (page === 'doctor-patient-detail' && !selectedPatient) {
    if (currentUser?.role === 'doctor') {
      setPage('doctor-dashboard');
    }
  }

  const renderPage = () => {
    switch (page) {
      case 'doctor-dashboard':
        return (
          <DoctorDashboard
            doctor={currentUser}
            patients={doctorPatients}
            onSelectPatient={(id) => navigate('doctor-patient-detail', { patientId: id })}
            onLogout={handleLogout}
          />
        );
      case 'doctor-patient-detail':
        return selectedPatient ? (
          <PatientDetailView
            patient={selectedPatient}
            onBack={() => navigate('doctor-dashboard')}
            onUpdatePatient={handleUpdatePatient}
          />
        ) : null;
      case 'patient-dashboard':
        return currentPatientData ? (
          <PatientDashboard
            patient={currentPatientData}
            onLogout={handleLogout}
          />
        ) : null;
      default:
        return <LandingPage onNavigate={handleRoleSelect} />;
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div key={page} style={{ animation: 'fadeIn 150ms ease' }}>
        {renderPage()}
      </div>
    </>
  );
}
