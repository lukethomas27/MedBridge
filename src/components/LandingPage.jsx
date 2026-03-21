import { FileText, Activity, CheckCircle } from 'lucide-react';

function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F4EF', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @keyframes gradientDrift {
          0% { background-position: 0% 0%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 0% 50%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: '#00C9A7' }}
            />
            <span
              className="text-xl font-bold"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              HealthForge
            </span>
          </div>
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('doctor')}
              className="bg-transparent border-none cursor-pointer text-sm transition-all duration-200"
              style={{
                fontFamily: 'system-ui, sans-serif',
                color: '#0B1929',
                borderBottom: '2px solid transparent',
              }}
              onMouseEnter={(e) => (e.target.style.borderBottomColor = '#00C9A7')}
              onMouseLeave={(e) => (e.target.style.borderBottomColor = 'transparent')}
            >
              For Doctors
            </button>
            <button
              onClick={() => onNavigate('patient')}
              className="bg-transparent border-none cursor-pointer text-sm transition-all duration-200"
              style={{
                fontFamily: 'system-ui, sans-serif',
                color: '#0B1929',
                borderBottom: '2px solid transparent',
              }}
              onMouseEnter={(e) => (e.target.style.borderBottomColor = '#00C9A7')}
              onMouseLeave={(e) => (e.target.style.borderBottomColor = 'transparent')}
            >
              For Patients
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-32 pb-16 px-6">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 40%, #00C9A7, transparent 50%), radial-gradient(circle at 70% 60%, #0B1929, transparent 50%)',
            opacity: 0.08,
            backgroundSize: '200% 200%',
            animation: 'gradientDrift 15s ease infinite',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1
            className="text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
          >
            The space between your appointment and your health.
          </h1>
          <p className="text-xl text-gray-500 mb-10" style={{ fontFamily: 'system-ui, sans-serif' }}>
            HealthForge turns what your doctor said into what you actually need to do.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button
              onClick={() => onNavigate('doctor')}
              className="px-8 py-3 rounded-sm text-white font-medium cursor-pointer border-none transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: '#0B1929' }}
            >
              {"I'm a Doctor \u2192"}
            </button>
            <button
              onClick={() => onNavigate('patient')}
              className="px-8 py-3 rounded-sm font-medium cursor-pointer border-none transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: '#00C9A7', color: '#0B1929' }}
            >
              {"I'm a Patient \u2192"}
            </button>
          </div>
          <p className="text-sm text-gray-400">
            Trusted by practitioners. Designed for patients.
          </p>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <FileText
              size={40}
              strokeWidth={1.5}
              style={{ color: '#00C9A7' }}
              className="mb-4"
            />
            <h3
              className="text-xl font-bold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              Transcription
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Every word from your consultation, captured and stored. Your doctor's notes become a shared record.
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <Activity
              size={40}
              strokeWidth={1.5}
              style={{ color: '#00C9A7' }}
              className="mb-4"
            />
            <h3
              className="text-xl font-bold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              AI Insights
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Complex medical language translated into clear, honest guidance. Confidence-scored so you know how certain the AI is.
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <CheckCircle
              size={40}
              strokeWidth={1.5}
              style={{ color: '#00C9A7' }}
              className="mb-4"
            />
            <h3
              className="text-xl font-bold mb-3"
              style={{ fontFamily: 'Georgia, serif', color: '#0B1929' }}
            >
              Action Plans
            </h3>
            <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Not just information — a daily plan. Medication reminders, environmental alerts, warning signs to watch for.
            </p>
          </div>
        </div>
      </section>

      {/* Closing Section */}
      <section className="py-24 px-6 text-center" style={{ backgroundColor: '#0B1929' }}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-4xl font-bold text-white mb-6"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Built for the gap nobody talks about.
          </h2>
          <p className="text-lg text-gray-300 mb-10" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Patients retain less than 20% of what they're told at appointments. HealthForge makes that 100%.
          </p>
          <button
            onClick={() => onNavigate('doctor')}
            className="px-8 py-3 rounded-sm bg-white font-medium cursor-pointer border-none transition-all duration-200 hover:opacity-90"
            style={{ color: '#0B1929' }}
          >
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
