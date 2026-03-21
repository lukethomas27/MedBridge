// Simulated AI insight generation from transcription text
// Parses transcription for keywords and builds insights object

export function generateInsights(transcription, patient, sessions) {
  const text = transcription.toLowerCase();
  const words = transcription.split(/\s+/).length;

  // Confidence based on word count
  let confidence;
  if (words < 80) {
    confidence = Math.floor(45 + Math.random() * 17); // 45-62
  } else if (words <= 150) {
    confidence = Math.floor(63 + Math.random() * 15); // 63-78
  } else {
    confidence = Math.floor(79 + Math.random() * 15); // 79-94
  }

  // Build differentials based on keywords
  const differentials = [];
  if (text.includes('blood pressure') || text.includes('hypertension')) {
    differentials.push({ label: 'Hypertension-related findings', pct: 35 + Math.floor(Math.random() * 20) });
  }
  if (text.includes('cough')) {
    differentials.push({ label: 'Respiratory / cough etiology', pct: 25 + Math.floor(Math.random() * 20) });
    // Check ACE inhibitor
    const hasACE = patient.medications.some(m => m.toLowerCase().includes('lisinopril') || m.toLowerCase().includes('enalapril'));
    if (hasACE) {
      differentials.push({ label: 'ACE inhibitor-induced cough', pct: 30 + Math.floor(Math.random() * 15) });
    }
  }
  if (text.includes('diabetes') || text.includes('glucose') || text.includes('hba1c')) {
    differentials.push({ label: 'Glycemic control / diabetes management', pct: 40 + Math.floor(Math.random() * 20) });
  }

  // Ensure at least 2 differentials
  if (differentials.length < 2) {
    differentials.push({ label: 'General medical evaluation', pct: 20 + Math.floor(Math.random() * 15) });
    differentials.push({ label: 'Routine follow-up findings', pct: 10 + Math.floor(Math.random() * 15) });
  }

  // Normalize percentages
  const total = differentials.reduce((s, d) => s + d.pct, 0);
  differentials.forEach(d => { d.pct = Math.round((d.pct / total) * 100); });

  // Medication flags
  const medicationFlags = [];
  patient.allergies.forEach(allergy => {
    if (text.includes(allergy.toLowerCase())) {
      medicationFlags.push(`⚠ Allergy alert: "${allergy}" mentioned in transcription — verify no contraindicated prescriptions.`);
    }
  });
  if (text.includes('adherence') || text.includes('missing') || text.includes('skip')) {
    medicationFlags.push('Medication adherence concerns noted in transcription.');
  }

  // Risk level
  let riskLevel = 'low';
  if (confidence < 70) riskLevel = 'high';
  else if (confidence < 85) riskLevel = 'medium';

  // Delta
  const priorSessions = sessions.filter(s => s.insights);
  const delta = priorSessions.length === 0
    ? 'First session — no prior data for comparison.'
    : `Compared to session on ${priorSessions[priorSessions.length - 1].date}. Review changes in symptoms and vitals.`;

  // Summary generation
  const summary = `Clinical evaluation documented. ${differentials.map(d => d.label).join(', ')} identified as key considerations. Confidence level: ${confidence}/100.`;
  const plainSummary = `Your doctor reviewed your health today. The main topics were: ${differentials.map(d => d.label.toLowerCase()).join(' and ')}. ${confidence >= 70 ? 'The analysis is fairly confident.' : 'Some parts need more information from your doctor.'}`;
  const simpleSummary = `Your doctor checked on you. ${confidence >= 70 ? 'Things look mostly clear.' : 'Your doctor may need to add more notes.'} Follow your action plan below.`;

  return {
    confidence,
    summary,
    plainSummary,
    simpleSummary,
    differentials,
    medicationFlags,
    wearableNote: `Wearable data for ${patient.name}: resting HR and activity levels being monitored. Review trends at next visit.`,
    environmentalNote: `${patient.city}: Current conditions suitable for normal activity. Check local AQI before outdoor exercise.`,
    actionsForDoctor: [
      'Review transcription details and confirm differential assessment.',
      'Schedule appropriate follow-up based on confidence level and risk.',
    ],
    actionsForPatient: [
      { icon: '💊', text: 'Continue all current medications as prescribed', category: 'medication' },
      { icon: '📋', text: 'Note any new or changing symptoms in your health diary', category: 'activity' },
      { icon: '🚶', text: 'Maintain regular light physical activity as tolerated', category: 'activity' },
      { icon: '🍎', text: 'Follow a balanced diet and stay well hydrated', category: 'diet' },
      { icon: '⚠', text: 'Contact your doctor immediately if symptoms worsen or new concerns arise', category: 'warning' },
      { icon: '📅', text: 'Attend your next scheduled follow-up appointment', category: 'followup' },
    ],
    delta,
    riskLevel,
  };
}
