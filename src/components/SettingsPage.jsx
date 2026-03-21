import { ArrowLeft, Settings, RotateCcw, Sun, Moon, Eye, Ear, Palette, Move, SortDesc, Expand, Bell, Save, EyeOff, Clock, Share2, Database, Trash2, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { deleteEmptySessions } from '../lib/queries';
import { useState } from 'react';

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex-1 min-w-0 mr-4">
        <span className="text-sm font-semibold setting-text block">{label}</span>
        {description && <span className="text-xs setting-muted mt-0.5 block">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[22px] w-[40px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-teal-500' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-[20px]' : 'translate-x-[2px]'
          }`}
          style={{ marginTop: '2px' }}
        />
      </button>
    </div>
  );
}

function SegmentedToggle({ value, options, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-sm font-semibold setting-text">{label}</span>
      <div className="inline-flex rounded-lg p-0.5 setting-segment-bg">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              value === opt.value
                ? 'bg-white shadow-sm setting-text'
                : 'setting-muted hover:opacity-80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectDropdown({ value, options, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex-1 min-w-0 mr-4">
        <span className="text-sm font-semibold setting-text block">{label}</span>
        {description && <span className="text-xs setting-muted mt-0.5 block">{description}</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm rounded-md border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 setting-select"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function SettingsCard({ title, icon: Icon, children }) {
  return (
    <div className="setting-card shadow-md rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-1 pb-3 border-b setting-card-border">
        {Icon && <Icon size={18} className="text-teal-500" />}
        <h2 className="text-lg font-bold setting-heading" style={{ fontFamily: 'Georgia, serif' }}>
          {title}
        </h2>
      </div>
      <div className="divide-y setting-card-divider">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage({ currentUser, onBack }) {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [cleaning, setCleaning] = useState(false);
  const [cleanedCount, setCleanedCount] = useState(null);
  const role = currentUser?.role;

  const handleCleanup = async () => {
    if (!confirm('This will permanently delete all sessions with no transcription. This cannot be undone. Continue?')) return;
    setCleaning(true);
    setCleanedCount(null);
    try {
      const count = await deleteEmptySessions();
      setCleanedCount(count);
      setTimeout(() => setCleanedCount(null), 5000);
    } catch (err) {
      console.error('Cleanup failed:', err);
      alert('Failed to clean up sessions.');
    } finally {
      setCleaning(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      resetSettings();
    }
  };

  return (
    <div className="min-h-screen setting-bg" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-10 setting-nav border-b setting-nav-border">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="animate-pulse" style={{ color: '#00C9A7', fontSize: '12px' }}>●</span>
            <span className="font-bold text-lg setting-heading" style={{ fontFamily: 'Georgia, serif' }}>
              HealthForge
            </span>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm setting-muted hover:opacity-80 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 pb-24">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
            <Settings size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold setting-heading" style={{ fontFamily: 'Georgia, serif' }}>
              Settings
            </h1>
            <p className="text-sm setting-muted">Customize your MedBridge experience</p>
          </div>
        </div>

        {/* Accessibility Section (shared) */}
        <SettingsCard title="Accessibility" icon={Eye}>
          <SegmentedToggle
            label="Theme"
            value={settings.theme}
            onChange={(v) => updateSetting('theme', v)}
            options={[
              { value: 'light', label: '☀️ Light' },
              { value: 'dark', label: '🌙 Dark' },
            ]}
          />
          <SegmentedToggle
            label="Font Size"
            value={settings.fontSize}
            onChange={(v) => updateSetting('fontSize', v)}
            options={[
              { value: 'small', label: 'S' },
              { value: 'medium', label: 'M' },
              { value: 'large', label: 'L' },
            ]}
          />
          <Toggle
            label="High Contrast"
            description="Increase contrast ratios for better visibility"
            checked={settings.highContrast}
            onChange={(v) => updateSetting('highContrast', v)}
          />
          <Toggle
            label="Reduced Motion"
            description="Minimize animations and transitions"
            checked={settings.reducedMotion}
            onChange={(v) => updateSetting('reducedMotion', v)}
          />
          <Toggle
            label="Screen Reader Enhancements"
            description="Add extra ARIA labels and landmarks"
            checked={settings.screenReader}
            onChange={(v) => updateSetting('screenReader', v)}
          />
          <Toggle
            label="Color Blind-Friendly"
            description="Add icons and patterns alongside colors"
            checked={settings.colorBlindFriendly}
            onChange={(v) => updateSetting('colorBlindFriendly', v)}
          />
        </SettingsCard>

        {/* Maintenance Section (Doctor only) */}
        {role === 'doctor' && (
          <SettingsCard title="Data Maintenance" icon={Database}>
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <span className="text-sm font-semibold setting-text block">Cleanup Empty Sessions</span>
                  <span className="text-xs setting-muted mt-0.5 block">
                    Remove all session records that don't have any transcription data.
                  </span>
                </div>
                <button
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                    cleaning 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <Trash2 size={14} />
                  {cleaning ? 'Cleaning...' : 'Run Cleanup'}
                </button>
              </div>
              {cleanedCount !== null && (
                <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-lg flex items-center gap-2 text-teal-800 text-sm">
                  <CheckCircle2 size={16} className="text-teal-500" />
                  Successfully deleted {cleanedCount} empty sessions.
                </div>
              )}
            </div>
          </SettingsCard>
        )}

        {/* Doctor Section */}
        {role === 'doctor' && (
          <SettingsCard title="Consultation Preferences" icon={Ear}>
            <SelectDropdown
              label="Patient List Sort"
              description="Default sort order for your patient list"
              value={settings.patientSortOrder}
              onChange={(v) => updateSetting('patientSortOrder', v)}
              options={[
                { value: 'lastVisit', label: 'Last Visit' },
                { value: 'nameAZ', label: 'Name (A-Z)' },
                { value: 'riskLevel', label: 'Risk Level' },
              ]}
            />
            <Toggle
              label="Auto-Expand Sessions"
              description="Automatically expand all session cards"
              checked={settings.autoExpandSessions}
              onChange={(v) => updateSetting('autoExpandSessions', v)}
            />
            <Toggle
              label="Critical Score Alerts"
              description="Show alert badges for low-confidence scores"
              checked={settings.criticalScoreAlerts}
              onChange={(v) => updateSetting('criticalScoreAlerts', v)}
            />
            <Toggle
              label="Auto-Save Transcriptions"
              description="Save transcription edits automatically"
              checked={settings.autoSaveTranscriptions}
              onChange={(v) => updateSetting('autoSaveTranscriptions', v)}
            />
          </SettingsCard>
        )}

        {/* Patient Section */}
        {role === 'patient' && (
          <SettingsCard title="My Preferences" icon={Palette}>
            <Toggle
              label="Hide Completed Actions"
              description="Remove checked-off items from your action plan"
              checked={settings.hideCompletedActions}
              onChange={(v) => updateSetting('hideCompletedActions', v)}
            />
            <SelectDropdown
              label="Reminder Frequency"
              description="How often you'd like to be reminded"
              value={settings.reminderFrequency}
              onChange={(v) => updateSetting('reminderFrequency', v)}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'never', label: 'Never' },
              ]}
            />
            <Toggle
              label="Data Sharing"
              description="Allow your data to be shared with authorized family members"
              checked={settings.dataSharing}
              onChange={(v) => updateSetting('dataSharing', v)}
            />
          </SettingsCard>
        )}

        {/* Reset */}
        <div className="text-center mt-8">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border setting-reset-btn transition-colors duration-200"
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
        </div>
      </main>
    </div>
  );
}
