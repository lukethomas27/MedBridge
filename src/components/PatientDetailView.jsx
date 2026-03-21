import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  MapPin,
  Pill,
  Activity,
  Wind,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Mic,
} from 'lucide-react';
import { generateInsights } from '../utils/generateInsights';
import { createSession, updateTranscription, saveInsights } from '../lib/queries';
import { useDeepgramTranscription } from '../hooks/useDeepgramTranscription';
import { useSettings } from '../context/SettingsContext';
import { useEffect, useRef } from 'react';

function ConfidenceGauge({ confidence }) {
  const radius = 48;
  const strokeWidth = 8;
  const size = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;
  const color =
    confidence >= 70 ? '#00C9A7' : confidence >= 50 ? '#F59E0B' : '#F87171';

  return (
    <div className="flex flex-col items-center my-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "'Courier New', monospace",
            fontWeight: 'bold',
            fontSize: '24px',
            fill: '#0B1929',
          }}
        >
          {confidence}
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">AI Confidence</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-20 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  );
}

export default function PatientDetailView({ patient, onBack, onUpdatePatient, onLogout }) {
  const { settings } = useSettings();
  const [expandedSessions, setExpandedSessions] = useState(() => {
    if (settings.autoExpandSessions) {
      const all = {};
      (patient.sessions || []).forEach(s => all[s.id] = true);
      return all;
    }
    return {};
  });
  const [editingSessions, setEditingSessions] = useState({});
  const [editBuffers, setEditBuffers] = useState({});
  const [loadingSessions, setLoadingSessions] = useState({});
  const [recordingSessionId, setRecordingSessionId] = useState(null);

  const autoSaveTimers = useRef({});

  const { isRecording, interimText, error: micError, startRecording, stopRecording } = useDeepgramTranscription();

  const sessions = [...(patient.sessions || [])].reverse();
  const latestSession = sessions[0] || null;
  const latestRisk = latestSession?.insights?.riskLevel || null;

  const riskColor = {
    Low: 'border-[#00C9A7] text-teal-700 bg-teal-50',
    Medium: 'border-[#F59E0B] text-amber-700 bg-amber-50',
    High: 'border-[#F87171] text-red-700 bg-red-50',
  };

  const toggleExpand = useCallback((id) => {
    setExpandedSessions((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const startEdit = useCallback(
    (sessionId, currentText) => {
      setEditingSessions((prev) => ({ ...prev, [sessionId]: true }));
      setEditBuffers((prev) => ({ ...prev, [sessionId]: currentText }));
    },
    []
  );

  const cancelEdit = useCallback((sessionId) => {
    setEditingSessions((prev) => ({ ...prev, [sessionId]: false }));
  }, []);

  const saveEdit = useCallback(
    async (sessionId) => {
      const newText = editBuffers[sessionId];
      try {
        await updateTranscription(sessionId, newText);
      } catch (err) {
        console.error('Error saving transcription:', err);
      }
      const updatedSessions = patient.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, transcription: newText, insights: null }
          : s
      );
      onUpdatePatient({ ...patient, sessions: updatedSessions });
      setEditingSessions((prev) => ({ ...prev, [sessionId]: false }));
    },
    [patient, editBuffers, onUpdatePatient]
  );

  const handleGenerateInsights = useCallback(
    async (session) => {
      setLoadingSessions((prev) => ({ ...prev, [session.id]: true }));
      try {
        const insights = await generateInsights(
          session.transcription,
          patient,
          patient.sessions
        );
        await saveInsights(session.id, insights);
        
        const updatedSessions = patient.sessions.map((s) =>
          s.id === session.id ? { ...s, insights } : s
        );
        onUpdatePatient({ ...patient, sessions: updatedSessions });
      } catch (err) {
        console.error('Error generating insights:', err);
        // Maybe show an error to the user here
      } finally {
        setLoadingSessions((prev) => ({ ...prev, [session.id]: false }));
      }
    },
    [patient, onUpdatePatient]
  );

  const addNewSession = useCallback(async () => {
    try {
      const newSession = await createSession(patient.id);
      const updatedSessions = [newSession, ...patient.sessions];
      onUpdatePatient({ ...patient, sessions: updatedSessions });
      setExpandedSessions((prev) => ({ ...prev, [newSession.id]: true }));
      setEditingSessions((prev) => ({ ...prev, [newSession.id]: true }));
      setEditBuffers((prev) => ({ ...prev, [newSession.id]: '' }));
    } catch (err) {
      console.error('Error creating session:', err);
    }
  }, [patient, onUpdatePatient]);

  const handleTranscriptionChange = useCallback((sessionId, value) => {
    setEditBuffers(prev => ({ ...prev, [sessionId]: value }));

    if (settings.autoSaveTranscriptions) {
      if (autoSaveTimers.current[sessionId]) {
        clearTimeout(autoSaveTimers.current[sessionId]);
      }
      autoSaveTimers.current[sessionId] = setTimeout(async () => {
        try {
          await updateTranscription(sessionId, value);
          onUpdatePatient({
            ...patient,
            sessions: patient.sessions.map(s => s.id === sessionId ? { ...s, transcription: value } : s)
          });
        } catch (err) {
          console.error("Auto-save error:", err);
        }
      }, 2000); // 2 second debounce
    }
  }, [settings.autoSaveTranscriptions, patient, onUpdatePatient]);

  const toggleRecording = useCallback((sessionId) => {
    if (recordingSessionId === sessionId) {
      stopRecording();
      setRecordingSessionId(null);
      return;
    }

    // Stop any existing recording
    if (recordingSessionId) {
      stopRecording();
    }

    setRecordingSessionId(sessionId);
    startRecording((finalText) => {
      setEditBuffers(prev => ({
        ...prev,
        [sessionId]: (prev[sessionId] || '') + finalText
      }));
    });
  }, [recordingSessionId, startRecording, stopRecording]);

  const confidenceBadgeColor = (c) => {
    if (c >= 70) return 'border-[#00C9A7] text-teal-700 bg-teal-50';
    if (c >= 50) return 'border-[#F59E0B] text-amber-700 bg-amber-50';
    return 'border-[#F87171] text-red-700 bg-red-50';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F4EF' }}>
      {/* Navigation bar */}
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <button onClick={onLogout} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
            <span className="animate-pulse" style={{ color: '#00C9A7', fontSize: '12px' }}>●</span>
            <span
              className="font-bold text-lg"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              HealthForge
            </span>
          </button>
        </div>
      </nav>

      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patients
        </button>
        <div className="flex items-center gap-3">
          <h1
            className="text-[28px]"
            style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
          >
            {patient.name}
          </h1>
          {latestRisk && (
            <span
              className={`border-l-4 px-3 py-1 text-sm font-medium rounded-r ${riskColor[latestRisk] || ''}`}
            >
              {latestRisk} Risk
            </span>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24 flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL */}
        <div className="lg:w-[35%] lg:sticky lg:top-6 self-start">
          {/* Patient Profile card */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2
              className="text-lg font-semibold mb-1"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              {patient.name}
            </h2>
            <p className="text-sm text-gray-600">
              DOB: {patient.dob} &middot; Age {patient.age}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {patient.city}
            </p>

            <div className="border-t border-gray-200 my-4" />

            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Allergies
            </p>
            <div className="flex flex-wrap gap-1 mb-4">
              {(patient.allergies || []).map((a, i) => (
                <span
                  key={i}
                  className="border border-red-300 text-red-700 bg-red-50 rounded px-2 py-0.5 text-xs"
                >
                  {a}
                </span>
              ))}
              {(!patient.allergies || patient.allergies.length === 0) && (
                <span className="text-xs text-gray-400">None recorded</span>
              )}
            </div>

            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Current Medications
            </p>
            <div className="space-y-1">
              {(patient.medications || []).map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <Pill className="w-3.5 h-3.5 text-gray-400" />
                  {m}
                </div>
              ))}
              {(!patient.medications || patient.medications.length === 0) && (
                <span className="text-xs text-gray-400">None recorded</span>
              )}
            </div>

            <div className="border-t border-gray-200 my-4" />
          </div>

          {/* Wearable Summary card */}
          <div className="bg-white shadow-md rounded-lg p-6 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-teal-600" />
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
              >
                Wearable Data
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resting HR</span>
                <span>
                  <span style={{ fontFamily: "'Courier New', monospace" }} className="text-sm font-medium">
                    68 bpm
                  </span>
                  <span className="text-gray-400 ml-1">&rarr;</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sleep average</span>
                <span>
                  <span style={{ fontFamily: "'Courier New', monospace" }} className="text-sm font-medium">
                    7.1 hrs
                  </span>
                  <span className="text-teal-600 ml-1">&uarr;</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">(simulated from device data)</p>
          </div>

          {/* Environmental card */}
          <div className="bg-white shadow-md rounded-lg p-6 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Wind className="w-4 h-4 text-teal-600" />
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
              >
                Today&apos;s Environment
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AQI</span>
                <span
                  className="text-teal-600 text-sm font-medium"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  AQI 42 &mdash; Good
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pollen</span>
                <span
                  className="text-amber-600 text-sm font-medium"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  Moderate
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">{patient.city}</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:w-[65%]">
          {/* New Session button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={addNewSession}
              className="flex items-center gap-2 rounded-sm px-4 py-2 text-white text-sm font-medium"
              style={{ backgroundColor: '#00C9A7' }}
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>

          {/* Session list */}
          {sessions.map((session, index) => {
            const isExpanded = expandedSessions[session.id];
            const isEditing = editingSessions[session.id];
            const isLoading = loadingSessions[session.id];
            const sessionNumber = sessions.length - index;
            const { insights } = session;
            const confidence = insights?.confidence;
            const excerpt =
              session.transcription && session.transcription.length > 80
                ? session.transcription.slice(0, 80) + '...'
                : session.transcription || '';

            return (
              <div
                key={session.id}
                className="bg-white shadow-sm rounded-lg mb-3 overflow-hidden"
              >
                {/* Collapsed header */}
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: '#0B1929' }}
                      >
                        {session.date}
                      </span>
                      <span className="text-xs text-gray-400">
                        Session #{sessionNumber}
                      </span>
                      {confidence != null && (
                        <span
                          className={`border-l-4 px-2 py-0.5 text-xs font-medium rounded-r ${confidenceBadgeColor(confidence)}`}
                        >
                          {confidence}%
                        </span>
                      )}
                      {confidence != null && confidence < 70 && (
                        <span className="text-xs text-amber-600 font-medium">
                          &#9888; Review Required
                        </span>
                      )}
                    </div>
                    {!isExpanded && excerpt && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {excerpt}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Transcription section */}
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                        Transcription
                      </p>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={editBuffers[session.id] || ''}
                            onChange={(e) => handleTranscriptionChange(session.id, e.target.value)}
                            className={`w-full bg-gray-50 p-4 rounded font-mono text-sm border-2 ${recordingSessionId === session.id ? 'border-red-400' : 'border-teal-400'} focus:outline-none resize-y min-h-[120px]`}
                          />
                          {recordingSessionId === session.id && interimText && (
                            <div className="text-sm italic text-gray-500 mt-1 px-1 flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              {interimText}
                            </div>
                          )}
                          {micError && recordingSessionId === session.id && (
                            <div className="text-sm text-red-600 mt-1 px-1">
                              ⚠ {micError}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveEdit(session.id)}
                              className="flex items-center gap-1 text-sm text-white px-3 py-1.5 rounded"
                              style={{ backgroundColor: '#00C9A7' }}
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </button>
                            <button
                              onClick={() => toggleRecording(session.id)}
                              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded transition-colors ${recordingSessionId === session.id
                                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 animate-pulse'
                                  : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                              {recordingSessionId === session.id ? 'Stop Recording' : 'Record'}
                            </button>
                            <button
                              onClick={() => cancelEdit(session.id)}
                              className="flex items-center gap-1 text-sm text-gray-600 px-3 py-1.5 rounded border border-gray-300"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-gray-50 p-4 rounded font-mono text-sm whitespace-pre-wrap">
                            {session.transcription || '(empty)'}
                          </div>
                          <button
                            onClick={() =>
                              startEdit(session.id, session.transcription || '')
                            }
                            className="flex items-center gap-1 text-sm text-teal-600 mt-2 hover:text-teal-700"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit Transcription
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Loading skeleton */}
                    {isLoading && <LoadingSkeleton />}

                    {/* AI Insights section */}
                    {insights && !isLoading && (
                      <div className="mt-6">
                        <p className="text-xs uppercase tracking-wider text-teal-600 mb-3">
                          AI Insights
                        </p>

                        {/* Confidence Gauge */}
                        <ConfidenceGauge confidence={insights.confidence} />

                        {/* Low Confidence Alert Banner */}
                        {insights.confidence < 70 && (
                          <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-lg flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-amber-800">
                                AI confidence is below threshold (
                                {insights.confidence}/100). The insights below
                                may be incomplete. Please review and add more
                                detail to the transcription.
                              </p>
                              <button
                                onClick={() =>
                                  startEdit(
                                    session.id,
                                    session.transcription || ''
                                  )
                                }
                                className="text-sm text-amber-700 font-medium mt-1 hover:text-amber-900"
                              >
                                Add Context &rarr;
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Session Summary */}
                        {insights.summary && (
                          <div className="mb-4">
                            <h4
                              className="text-sm font-semibold mb-1"
                              style={{ color: '#0B1929' }}
                            >
                              Session Summary
                            </h4>
                            <p className="text-sm text-gray-700">
                              {insights.summary}
                            </p>
                          </div>
                        )}

                        {/* Key Differentials */}
                        {insights.differentials &&
                          insights.differentials.length > 0 && (
                            <div className="mb-4">
                              <h4
                                className="text-sm font-semibold mb-1"
                                style={{ color: '#0B1929' }}
                              >
                                Key Differentials
                              </h4>
                              <ol className="space-y-1">
                                {insights.differentials.map((d, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-700 flex items-baseline gap-2"
                                  >
                                    <span className="text-gray-400 text-xs">
                                      {i + 1}.
                                    </span>
                                    <span>{d.label}</span>
                                    <span
                                      className="ml-auto text-xs font-medium"
                                      style={{
                                        fontFamily: "'Courier New', monospace",
                                      }}
                                    >
                                      {d.pct}%
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                        {/* Medication Flags */}
                        {insights.medicationFlags &&
                          insights.medicationFlags.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <h4
                                className="text-sm font-semibold mb-1"
                                style={{ color: '#0B1929' }}
                              >
                                Medication Flags
                              </h4>
                              {insights.medicationFlags.map((flag, i) => (
                                <div
                                  key={i}
                                  className="border-l-4 border-amber-400 bg-amber-50 px-3 py-2 rounded-r flex items-center gap-2"
                                >
                                  <Pill className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                  <span className="text-sm text-amber-800">
                                    {flag}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                        {/* Wearable Correlation */}
                        {insights.wearableNote && (
                          <div className="mb-4">
                            <h4
                              className="text-sm font-semibold mb-1"
                              style={{ color: '#0B1929' }}
                            >
                              Wearable Correlation
                            </h4>
                            <p className="text-sm italic text-gray-600">
                              {insights.wearableNote}
                            </p>
                          </div>
                        )}

                        {/* Environmental Note */}
                        {insights.environmentalNote && (
                          <div className="mb-4">
                            <h4
                              className="text-sm font-semibold mb-1"
                              style={{ color: '#0B1929' }}
                            >
                              Environmental Note
                            </h4>
                            <p className="text-sm italic text-gray-600">
                              {insights.environmentalNote}
                            </p>
                          </div>
                        )}

                        {/* Session Delta */}
                        {insights.delta && (
                          <div className="bg-gray-50 p-4 rounded mb-4">
                            <h4
                              className="text-sm font-semibold mb-1"
                              style={{ color: '#0B1929' }}
                            >
                              Session Delta
                            </h4>
                            <p className="text-sm text-gray-700">
                              {insights.delta}
                            </p>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {(insights.actionsForDoctor || insights.actionsForPatient) && (
                          <div className="mb-4">
                            <h4
                              className="text-sm font-semibold mb-2"
                              style={{ color: '#0B1929' }}
                            >
                              Recommended Actions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {insights.actionsForDoctor && (
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                                    For You (Doctor)
                                  </p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {insights.actionsForDoctor.map((a, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-gray-700"
                                      >
                                        {a}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {insights.actionsForPatient && (
                                <div>
                                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                                    For Patient
                                  </p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {insights.actionsForPatient.map((a, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-gray-700"
                                      >
                                        {typeof a === 'string' ? a : a.text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generate / Regenerate button */}
                    {!isLoading && (
                      <button
                        onClick={() => handleGenerateInsights(session)}
                        className="w-full py-3 text-white text-sm font-medium rounded mt-4"
                        style={{ backgroundColor: '#0B1929' }}
                      >
                        {insights ? 'Regenerate Insights' : 'Generate AI Insights'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No sessions yet. Click &ldquo;+ New Session&rdquo; to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
