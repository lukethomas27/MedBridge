import { useState } from 'react';
import { User, ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle, Heart } from 'lucide-react';

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
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getConfidenceLabel(confidence) {
  if (confidence >= 70) return { text: 'High', color: 'text-teal-500' };
  if (confidence >= 50) return { text: 'Medium', color: 'text-amber-500' };
  return { text: 'Low', color: 'text-red-500' };
}

export default function PatientDashboard({ patient, onLogout }) {
  const firstName = patient.name?.split(' ')[0] || 'there';
  const sessions = patient.sessions || [];
  const mostRecent = sessions.length > 0 ? sessions[0] : null;
  const mostRecentInsights = mostRecent?.insights || null;

  const [checkedItems, setCheckedItems] = useState({});
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [readingLevels, setReadingLevels] = useState({});

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
        icon: <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />,
      };
    }
    if (level === 'high') {
      return {
        message: "Your doctor wants to make sure you're okay. Stay on top of your plan.",
        icon: <Heart size={20} className="text-rose-500 flex-shrink-0" />,
      };
    }
    return null;
  };

  const getInsightText = (insights, level) => {
    if (!insights) return '';
    if (level === 'simple') return insights.simpleSummary || insights.plainSummary || '';
    if (level === 'detail') return insights.summary || insights.plainSummary || '';
    return insights.plainSummary || '';
  };

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F7F4EF' }}>
        {/* Nav */}
        <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-6 flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#00C9A7' }} />
              <span className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}>
                HealthForge
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: '#0B1929' }}>
              <span>{firstName}</span>
              <User size={16} />
              <button onClick={onLogout} className="text-gray-500 hover:text-gray-700 underline">
                Sign Out
              </button>
            </div>
          </div>
          <div className="border-t-2 border-teal-400 w-full" />
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col items-center justify-center mt-24 text-center">
          <Heart size={48} className="text-gray-300 mb-4" />
          <p className="text-lg leading-relaxed text-gray-500" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Your doctor hasn't added any visits yet. They will appear here after your first appointment.
          </p>
        </div>
      </div>
    );
  }

  const riskContent = getRiskContent();
  const actions = mostRecentInsights?.actionsForPatient || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F4EF', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: '#00C9A7' }}
            />
            <span className="font-bold text-lg" style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}>
              HealthForge
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm" style={{ color: '#0B1929' }}>
            <span>{firstName}</span>
            <User size={16} />
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-700 underline">
              Sign Out
            </button>
          </div>
        </div>
        <div className="border-t-2 border-teal-400 w-full" />
      </nav>

      {/* Page content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Section 1: How are you doing? */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1
            className="text-2xl mb-3"
            style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
          >
            Hi, {firstName}.
          </h1>

          {riskContent && (
            <div className="flex items-center gap-2 mb-3">
              {riskContent.icon}
              <span className="text-lg leading-relaxed" style={{ color: '#0B1929' }}>
                {riskContent.message}
              </span>
            </div>
          )}

          {mostRecentInsights?.plainSummary && (
            <p className="text-lg leading-relaxed text-gray-600 mb-4">
              {mostRecentInsights.plainSummary}
            </p>
          )}

          {mostRecent?.date && (
            <p className="text-sm text-gray-400">
              Last visit: {formatDate(mostRecent.date)} with Dr. Emily Chen
            </p>
          )}
        </div>

        {/* Section 2: Today's Action Plan */}
        {actions.length > 0 && (
          <div className="mt-8">
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              What to do today
            </h2>
            <p className="text-sm text-gray-500 mb-4">Based on your most recent visit</p>

            <div className="space-y-2">
              {actions.map((action, idx) => {
                const cat = action.category || 'followup';
                const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.followup;
                const isWarning = cat === 'warning';
                const isChecked = !!checkedItems[idx];

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 bg-white shadow-sm rounded-r-lg p-4 border-l-4 ${style.border} ${
                      isWarning ? 'bg-red-50/50' : ''
                    }`}
                    style={isWarning ? { backgroundColor: 'rgba(254, 242, 242, 0.5)' } : {}}
                  >
                    {/* Checkbox */}
                    {!isWarning ? (
                      <button
                        onClick={() => toggleChecked(idx)}
                        className={`w-5 h-5 flex-shrink-0 rounded-sm flex items-center justify-center border-2 transition-colors ${
                          isChecked
                            ? 'bg-teal-500 border-teal-500'
                            : ''
                        }`}
                        style={!isChecked ? { borderColor: '#0B1929' } : {}}
                        aria-label={isChecked ? 'Uncheck item' : 'Check item'}
                      >
                        {isChecked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <div className="w-5 flex-shrink-0" />
                    )}

                    {/* Icon + Text */}
                    <div className="flex-1 min-w-0">
                      <span className="mr-2">{style.icon}</span>
                      <span
                        className={`text-base leading-relaxed ${
                          isWarning ? 'font-medium' : ''
                        } ${isChecked ? 'line-through text-gray-400' : ''}`}
                        style={{ color: isWarning ? '#0B1929' : undefined }}
                      >
                        {action.text}
                      </span>
                    </div>

                    {/* Category badge */}
                    <span className="text-xs text-gray-400 uppercase tracking-wider flex-shrink-0">
                      {cat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: My Health History */}
        <div className="mt-8">
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
          >
            Your visit history
          </h2>

          <div className="space-y-3">
            {sessions.map((session) => {
              const insights = session.insights;
              const isExpanded = expandedSessionId === session.id;
              const confidence = insights?.confidence;
              const confLabel = confidence != null ? getConfidenceLabel(confidence) : null;
              const currentLevel = getReadingLevel(session.id);
              const sessionActions = insights?.actionsForPatient || [];

              return (
                <div
                  key={session.id}
                  className="bg-white shadow-sm rounded-lg p-5"
                >
                  {/* Collapsed header */}
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" style={{ color: '#0B1929' }}>
                            {formatDate(session.date)}
                          </span>
                          <span className="text-sm text-gray-400">Visit with Dr. Emily Chen</span>
                        </div>

                        {insights?.plainSummary && (
                          <p className="text-sm text-gray-600 leading-relaxed truncate">
                            {insights.plainSummary}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                          {confLabel && (
                            <span className={`text-xs font-medium ${confLabel.color}`}>
                              AI Confidence: {confLabel.text}
                            </span>
                          )}
                          {confidence != null && confidence < 70 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 italic">
                              <Clock size={12} />
                              Your doctor has been asked to review this. Check back soon.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-3 mt-1 text-gray-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && insights && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
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

                      {/* Action items for this session */}
                      {sessionActions.length > 0 && (
                        <ul className="mt-4 space-y-1">
                          {sessionActions.map((a, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                              {a.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
