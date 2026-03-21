// HealthForge Seed Data — single source of truth for all patient/session data

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

export const SEED_DATA = {
  doctor: {
    id: 'doc-1',
    name: 'Dr. Emily Chen',
    role: 'doctor',
    specialty: 'Internal Medicine',
    email: 'dr.chen@healthforge.io',
  },

  patients: [
    {
      id: 'patient-1',
      name: 'Sarah Kim',
      dob: '1989-04-12',
      age: 36,
      email: 'sarah.k@email.com',
      allergies: ['Penicillin', 'Shellfish'],
      medications: ['Lisinopril 10mg (daily)', 'Cetirizine 10mg (as needed)'],
      city: 'Victoria, BC',
      doctorId: 'doc-1',
      sessions: [
        {
          id: 'session-s2',
          date: daysAgo(3),
          transcription:
            'Follow-up visit for persistent cough. Patient reports cough frequency has decreased by approximately 50% over the past two weeks. Still present at night but less disruptive. No new symptoms. Blood pressure 124/78 — well controlled. Reviewed cough diary: average 4-5 episodes per day, down from 10+. Given improvement trend, will continue Lisinopril for now rather than switching. If cough does not fully resolve in 3 more weeks, will transition to Losartan. Patient tolerating Cetirizine well. Seasonal allergies mild this year. Advised continued hydration and monitoring. Next follow-up in 3 weeks or sooner if symptoms worsen.',
          insights: {
            confidence: 91,
            summary:
              'Follow-up shows significant improvement in cough frequency (~50% reduction). BP remains well controlled at 124/78. Decision to continue current Lisinopril regimen with conditional plan to switch to ARB if cough persists beyond 3 weeks. Low acute risk.',
            plainSummary:
              'Great news — your cough is getting better. It has decreased by about half since your last visit. Your blood pressure is in a good range. Your doctor has decided to keep you on the same medication for now, but will switch it if the cough does not go away completely in the next three weeks.',
            simpleSummary:
              'Your cough is much better. Your doctor is keeping your medicine the same for now. Come back in 3 weeks.',
            differentials: [
              { label: 'ACE inhibitor-induced cough (improving)', pct: 55 },
              { label: 'Residual post-nasal drip', pct: 30 },
              { label: 'Resolved viral component', pct: 15 },
            ],
            medicationFlags: [],
            wearableNote:
              'Sleep quality improved — average 7.1 hours vs 6.4 hours at last visit. Resting HR stable at 70 bpm.',
            environmentalNote:
              'Victoria, BC: AQI 38 (Good). Pollen levels low this week — favorable for respiratory symptoms.',
            actionsForDoctor: [
              'Continue Lisinopril; reassess at 3-week follow-up.',
              'Order baseline spirometry if cough recurs or worsens.',
            ],
            actionsForPatient: [
              { icon: '💊', text: 'Keep taking Lisinopril 10mg every morning — do not stop without asking your doctor', category: 'medication' },
              { icon: '💊', text: 'Take Cetirizine as needed if you notice allergy symptoms', category: 'medication' },
              { icon: '📋', text: 'Continue tracking your cough in your diary', category: 'activity' },
              { icon: '🚶', text: 'Light daily walks (20-30 min) to support cardiovascular health', category: 'activity' },
              { icon: '🍎', text: 'Maintain good hydration — aim for 8 glasses of water daily', category: 'diet' },
              { icon: '⚠', text: 'If cough suddenly worsens or you develop shortness of breath, contact your doctor immediately', category: 'warning' },
              { icon: '📅', text: 'Next appointment in 3 weeks — book now to secure your slot', category: 'followup' },
            ],
            delta: 'Cough frequency reduced ~50% since last visit. BP improved from 128/82 to 124/78. Sleep quality up. Overall positive trend.',
            riskLevel: 'low',
          },
        },
        {
          id: 'session-s1',
          date: daysAgo(14),
          transcription:
            'Patient presents with persistent dry cough for approximately three weeks. Reports cough is worse at night and occasionally disrupts sleep. No fever, no hemoptysis. Currently taking Lisinopril 10mg daily for mild hypertension diagnosed six months ago. Blood pressure today 128/82. Lungs clear on auscultation bilaterally. Throat mildly erythematous. Discussed possibility of ACE inhibitor-induced cough — Lisinopril is a known cause. Plan: monitor for two more weeks, if cough persists, consider switching to ARB (losartan). Patient advised to track cough frequency and any new symptoms. Allergies confirmed: Penicillin and Shellfish. No changes to Cetirizine.',
          insights: {
            confidence: 82,
            summary:
              'Patient presents with a 3-week persistent dry cough, likely ACE inhibitor-related given current Lisinopril use. BP controlled at 128/82. No acute respiratory findings. Plan to monitor and potentially switch antihypertensive class.',
            plainSummary:
              'You have a cough that has lasted about three weeks. Your doctor thinks it might be caused by one of your blood pressure medications (Lisinopril). Your blood pressure is looking good. The plan is to watch the cough for two more weeks and possibly switch you to a different medication if it does not improve.',
            simpleSummary:
              'Your cough might be from your blood pressure pill. Your doctor will watch it and may change your medicine soon.',
            differentials: [
              { label: 'ACE inhibitor-induced cough', pct: 68 },
              { label: 'Post-nasal drip / allergic rhinitis', pct: 18 },
              { label: 'Viral upper respiratory (resolving)', pct: 14 },
            ],
            medicationFlags: [
              'Lisinopril is an ACE inhibitor — dry cough is a recognized side effect in ~10-15% of patients.',
            ],
            wearableNote:
              'Resting heart rate has remained stable (68-72 bpm). No significant sleep disruption detected beyond mild fragmentation on nights with reported cough episodes.',
            environmentalNote:
              'Victoria, BC: AQI is 42 (Good). Moderate pollen levels — may contribute to post-nasal drip component.',
            actionsForDoctor: [
              'Monitor cough for 2 additional weeks; schedule follow-up.',
              'If cough persists, switch Lisinopril to Losartan 50mg and reassess in 4 weeks.',
            ],
            actionsForPatient: [
              { icon: '💊', text: 'Continue taking Lisinopril 10mg every morning with water', category: 'medication' },
              { icon: '📋', text: 'Track your cough — note how many times per day and if it worsens at night', category: 'activity' },
              { icon: '🌿', text: 'Check daily pollen levels — stay indoors on high-pollen days', category: 'environment' },
              { icon: '🍎', text: 'Stay hydrated — warm liquids may soothe throat irritation', category: 'diet' },
              { icon: '⚠', text: 'Seek immediate care if you develop difficulty breathing, chest pain, or cough up blood', category: 'warning' },
              { icon: '📅', text: 'Follow-up appointment in 2 weeks to reassess cough', category: 'followup' },
            ],
            delta: 'First session — no prior data for comparison.',
            riskLevel: 'medium',
          },
        },
      ],
    },
    {
      id: 'patient-2',
      name: 'James Miller',
      dob: '1975-11-30',
      age: 50,
      email: 'james.m@email.com',
      allergies: ['Sulfa drugs'],
      medications: ['Metformin 500mg (twice daily)', 'Atorvastatin 20mg (nightly)'],
      city: 'Victoria, BC',
      doctorId: 'doc-1',
      sessions: [
        {
          id: 'session-j1',
          date: daysAgo(7),
          transcription:
            'Diabetes management check. HbA1c came back at 7.8% — above target of 7.0%. Fasting glucose this morning 156 mg/dL. Patient reports inconsistent medication adherence, missing Metformin doses 2-3 times per week. Diet review: high carbohydrate intake, frequent fast food. Weight 210 lbs, BMI 30.2. Blood pressure 138/88 — borderline elevated. Discussed importance of medication compliance and dietary modifications. Considering adding a second agent if HbA1c does not improve. Cholesterol panel: LDL 142, HDL 38 — suboptimal. Atorvastatin dose may need increase. Referred to nutritionist. Follow-up in 6 weeks with repeat labs.',
          insights: {
            confidence: 61,
            summary:
              'Type 2 diabetes with suboptimal control — HbA1c 7.8% (target <7.0%). Non-adherence to Metformin regimen is primary contributor. Elevated fasting glucose and borderline hypertension. Lipid panel suboptimal despite Atorvastatin. Multi-factorial lifestyle intervention needed.',
            plainSummary:
              'Your blood sugar levels are higher than your doctor would like. The main reason is that you are missing some of your Metformin doses. Your cholesterol could also be better. Your doctor wants you to see a nutritionist and come back in 6 weeks for new blood tests.',
            simpleSummary:
              'Your blood sugar is too high because you are missing your medicine. You need to eat healthier and take your pills every day. See a food expert and come back in 6 weeks.',
            differentials: [
              { label: 'Poor glycemic control — medication non-adherence', pct: 52 },
              { label: 'Dietary factors (high carb / fast food)', pct: 30 },
              { label: 'Possible need for therapy escalation', pct: 18 },
            ],
            medicationFlags: [
              'Patient reports missing Metformin 2-3 times/week — critical adherence gap.',
              'Atorvastatin may need dose increase given LDL of 142 (target <100 for diabetic patients).',
            ],
            wearableNote:
              'Resting heart rate elevated at 82 bpm. Activity levels low — average 2,800 steps/day. Sleep average 5.8 hours — below recommended.',
            environmentalNote:
              'Victoria, BC: No acute environmental concerns. AQI 42 (Good). Outdoor exercise conditions favorable.',
            actionsForDoctor: [
              'Reinforce medication adherence; consider pill organizer or reminders.',
              'If HbA1c does not improve in 6 weeks, add second oral agent or GLP-1 agonist.',
              'Consider increasing Atorvastatin to 40mg given LDL 142.',
              'Monitor blood pressure — if sustained >135/85, initiate antihypertensive.',
            ],
            actionsForPatient: [
              { icon: '💊', text: 'Take Metformin 500mg TWICE daily — with breakfast and dinner, never skip', category: 'medication' },
              { icon: '💊', text: 'Take Atorvastatin 20mg every night before bed', category: 'medication' },
              { icon: '🍎', text: 'Reduce fast food to once per week maximum — choose grilled options when eating out', category: 'diet' },
              { icon: '🍎', text: 'Eat more vegetables, lean proteins, and whole grains — cut sugary drinks completely', category: 'diet' },
              { icon: '🚶', text: 'Walk at least 30 minutes every day — even a short walk after meals helps blood sugar', category: 'activity' },
              { icon: '⚠', text: 'If you feel dizzy, extremely thirsty, or urinate excessively, contact your doctor right away', category: 'warning' },
              { icon: '⚠', text: 'Do NOT stop taking any medication without talking to your doctor first', category: 'warning' },
              { icon: '📅', text: 'Nutritionist appointment — call to schedule this week', category: 'followup' },
              { icon: '📅', text: 'Follow-up with blood work in 6 weeks', category: 'followup' },
            ],
            delta: 'First session — no prior data for comparison.',
            riskLevel: 'high',
          },
        },
      ],
    },
    {
      id: 'patient-3',
      name: 'Robert "Bob" Thompson',
      dob: '1948-06-15',
      age: 78,
      email: 'bob.t@email.com',
      allergies: ['Pollen', 'Dust mites'],
      medications: ['Donepezil 10mg (nightly)', 'Amlodipine 5mg (morning)'],
      city: 'Victoria, BC',
      doctorId: 'doc-1',
      sessions: [
        {
          id: 'session-b1',
          date: daysAgo(2),
          transcription:
            'Routine follow-up for 78-year-old male with hypertension and early-stage Alzheimer\'s disease. Accompanied by daughter, Sarah. Patient reports occasional dizziness in the mornings. Blood pressure today 145/92 — slightly elevated. Heart rate 72 bpm. Medication review: Donepezil 10mg and Amlodipine 5mg. Sarah reports Bob has been forgetting his morning Amlodipine occasionally. Cognitive screening (MMSE) shows slight decline since last year (23/30). Lungs clear. Neurological exam stable. Plan: Increase Amlodipine to 10mg daily. Discussed importance of medication adherence. Sarah will implement a pill organizer and smart reminder system. Bob encouraged to stay physically active with supervised daily walks. Follow-up in 1 month.',
          insights: {
            confidence: 88,
            summary:
              'Elderly patient with hypertension and early-stage Alzheimer\'s. BP elevated (145/92) likely due to inconsistent Amlodipine adherence. Cognitive screening indicates slight decline (MMSE 23/30). Therapy escalated to Amlodipine 10mg. Family involvement (daughter) is critical for medication management and safety.',
            plainSummary:
              'Bob\'s blood pressure is a bit high right now, mostly because he has been forgetting his morning medicine. His memory test showed a small decline. The doctor is increasing his blood pressure pill to a higher dose. Sarah, you will need to help him with a pill organizer to make sure he takes it every day. He should also go for a walk with you once a day.',
            simpleSummary:
              'Bob needs to take his new, stronger heart pill every morning. Sarah will help him with a pill box. Go for a walk together every day.',
            differentials: [
              { label: 'Hypertension — medication non-adherence', pct: 60 },
              { label: 'Early-stage Alzheimer\'s disease', pct: 35 },
              { label: 'Orthostatic hypotension risk', pct: 5 },
            ],
            medicationFlags: [
              'Increased Amlodipine from 5mg to 10mg daily.',
              'Monitor for dizziness after dose increase.',
            ],
            wearableNote:
              'Steps are low (1,500/day). Sleep is fragmented with several nighttime wake periods. Resting HR 72 bpm.',
            environmentalNote:
              'Victoria, BC: Cold weather currently — recommend indoor exercise or proper layering for walks.',
            actionsForDoctor: [
              'Implement medication reminder system with family.',
              'Re-screen MMSE in 6 months.',
              'Schedule follow-up for BP check in 4 weeks.',
            ],
            actionsForPatient: [
              { icon: '💊', text: 'Start taking NEW Amlodipine 10mg dose every morning', category: 'medication' },
              { icon: '💊', text: 'Continue Donepezil 10mg every night before bed', category: 'medication' },
              { icon: '📅', text: 'Use a pill organizer for all morning and evening medicines', category: 'activity' },
              { icon: '🚶', text: 'Daily 20-minute walk with Sarah to stay active', category: 'activity' },
              { icon: '⚠', text: 'If Bob feels dizziness when standing up, please notify the doctor', category: 'warning' },
              { icon: '📅', text: 'Follow-up appointment for blood pressure check in 4 weeks', category: 'followup' },
            ],
            delta: 'MMSE score down 2 points from previous year. BP up from 135/85 to 145/92.',
            riskLevel: 'medium',
          },
        },
      ],
    },
  ],
};
