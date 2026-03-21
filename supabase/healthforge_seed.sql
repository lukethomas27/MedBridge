-- HealthForge Seed Data
-- Run this AFTER schema.sql
-- Includes: doctors, patients, wearable_snapshots, wearable_anomalies,
--           environment_snapshots, sessions, insights, patient_actions

-- Fixed UUIDs
-- Doctors:              a0000000-0000-0000-0000-000000000001
-- Patients:             b0000000-0000-0000-0000-000000000001 (Sarah Kim)
--                       b0000000-0000-0000-0000-000000000002 (James Miller)
-- Sessions:             c0000000-0000-0000-0000-000000000001 (Sarah S1)
--                       c0000000-0000-0000-0000-000000000002 (Sarah S2)
--                       c0000000-0000-0000-0000-000000000003 (James S1)
-- Insights:             e0000000-0000-0000-0000-000000000001 (Sarah S1)
--                       e0000000-0000-0000-0000-000000000002 (Sarah S2)
--                       e0000000-0000-0000-0000-000000000003 (James S1)
-- Wearable snapshots:   f0000000-0000-0000-0000-000000000001 (Sarah)
--                       f0000000-0000-0000-0000-000000000002 (James)
-- Wearable anomalies:   d0000000-0000-0000-0000-000000000001 (James HR spike)
--                       d0000000-0000-0000-0000-000000000002 (James SpO2 dip)
-- Environment:          g0000000-0000-0000-0000-000000000001 (Sarah)
--                       g0000000-0000-0000-0000-000000000002 (James)


-- ============================================
-- DOCTOR
-- ============================================

insert into doctors (id, name, specialty, email) values
  ('a0000000-0000-0000-0000-000000000001', 'Dr. Emily Chen', 'Internal Medicine', 'dr.chen@healthforge.io');


-- ============================================
-- PATIENTS
-- ============================================

insert into patients (id, doctor_id, name, dob, email, allergies, medications, city) values
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Sarah Kim',
    '1989-04-12',
    'sarah.k@email.com',
    array['Penicillin', 'Shellfish'],
    array['Losartan 50mg (daily, morning)', 'Cetirizine 10mg (as needed — take before outdoor exposure)'],
    'Victoria, BC'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'James Miller',
    '1975-11-30',
    'james.m@email.com',
    array['Sulfa drugs'],
    array['Metformin 1000mg (twice daily, with meals)', 'Atorvastatin 20mg (nightly)'],
    'Victoria, BC'
  );


-- =========================================  ===
-- WEARABLE SNAPSHOTS
-- Current readings + 7-day trend arrays per patient
-- Stored as JSONB — one row per patient per day (latest replaces previous in prod)
-- ============================================

insert into wearable_snapshots (id, patient_id, device, last_sync, resting_hr, hrv, spo2, sleep_avg_hrs, steps_today, active_minutes_today, trend_7day) values
  (
    'f0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Apple Watch Series 9',
    '2026-03-21T07:42:00',
    68,
    42,
    97,
    5.8,
    3200,
    18,
    '{
      "resting_hr":  [81, 79, 76, 74, 72, 69, 68],
      "sleep_hrs":   [4.9, 5.1, 5.5, 5.2, 6.1, 5.8, 5.8],
      "spo2":        [96, 97, 97, 96, 97, 97, 97]
    }'::jsonb
    -- Sarah: HR was elevated while on Lisinopril, now normalizing after switch to Losartan
    -- Sleep still below target (7-9hrs) — primary remaining concern
    -- No active anomalies
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'Fitbit Charge 6',
    '2026-03-21T06:15:00',
    84,
    28,
    95,
    6.1,
    1100,
    4,
    '{
      "resting_hr":  [79, 81, 80, 83, 85, 82, 84],
      "sleep_hrs":   [6.4, 5.8, 6.2, 5.9, 6.3, 6.0, 6.1],
      "spo2":        [94, 95, 95, 94, 93, 95, 95]
    }'::jsonb
    -- James: HR creeping up 79->84 over 7 days — flagged in insights
    -- HRV low at 28ms — consistent with poor metabolic control
    -- SpO2 dipped to 93% on day 5 — anomaly recorded separately below
    -- Steps extremely low (1100 today) vs 150min/week goal
  );


-- ============================================
-- WEARABLE ANOMALIES
-- Events that fall outside normal thresholds
-- severity: 'critical' | 'high' | 'medium' | 'low'
-- alert_to: who gets notified
--   'doctor'           → surfaces in doctor dashboard + insights panel
--   'emergency_contact'→ triggers SMS/push to listed emergency contact
--   'patient'          → surfaces in patient dashboard as a warning action item
-- resolved: false = still active / unacknowledged by doctor
-- ============================================

insert into wearable_anomalies (id, patient_id, type, severity, occurred_at, description, alert_to, resolved, display_note) values
  (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'hr_spike_sleep',
    'medium',
    '2026-03-20T02:14:00',
    'Resting HR spiked to 112 bpm during sleep. Duration: 8 minutes. No movement detected during event. Returned to baseline (82 bpm) without intervention. Single isolated event.',
    array['doctor'],
    -- medium severity = doctor only, not emergency contact (single event, self-resolving)
    false,
    'Nighttime HR spike detected March 20 at 2:14am — heart rate reached 112 bpm for 8 minutes while asleep. Flagged for Dr. Chen to review.'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'spo2_dip',
    'medium',
    '2026-03-19T03:30:00',
    'SpO2 reading of 93% recorded at 3:30am. Single reading lasting approximately 4 minutes. May indicate mild sleep-disordered breathing or poor sensor contact during movement.',
    array['doctor'],
    -- SpO2 93% = medium (not critical until below 92%)
    -- If this were below 92% it would also alert emergency_contact
    false,
    'Oxygen level briefly reached 93% during sleep on March 19 at 3:30am. Normal is 95% or above. Flagged for Dr. Chen to review — may indicate mild sleep-related breathing issue.'
  );

-- NOTE: Anomaly severity thresholds for reference (enforce in application logic):
-- HR = 0 for 2+ min          → critical → alert: doctor, emergency_contact, patient
-- HR > 150 at rest            → high    → alert: doctor, patient
-- HR spike (>110) during sleep → medium  → alert: doctor
-- HR trend +10bpm over 7d    → medium  → alert: doctor
-- SpO2 < 92%                 → high    → alert: doctor, emergency_contact
-- SpO2 93-94%                → medium  → alert: doctor
-- SpO2 < 88%                 → critical→ alert: doctor, emergency_contact, patient
-- Fall detected, no movement 5min → critical → alert: all
-- Sleep < 6hrs for 5+ days   → low     → surfaces in insights only


-- ============================================
-- ENVIRONMENT SNAPSHOTS
-- One row per patient per day (simulated — in prod would be fetched from weather API)
-- environment_triggers is a JSONB array of rules evaluated at render time
-- to inject dynamic action items into the patient's action plan
-- ============================================

insert into environment_snapshots (id, patient_id, recorded_at, aqi, aqi_label, aqi_note, pollen_level, pollen_type, uv_index, temp_c, humidity, environment_triggers) values
  (
    'g0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '2026-03-21T08:00:00',
    38,
    'Good',
    null,
    'High',
    'Tree pollen (Birch)',
    4,
    11,
    72,
    '[
      {
        "id": "high-pollen-antihistamine",
        "condition_description": "Pollen High AND patient takes Cetirizine",
        "action": {
          "icon": "🌿",
          "text": "Pollen is High today (Birch tree). Take your Cetirizine before going outside — this is especially important given your allergy history.",
          "category": "environment",
          "checkable": true,
          "priority": 1
        }
      },
      {
        "id": "high-pollen-windows",
        "condition_description": "Pollen High AND patient has respiratory diagnosis in recent session",
        "action": {
          "icon": "🏠",
          "text": "Consider keeping windows closed today and avoiding outdoor exercise during peak pollen hours (10am–3pm).",
          "category": "environment",
          "checkable": true,
          "priority": 2
        }
      }
    ]'::jsonb
  ),
  (
    'g0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    '2026-03-21T08:00:00',
    78,
    'Moderate',
    'Construction activity nearby — elevated particulate matter',
    'Moderate',
    'Tree pollen (Alder)',
    3,
    10,
    68,
    '[
      {
        "id": "moderate-aqi-diabetes",
        "condition_description": "AQI >= 75 AND patient has diabetes diagnosis",
        "action": {
          "icon": "🏠",
          "text": "Air quality is Moderate today (AQI 78) due to nearby construction. For people managing diabetes, poor air quality can affect blood sugar. Consider indoor exercise today instead of walking outside.",
          "category": "environment",
          "checkable": true,
          "priority": 1
        }
      },
      {
        "id": "moderate-aqi-cardiovascular",
        "condition_description": "AQI >= 75 AND wearable resting_hr elevated",
        "action": {
          "icon": "💨",
          "text": "If you do go outside, avoid areas with visible construction dust. Air pollution places extra strain on the cardiovascular system.",
          "category": "environment",
          "checkable": true,
          "priority": 2
        }
      }
    ]'::jsonb
  );


-- ============================================
-- SESSIONS
-- Transcriptions are formatted as doctor/patient dialogue
-- ============================================

insert into sessions (id, patient_id, date, transcription) values

  -- ──────────────────────────────────
  -- SARAH KIM — Session 1 (14 days ago)
  -- Story: Lisinopril cough identified, switching to Losartan
  -- ──────────────────────────────────
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    current_date - interval '14 days',
    'Dr. Chen: Good morning Sarah, come on in. So what''s been going on?

Sarah: Hi Dr. Chen. I''ve had this really annoying dry cough for about three weeks now. It''s not going away and I can''t figure out why. I haven''t been sick or anything.

Dr. Chen: Okay, and is it worse at any particular time of day? Night, morning?

Sarah: Honestly it seems kind of constant. Maybe a bit worse at night when I''m lying down. It''s starting to affect my sleep.

Dr. Chen: Right. And you mentioned on the intake form you''ve been on Lisinopril for about eight months now for blood pressure, is that right?

Sarah: Yeah, 10mg, once a day. Has been fine until this started.

Dr. Chen: That''s actually really important information. ACE inhibitors like Lisinopril cause a dry, persistent cough in roughly 10 to 15 percent of patients. It''s one of the most common side effects and it can start weeks or even months after you begin the medication.

Sarah: Oh wow, I had no idea. So the medication is causing the cough?

Dr. Chen: Almost certainly, yes. Let me also check your blood pressure while you''re here. [pause] 138 over 88 — slightly elevated, ideally we want you below 130 over 80. How''s your stress been lately?

Sarah: Pretty high honestly. Work has been a lot. I''m probably only sleeping five hours a night most nights.

Dr. Chen: That will absolutely affect your blood pressure. Okay, so here''s what I''m thinking. I want to switch you from Lisinopril to a different class of medication called an ARB — specifically Losartan, 50 milligrams once daily. It works similarly but doesn''t cause the cough. We''ll need to do a quick renal panel before you start it though, just to make sure your kidneys are handling things well.

Sarah: How long before the cough goes away?

Dr. Chen: Usually within two to four weeks once you stop the ACE inhibitor. And I''d also like you to avoid any strenuous exercise until we get the blood pressure more stable — light walking is fine. Come back and see me in four weeks.

Sarah: Okay, that''s a relief honestly. I thought something was really wrong.

Dr. Chen: No, this is very manageable. Oh — one more thing. I see you''re on Cetirizine as needed for allergies. Spring is coming, pollen will be high in Victoria. Make sure you''re taking it before outdoor activities.'
  ),

  -- ──────────────────────────────────
  -- SARAH KIM — Session 2 (3 days ago)
  -- Story: Cough resolved, BP improving, sleep still concern
  -- ──────────────────────────────────
  (
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    current_date - interval '3 days',
    'Dr. Chen: Hi Sarah, good to see you again. How have you been feeling since we switched medications?

Sarah: Honestly so much better. The cough is basically gone. Like completely gone within about ten days of stopping the Lisinopril.

Dr. Chen: That''s exactly what we were hoping for. And the renal panel came back normal, which is reassuring — your kidneys are tolerating the Losartan well.

Sarah: Yeah I was a bit nervous about that.

Dr. Chen: No need to be — your results were perfectly fine. Let me take your blood pressure. [pause] 132 over 84. That''s improved from 138 over 88 last time. Still a touch high but going in the right direction.

Sarah: That''s good to hear. I''ve been trying to walk more.

Dr. Chen: That definitely helps. How''s the sleep situation?

Sarah: Still not great. Probably five or six hours. Work has been really stressful. We have a big project deadline.

Dr. Chen: I understand. Sleep really is a lever for blood pressure — it''s not just fatigue, it genuinely affects how your cardiovascular system regulates. I want to talk about sleep hygiene. Are you on your phone before bed?

Sarah: Yeah, probably until about midnight most nights.

Dr. Chen: Okay, so that''s something we can work on. Try to stop screens at least an hour before you want to sleep. Even 30 minutes makes a measurable difference. Also keep your room cool and dark if you can.

Sarah: I''ll try.

Dr. Chen: If the sleep doesn''t improve in the next six weeks I''d like to refer you to a sleep specialist — not because something is necessarily wrong, but because there are good interventions. For now, continue the Losartan. Everything else looks good. Come back in six weeks or sooner if anything changes.

Sarah: Sounds good. Thank you.'
  ),

  -- ──────────────────────────────────
  -- JAMES MILLER — Session 1 (7 days ago)
  -- Story: T2DM annual check, HbA1c above target, Metformin increase
  -- Note: confidence 61 — below threshold, doctor alert fires
  -- Wearable anomalies (HR spike, SpO2 dip) not yet discussed in session
  -- ──────────────────────────────────
  (
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000002',
    current_date - interval '7 days',
    'Dr. Chen: Hi James, good to see you. It''s been about a year, right?

James: Yeah, about that. Feels like longer though, it''s been a busy year.

Dr. Chen: I hear that. Let''s go through everything. Your labs came back — your HbA1c is 7.8. Last year it was 7.2, so it''s gone up a bit. The target we''re aiming for is 7.0 or below.

James: That''s not great news.

Dr. Chen: It''s not where we want it, but it''s not alarming either. It tells me your blood sugar has been running a bit higher on average over the past three months. Your fasting glucose today was 148. Normal fasting is below 100, and we like to see diabetics below 130 ideally.

James: I''ve been feeling tired a lot. Like really drained. Is that connected?

Dr. Chen: Quite possibly. When blood sugar runs higher than it should, it can cause fatigue. Your LDL cholesterol is 2.9, which is acceptable on the statin. Your foot exam is normal, no signs of neuropathy. BMI is 29.4 — you''re in the overweight range but not by much.

James: So what do we do?

Dr. Chen: I want to increase your Metformin from 500mg twice daily to 1000mg twice daily. Always take it with food to minimize any stomach upset. I''d also really like you to focus on diet — specifically cutting back on refined carbohydrates. White bread, white rice, sugary drinks. And exercise — aim for 150 minutes a week of moderate activity. Walking counts.

James: Okay. I can try.

Dr. Chen: Come back in three months for a repeat HbA1c. We''ll see if the increased dose and lifestyle changes move the needle.'
  );


-- ============================================
-- INSIGHTS
-- confidence_flag only populated when confidence < 70
-- differentials stored as JSONB array of {label, pct}
-- actions_for_doctor stored as text[]
-- ============================================

insert into insights (id, session_id, confidence, confidence_flag, risk_level, summary, plain_summary, simple_summary, differentials, medication_flags, wearable_note, environmental_note, actions_for_doctor, delta, approved) values

  -- ──────────────────────────────────
  -- Sarah Session 1 — confidence 82
  -- ──────────────────────────────────
  (
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    82,
    null,
    'medium',
    'Likely ACE inhibitor-induced cough (Lisinopril). BP mildly elevated at 138/88. Medication switch to Losartan 50mg initiated pending renal panel. Sleep deprivation contributing to BP elevation. Environmental pollen risk noted given allergy history.',
    'Your cough is almost certainly caused by your blood pressure medication (Lisinopril). Your doctor is switching you to a different medication called Losartan that works the same way but will not cause the cough. Your blood pressure is slightly high — better sleep and less stress will help bring it down.',
    'Your cough is from your blood pressure pill. Your doctor gave you a new pill that will not cause coughing. Try to sleep more — it helps your blood pressure too.',
    '[
      {"label": "ACE inhibitor-induced cough (Lisinopril)", "pct": 85},
      {"label": "Early-stage bronchitis", "pct": 10},
      {"label": "GERD-related cough", "pct": 5}
    ]'::jsonb,
    array[
      'Lisinopril (ACE inhibitor) — high likelihood of causing reported dry cough. Discontinuing.',
      'Losartan 50mg initiated — renal panel required before first dose. No allergy conflict detected.'
    ],
    'Resting HR elevated at 81 bpm (up from 72 bpm baseline 14 days prior). Likely reflecting stress and poor sleep. Sleep averaging 5.1 hrs — significantly below recommended 7–9 hrs. No SpO2 abnormalities.',
    'Tree pollen (Birch) currently High in Victoria. Patient takes Cetirizine as needed — recommend proactive dosing before outdoor exposure during pollen season. AQI 38 (Good) — no respiratory air quality concern.',
    array[
      'Order renal panel (eGFR, creatinine, potassium) before Losartan initiation.',
      'Review BP response at 4-week follow-up — target <130/80.',
      'Assess sleep quality at next visit; consider referral if no improvement.'
    ],
    'First session — no prior data for comparison.',
    true
  ),

  -- ──────────────────────────────────
  -- Sarah Session 2 — confidence 91
  -- ──────────────────────────────────
  (
    'e0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    91,
    null,
    'low',
    'Medication switch successful — cough fully resolved. BP improved from 138/88 to 132/84. Renal function normal on Losartan. Sleep deprivation persists (5–6 hrs avg) — primary remaining concern. Sleep hygiene counseling provided. Referral pending if no improvement at 6-week follow-up.',
    'Great news — the new medication is working and your cough is gone. Your blood pressure has improved too. The main thing to work on now is sleep — better sleep will continue to bring your blood pressure down. Your doctor wants to refer you to a sleep specialist if things do not improve.',
    'Your cough is gone and your blood pressure is getting better. Try to sleep more — put your phone down before bed. See Dr. Chen again in 6 weeks.',
    '[
      {"label": "Treatment-responsive hypertension (improving)", "pct": 90},
      {"label": "Sleep-related cardiovascular strain", "pct": 8},
      {"label": "Residual stress-induced BP elevation", "pct": 2}
    ]'::jsonb,
    array[
      'Losartan 50mg — well tolerated, renal panel normal. Continue current dose.',
      'Cetirizine — continue as needed for pollen season.'
    ],
    'Resting HR normalized from 81 to 68 bpm over past 2 weeks. Sleep improving marginally (5.1 to 5.8 hrs avg) but still below target. HR variability 42ms — acceptable but room for improvement with better sleep.',
    'Pollen remains High (Birch). Patient should continue proactive Cetirizine dosing on high-pollen days. AQI 38 (Good) — no outdoor activity restriction.',
    array[
      'Reassess BP at 6-week follow-up — target <130/80.',
      'Sleep specialist referral if sleep avg remains <7hrs by April 29 visit.',
      'Continue Losartan 50mg — consider dose titration at next visit if BP not at target.'
    ],
    'vs. March 7: BP improved 138/88 → 132/84. Cough fully resolved. HR normalized 81 → 68 bpm. Sleep marginally improved 5.1 → 5.8 hrs but remains below target. Overall trajectory: improving.',
    true
  ),

  -- ──────────────────────────────────
  -- James Session 1 — confidence 61 (BELOW THRESHOLD)
  -- confidence_flag explains what is missing from the transcription
  -- ──────────────────────────────────
  (
    'e0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    61,
    'Transcription lacks detail on patient current diet composition, daily routine, recent stress levels, and sleep quality — all highly relevant to glycemic control. Wearable anomalies (nighttime HR spike, SpO2 dip) were not discussed during the session and may require follow-up. Doctor review recommended before sharing insights with patient.',
    'high',
    'HbA1c elevated at 7.8 (above 7.0 target). Fasting glucose 148. Metformin dose increased to 1000mg BID. Fatigue reported — likely related to suboptimal glycemic control. Lifestyle intervention initiated. Wearable data shows concerning HR trends and nighttime anomalies not discussed in session.',
    'Your blood sugar has been running a bit higher than your doctor wants. She has increased your diabetes medication to help bring it down. Feeling tired is connected to this — as your blood sugar improves, your energy should too. You will need to check in again in 3 months.',
    'Your blood sugar is too high. Your doctor gave you more medicine to help. Eat less white bread and rice. Walk more. Come back in 3 months.',
    '[
      {"label": "Suboptimal glycemic control — dietary and adherence factors", "pct": 65},
      {"label": "Progressive T2DM requiring medication escalation", "pct": 25},
      {"label": "Secondary fatigue from sleep-disordered breathing", "pct": 10}
    ]'::jsonb,
    array[
      'Metformin increased to 1000mg BID — monitor for GI side effects (nausea, diarrhea) especially in first 2 weeks. Take with meals.',
      'Sulfa allergy on file — Metformin is safe, no conflict. Atorvastatin unchanged.',
      'No new prescriptions this visit.'
    ],
    '⚠ ANOMALY DETECTED: Resting HR spiked to 112 bpm during sleep on March 20 (8 min duration, no movement detected). SpO2 dipped to 93% on March 19 at 3:30am. Resting HR trending upward 79→84 bpm over past 7 days. HRV low at 28ms. These findings were not discussed during the session and may warrant follow-up, particularly given diabetic cardiovascular risk profile.',
    'AQI 78 (Moderate) — elevated due to nearby construction activity. For a diabetic patient with elevated resting HR, outdoor exercise should be modified today. Indoor alternatives recommended. Pollen Moderate (Alder) — no antihistamine on current medication list.',
    array[
      'Review nighttime HR spike anomaly (112 bpm, March 20) — consider sleep study referral for possible sleep apnea given T2DM, fatigue, and SpO2 dip to 93%.',
      'Dietary referral to registered dietitian — transcription lacks diet detail needed to provide specific nutritional guidance.',
      'Repeat HbA1c in 3 months — if still above 7.0, consider adding GLP-1 agonist or SGLT2 inhibitor.',
      'Consider increasing Atorvastatin if LDL remains elevated at next lipid panel.',
      'Review wearable data trends at next visit — HR creep may indicate worsening cardiovascular strain.'
    ],
    'vs. last annual (2025): HbA1c increased 7.2 → 7.8. Weight stable. LDL improved marginally on statin. Overall glycemic trajectory: worsening. First session with wearable data — anomalies flagged above.',
    true
  );


-- ============================================
-- PATIENT ACTIONS
-- Linked to insight_id
-- category: 'medication' | 'environment' | 'activity' | 'diet' | 'warning' | 'followup'
-- checkable: false for warning items — patients cannot mark dangers as "done"
-- sort_order: controls display order in action plan
-- ============================================

-- Sarah Session 1 actions
insert into patient_actions (insight_id, icon, text, category, checkable, sort_order) values
  ('e0000000-0000-0000-0000-000000000001', '💊', 'Stop taking Lisinopril. Start Losartan 50mg once daily in the morning — begin after your blood test results come back.', 'medication', true, 1),
  ('e0000000-0000-0000-0000-000000000001', '🩸', 'Book your blood test (renal panel) this week before starting the new medication. Your doctor''s office will send the requisition.', 'followup', true, 2),
  ('e0000000-0000-0000-0000-000000000001', '🌿', 'Pollen is high in Victoria right now (Birch tree). Take your Cetirizine before going outside — your cough may be made worse by allergens on top of the medication.', 'environment', true, 3),
  ('e0000000-0000-0000-0000-000000000001', '🚶', 'Light walking is fine — avoid running or vigorous exercise until your blood pressure stabilizes.', 'activity', true, 4),
  ('e0000000-0000-0000-0000-000000000001', '😴', 'Aim for at least 7 hours of sleep tonight. Poor sleep directly raises blood pressure — even one better night will help.', 'activity', true, 5),
  ('e0000000-0000-0000-0000-000000000001', '⚠', 'Seek care immediately if you experience swelling of the face or lips, difficulty breathing, or chest pain. These are rare but serious side effects of the new medication.', 'warning', false, 6),
  ('e0000000-0000-0000-0000-000000000001', '📅', 'Follow-up appointment in 4 weeks — March 18, 2026 with Dr. Chen.', 'followup', true, 7);

-- Sarah Session 2 actions
insert into patient_actions (insight_id, icon, text, category, checkable, sort_order) values
  ('e0000000-0000-0000-0000-000000000002', '💊', 'Continue Losartan 50mg every morning. Do not skip doses — consistency is important for blood pressure control.', 'medication', true, 1),
  ('e0000000-0000-0000-0000-000000000002', '💊', 'Take Cetirizine before going outside today — pollen (Birch) is still high in Victoria.', 'medication', true, 2),
  ('e0000000-0000-0000-0000-000000000002', '📵', 'Put your phone away at least 1 hour before bed tonight. This is the single most impactful thing you can do for your sleep right now.', 'activity', true, 3),
  ('e0000000-0000-0000-0000-000000000002', '🌡️', 'Keep your bedroom cool (around 18°C) and as dark as possible — this signals your body it is time to sleep.', 'activity', true, 4),
  ('e0000000-0000-0000-0000-000000000002', '🚶', 'Continue your daily walks — they are helping your blood pressure. Try to get 30 minutes most days.', 'activity', true, 5),
  ('e0000000-0000-0000-0000-000000000002', '🌿', 'High pollen today — avoid outdoor exercise between 10am and 3pm if possible.', 'environment', true, 6),
  ('e0000000-0000-0000-0000-000000000002', '⚠', 'If you experience a persistent headache, blurred vision, or sudden shortness of breath — go to urgent care. These can be signs of a blood pressure spike.', 'warning', false, 7),
  ('e0000000-0000-0000-0000-000000000002', '📅', 'Next appointment: April 29, 2026 with Dr. Chen. This is when she will decide about the sleep specialist referral.', 'followup', true, 8);

-- James Session 1 actions
insert into patient_actions (insight_id, icon, text, category, checkable, sort_order) values
  ('e0000000-0000-0000-0000-000000000003', '💊', 'Take your Metformin 1000mg twice a day — once with breakfast and once with dinner. Do not take on an empty stomach.', 'medication', true, 1),
  ('e0000000-0000-0000-0000-000000000003', '💊', 'Continue Atorvastatin 20mg every night before bed.', 'medication', true, 2),
  ('e0000000-0000-0000-0000-000000000003', '🍎', 'Try to swap white rice or white bread for one meal today — brown rice, whole grain bread, or vegetables instead. Small swaps add up.', 'diet', true, 3),
  ('e0000000-0000-0000-0000-000000000003', '🍎', 'Cut sugary drinks completely this week — replace with water or unsweetened tea. This is the single fastest way to lower blood sugar.', 'diet', true, 4),
  ('e0000000-0000-0000-0000-000000000003', '🚶', 'Aim for a 20-minute walk today. Air quality is Moderate outside — consider walking indoors (mall, community centre) if you notice any shortness of breath.', 'activity', true, 5),
  ('e0000000-0000-0000-0000-000000000003', '🏠', 'Air quality in your area is Moderate today due to construction. People managing diabetes can be more sensitive to air pollution — indoors is better for exercise today.', 'environment', true, 6),
  ('e0000000-0000-0000-0000-000000000003', '📊', 'If you have a blood glucose monitor at home, check your fasting reading tomorrow morning before eating. Write it down to share with Dr. Chen.', 'followup', true, 7),
  ('e0000000-0000-0000-0000-000000000003', '⚠', 'Your wearable detected an unusual heart rate spike while you were sleeping on March 20. This has been flagged for Dr. Chen to review. Mention it at your next visit.', 'warning', false, 8),
  ('e0000000-0000-0000-0000-000000000003', '⚠', 'Seek care immediately if you feel your heart racing, chest pain, severe dizziness, or difficulty breathing — especially at night.', 'warning', false, 9),
  ('e0000000-0000-0000-0000-000000000003', '📅', 'Follow-up in 3 months for repeat HbA1c blood test. Dr. Chen''s office will contact you to schedule.', 'followup', true, 10);
