import { supabase } from './supabase';

// Fetch doctor by id
export async function fetchDoctor(doctorId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', doctorId)
    .single();
  if (error) throw error;
  return { ...data, role: 'doctor' };
}

// Fetch first doctor (for demo login)
export async function fetchFirstDoctor() {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .limit(1)
    .single();
  if (error) throw error;
  return { ...data, role: 'doctor' };
}

// Fetch patients for a doctor, with sessions + insights + actions
export async function fetchPatientsForDoctor(doctorId) {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('doctor_id', doctorId);
  if (error) throw error;

  // For each patient, fetch sessions with insights and actions
  const fullPatients = await Promise.all(
    patients.map(async (patient) => {
      const sessions = await fetchSessionsForPatient(patient.id);
      return normalizePatient(patient, sessions);
    })
  );

  return fullPatients;
}

// Fetch a single patient with full session data
export async function fetchPatient(patientId) {
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();
  if (error) throw error;

  const sessions = await fetchSessionsForPatient(patient.id);
  return normalizePatient(patient, sessions);
}

// Fetch sessions for a patient with insights and actions
async function fetchSessionsForPatient(patientId) {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });
  if (error) throw error;

  const fullSessions = await Promise.all(
    sessions.map(async (session) => {
      const { data: insights } = await supabase
        .from('insights')
        .select('*')
        .eq('session_id', session.id)
        .maybeSingle();

      let actionsForPatient = [];
      if (insights) {
        const { data: actions } = await supabase
          .from('patient_actions')
          .select('*')
          .eq('insight_id', insights.id)
          .order('sort_order', { ascending: true });
        actionsForPatient = (actions || []).map(a => ({
          icon: a.icon,
          text: a.text,
          category: a.category,
        }));
      }

      return {
        id: session.id,
        date: session.date,
        transcription: session.transcription,
        insights: insights
          ? {
              confidence: insights.confidence,
              riskLevel: insights.risk_level,
              summary: insights.summary,
              plainSummary: insights.plain_summary,
              simpleSummary: insights.simple_summary,
              differentials: insights.differentials,
              medicationFlags: insights.medication_flags || [],
              wearableNote: insights.wearable_note,
              environmentalNote: insights.environmental_note,
              actionsForDoctor: insights.actions_for_doctor || [],
              actionsForPatient,
              delta: insights.delta,
              doctorNote: insights.doctor_note,
              approved: insights.approved || false,
            }
          : null,
      };
    })
  );

  return fullSessions;
}

// Normalize DB patient row to app shape
function normalizePatient(dbPatient, sessions) {
  const dob = dbPatient.dob;
  const age = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return {
    id: dbPatient.id,
    name: dbPatient.name,
    dob,
    age,
    email: dbPatient.email,
    allergies: dbPatient.allergies || [],
    medications: dbPatient.medications || [],
    city: dbPatient.city,
    doctorId: dbPatient.doctor_id,
    sessions,
  };
}

// ============================================
// SHARE OPERATIONS
// ============================================

export async function createShareInvite(patientId, email, accessType, sessionId = null) {
  const { data, error } = await supabase
    .from('patient_shares')
    .insert({
      patient_id: patientId,
      shared_with_email: email,
      access_type: accessType,
      session_id: sessionId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSharesForPatient(patientId) {
  const { data, error } = await supabase
    .from('patient_shares')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function revokeShare(shareId) {
  const { error } = await supabase
    .from('patient_shares')
    .update({ status: 'revoked' })
    .eq('id', shareId);

  if (error) throw error;
}

export async function fetchSharedDataByToken(token) {
  const { data: share, error: shareErr } = await supabase
    .from('patient_shares')
    .select('*, patients(*)')
    .eq('token', token)
    .neq('status', 'revoked')
    .single();

  if (shareErr) throw shareErr;

  let sharedData = {
    patient: {
      name: share.patients.name,
      email: share.patients.email,
    },
    accessType: share.access_type,
  };

  if (share.access_type === 'individual_session') {
    const session = await fetchSessionWithInsights(share.session_id);
    sharedData.sessions = [session];
  } else {
    sharedData.sessions = await fetchSessionsForPatient(share.patient_id);
  }

  return sharedData;
}

async function fetchSessionWithInsights(sessionId) {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;

  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('session_id', session.id)
    .maybeSingle();

  let actionsForPatient = [];
  if (insights) {
    const { data: actions } = await supabase
      .from('patient_actions')
      .select('*')
      .eq('insight_id', insights.id)
      .order('sort_order', { ascending: true });
    actionsForPatient = (actions || []).map(a => ({
      icon: a.icon,
      text: a.text,
      category: a.category,
    }));
  }

  return {
    id: session.id,
    date: session.date,
    transcription: session.transcription,
    insights: insights
      ? {
          confidence: insights.confidence,
          riskLevel: insights.risk_level,
          summary: insights.summary,
          plainSummary: insights.plain_summary,
          simpleSummary: insights.simple_summary,
          differentials: insights.differentials,
          medicationFlags: insights.medication_flags || [],
          wearableNote: insights.wearable_note,
          environmentalNote: insights.environmental_note,
          actionsForDoctor: insights.actions_for_doctor || [],
          actionsForPatient,
          delta: insights.delta,
          doctorNote: insights.doctor_note,
          approved: insights.approved || false,
        }
      : null,
  };
}

// Create a new session (no insights yet)
export async function createSession(patientId) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      patient_id: patientId,
      date: new Date().toISOString().split('T')[0],
      transcription: '',
    })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, date: data.date, transcription: '', insights: null };
}

// Update session transcription
export async function updateTranscription(sessionId, transcription) {
  const { error } = await supabase
    .from('sessions')
    .update({ transcription })
    .eq('id', sessionId);
  if (error) throw error;

  // Delete old insights when transcription changes
  await supabase.from('insights').delete().eq('session_id', sessionId);
}

// Save generated insights for a session
export async function saveInsights(sessionId, insights) {
  // Delete existing insights first
  const { data: existing } = await supabase
    .from('insights')
    .select('id, doctor_note')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (existing) {
    await supabase.from('patient_actions').delete().eq('insight_id', existing.id);
    await supabase.from('insights').delete().eq('id', existing.id);
  }

  // Insert new insight (preserving doctor_note if it exists)
  const { data: newInsight, error } = await supabase
    .from('insights')
    .insert({
      session_id: sessionId,
      confidence: insights.confidence,
      risk_level: insights.riskLevel,
      summary: insights.summary,
      plain_summary: insights.plainSummary,
      simple_summary: insights.simpleSummary,
      differentials: insights.differentials,
      medication_flags: insights.medicationFlags,
      wearable_note: insights.wearableNote,
      environmental_note: insights.environmentalNote,
      actions_for_doctor: insights.actionsForDoctor,
      delta: insights.delta,
      doctor_note: existing?.doctor_note || null,
      approved: false,
    })
    .select()
    .single();
  if (error) throw error;

  // Insert patient actions
  if (insights.actionsForPatient?.length) {
    const rows = insights.actionsForPatient.map((a, i) => ({
      insight_id: newInsight.id,
      icon: a.icon,
      text: a.text,
      category: a.category,
      sort_order: i + 1,
    }));
    const { error: actErr } = await supabase.from('patient_actions').insert(rows);
    if (actErr) throw actErr;
  }
}

// Update the doctor's manual addendum/note
export async function updateInsightNote(sessionId, doctorNote) {
  const { error } = await supabase
    .from('insights')
    .update({ doctor_note: doctorNote })
    .eq('session_id', sessionId);
  if (error) throw error;
}

// Approve insights so they become visible to the patient
export async function approveInsights(sessionId) {
  const { error } = await supabase
    .from('insights')
    .update({ approved: true })
    .eq('session_id', sessionId);
  if (error) throw error;
}

// Delete a single session and its cascading data
export async function deleteSession(sessionId) {
  const { data: insight } = await supabase
    .from('insights')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (insight) {
    await supabase.from('patient_actions').delete().eq('insight_id', insight.id);
    await supabase.from('insights').delete().eq('id', insight.id);
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

// Bulk delete all sessions that have no transcription
export async function deleteEmptySessions() {
  const { data: emptySessions, error: fetchErr } = await supabase
    .from('sessions')
    .select('id')
    .or('transcription.eq.,transcription.is.null');

  if (fetchErr) throw fetchErr;

  if (emptySessions && emptySessions.length > 0) {
    const ids = emptySessions.map(s => s.id);
    
    // First clean up insights and actions for these IDs
    const { data: insights } = await supabase
      .from('insights')
      .select('id')
      .in('session_id', ids);

    if (insights && insights.length > 0) {
      const insightIds = insights.map(i => i.id);
      await supabase.from('patient_actions').delete().in('insight_id', insightIds);
      await supabase.from('insights').delete().in('id', insightIds);
    }

    const { error: deleteErr } = await supabase
      .from('sessions')
      .delete()
      .in('id', ids);

    if (deleteErr) throw deleteErr;
    return ids.length;
  }
  return 0;
}
