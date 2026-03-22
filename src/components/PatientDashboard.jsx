import { useState, useEffect, useCallback } from 'react';
import {
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Heart,
  Share2,
  Shield,
  Trash2,
  Settings,
  Activity,
  Wind,
  UserCheck,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import ShareModal from './ShareModal';
import { fetchSharesForPatient, revokeShare } from '../lib/queries';

const CATEGORY_STYLES = {
  medication: { border: 'border-teal-400', icon: '\u{1F48A}' },
  environment: { border: 'border-green-400', icon: '\u{1F33F}' },
  activity: { border: 'border-blue-400', icon: '\u{1F6B6}' },
  diet: { border: 'border-orange-400', icon: '\u{1F34E}' },
  warning: { border: 'border-red-400', icon: '\u26A0' },
  followup: { border: 'border-purple-400', icon: '\u{1F4C5}' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getConfidenceLabel(confidence) {
  if (confidence >= 70) return { text: 'High', color: 'text-teal-500' };
  if (confidence >= 50) return { text: 'Medium', color: 'text-amber-500' };
  return { text: 'Low', color: 'text-red-500' };
}

function sortActions(actions) {
  return [...actions].sort((a, b) => {
    if (a.category === 'warning' && b.category !== 'warning') return -1;
    if (a.category !== 'warning' && b.category === 'warning') return 1;
    return 0;
  });
}

export default function PatientDashboard({ patient, onLogout, onOpenSettings }) {
  const { settings } = useSettings();
  const { addToast } = useToast();
  const firstName = patient.name?.split(' ')[0] || 'there';
  const allSessions = patient.sessions || [];
  // Only show insights that have been approved by the doctor
  const sessions = allSessions.map((s) => ({
    ...s,
    insights: s.insights?.approved ? s.insights : null,
  }));
  
  // Find the actual most recent session for UI labels (even if not approved)
  const mostRecent = allSessions.length > 0 ? allSessions[0] : null;
  
  // Find the most recent session that HAS approved insights for the "Today" panel
  const latestApprovedSession = sessions.find(s => s.insights !== null);
  const mostRecentInsights = latestApprovedSession?.insights || null;
  const isPendingNewAnalysis = allSessions.length > 0 && !allSessions[0].insights?.approved && allSessions[0].insights !== null;

  const [checkedItems, setCheckedItems] = useState({});
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [readingLevels, setReadingLevels] = useState({});

  // Sharing state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingSessionId, setSharingSessionId] = useState(null);
  const [sharingSessionDate, setSharingSessionDate] = useState(null);
  const [shares, setShares] = useState([]);

  const loadShares = useCallback(async () => {
    try {
      const data = await fetchSharesForPatient(patient.id);
      setShares(data);
    } catch (err) {
      console.error('Error loading shares:', err);
    }
  }, [patient.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShares();
  }, [loadShares]);

  const [shareError, setShareError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const handleRevoke = async (shareId) => {
    if (!confirm('Are you sure you want to revoke access?')) return;
    setRevokingId(shareId);
    setShareError(null);
    try {
      await revokeShare(shareId);
      loadShares();
      addToast('Access revoked');
    } catch (err) {
      console.error('Error revoking share:', err);
      setShareError('Failed to revoke access. Please try again.');
      addToast('Failed to revoke access', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const openShareModal = (sessionId = null, date = null) => {
    setSharingSessionId(sessionId);
    setSharingSessionDate(date ? formatDate(date) : null);
    setIsShareModalOpen(true);
  };

  const toggleChecked = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSession = (id) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const getReadingLevel = (sessionId) => readingLevels[sessionId] || 'plain';

  const setReadingLevel = (sessionId, level) => {
    setReadingLevels((prev) => ({ ...prev, [sessionId]: level }));
  };

  const getRiskContent = () => {
    if (!mostRecentInsights) return null;
    const level = mostRecentInsights.riskLevel;
    if (level === 'low') {
      return {
        message: "You're doing well. Keep it up.",
        icon: <CheckCircle size={20} className="text-teal-500 flex-shrink-0" />,
      };
    }
    if (level === 'medium') {
      return {
        message: 'There are a few things to keep an eye on.',
        icon: (
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
        ),
      };
    }
    if (level === 'high') {
      return {
        message:
          "Your doctor wants to make sure you're okay. Stay on top of your plan.",
        icon: <Heart size={20} className="text-rose-500 flex-shrink-0" />,
      };
    }
    return null;
  };

  const getInsightText = (insights, level) => {
    if (!insights) return '';
    if (level === 'simple')
      return insights.simpleSummary || insights.plainSummary || '';
    if (level === 'detail')
      return insights.summary || insights.plainSummary || '';
    return insights.plainSummary || '';
  };

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F7F4EF' }}>
        {/* Nav */}
        <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
            <button onClick={onLogout} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#00C9A7' }} />
              <span className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}>
                HealthForge
              </span>
            </button>
            <div className="flex items-center gap-3 text-sm" style={{ color: '#0B1929' }}>
              <span>{firstName}</span>
              <User size={16} />
              <button
                onClick={onOpenSettings}
                className="text-gray-400 hover:text-teal-600 transition-colors"
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button onClick={onLogout} className="text-gray-500 hover:text-gray-700 underline">
                Sign Out
              </button>
            </div>
          </div>
          <div className="border-t-2 border-teal-400 w-full" />
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col items-center justify-center mt-24 text-center">
          <Heart size={48} className="text-gray-300 mb-4" />
          <p
            className="text-lg leading-relaxed text-gray-500"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            Your doctor hasn&apos;t added any visits yet. They will appear here
            after your first appointment.
          </p>
        </div>
      </div>
    );
  }

  const riskContent = getRiskContent();
  const actions = sortActions(mostRecentInsights?.actionsForPatient || []).filter((action, idx) => {
    if (settings.hideCompletedActions && checkedItems[idx]) return false;
    return true;
  });

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#F7F4EF',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <button onClick={onLogout} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: '#00C9A7' }}
            />
            <span
              className="font-bold text-lg"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              HealthForge
            </span>
          </button>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#0B1929' }}>
            <button
              onClick={() => openShareModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg font-medium hover:bg-teal-100 transition-colors mr-2"
            >
              <Share2 size={14} />
              Share History
            </button>
            <span>{firstName}</span>
            <User size={16} />
            <button
              onClick={onOpenSettings}
              className="text-gray-400 hover:text-teal-600 transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-700 underline">
              Sign Out
            </button>
          </div>
        </div>
        <div className="border-t-2 border-teal-400 w-full" />
      </nav>

      {/* Page content — 3-column layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-24 flex flex-col lg:flex-row gap-6">

        {/* ========== LEFT PANEL (sticky) ========== */}
        <div className="lg:w-[28%] lg:sticky lg:top-20 self-start">
          {/* Greeting card */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start">
              <h1
                className="text-2xl mb-3"
                style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
              >
                Hi, {firstName}.
              </h1>
              {mostRecent && (
                <button
                  onClick={() => openShareModal(mostRecent.id, mostRecent.date)}
                  className="text-gray-400 hover:text-teal-600 transition-colors"
                  title="Share this visit"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>

            {riskContent && (
              <div className="flex items-center gap-2 mb-3">
                {riskContent.icon}
                <span
                  className="text-base leading-relaxed"
                  style={{ color: '#0B1929' }}
                >
                  {riskContent.message}
                </span>
              </div>
            )}

            {mostRecentInsights?.plainSummary && (
              <p className="text-sm leading-relaxed text-gray-600 mb-3">
                {mostRecentInsights.plainSummary}
              </p>
            )}

            {mostRecentInsights?.medicationFlags?.length > 0 && (
              <div className="mt-3 mb-3 space-y-2">
                {mostRecentInsights.medicationFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-50 border-l-4 border-amber-400 rounded-r p-2">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-800">{flag}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Doctor Verification */}
            {mostRecentInsights?.doctorNote && (
              <div className="bg-[#0B1929] text-white p-4 rounded-lg shadow-lg mb-3 border-l-4 border-teal-400">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="text-teal-400" size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                    Doctor Verified
                  </span>
                </div>
                <p className="text-sm italic leading-relaxed">
                  &quot;{mostRecentInsights.doctorNote}&quot;
                </p>
              </div>
            )}

            {mostRecent?.date && (
              <p className="text-xs text-gray-400">
                Last visit: {formatDate(mostRecent.date)} with Dr. Emily Chen
              </p>
            )}
          </div>

          {/* Health Profile */}
          <div className="mt-4 bg-white shadow-md rounded-lg p-6">
            <h2
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              Your health profile
            </h2>

            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Allergies</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {(patient.allergies || []).map((a, i) => (
                <span key={i} className="border border-red-300 text-red-700 bg-red-50 rounded px-2 py-0.5 text-xs">{a}</span>
              ))}
              {(!patient.allergies || patient.allergies.length === 0) && (
                <span className="text-xs text-gray-400">None recorded</span>
              )}
            </div>

            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Current Medications</p>
            <div className="space-y-1">
              {(patient.medications || []).map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                  <span className="text-gray-400 flex-shrink-0">💊</span>
                  <span className="truncate" title={m}>{m}</span>
                </div>
              ))}
              {(!patient.medications || patient.medications.length === 0) && (
                <span className="text-xs text-gray-400">None recorded</span>
              )}
            </div>
          </div>

          {/* Wellness Data */}
          <div className="mt-4 bg-white shadow-md rounded-lg p-6">
            <h2
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              Your wellness data
            </h2>

            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-teal-600" />
              <h3 className="text-xs font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}>From Your Devices</h3>
            </div>
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resting HR</span>
                <span className="text-sm font-medium" style={{ fontFamily: "'Courier New', monospace" }}>68 bpm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sleep average</span>
                <span className="text-sm font-medium" style={{ fontFamily: "'Courier New', monospace" }}>7.1 hrs</span>
              </div>
            </div>

            <div className="border-t border-gray-100 my-3" />

            <div className="flex items-center gap-2 mb-2">
              <Wind size={14} className="text-teal-600" />
              <h3 className="text-xs font-semibold" style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}>Today&apos;s Environment</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Air Quality</span>
                <span className="text-teal-600 text-sm font-medium">Good (AQI 42)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pollen</span>
                <span className="text-amber-600 text-sm font-medium">Moderate</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{patient.city}</p>
          </div>

          {/* Family Sharing / Manage Access */}
          {shares.length > 0 && (
            <div className="mt-4 bg-white rounded-lg shadow-md border border-teal-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
                >
                  <Shield className="text-teal-600" size={16} />
                  Manage Access
                </h2>
              </div>
              {shareError && (
                <div className="px-4 py-2 bg-red-50 text-xs text-red-600">{shareError}</div>
              )}
              <div className="divide-y divide-gray-100">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${share.status === 'revoked' ? 'bg-gray-100 text-gray-400' : 'bg-teal-50 text-teal-600'}`}
                      >
                        <User size={14} />
                      </div>
                      <div>
                        <div
                          className={`text-sm font-medium truncate max-w-[180px] ${share.status === 'revoked' ? 'text-gray-400' : 'text-gray-900'}`}
                          title={share.shared_with_email}
                        >
                          {share.shared_with_email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>
                            {share.access_type === 'full_history'
                              ? 'Full History'
                              : 'Single Visit'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span
                            className={
                              share.status === 'revoked'
                                ? 'text-red-400'
                                : 'text-teal-600'
                            }
                          >
                            {share.status.charAt(0).toUpperCase() +
                              share.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {share.status !== 'revoked' && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        disabled={revokingId === share.id}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Revoke access"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========== CENTER PANEL — Visit History ========== */}
        <div className="lg:w-[44%]">
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
          >
            Your visit history
          </h2>

          <div className="space-y-3">
            {sessions.map((session, sessionIdx) => {
              const insights = session.insights;
              const rawInsights = allSessions[sessionIdx]?.insights;
              const pendingReview = rawInsights && !rawInsights.approved;
              const isExpanded = expandedSessionId === session.id;
              const confidence = insights?.confidence;
              const confLabel =
                confidence != null ? getConfidenceLabel(confidence) : null;
              const currentLevel = getReadingLevel(session.id);
              const sessionActions = insights?.actionsForPatient || [];

              return (
                <div key={session.id} className="bg-white shadow-sm rounded-lg p-6">
                  {/* Collapsed header */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleSession(session.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-medium"
                              style={{ color: '#0B1929' }}
                            >
                              {formatDate(session.date)}
                            </span>
                            <span className="text-sm text-gray-400">
                              Visit with Dr. Emily Chen
                            </span>
                          </div>

                          {insights?.plainSummary && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 break-words mt-1">
                              {insights.plainSummary}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2">
                            {confLabel && (
                              <span
                                className={`text-xs font-medium ${confLabel.color}`}
                              >
                                AI Confidence: {confLabel.text}
                              </span>
                            )}
                            {confidence != null && confidence < 70 && !insights.doctorNote && (
                              <span className="flex items-center gap-1 text-xs text-gray-400 italic">
                                <Clock size={12} />
                                Your doctor has been asked to review this. Check
                                back soon.
                              </span>
                            )}
                            {insights?.doctorNote && (
                              <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                                <UserCheck size={12} />
                                Doctor Verified
                              </span>
                            )}
                            {pendingReview && !insights && (
                              <span className="flex items-center gap-1 text-xs text-amber-500 italic">
                                <Clock size={12} />
                                Insights pending doctor review
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-3 mt-1 text-gray-400">
                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => openShareModal(session.id, session.date)}
                      className="mt-1 p-1 text-gray-300 hover:text-teal-600 transition-colors"
                      title="Share this visit"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && insights && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Doctor Note in History */}
                      {insights.doctorNote && (
                        <div className="mb-4 bg-teal-50 p-4 rounded border-l-4 border-teal-400">
                          <p className="text-xs font-bold text-teal-700 uppercase mb-1">
                            Clinical Verification
                          </p>
                          <p className="text-sm italic text-teal-900">
                            &quot;{insights.doctorNote}&quot;
                          </p>
                        </div>
                      )}

                      {/* Reading level toggle */}
                      <div className="flex gap-4 mb-4">
                        <button
                          onClick={() => setReadingLevel(session.id, 'simple')}
                          className={`text-sm pb-1 ${
                            currentLevel === 'simple'
                              ? 'border-b-2 border-teal-400 text-teal-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Simpler
                        </button>
                        <button
                          onClick={() => setReadingLevel(session.id, 'plain')}
                          className={`text-sm pb-1 ${
                            currentLevel === 'plain'
                              ? 'border-b-2 border-teal-400 text-teal-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Plain
                        </button>
                        <button
                          onClick={() => setReadingLevel(session.id, 'detail')}
                          className={`text-sm pb-1 ${
                            currentLevel === 'detail'
                              ? 'border-b-2 border-teal-400 text-teal-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          More detail
                        </button>
                      </div>

                      {/* Insight text */}
                      <div className="bg-gray-50 p-4 rounded leading-relaxed text-gray-700">
                        {getInsightText(insights, currentLevel)}
                      </div>

                      {/* Session delta */}
                      {insights.delta && (
                        <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800">
                          <span className="font-medium">Changes since last visit: </span>
                          {insights.delta}
                        </div>
                      )}

                      {/* Action items for this session */}
                      {sessionActions.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Action Items
                          </h4>
                          <div className="space-y-2">
                            {sortActions(sessionActions).map((a, i) => {
                              const style =
                                CATEGORY_STYLES[a.category] ||
                                CATEGORY_STYLES.followup;
                              return (
                                <div key={i} className="flex items-start gap-3">
                                  <span className="text-base flex-shrink-0 w-5 text-center mt-0.5">
                                    {style.icon}
                                  </span>
                                  <span className="text-sm text-gray-600 break-words">
                                    {a.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========== RIGHT PANEL (sticky) — Action Plan Checklist ========== */}
        <div className="lg:w-[28%] lg:sticky lg:top-20 self-start">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              What to do today
            </h2>
            {isPendingNewAnalysis && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded text-[10px] font-bold text-amber-600 uppercase tracking-wider border border-amber-100">
                <Clock size={12} />
                Update Pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">Based on your most recent visit</p>
          {actions.length > 0 ? (
            <div>

              <div className="space-y-2">
                {actions.map((action, idx) => {
                  const cat = action.category || 'followup';
                  const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.followup;
                  const isWarning = cat === 'warning';
                  const isChecked = !!checkedItems[idx];

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 bg-white shadow-sm rounded-r-lg p-3 border-l-4 ${style.border} ${
                        isWarning ? 'bg-red-50/50' : ''
                      }`}
                      style={
                        isWarning
                          ? { backgroundColor: 'rgba(254, 242, 242, 0.5)' }
                          : {}
                      }
                    >
                      {/* Checkbox */}
                      {!isWarning ? (
                        <button
                          onClick={() => toggleChecked(idx)}
                          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-sm flex items-center justify-center border-2 transition-colors ${
                            isChecked ? 'bg-teal-500 border-teal-500' : ''
                          }`}
                          style={!isChecked ? { borderColor: '#0B1929' } : {}}
                          aria-label={isChecked ? 'Uncheck item' : 'Check item'}
                        >
                          {isChecked && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      ) : (
                        <div className="w-5 flex-shrink-0" />
                      )}

                      {/* Icon + Text */}
                      <div className="flex-1 min-w-0 flex items-start gap-2">
                        <span className="text-base flex-shrink-0 w-5 text-center">
                          {style.icon}
                        </span>
                        <span
                          className={`text-sm leading-relaxed break-words ${
                            isWarning ? 'font-medium' : ''
                          } ${isChecked ? 'line-through text-gray-400' : ''}`}
                          style={{ color: isWarning ? '#0B1929' : undefined }}
                        >
                          {action.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg p-6 text-center">
              <CheckCircle size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No action items yet. Your checklist will be generated from your doctor&apos;s insights after each visit.</p>
            </div>
          )}
        </div>

      </div>

      {isShareModalOpen && (
        <ShareModal
          patient={patient}
          sessionId={sharingSessionId}
          sessionDate={sharingSessionDate}
          onClose={() => setIsShareModalOpen(false)}
          onShareCreated={() => loadShares()}
        />
      )}
    </div>
  );
}
