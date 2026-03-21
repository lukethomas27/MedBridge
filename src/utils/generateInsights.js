// AI insight generation from transcription text using Claude API
// Sends transcription to Claude for three streams of summary
// and a secondary review for confidence scoring.

async function callClaude(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is missing in your .env file');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Claude API error (${response.status}): ${
        errorData.error?.message || response.statusText
      }`
    );
  }

  const data = await response.json();
  return data.content[0].text;
}

function extractJson(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
  } catch (e) {}
  return text;
}

export async function generateInsights(transcription, patient, sessions) {
  if (!transcription || transcription.trim().length < 10) {
    return {
      confidence: 0,
      summary: 'Insufficient transcription data to generate insights.',
      plainSummary: 'Not enough information was recorded.',
      simpleSummary: 'Please record more details.',
      differentials: [],
      medicationFlags: [],
      riskLevel: 'high',
      actionsForDoctor: ['Obtain more detailed history.'],
      actionsForPatient: [],
    };
  }

  // 1. First Request: Three Streams of Summarization
  const summaryPrompt = `You are a medical assistant. Summarize the following doctor-patient transcription into three distinct streams. 
Return ONLY a JSON object with the keys 'simpler', 'plain', and 'more_detail'.

- 'simpler': Very easy to understand, for someone with no medical knowledge. Focus on the main takeaway and next steps.
- 'plain': Clear and direct, using standard language. Balanced between simple and clinical.
- 'more_detail': Including clinical terms, specific findings, and detailed medical observations.

Transcription:
${transcription}`;

  let summaries;
  try {
    const summaryText = await callClaude(summaryPrompt);
    summaries = JSON.parse(extractJson(summaryText));
  } catch (err) {
    console.error('Error generating summaries:', err);
    throw err;
  }

  // 2. Second Request: Review and Score
  const scorePrompt = `You are a medical auditor. Review the following summaries against the original transcription for accuracy and completeness. 
Score the summaries collectively out of 100 based on how well they capture the essential medical information from the transcription.
Return ONLY a JSON object with the key 'score' (an integer 0-100).

Transcription:
${transcription}

Summaries to review:
Simpler: ${summaries.simpler}
Plain: ${summaries.plain}
More Detail: ${summaries.more_detail}`;

  let confidence = 50;
  try {
    const scoreText = await callClaude(scorePrompt);
    const scoreData = JSON.parse(extractJson(scoreText));
    confidence = parseInt(scoreData.score) || 50;
  } catch (err) {
    console.error('Error generating score:', err);
    // Continue with default confidence if only the score fails
  }

  // Follow existing patterns for differentials and other fields
  const text = transcription.toLowerCase();
  const differentials = [];
  if (text.includes('blood pressure') || text.includes('hypertension')) {
    differentials.push({
      label: 'Hypertension-related findings',
      pct: 35 + Math.floor(Math.random() * 20),
    });
  }
  if (text.includes('cough')) {
    differentials.push({
      label: 'Respiratory / cough etiology',
      pct: 25 + Math.floor(Math.random() * 20),
    });
    const hasACE = patient.medications.some(
      (m) =>
        m.toLowerCase().includes('lisinopril') ||
        m.toLowerCase().includes('enalapril')
    );
    if (hasACE) {
      differentials.push({
        label: 'ACE inhibitor-induced cough',
        pct: 30 + Math.floor(Math.random() * 15),
      });
    }
  }
  if (
    text.includes('diabetes') ||
    text.includes('glucose') ||
    text.includes('hba1c')
  ) {
    differentials.push({
      label: 'Glycemic control / diabetes management',
      pct: 40 + Math.floor(Math.random() * 20),
    });
  }

  if (differentials.length < 2) {
    differentials.push({
      label: 'General medical evaluation',
      pct: 20 + Math.floor(Math.random() * 15),
    });
    differentials.push({
      label: 'Routine follow-up findings',
      pct: 10 + Math.floor(Math.random() * 15),
    });
  }

  const total = differentials.reduce((s, d) => s + d.pct, 0);
  differentials.forEach((d) => {
    d.pct = Math.round((d.pct / total) * 100);
  });

  const medicationFlags = [];
  patient.allergies.forEach((allergy) => {
    if (text.includes(allergy.toLowerCase())) {
      medicationFlags.push(
        `⚠ Allergy alert: "${allergy}" mentioned in transcription — verify no contraindicated prescriptions.`
      );
    }
  });
  if (
    text.includes('adherence') ||
    text.includes('missing') ||
    text.includes('skip')
  ) {
    medicationFlags.push('Medication adherence concerns noted in transcription.');
  }

  // Risk level based on confidence score (existing pattern)
  let riskLevel = 'low';
  if (confidence < 70) riskLevel = 'high';
  else if (confidence < 85) riskLevel = 'medium';

  const priorSessions = sessions.filter((s) => s.insights);
  const delta =
    priorSessions.length === 0
      ? 'First session — no prior data for comparison.'
      : `Compared to session on ${
          priorSessions[priorSessions.length - 1].date
        }. Review changes in symptoms and vitals.`;

  return {
    confidence,
    summary: summaries.more_detail,
    plainSummary: summaries.plain,
    simpleSummary: summaries.simpler,
    differentials,
    medicationFlags,
    wearableNote: `Wearable data for ${patient.name}: resting HR and activity levels being monitored. Review trends at next visit.`,
    environmentalNote: `${patient.city}: Current conditions suitable for normal activity. Check local AQI before outdoor exercise.`,
    actionsForDoctor: [
      'Review transcription details and confirm differential assessment.',
      'Schedule appropriate follow-up based on confidence level and risk.',
    ],
    actionsForPatient: [
      {
        icon: '💊',
        text: 'Continue all current medications as prescribed',
        category: 'medication',
      },
      {
        icon: '📋',
        text: 'Note any new or changing symptoms in your health diary',
        category: 'activity',
      },
      {
        icon: '🚶',
        text: 'Maintain regular light physical activity as tolerated',
        category: 'activity',
      },
      {
        icon: '🍎',
        text: 'Follow a balanced diet and stay well hydrated',
        category: 'diet',
      },
      {
        icon: '⚠',
        text: 'Contact your doctor immediately if symptoms worsen or new concerns arise',
        category: 'warning',
      },
      {
        icon: '📅',
        text: 'Attend your next scheduled follow-up appointment',
        category: 'followup',
      },
    ],
    delta,
    riskLevel,
  };
}
