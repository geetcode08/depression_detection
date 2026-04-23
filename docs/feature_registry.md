# Feature Registry

## Status Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete

## Features

| ID | Feature | Status | Backend | Frontend | Notes |
|----|---------|--------|---------|----------|-------|
| F-01 | User Registration | 🟢 | `routers/auth.py` | `src/app/(auth)/register/page.tsx` | JWT bootstrap via login after register |
| F-02 | User Login | 🟢 | `routers/auth.py` | `src/app/(auth)/login/page.tsx` | OAuth2 form encoding integrated |
| F-03 | Consent Gate | 🟢 | `routers/auth.py` | `src/components/shared/ConsentModal.tsx` | PATCH `/auth/consent` wired |
| F-04 | Account Deletion | 🟢 | `routers/auth.py` | `src/components/shared/Navbar.tsx` | Account delete action in nav |
| F-05 | Chat Send | 🟢 | `routers/chat.py` | `src/app/chat/page.tsx` | LLM + NLP pipeline live |
| F-06 | Sentiment Analysis | 🟢 | `services/nlp_service.py` | `src/components/chat/MessageBubble.tsx` | Shown with message metadata |
| F-07 | Depression Risk Scoring | 🟢 | `services/nlp_service.py` | `src/components/chat/RiskBadge.tsx` | Threshold-based UI rendering |
| F-08 | Crisis Escalation | 🟢 | `routers/chat.py` | `src/components/shared/CrisisAlert.tsx` | Fires on explicit crisis language across all tiers; returned top-level + in analysis |
| F-09 | LLM Chat Response | 🟢 | `services/llm_service.py` | `src/components/chat/ChatWindow.tsx` | Live chat replies |
| F-10 | Recommendations | 🟢 | `routers/recommend.py` | `src/app/dashboard/page.tsx` | Rule-based recs shown |
| F-11 | Dashboard Stats | 🟢 | `routers/dashboard.py` | `src/app/dashboard/page.tsx` | Aggregated metrics cards |
| F-12 | Mood Trend Chart Data | 🟢 | `routers/dashboard.py` | `src/components/dashboard/MoodLineChart.tsx` | Time-series chart wired |
| F-13 | Sentiment Distribution | 🟢 | `routers/dashboard.py` | `src/components/dashboard/SentimentPieChart.tsx` | Pie chart wired |
| F-14 | Behavioral Analytics | 🟢 | `routers/dashboard.py` | `src/components/dashboard/RiskTrendChart.tsx` | Pattern chart wired |
| F-15 | Mood Log Aggregation | 🟢 | `services/behavioral_service.py` | N/A | Daily upsert |
| F-16 | Keyword Explainability | 🟢 | `services/nlp_service.py` | `src/components/chat/MessageBubble.tsx` | TF-IDF keywords visible |
| F-17 | Anonymous Mode | 🟢 | `routers/auth.py` | `src/app/page.tsx` + `src/components/shared/Navbar.tsx` | Landing page guest start wired; navbar shows Guest badge + create account CTA |
| F-18 | ML Model Training | 🟢 | `ml_training/` | N/A | Offline scripts |
| F-19 | Analyze Arbitrary Text | 🟢 | `routers/analysis.py` | API client ready | POST /analyze |
| F-20 | Analysis History | 🟢 | `routers/analysis.py` | `src/app/analysis/page.tsx` | Session analysis now includes and displays stored `session_summary` |

## Update Rules
- When implementing a feature, change status to 🟡
- When feature passes manual/automated testing, change to 🟢
- Add new features at the bottom with next ID
