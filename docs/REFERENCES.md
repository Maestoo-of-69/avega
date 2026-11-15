# AVEGA — References

Every outside fact used in AVEGA must be recorded here: what was read, where, when, and what exactly it says.
**Access date for all entries below: 2026-11-15.** Wording is paraphrased; where a page does *not* say something, that is stated
explicitly so we do not invent it later.

Legend — **Used for:** where in AVEGA the information influenced the product.

## 1. NASA Human Research Program (HRP) — risks

### R1. HRP risk list
- URL: https://www.nasa.gov/hrp/risks/
- Says: HRP lists **17 risks** in three groups — *Human physiology* (11), *Behavioral performance & human factors* (5), *Space radiation* (1).
  Physiology: altered immune responses; sensorimotor/vestibular; cardiovascular adaptations; decompression sickness; host–microorganism
  interactions; hypoxia; inadequate food & nutrition; spacewalk (EVA) injury/performance; reduced cardiorespiratory & musculoskeletal fitness;
  SANS (spaceflight-associated neuro-ocular syndrome); spaceflight-induced bone changes. Behavioral: behavioral conditions & psychiatric
  disorders; inadequate teamwork; inadequate sleep & irregular schedules; inadequate systems-operations support; injury from dynamic loads.
  Radiation: radiation-induced cancers.
- Used for: choosing which health domains AVEGA should cover (sleep, psychology, cardiovascular/fitness, bone, radiation).

### R2. Risk of radiation-induced cancers
- URL: https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/
- Says: exposure is tracked by instruments on the ISS (instruments are **not named** on the page); Earth-based tissue research aims at personalised
  risk assessment from dose and genetic factors (no biomarkers named); mitigations: health-surveillance practices, medicines against radiation effects,
  shielding for Artemis / lunar Gateway and future Mars missions, heavy-ion research at the NASA Space Radiation Laboratory.
- Does **not** say: any dose limit or exposure number.
- Used for: radiation is a planned module; AVEGA must not show invented dose limits. Dose data would be simulated until a real source exists.

### R3. Risk of behavioral conditions and psychiatric disorders
- URL: https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/
- Says: affected outcomes include sleep, morale, decision-making, anxiety, depression. Countermeasures: personal journal, growing plants, windows
  (less monotony/confinement), privacy, communication with family and medical staff (harder with longer Mars delays), Earth-based isolation studies.
- Does **not** say: which assessments or tools are used to measure it, or how crews are trained.
- Used for: check-in design (mood/stress/energy), support recommendations (journal, relaxation), communication-delay modelling.

### R4. Risk of spaceflight-induced bone changes
- URL: https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/
- Says: bone density checked by routine scans before and after flight (scan type **not named**); height can increase up to ~3 % in space;
  resistive exercise is described as essential; bisphosphonates may mitigate some loss.
- Does **not** say: biomarkers, nutrition measures.
- Used for: bone is a *pre/post-flight* measure, not a continuous one — AVEGA must not show a live "bone density" stream.

### R5. Risk of cardiovascular adaptations
- URL: https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/
- Says: ultrasound (incl. vascular echo on the station) helps physicians assess heart structure/function; low blood pressure raises fainting risk at landing.
  Countermeasures: regular exercise and diet, lower-body compression garments, fluids before landing, enhanced cardiovascular emergency training for Mars.
- Does **not** say: that heart rate, blood pressure or arterial stiffness are monitored routinely.
- Used for: heart-rate stream is labelled *simulated*; blood pressure is a stub.

### R6. Risk from inadequate sleep and irregular schedules
- URL: https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- Says: ISS LED lighting simulates the Earth light–dark cycle; crews get scheduled time for relaxation/self-care; research studies light and caffeine effects on body clocks.
- Does **not** say: actigraphy, sleep logs, PVT, medication guidance.
- Used for: sleep duration tracking; lighting/schedule advice only as generic UI hints, not clinical advice.

### R7. Risk of reduced cardiorespiratory and musculoskeletal fitness
- URL: https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/
- Says: fitness assessed by periodic crew self-evaluations (strength, endurance, flexibility, aerobic fitness, agility, coordination); average losses of strength and
  aerobic fitness about 10–12 % of pre-mission level; ISS crews exercise about 1.5 h/day, 6–7 days/week; equipment space for Moon/Mars is limited.
- Does **not** say: VO2max or muscle mass by name.
- Used for: activity/exercise stubs; the 10–12 % figure is context, not an AVEGA threshold.

## 2. Communication delay Earth ↔ Mars

### C1. NASA Science — Perseverance communications
- URL: https://science.nasa.gov/?p=354728
- Says: radio waves travel at light speed, but it takes **3 to 22 minutes** for commands to reach Perseverance, depending on where Earth and Mars are in their orbits.
- Used for: the *demo* delay (13 min one way) between the crew and the Earth-side doctor. The real value varies with the planets' positions.

### C2. NASA NTRS — Communication delays, disruptions and blackouts for crewed Mars missions (ASCEND paper)
- URL: https://ntrs.nasa.gov/citations/20220013418
- Says: over a crewed mission the one-way delay varies from 0 to 22 minutes, peaking when the crew is at or just departed from Mars; Sun–Earth–Mars geometry repeats about every 26 months
  (disruption/blackout analysis is in the paper).
- Used for: why the doctor's view shows data "as of" an earlier moment and why advice arrives with a delay.

## 3. Project brief (from the team)
- Task: software for astronauts to track health indicators on long missions (radiation, heart rate, mental state); prototype web/mobile app; suggested stack
  React / Vue / Flutter / Swift / Kotlin, Python backend, SQLite / PostgreSQL; target developers: confident Junior/Middle.
- Source: task description supplied by the project owner (not a public document).

## 4. Behavioural / psychological measures used by space agencies

### N1. NASA — Spaceflight Standard Measures (overview page)
- URL: https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space
- Says: a consistent core set of measures on ISS crews; includes wrist **actigraphy** (activity level, light exposure), blood/urine **biomarkers**,
  the **Cognition** battery (10 computer tests, from memory to risk decision-making), and questionnaires that let researchers compare perceived sleep quality
  with actigraphy and look at team characteristics.
- Used for: choice of AVEGA's parameter families (docs/PARAMETERS.md).

### N2. NASA NTRS 20200001281 / 20180002943 — Spaceflight Standard Measures (slides)
- URL: https://ntrs.nasa.gov/api/citations/20200001281/downloads/20200001281.pdf
- Says: actigraphy with sleep logs pre-flight, continuous in flight; personality survey pre-flight; monthly sleep-quality / team questionnaires in flight
  (sleep quantity and quality, mood, affect, team cohesion and performance, crew living/habitability); Cognition at fixed pre/in/post-flight sessions.
- Used for: check-in content and frequency ideas; pre-flight baseline concept.

### N3. NASA NTRS 20190000670 — Overview of NASA Behavioral Health and Performance Standard Measures
- URL: https://ntrs.nasa.gov/citations/20190000670
- Says: the first-generation BHP Standard Measures include a neurocognitive test battery, actigraphy, physical proximity sensors, cardiovascular monitors and
  self-reports of mood, depression (list continues in the abstract).
- Used for: justification for combining physiological and self-report streams in one system.

### N4. NASA NTRS 20170005421 — BHP Laboratory Standard Measures (information paper)
- URL: https://ntrs.nasa.gov/citations/20170005421
- Says: a brief (120-item) Big-Five personality measure pre-mission; Cognition battery (10 brief tests incl. sensorimotor ability and vigilant attention); actigraphy; brief daily sleep log.
- Used for: planned parameters (personality pre-flight, sleep log).

### N5. NASA NTRS 20220013722 — Isolation Standard Measures (IAC 2022; NASA, JAXA, DLR, CNES and other agencies)
- URL: https://ntrs.nasa.gov/citations/20220013722
- Says: an international expert group defined core measures for isolation studies covering sleep, mood, psychological state, psychophysiology, cognitive performance,
  stress and the immune system, general health and well-being, team measures, nutrition, environment. Acronym list names instruments such as CES-D (depression scale) and GHQ (General Health Questionnaire).
- Used for: the domain list in docs/PARAMETERS.md. Exact questionnaires must be taken from the full paper before use.

### N6. NASA NTRS 20260002661 — behavioural health and team metrics in isolation (abstract)
- URL: https://ntrs.nasa.gov/citations/20260002661
- Says: positive affect tended to decrease over time; negative affect and stress varied strongly between individuals and tracked situational stressors more than time in isolation.
- Used for: why AVEGA compares each person with their own norm rather than a group curve.

### J1. JAXA confined-facility study (JAXA-CFE) — Scientific Reports 2018, PMC5974367
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC5974367
- Says: salivary cortisol profiles and skin physiological parameters showed a transition of psychological stress in confinement; IL-1β in stratum corneum and facial-expression symmetry are *possible*
  convenient markers. JAXA's stated goal: a handy on-orbit stress evaluation combining low-invasive markers with psychiatric interviews.
- Used for: planned (not implemented) parameters: salivary cortisol rhythm; AVEGA does not have these data.

### J2. JAXA — isolation test for long-term ISS stays (2000)
- URL: https://iss.jaxa.jp/iss/kibo/develop_status_12_e.html
- Says: stress evaluated with urinary stress hormones and psychological tests; support through periodic counselling and video contact with family.
- Used for: support functions (contact with family and doctor).

### K1. Canadian Space Agency — health science experiments (Expedition 58)
- URL: https://www.asc-csa.gc.ca/eng/missions/expedition58/about-the-mission/health-science-experiments.asp
- Says: **Bio-Monitor** smart shirt monitors and records vital signs; **Radi-N2** measures neutron radiation and the dose absorbed; **Vascular Echo** studies arterial stiffening;
  **TBone** bone; Bio-Analyzer near-real-time blood/urine/saliva analysis; NASA Behavioral Core Measures also flown.
- Used for: which sensors a real AVEGA could read (wearable vitals, dosimetry).

### K2. Government of Canada backgrounder — At Home in Space
- URL: https://www.canada.ca/en/space-agency/news/2017/11/international_spacestationissongoingcanadianhealthexperimentsand.html
- Says: Canada's first psychosocial ISS experiment; studies how multinational crews adapt to living together on long missions.
- Used for: team-climate block (planned).

## 5. Peer-reviewed evidence for links (sleep ↔ performance ↔ stress ↔ physiology)

### P1. Barger et al., Lancet Neurology 2014 — sleep deficiency in astronauts
- URL: https://www.eurekalert.org/news-releases/541449 (press release of the paper; doi 10.1016/S1474-4422(14)70122-X)
- Says: >4,200 nights in space recorded by actigraphy and diaries; crews slept about 6 h despite 8.5 h scheduled; sleep-medication use was widespread, which raises concern for
  performance if woken by an alarm.
- Used for: sleep is a first-priority signal; the assistant never suggests medication.

### P2. Basner et al., PNAS 2013 — Mars 520-day simulation
- URL: https://www.med.upenn.edu/uep/assets/user-content/documents/PNAS2013Basner1212646110withSupportingAppendix.pdf
- Says: crew became more sedentary (less waking movement, more sleep/rest); light exposure fell; conclusion — exploration missions need maintained circadian entrainment, sleep quantity/quality and activity levels.
- Used for: assistant advice on regular sleep–wake timing and light; activity tracking as a planned parameter.

### P3. Cognition test battery (Basner et al.; University of Pennsylvania)
- URL: https://www.med.upenn.edu/uep/cognition.html
- Says: 10 brief tests built for NASA; includes DSST and a 3-minute Psychomotor Vigilance Test (PVT-B); 15 versions for repeated use.
- Used for: design target for AVEGA's cognitive tests (currently one demo composite score).

### P4. Goessl, Curtiss, Hofmann — Psychological Medicine 2017 — HRV biofeedback meta-analysis
- Found via search (Cambridge Core PDF). Says: 24 studies, 484 participants; HRV-biofeedback training associated with a large pre–post reduction in self-reported stress and anxiety (Hedges g = 0.81).
- Used for: "5 minutes of slow breathing" suggestion. Note: AVEGA's suggestion is plain paced breathing, not full biofeedback — weaker than the studied intervention.

### P5. Kim et al., Psychiatry Investigation 2018 — Stress and HRV (PMID 29486547)
- URL: https://pubmed.ncbi.nlm.nih.gov/29486547/
- Says: 37 studies; HRV changes under stress, most often lower parasympathetic activity; supports HRV as an objective stress indicator; no accepted standard for stress evaluation exists.
- Used for: HRV is a planned parameter (needs beat-to-beat intervals; not in demo data).

## 6. Space-specific conditions (handbook `prototype/engine.js`, KB)

### R8. NASA — Risk of altered sensorimotor and vestibular function
- URL: https://www.nasa.gov/reference/risk-of-altered-sensorimotor-and-vestibular-function/
- Says: most astronauts experience motion sickness in flight; ill crew may struggle with tasks, vehicle controls, spacewalks; Earth motion sickness does not predict it;
  medication combined with training/orientation aids, and head-movement manoeuvres, are being studied.
- Does **not** say: specific symptoms, timing, drugs, doses.

### R9. NASA — Risk of SANS
- URL: https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/
- Says: optic-nerve swelling, retinal folds, flattening of the back of the eye linked to headward fluid shift; about 70 % of ISS astronauts show some swelling at the back of the eye;
  higher risk on longer missions; tracked by retinal imaging; supplements and mechanical countermeasures are under investigation; long-term outcome unknown.
- Does **not** say: thresholds, proven countermeasures.

### R10. NASA — Risk of altered immune system responses
- URL: https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/
- Says: some ISS astronauts reported cold sores, rashes, atypical allergies, infections; dormant viruses can reactivate; poor sleep is named with radiation and microgravity as a factor;
  monitored through blood/saliva/urine samples.
- Does **not** say: any countermeasure or prevalence.

### S1. Kerstman et al., Aviat Space Environ Med 2012 — Space adaptation back pain (NASA NTRS 20090019566; doi 10.3357/ASEM.2876.2012)
- URL: https://ntrs.nasa.gov/citations/20090019566
- Says: incidence 52 % (382/728 records); 86 % mild; most effective relief: fetal positioning (91 %), analgesics and exercise (treadmill, cycle ergometer; 85 % each);
  no accepted preventive measure; possible mission impact through pain and sleep disturbance.
- Used for: handbook entry "back pain"; the app suggests the non-drug options only.

### S2. Khalid et al., Front. Neural Circuits 2023 — countermeasures to space motion sickness (systematic review)
- URL: https://www.frontiersin.org/articles/10.3389/fncir.2023.1150233/full
- Says: SMS affects around 70 % of astronauts in the first 72 h; symptoms: nausea, dizziness, fatigue, vertigo, headache, vomiting, cold sweating; both drug and non-drug
  countermeasures can help but no definitive recommendation can be given.
- Used for: symptom list; the app gives no drug advice.

### S3. NASA NTRS 19830021722 — space motion sickness working-group report (1983)
- URL: https://ntrs.nasa.gov/api/citations/19830021722/downloads/19830021722.pdf
- Says: space sickness mainly impairs crews in the initial 2–5 days while habituation takes place.
- Used for: "usually the first 2–5 days" wording.

### S4. Law et al., J Occup Environ Med 2014 — CO₂ and headaches on the ISS
- URL: https://www.ishn.com/articles/98606-occupational-hazard-in-space-headaches (summary); paper: 56(5):477-83
- Says: each 1 mm Hg rise in CO₂ doubled the odds of a reported headache; higher CO₂ also appeared related to sleep problems, fatigue, irritability; after CO₂ was held at ≤ 4 mm Hg
  weekly headache risk fell from about 3.3 % to 1.6 %; < 2.5 mm Hg (7-day mean) would be needed for < 1 %.
- Used for: simulated cabin-CO₂ stream, CO₂→headache link in the synthetic generator (direction only), handbook entry.

### S5. Rooney, Crucian, Pierson, Laudenslager, Mehta — Front. Microbiol. 2019 — herpes virus reactivation in astronauts
- URL: https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2019.00016/full
- Says: 53 % of shuttle and 61 % of ISS astronauts shed one or more herpes viruses; shedding is typically asymptomatic; raised stress hormones (cortisol) reduce cellular immunity,
  which facilitates reactivation; a few cases had dermatitis / skin lesions.
- Used for: stress → skin-symptom link (direction only) and the "immune" handbook entry — the clearest sourced psych ↔ space-illness connection.

### S6. Mehta et al., npj Microgravity 2017 — latent virus reactivation on the ISS
- URL: https://doaj.org/article/f32947e92776479e9e3b840364e87d36
- Says: reactivation is more frequent on 60–180-day ISS stays than on short flights and is associated with changes in the daily salivary-cortisol trajectory.

### R11. NASA — Risk of decompression sickness
- URL: https://www.nasa.gov/reference/risk-of-decompression-sickness/
- Says: arises when moving from the pressurized spacecraft into a lower-pressure suit; dissolved nitrogen forms bubbles; for divers it describes severe pain and, in severe cases,
  effects on breathing and stroke-like symptoms; prevention: oxygen pre-breathing, training, lower-pressure spacecraft, variable-pressure suits (in development);
  if symptoms appear the spacewalk is ended safely but rapidly and the crew member returns to the spacecraft.
- Does **not** say: astronaut-specific symptoms, incidence, pressures, pre-breathe duration, treatment after return.

### R12. NASA — Risk of hypoxia
- URL: https://www.nasa.gov/reference/risk-of-hypoxia/
- Says: mild hypoxia = tissue oxygen below normal; tied to future spacecraft kept partly depressurized; untreated it can cause confusion, headaches, vision impairment, trouble sleeping;
  NASA rates the risk relatively low and compares it with altitude sickness; monitoring and treatment protocols are being developed.
- Does **not** say: thresholds, diagnosis, any treatment.

### R13. NASA — Risk of inadequate food and nutrition
- URL: https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/
- Says: outcomes are reduced performance and crew illness; food must be safe, nutritious, long-lasting and varied enough to avoid menu fatigue; more than 200 foods and beverages on the ISS;
  resupply is the hard part for Moon/Mars missions.
- Does **not** say: symptoms, nutrient targets, how crew nutrition is monitored, treatment.

### R14. NASA — Risk of host–microorganism interactions
- URL: https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/
- Says: skin and gut microbial communities appear to change in space; some microbes may be more virulent; crews limit exposure to large groups for two weeks before launch;
  astronauts give samples and swab station surfaces; some may still get sick; disinfectants, anti-inflammatories and antibiotics are being assessed.
- Does **not** say: symptoms, pathogens, incidence, treatment protocols.

### R15. NASA — Risk of injury and compromised performance from spacewalks (EVA)
- URL: https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/
- Says: risk during real or simulated spacewalks; causes: pressure/oxygen differences, physical and mental demands, heavier suits in surface gravity; countermeasures: pre-breathe,
  suit design with biomedical monitoring, exercise to keep bone and muscle strength.
- Does **not** say: specific injuries, rates, treatment.

### R16. NASA — Risk of inadequate teamwork
- URL: https://www.nasa.gov/reference/risk-of-inadequate-teamwork/
- Says: performance and behavioural-health decrements from poor cooperation, coordination, communication and psychosocial adaptation; driven by communication delay, isolation,
  limited resources, small habitat; astronauts practise team-building skills before flight; crews get in-mission support, harder with delay.
- Does **not** say: how teamwork is measured in flight, specific conflict-resolution techniques, results.

### R17. NASA — Risk of injury from dynamic loads
- URL: https://www.nasa.gov/reference/risk-of-injury-from-dynamic-loads/
- Says: injury risk mainly at landing and at gravity transitions; possible disorientation; weakened bones and muscles raise the risk; countermeasures: body models that inform
  seat and restraint design, suit design, recovery teams on Earth.
- Does **not** say: specific injuries, load values, rates, treatment.

Used for (R11–R17): seven additional handbook entries and the chat interview (`docs/CHAT_SPEC_V2.md`). Not covered as a health condition: HRP risk "inadequate systems operations support" (a human–system design risk, not a condition a crew member reports).

### R18. NASA HRP Human Research Roadmap — Task 1623 (verified: page opened)
- URL: https://humanresearchroadmap.nasa.gov/Tasks/task.aspx?i=1623
- Source of the Visual Analogue Scales (VAS) item, given by the team. Says: only what the task page states about VAS; AVEGA's own item list and anchor wording
  ("Совсем нет" / "Предельно сильно") are **AVEGA wording**, not NASA's.
- Does **not** say: AVEGA's seven items, schedule, thresholds.

### R19. NASA — Spaceflight Standard Measures (reference page; verified in general terms only)
- URL: https://www.nasa.gov/reference/standard-measures/
- Says: NASA collects a standard set of measures from astronauts; used as the general basis for the Actigraphy / Sleep Log item.
- Does **not** say: any measurement schedule for the instruments in AVEGA's catalogue. **Periodicity labels on the page are AVEGA demo values.**

### R20. NASA NTRS 20210023420 — Evidence-based process for assessing teamwork competencies in applicant performance (verified: record opened)
- URL: https://ntrs.nasa.gov/citations/20210023420
- Says: how teamwork, leadership and followership competencies are defined and measured for high-risk operational jobs (applicant selection). The record page does **not** mention behaviourally anchored rating scales by name.
- Used as context for the planned "Team Performance BARS" (Behaviourally Anchored Rating Scale). AVEGA does **not** implement it yet (status «Скоро»).
- Does **not** say: use as a continuous in-flight team monitor.

### R21. PubMed 31156490 — Team Functioning Assessment (**NOT VERIFIED**: page could not be opened, reCAPTCHA)
- URL: https://pubmed.ncbi.nlm.nih.gov/31156490/ — supplied by the team; shown on the page with the label «(не проверено)». Do not cite content from it. Not implemented (status «Скоро»).

### P6. PMC4691281 — cognition test battery (verified: page opened)
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC4691281/ — publication about the cognition test battery; supports the CTB item. Details beyond this are not recorded here.

### P7. Nature npj Microgravity s41526-025-00532-6 (**NOT VERIFIED**: could not be opened)
- URL: https://www.nature.com/articles/s41526-025-00532-6 — supplied by the team; shown as «(не проверено)». Do not cite content from it.

### Naming notes for the instrument catalogue
- "Spaceflight Behavioral Health" was **not found** as a documented NASA instrument name; in AVEGA it is the team's label for the daily mood/stress/energy check-in (demo data, not an original NASA questionnaire).
- «Креативное задание» (formerly "Narrative Assessment") and "Crew Connection" are AVEGA's own experimental methods (tag «Авторская методика»); both work in the prototype (see 6c).

## 6b. Radiation exposure monitoring (page «Радиация», `prototype/radiation.js`)

### R22. NASA SRAG — How we measure space radiation: Crew Active Dosimeter (verified)
- URL: https://srag.jsc.nasa.gov/SpaceRadiation/How/How.cfm
- Says: since 2020 SRAG collects time-resolved dosimetry for individual ISS crew members with the Crew Active Dosimeter; CAD relates electrical changes to an
  **absorbed dose** via ground calibration; readings are timestamped and sent via Bluetooth; an always-on display shows total mission dose and the recent dose rate.
- Also (Mirion / Life Sci Space Res 2023, PMID 37945094): developed by Mirion with SRAG; used for ISS crew operations since 2020; carried by Artemis II crew.
- Used for: device card and record format. **CAD gives absorbed dose (Gy), not Sv** — Sievert values in AVEGA are an estimate.

### R23. George et al., Nature 2024 — Space radiation measurements during the Artemis I lunar mission (+ NASA summary)
- URLs: https://www.osti.gov/pages/servlets/purl/2447574 · https://www.nasa.gov/humans-in-space/artemis-i-radiation-measurements-validate-orion-safety-for-astronauts/
- Says: HERA, ESA EAD, DLR M-42 and NASA CAD measured radiation inside Orion; dose varied with shielding location and spacecraft orientation (≈50 % drop during a burn);
  CAD can collect real-time dose and transmit it to Earth.
- Used for: CAD is flight-proven beyond LEO; why per-person dose differs (AVEGA's shielding factors are **invented** demo values).

### R24. ISS crew doses — PMC10919966 (ISS exposure limits review) and NASA NTRS 20250006168
- Says: ISS badges usually record absorbed dose below 0.3 mGy/day; effective dose ≈0.2–0.5 mSv/day; ~40–90 mSv in a 6-month mission.
- Used for: reference values block.

### R25. Zeitlin et al., Science 2013 — RAD measurements in transit to Mars (SwRI release; A&A 2015 paper by Guo et al. quotes the absorbed values)
- URLs: https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-the-radiation-exposure-associated-trip-mars · https://www.aanda.org/10.1051/0004-6361/201525680
- Says: average GCR dose-equivalent rate ≈1.8 mSv/day in cruise; absorbed GCR dose rate ≈461 µGy/day (plastic); SEP days exceeded 10,000 µGy/day.
- Used for: simulated base rate 461/24 ≈ 19.2 µGy/h; estimate factor 1.8/0.461 ≈ 3.9 Sv/Gy (coarse; overestimates proton events).

### R26. NASA-STD-3001 technical brief OCHMO-TB-020 (radiation protection)
- URL: https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- Says: career effective dose < 600 mSv (all ages and sexes); solar particle event exposure limited to 250 mSv effective dose.
- Used for: limit bar (compared with an estimate, labelled as such).

### R27. Feiveson et al., Sci Rep 2021 — Predicting chromosome damage in astronauts on ISS missions (+ NASA release)
- URL: https://doaj.org/article/bade7148abc2402f9e8c4d6c3b98ddad
- Says: 43 crew-missions; pre-flight background chromosome-aberration rate and ex-vivo radiosensitivity added predictive value for post-flight aberrations beyond dose alone.
- Used for: «Связь с физиологией» row «накопленная доза ↔ хромосомные аберрации» (lab test, not simulated).

### R28. NASA Ames Radiation Biophysics Lab
- URL: https://www.nasa.gov/ames/research/space-biosciences/radiation-biophysics
- Says: quantifies DNA damage in blood (53BP1, γH2AX) to study individual sensitivity; studies cytokines and exosomes as potential personalised markers.
- Used for: research-stage rows in «Связь с физиологией».

**Correction to the team's draft:** the example 0.45 µSv/h / 12.6 mSv is about 40× lower than measured deep-space rates (≈19 µGy/h absorbed, R25) and is near
Earth-surface background; AVEGA uses RAD-based simulated values instead. Every number in the radiation stream, the solar event on day 31 and the device ids are invented.

## 6c. AVEGA authored methods
- «Креативное задание» (formerly Narrative Assessment) and Crew Connection are the team's own methods — not validated instruments, not used for diagnosis.
  Context only: HRP risks of behavioural conditions (R3) and inadequate teamwork (R16). Scenario texts and question sets are written by AVEGA.

## 7. Not yet used (candidates — do not cite as used)
- NASA Open Science Data Repository (OSDR) and other NASA open data: not connected, no data from them is in AVEGA.

## How to add a reference
1. Add an entry: URL, what it says (paraphrase, < 15 words quoted), what it does **not** say, "Used for".
2. Link it from the UI/doc where it matters. 3. Never state a medical value without a source in this file.
