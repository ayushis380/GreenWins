# GreenWins - High Level Design Diagrams

## 1. System Architecture (For Slides)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                  GREENWINS                                     ║
║                     Gamified Sustainability Tracking with AI                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                              ┌─────────────────┐
                              │      USER       │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
            │   Win Cards   │  │   AI Coach    │  │   My Story    │
            │   Dashboard   │  │     Chat      │  │   Narrative   │
            └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │         REACT HOOKS LAYER           │
                    │  useWinCards │ useCoach │ useTeam   │
                    │  useStreak │ useObservability       │
                    └──────────────────┬──────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   localStorage  │         │  Next.js API    │         │     Opik        │
│   Persistence   │         │    Routes       │         │   Tracing       │
└─────────────────┘         └────────┬────────┘         └────────┬────────┘
                                     │                           │
                    ┌────────────────┼────────────────┐          │
                    ▼                ▼                ▼          │
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
            │  /analyze   │  │   /chat     │  │  /custom    │    │
            │   -stamp    │  │ GreenGuide  │  │  -action    │    │
            └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
                   │                │                │           │
                   └────────────────┼────────────────┘           │
                                    ▼                            │
                         ┌─────────────────────┐                 │
                         │   GEMINI 2.5 FLASH  │◄────────────────┘
                         │   (5 Endpoints)     │     Traces every call
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  VALIDATION LAYER   │
                         │  EPA/DOE Bounds     │
                         │  Scientific Checks  │
                         └─────────────────────┘
```

## 2. AI/LLM Flow (For Technical Slide)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GEMINI INTEGRATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

  User Input                                                      Output
      │                                                              ▲
      ▼                                                              │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Validate │───▶│  Build   │───▶│  Gemini  │───▶│  Parse   │───▶│ Validate │
│  Request │    │  Prompt  │    │   Call   │    │   JSON   │    │  Bounds  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │               │               │               │
                     ▼               ▼               ▼               ▼
               ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
               │ Context  │    │  Trace   │    │ Extract  │    │  Adjust  │
               │Injection │    │ to Opik  │    │  Output  │    │ if OOB   │
               └──────────┘    └──────────┘    └──────────┘    └──────────┘


  ┌─────────────────────────────────────────────────────────────────────────┐
  │                          5 SPECIALIZED ENDPOINTS                         │
  ├─────────────────┬───────────────────────────────────────────────────────┤
  │  analyze-stamp  │ Personalized impact analysis with sustainability score│
  │  chat           │ GreenGuide advisor with user context injection        │
  │  analyze-custom │ Create new actions with AI-calculated metrics         │
  │  weekly-narr.   │ Generate shareable story from week's activities       │
  │  parse-voice    │ Convert voice input to matching action                │
  └─────────────────┴───────────────────────────────────────────────────────┘
```

## 3. Observability Pipeline (For Evaluation Slide)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OBSERVABILITY PIPELINE                               │
└─────────────────────────────────────────────────────────────────────────────┘

    API Call                    Opik Tracing                    Dashboard
        │                            │                              │
        ▼                            ▼                              ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────────┐
│traceGeminiCall│──────────▶│ Parent Trace  │          │ /observability    │
│   wrapper     │           │   + LLM Span  │          │                   │
└───────────────┘           └───────┬───────┘          │ ┌───────────────┐ │
                                    │                  │ │ Success Rate  │ │
                            ┌───────┴───────┐          │ │ Avg Latency   │ │
                            ▼               ▼          │ │ Token Usage   │ │
                    ┌───────────┐   ┌───────────┐      │ │ Confidence    │ │
                    │  Input    │   │  Output   │      │ └───────────────┘ │
                    │  Payload  │   │  + Text   │      │                   │
                    └───────────┘   └───────────┘      │ ┌───────────────┐ │
                            │               │          │ │ Trace History │ │
                            ▼               ▼          │ │ with Details  │ │
                    ┌─────────────────────────┐        │ └───────────────┘ │
                    │      Metadata           │        │                   │
                    │ • Latency (ms)          │        │ ┌───────────────┐ │
                    │ • Token Count           │        │ │ User Feedback │ │
                    │ • Confidence Score      │        │ │ 👍 / 👎       │ │
                    │ • Mermaid Graph         │        │ └───────────────┘ │
                    └─────────────────────────┘        └───────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      CUSTOM EVALUATION METRICS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │ CO2Accuracy │  │WaterAccuracy│  │EnergyAccur. │  │ BoundsCompliance    ││
│  │  Metric     │  │   Metric    │  │   Metric    │  │     Metric          ││
│  │ (±25% tol)  │  │ (±40% tol)  │  │ (±40% tol)  │  │ (EPA/DOE limits)    ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │ OverallAccuracyMetric│                                 │
│                    │ 50% CO2 + 25% Water  │                                 │
│                    │     + 25% Energy     │                                 │
│                    └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. User Journey Flow (For Demo Slide)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER JOURNEY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  ADD    │─────▶│  STAMP  │─────▶│DESCRIBE │─────▶│   AI    │
    │ ACTION  │      │  A DAY  │      │ ACTION  │      │ANALYSIS │
    └─────────┘      └─────────┘      └─────────┘      └─────────┘
         │                                                   │
         │                                                   ▼
         │                                            ┌─────────────┐
         │                                            │ • Score 1-10│
         │                                            │ • AI Insight│
         │                                            │ • Adj Impact│
         │                                            │ • Tips      │
         │                                            └─────────────┘
         │                                                   │
         ▼                                                   ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  BUILD  │◀─────│  GROW   │◀─────│  TRACK  │◀─────│  SAVE   │
    │ STREAKS │      │ IMPACT  │      │PROGRESS │      │ & LEARN │
    └─────────┘      └─────────┘      └─────────┘      └─────────┘
         │
         ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                     GAMIFICATION LOOP                        │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
    │  │ Streaks │  │ Shields │  │ Levels  │  │  Teams  │        │
    │  │ 🔥 7day │  │ 🛡️ x3   │  │ ⭐ Lv5  │  │ 👥 Top3 │        │
    │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
    └─────────────────────────────────────────────────────────────┘
```

## 5. Gamification System (For Features Slide)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GAMIFICATION ELEMENTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────────────┐
    │                          STREAK SYSTEM                                 │
    │                                                                        │
    │   Day 1    Day 2    Day 3    Day 4    Day 5    Day 6    Day 7        │
    │    ✓        ✓        ✓        ✗        ✓        ✓        ?          │
    │                              │                                        │
    │                              ▼                                        │
    │                     ┌─────────────────┐                               │
    │                     │  STREAK SHIELD  │                               │
    │                     │     🛡️ Used!    │                               │
    │                     │  Streak Saved!  │                               │
    │                     └─────────────────┘                               │
    └───────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────────────┐
    │                         IMPACT TRACKING                                │
    │                                                                        │
    │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
    │   │   🌿 CO2    │  │   💧 Water  │  │   ⚡ Energy │  │   🌳 Trees  │ │
    │   │   15.2 kg   │  │   2,340 L   │  │   8.5 kWh   │  │    0.7 eq   │ │
    │   │  ▲ +2.1     │  │  ▲ +150     │  │  ▲ +1.2     │  │  ▲ +0.1     │ │
    │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
    │                                                                        │
    │   Equivalency: "Like driving 38 fewer miles this week!"               │
    └───────────────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────────────────────────────────┐
    │                          SOCIAL FEATURES                               │
    │                                                                        │
    │   ┌─────────────────────┐    ┌─────────────────────────────────────┐  │
    │   │     LEADERBOARD     │    │           TEAM/HOUSEHOLD            │  │
    │   │                     │    │                                     │  │
    │   │  🥇 EcoWarrior 142  │    │  Team: Green Family                 │  │
    │   │  🥈 You       128   │    │  Weekly Goal: 50 kg CO2             │  │
    │   │  🥉 TreeHugger 115  │    │  Progress: ████████░░ 82%           │  │
    │   └─────────────────────┘    └─────────────────────────────────────┘  │
    └───────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Judging Criteria Mapping

| Criteria | GreenWins Feature | Evidence |
|----------|-------------------|----------|
| **Functionality** | 5 AI endpoints, stamp flow, streak system | Live demo works end-to-end |
| **Real-world Relevance** | EPA/DOE data, 12 practical actions, weekly cycles | Based on behavioral science |
| **LLM/Agent Use** | Context-aware prompts, structured JSON, validation | 5 specialized endpoints |
| **Evaluation/Observability** | Opik traces, 5 custom metrics, human feedback | `/observability` dashboard |
| **Goal Alignment** | Environmental tracking, teams, social sharing | Quantified positive impact |
