import { useState } from 'react';
import { Search, User, ChevronRight, AlertTriangle, Users } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getLatestSession(sessions) {
  if (!sessions || sessions.length === 0) return null;
  return [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

function getConfidence(session) {
  if (!session || !session.insights) return null;
  return session.insights.confidence;
}

function confidenceBadgeClasses(score) {
  if (score === null || score === undefined) return 'border-l-gray-300 bg-gray-50 text-gray-500';
  if (score >= 70) return 'border-l-teal-400 bg-teal-50 text-teal-800';
  if (score >= 50) return 'border-l-amber-400 bg-amber-50 text-amber-800';
  return 'border-l-red-400 bg-red-50 text-red-800';
}

export default function DoctorDashboard({ doctor, patients, onSelectPatient, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F4EF', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="animate-pulse" style={{ color: '#00C9A7', fontSize: '12px' }}>●</span>
            <span
              className="font-bold text-lg"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              HealthForge
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" style={{ color: '#0B1929' }}>
              <User size={16} />
              <span className="text-sm font-medium">{doctor.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 bg-transparent border-none cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header row */}
        <div className="flex justify-between items-center mb-6">
          <h1
            className="font-bold"
            style={{ fontFamily: 'Georgia, serif', fontSize: '32px', color: '#0B1929' }}
          >
            My Patients
          </h1>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border border-gray-300 rounded-sm pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            />
          </div>
        </div>

        {/* Patient cards or empty state */}
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users size={48} className="text-gray-300 mb-4" />
            <p
              className="text-lg font-semibold text-gray-400 mb-1"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              No patients found
            </p>
            <p className="text-sm text-gray-400">Try a different search term</p>
          </div>
        ) : (
          <div>
            {filteredPatients.map((patient) => {
              const latestSession = getLatestSession(patient.sessions);
              const confidence = getConfidence(latestSession);
              const sessionCount = patient.sessions ? patient.sessions.length : 0;
              const medCount = patient.medications ? patient.medications.length : 0;

              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className="bg-white shadow-sm rounded-lg p-5 mb-3 hover:shadow-md transition-all duration-200 cursor-pointer border-l-2 border-l-transparent hover:border-l-[#0B1929]"
                >
                  <div className="flex items-center">
                    {/* Left section */}
                    <div className="flex-1">
                      <p
                        className="text-lg font-bold"
                        style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
                      >
                        {patient.name}
                      </p>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'system-ui, sans-serif' }}>
                        {patient.age} years old &middot; {patient.city}
                      </p>
                      <p className="text-sm text-gray-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
                        {medCount} active medication{medCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Center section */}
                    <div className="text-right mr-6">
                      <p className="text-sm text-gray-600">
                        {latestSession
                          ? `Last seen ${formatDate(latestSession.date)}`
                          : 'No sessions'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-3">
                      {confidence !== null && confidence !== undefined ? (
                        <div>
                          <div
                            className={`border-l-4 px-3 py-1.5 rounded-r text-sm font-semibold ${confidenceBadgeClasses(confidence)}`}
                            style={{ fontFamily: "'Courier New', monospace" }}
                          >
                            {confidence}
                          </div>
                          {confidence < 70 && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle size={12} className="text-red-500" />
                              <span className="text-xs text-red-500">Review Required</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="border-l-4 border-l-gray-300 bg-gray-50 text-gray-500 px-3 py-1.5 rounded-r text-sm"
                          style={{ fontFamily: "'Courier New', monospace" }}
                        >
                          --
                        </div>
                      )}
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
