# GSoC 2027 Execution Roadmap

> **Principle:** Contribute first, learn only when blocked. Every day must produce a tangible artifact. No tutorials. No videos. Only production code and real issues.

---

## Phase Status Dashboard

| Phase | Name                                     | Status     | Duration                |
| ----- | ---------------------------------------- | ---------- | ----------------------- |
| 1     | Organization Selection & Reconnaissance  | ⬜ Pending | 3 days                  |
| 2     | Build Environment & Codebase Orientation | ⬜ Pending | 7 days                  |
| 3     | First Contribution                       | ⬜ Pending | 7-14 days               |
| 4     | Medium Contributions                     | ⬜ Pending | 30 days                 |
| 5     | Mentor Relationship Building             | ⬜ Pending | Ongoing (starts Day 15) |
| 6     | Proposal Preparation                     | ⬜ Pending | 21 days (Feb-Mar 2027)  |

---

## Phase 1: Organization Selection & Reconnaissance

### Objective

Select ONE primary organization and ONE backup organization based on data, not opinions. Eliminate all others with documented reasoning. Understand exactly what each organization values in contributors before writing a single line of code.

### Why This Phase Matters

GSoC selection is a product of three factors multiplied together:

```
P(selection) = P(org acceptance) × P(proposal quality) × P(contributor credibility)
```

Most applicants optimize `P(proposal quality)`. The winners optimize `P(contributor credibility)` by proving they can navigate the codebase and land patches _before_ applying. This phase ensures you pick an org where `P(org acceptance)` and your ability to build credibility are both maximized.

### Exit Criteria

- [ ] Primary organization and backup organization are locked in
- [ ] You can explain in 2 sentences why you chose each
- [ ] You can explain in 1 sentence why each of the other 8 was eliminated
- [ ] You have read the organization's GSoC page, contributor guide, and ideas list
- [ ] You have identified 3-5 subsystems within the org that match your skills
- [ ] You have read the last 2 years of GSoC final reports from that org
- [ ] You are subscribed to the org's developer mailing list / Discord / IRC

### Deliverables

1. A locked-in decision document (this file, Phase 1 section)
2. A shortlist of 3-5 candidate subsystems/projects
3. Notes on org culture: how they review patches, how they communicate, what they reject

### Estimated Duration

3 days (12 hours total)

### Common Mistakes

| Mistake                                                                                     | Consequence                                        |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Choosing an org because it's "prestigious" without checking if they accepted GSoC last year | Wasted 6 months if they don't participate          |
| Choosing an org where you've never built the codebase                                       | You'll drown during contribution period            |
| Not reading past GSoC final reports                                                         | You don't know what a "winning" project looks like |
| Picking an org with no beginner-tagged issues                                               | You won't build credibility before applying        |
| Choosing an org that doesn't align with your visible skills                                 | Reviewers dismiss your application                 |

### Success Metrics

- [ ] Decision matrix completed with weighted scoring
- [ ] Both org choices have confirmed GSoC participation in 2025 and 2026
- [ ] Both orgs have active public communication channels you can verify
- [ ] At least 5 beginner-friendly open issues exist in the primary org's tracker
- [ ] You can name 3 maintainers by name and describe their area of the codebase

---

### 1.1 Ranked List of 10 Organizations

These organizations are ranked by **probability of YOUR acceptance** weighted by career value. The ranking assumes the following about you:

- **Claimed:** Strong C++ foundation, DSA, systems thinking
- **Visible evidence:** TypeScript/React/Firebase web development (your current project)
- **Risk factor:** Zero visible C++ open source contributions — this is your single biggest credibility gap

This risk factor is accounted for in the scoring.

| Rank | Organization                     | Category                | Primary Language  |
| ---- | -------------------------------- | ----------------------- | ----------------- |
| 1    | **KDE**                          | Desktop/Applications    | C++ (Qt)          |
| 2    | **CERN-HSF**                     | Scientific Computing    | C++, Python       |
| 3    | **OpenCV**                       | Computer Vision / AI    | C++, Python       |
| 4    | **LLVM**                         | Compiler Infrastructure | C++               |
| 5    | **Blender**                      | 3D Graphics             | C, C++            |
| 6    | **Apache (individual projects)** | Distributed Systems     | C++, Java, Python |
| 7    | **Boost**                        | C++ Libraries           | C++               |
| 8    | **PostgreSQL**                   | Database                | C                 |
| 9    | **GNOME**                        | Desktop/Infrastructure  | C, JavaScript     |
| 10   | **QEMU**                         | Virtualization          | C                 |

---

### 1.2 Organization Comparison

#### Scoring Criteria (1-10 scale)

| Criterion                  | Weight | Description                                                                               |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| **C++ Suitability**        | 10     | Core codebase in C++; you write C++ daily                                                 |
| **Beginner Accessibility** | 10     | Has tagged beginner issues; mentors help new contributors ramp up                         |
| **GSoC Reliability**       | 10     | Consistently participated in GSoC for 5+ years; unlikely to drop out                      |
| **Slot Count**             | 9      | Number of GSoC contributors accepted per year (more slots = higher chance)                |
| **Web Dev Bridge**         | 8      | Parts of the org involve web/TypeScript work where your existing skills apply immediately |
| **AI/ML Relevance**        | 7      | AI/ML components exist in the codebase                                                    |
| **Systems Depth**          | 7      | Codebase involves systems programming for long-term growth                                |
| **Mentor Quality**         | 7      | Structured mentoring program; mentors actively guide, not just review                     |
| **Career Value**           | 6      | Impact on resume and job prospects                                                        |
| **Issue Availability**     | 6      | Beginner-tagged issues exist and are accessible                                           |

---

#### Detailed Comparison

##### 1. KDE (Recommended: Primary)

| Criterion              | Score   | Rationale                                                                                                   |
| ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| C++ Suitability        | 10      | Pure C++/Qt. Entire codebase is C++.                                                                        |
| Beginner Accessibility | 9       | "Junior Jobs" tag on Bugzilla. Excellent onboarding docs.                                                   |
| GSoC Reliability       | 10      | Participated every year since GSoC inception (2005).                                                        |
| Slot Count             | 9       | 15-25 contributors accepted per year.                                                                       |
| Web Dev Bridge         | 7       | Kirigami, Plasma Mobile, KDE Connect, web extensions — TypeScript/React skills transferable to UI toolkits. |
| AI/ML Relevance        | 4       | Krita has AI-assisted features; some ML in Plasma. Not core.                                                |
| Systems Depth          | 6       | Moderate. IPC, file indexing (Baloo), packaging.                                                            |
| Mentor Quality         | 10      | One of the best. Structured onboarding, dedicated mentor hours.                                             |
| Career Value           | 7       | KDE experience signals C++/Qt proficiency. Strong in embedded, automotive, and desktop sectors.             |
| Issue Availability     | 9       | Hundreds of Junior Jobs across projects.                                                                    |
| **Weighted Total**     | **500** |                                                                                                             |

**Why KDE is ranked #1 for you:**

1. **Lowest barrier to first merge.** KDE has a formal "Junior Jobs" program designed to get newcomers their first commit within days.
2. **C++ with immediate feedback.** Qt framework provides visual output for every change. You see the result of your code, unlike a compiler optimization pass.
3. **Web dev crossover.** KDE has web-based components (KDE Connect, Plasma widgets in QML/JS, web services). Your TypeScript/React experience means you can contribute to some subsystems _today_ while building C++ depth.
4. **Massive slot count.** With 15-25 slots, the raw probability math is in your favor.
5. **Proven mentoring culture.** KDE mentors are trained. They expect newcomers. They have a playbook for getting you from zero to merged.

**Candidate subsystems:**

- **Dolphin** (file manager) — Well-structured C++/Qt, moderate complexity
- **Kate** (text editor) — Smaller codebase, good for first contributions
- **KDE Connect** — Network layer in C++, UI in QML/JS (your web skills apply)
- **Krita** — Image processing in C++, some AI-assisted features
- **Elisa** (music player) — Small, modern codebase, good for learning Qt patterns

---

##### 2. CERN-HSF (Recommended: Backup)

| Criterion              | Score   | Rationale                                                                   |
| ---------------------- | ------- | --------------------------------------------------------------------------- |
| C++ Suitability        | 9       | Heavy C++ for performance-critical physics software (ROOT, Geant4, etc).    |
| Beginner Accessibility | 8       | Good documentation. Physicists are used to onboarding newcomers.            |
| GSoC Reliability       | 9       | Consistent participant.                                                     |
| Slot Count             | 7       | ~10-15 contributors per year.                                               |
| Web Dev Bridge         | 6       | Some web dashboards for experiment monitoring. Less web work.               |
| AI/ML Relevance        | 9       | ML for particle detection, anomaly detection, data analysis.                |
| Systems Depth          | 9       | Deep systems work: distributed computing, data pipelines, HPC.              |
| Mentor Quality         | 9       | CERN scientists treat mentoring as core responsibility.                     |
| Career Value           | 9       | "CERN" on a resume opens doors in HPC, scientific computing, quant finance. |
| Issue Availability     | 7       | Good but requires understanding domain context.                             |
| **Weighted Total**     | **484** |                                                                             |

**Why CERN-HSF is the backup:**

1. **AI/ML + C++ intersection is real.** Projects like using ML for particle track reconstruction involve both.
2. **Prestigious.** CERN carries weight comparable to FAANG in scientific computing circles.
3. **Ramp-up is harder.** You need to understand some physics context to be useful. This is why it's not primary.

**Candidate subsystems:**

- **ROOT** — Data analysis framework (C++)
- **CMSSW** — CMS experiment software
- **ML for particle physics** — TensorFlow/PyTorch inference in C++ pipelines

---

##### 3. OpenCV

| Criterion              | Score   | Rationale                                                          |
| ---------------------- | ------- | ------------------------------------------------------------------ |
| C++ Suitability        | 9       | Core in C++. DNN module in C++.                                    |
| Beginner Accessibility | 7       | Documentation exists. But onboarding requires CV domain knowledge. |
| GSoC Reliability       | 8       | Consistent participation.                                          |
| Slot Count             | 6       | ~5-10 contributors per year.                                       |
| Web Dev Bridge         | 4       | OpenCV.js exists but is a niche. Minimal web crossover.            |
| AI/ML Relevance        | 10      | DNN module, ML module. Directly relevant.                          |
| Systems Depth          | 6       | Moderate. SIMD optimization, memory management.                    |
| Mentor Quality         | 7       | Good but not as structured as KDE or CERN.                         |
| Career Value           | 9       | OpenCV on resume = computer vision/AI roles. Excellent signal.     |
| Issue Availability     | 6       | Issues exist but often require domain knowledge to fix.            |
| **Weighted Total**     | **440** |                                                                    |

**Eliminated because:** The C++ codebase requires computer vision domain knowledge (linear algebra, image processing algorithms) that adds months to your ramp-up. The slot count is half of KDE's. This is a better target for someone already in CV.

---

##### 4. LLVM

| Criterion              | Score   | Rationale                                                                  |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| C++ Suitability        | 10      | The reference C++ codebase. Thousands of engineers reference LLVM's style. |
| Beginner Accessibility | 3       | The codebase is 4M+ lines. Build takes 30+ minutes on modest hardware.     |
| GSoC Reliability       | 10      | Never missed a year.                                                       |
| Slot Count             | 10      | ~20-30 contributors per year.                                              |
| Web Dev Bridge         | 2       | Virtually none.                                                            |
| AI/ML Relevance        | 6       | MLIR subproject connects compilers to ML frameworks. Relevant but niche.   |
| Systems Depth          | 10      | Maximum. This is the deepest C++ codebase you can work on.                 |
| Mentor Quality         | 7       | Good but they expect you to be self-sufficient. Less hand-holding.         |
| Career Value           | 10      | Maximum. LLVM contributor = immediate credibility at any C++ shop.         |
| Issue Availability     | 8       | Many issues. Few realistic for a first-timer.                              |
| **Weighted Total**     | **430** |                                                                            |

**Eliminated because:** The ramp-up time from your current state (web developer, no visible C++ open source) to landing a patch in LLVM is measured in _months_, not weeks. LLVM contributors who get GSoC slots have typically already landed 2-3 patches before applying. You can revisit LLVM for GSoC 2028 after establishing your C++ open source credibility elsewhere.

---

##### 5. Blender

| Criterion              | Score   | Rationale                                              |
| ---------------------- | ------- | ------------------------------------------------------ |
| C++ Suitability        | 8       | GPL C and C++. Modern but with legacy patterns.        |
| Beginner Accessibility | 5       | Well-documented but codebase is large and build-heavy. |
| GSoC Reliability       | 9       | Consistent participant.                                |
| Slot Count             | 5       | ~5-10 contributors.                                    |
| Web Dev Bridge         | 3       | Little overlap.                                        |
| AI/ML Relevance        | 5       | Some AI denoising, but peripheral.                     |
| Systems Depth          | 7       | Deep 3D pipeline, threading, GPU work.                 |
| Mentor Quality         | 7       | Good, but the project has many applicants.             |
| Career Value           | 8       | Strong in graphics/gaming. Niche elsewhere.            |
| Issue Availability     | 5       | Issues are often deep in specific subsystems.          |
| **Weighted Total**     | **387** |                                                        |

**Eliminated because:** 3D graphics domain knowledge is a prerequisite for meaningful contributions. Slot count is low. This is a better fit for someone already in computer graphics.

---

##### 6. Apache (individual projects)

| Criterion              | Score   | Rationale                                                                  |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| C++ Suitability        | 6       | Apache projects span C++, Java, Python. You'd need to pick a C++ project.  |
| Beginner Accessibility | 7       | Varies wildly by project. Some are very welcoming.                         |
| GSoC Reliability       | 9       | Apache is an umbrella org. Always participates.                            |
| Slot Count             | 8       | Many projects = many slots. But spread thin.                               |
| Web Dev Bridge         | 7       | Several Apache projects are web infrastructure. Your current skills apply. |
| AI/ML Relevance        | 6       | Apache projects like MXNet, TVM exist. Not all are active.                 |
| Systems Depth          | 7       | Distributed systems, databases, messaging.                                 |
| Mentor Quality         | 6       | Quality varies significantly by project. Some have inactive mentors.       |
| Career Value           | 7       | Apache brand is recognized. Impact depends on which project.               |
| Issue Availability     | 7       | Good. Large number of projects = many issues.                              |
| **Weighted Total**     | **410** |                                                                            |

**Eliminated because:** "Apache" isn't one org — it's 50+ projects with different cultures, mentors, and codebases. Picking the wrong sub-project wastes months. The overhead of evaluating individual Apache projects is too high when KDE and CERN-HSF offer better-structured paths.

---

##### 7. Boost

| Criterion              | Score   | Rationale                                                                |
| ---------------------- | ------- | ------------------------------------------------------------------------ |
| C++ Suitability        | 10      | The standard for C++ library design.                                     |
| Beginner Accessibility | 4       | Review process is famously rigorous. Patches go through multiple rounds. |
| GSoC Reliability       | 6       | Has participated intermittently. Not guaranteed.                         |
| Slot Count             | 3       | ~3-5 contributors per year.                                              |
| Web Dev Bridge         | 1       | None.                                                                    |
| AI/ML Relevance        | 3       | Boost.Math, Boost.Graph — adjacent but not AI/ML focused.                |
| Systems Depth          | 7       | Deep template metaprogramming.                                           |
| Mentor Quality         | 7       | Rigorous but not warm. Code quality bar is very high.                    |
| Career Value           | 9       | Boost contributor = C++ expert. Very strong signal.                      |
| Issue Availability     | 4       | Issues are highly technical.                                             |
| **Weighted Total**     | **346** |                                                                          |

**Eliminated because:** Boost is for C++ library experts. Your first few patches being rejected 3+ times before acceptance is normal. Too slow for a GSoC timeline if you're establishing credibility from scratch.

---

##### 8. PostgreSQL

| Criterion              | Score   | Rationale                                                            |
| ---------------------- | ------- | -------------------------------------------------------------------- |
| C++ Suitability        | 2       | C, not C++. Different idioms.                                        |
| Beginner Accessibility | 6       | Excellent documentation. Database systems ramp-up is steep.          |
| GSoC Reliability       | 9       | Consistent.                                                          |
| Slot Count             | 5       | ~5-8 contributors.                                                   |
| Web Dev Bridge         | 5       | You know databases from your current project. Useful but tangential. |
| AI/ML Relevance        | 5       | ML for query optimization exists. Experimental.                      |
| Systems Depth          | 9       | Deep systems: storage, concurrency, networking.                      |
| Mentor Quality         | 9       | Excellent. Strong engineering culture.                               |
| Career Value           | 10      | PostgreSQL expertise is highly valued.                               |
| Issue Availability     | 6       | Issues exist but require deep database internals knowledge.          |
| **Weighted Total**     | **361** |                                                                      |

**Eliminated because:** PostgreSQL is C, not C++. Different language idioms, different tooling, different ecosystem. You'd be learning C conventions when your stated focus is C++. Also, database internals ramp-up is 2-3 months before you can meaningfully fix a bug.

---

##### 9. GNOME

| Criterion              | Score   | Rationale                                    |
| ---------------------- | ------- | -------------------------------------------- |
| C++ Suitability        | 3       | Primarily C and Vala. C++ is rare. GTK is C. |
| Beginner Accessibility | 7       | "Newcomers" tags on GitLab. Good onboarding. |
| GSoC Reliability       | 9       | Consistent.                                  |
| Slot Count             | 7       | ~10-15 contributors.                         |
| Web Dev Bridge         | 5       | Some GNOME web services exist.               |
| AI/ML Relevance        | 2       | Minimal.                                     |
| Systems Depth          | 5       | Moderate.                                    |
| Mentor Quality         | 9       | Good. Similar culture to KDE.                |
| Career Value           | 6       | GNOME experience valued in Linux ecosystem.  |
| Issue Availability     | 8       | Good.                                        |
| **Weighted Total**     | **348** |                                              |

**Eliminated because:** If you want a desktop environment org, KDE is the C++ choice. GNOME is the C choice. Choosing GNOME means learning GObject/C conventions instead of deepening your C++.

---

##### 10. QEMU

| Criterion              | Score   | Rationale                                              |
| ---------------------- | ------- | ------------------------------------------------------ |
| C++ Suitability        | 2       | Pure C. Even more distant from C++ than PostgreSQL.    |
| Beginner Accessibility | 3       | Virtualization is a highly specialized domain.         |
| GSoC Reliability       | 7       | Participates but not every year.                       |
| Slot Count             | 4       | ~3-5 contributors.                                     |
| Web Dev Bridge         | 1       | None.                                                  |
| AI/ML Relevance        | 1       | None.                                                  |
| Systems Depth          | 10      | Maximum. Emulation, hardware interfaces, performance.  |
| Mentor Quality         | 7       | Knowledgeable but expect domain expertise.             |
| Career Value           | 9       | QEMU experts are rare and well-compensated.            |
| Issue Availability     | 3       | Issues require deep hardware/virtualization knowledge. |
| **Weighted Total**     | **289** |                                                        |

**Eliminated because:** Wrong language (C), extremely high domain barrier, very low slot count. Triple elimination.

---

### 1.3 Decision Matrix with Weighted Scoring

| Criterion (Weight)     | KDE     | CERN    | OpenCV  | LLVM    | Blender | Apache  | Boost   | PG      | GNOME   | QEMU    |
| ---------------------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| C++ Suitability (10)   | 10      | 9       | 9       | 10      | 8       | 6       | 10      | 2       | 3       | 2       |
| Beginner Access (10)   | 9       | 8       | 7       | 3       | 5       | 7       | 4       | 6       | 7       | 3       |
| GSoC Reliability (10)  | 10      | 9       | 8       | 10      | 9       | 9       | 6       | 9       | 9       | 7       |
| Slot Count (9)         | 9       | 7       | 6       | 10      | 5       | 8       | 3       | 5       | 7       | 4       |
| Web Dev Bridge (8)     | 7       | 6       | 4       | 2       | 3       | 7       | 1       | 5       | 5       | 1       |
| AI/ML Relevance (7)    | 4       | 9       | 10      | 6       | 5       | 6       | 3       | 5       | 2       | 1       |
| Systems Depth (7)      | 6       | 9       | 6       | 10      | 7       | 7       | 7       | 9       | 5       | 10      |
| Mentor Quality (7)     | 10      | 9       | 7       | 7       | 7       | 6       | 7       | 9       | 9       | 7       |
| Career Value (6)       | 7       | 9       | 9       | 10      | 8       | 7       | 9       | 10      | 6       | 9       |
| Issue Availability (6) | 9       | 7       | 6       | 8       | 5       | 7       | 4       | 6       | 8       | 3       |
| **Weighted Total**     | **500** | **484** | **440** | **430** | **387** | **410** | **346** | **361** | **348** | **289** |

---

### 1.4 Primary Recommendation: KDE

**Justification:**

1. **Mathematical advantage.** KDE accepts 15-25 GSoC contributors per year. With a credible application (which this roadmap will produce), your baseline probability of selection is higher than at orgs accepting 3-5.

2. **Fastest path to credibility.** KDE's "Junior Jobs" system is designed to produce your first merged commit within 48-72 hours of starting. No other org in this list has a comparably optimized newcomer pipeline.

3. **C++ purity with visual feedback.** Every change you make in KDE produces a visible result (a button moves, a dialog changes, a feature works). This keeps motivation high during the grinding early weeks. Compare to LLVM where your first contribution might be a 3-line fix that makes a test pass with no visible effect.

4. **Your web skills are immediately useful.** KDE has QML/JS UI layers, web service integrations, and Plasma widgets that match your React/TypeScript experience. You can contribute to these **today** while building your C++ depth in parallel.

5. **Lowest risk of rejection.** KDE's mentor training program means reviewers are patient with first-time contributors. Your learning curve is expected and planned for.

**What success looks like at KDE:**

- By Month 1: 2-3 merged commits across different KDE projects
- By Month 2: Ownership of a small feature or bug fix area
- By Month 4: Proposal written for a medium/large project based on your demonstrated expertise

---

### 1.5 Backup Recommendation: CERN-HSF

**Justification:**

CERN-HSF is the backup because it preserves the C++ focus while adding AI/ML depth that KDE lacks. If KDE doesn't participate in GSoC 2027 (unlikely but possible) or if you discover during Phase 2 that desktop application development doesn't engage you, CERN-HSF is the pivot.

The CERN application has a different strategy: you lean on your AI/ML interest and demonstrated C++ capability (from KDE contributions) to build credibility in the scientific computing domain.

**Activation trigger for backup:**

- KDE announces they are not participating in GSoC 2027
- After 21 days of KDE contributions, you find the domain unengaging
- You find a CERN-HSF project that is a perfect skill match

---

### 1.6 Why the Remaining 8 Organizations Were Eliminated

| Organization   | Primary Reason for Elimination                                                                |
| -------------- | --------------------------------------------------------------------------------------------- |
| **OpenCV**     | Computer vision domain knowledge required for meaningful contributions. Ramp-up too long.     |
| **LLVM**       | 4M-line codebase. First-patch timeline measured in months, not days. Revisit for GSoC 2028.   |
| **Blender**    | 3D graphics domain knowledge required. Low slot count.                                        |
| **Apache**     | Not one org — 50+ projects. Overhead of evaluating individual projects is too high.           |
| **Boost**      | Patch acceptance requires C++ library design expertise. Rejection rate too high for timeline. |
| **PostgreSQL** | C, not C++. Database internals ramp-up is 2-3 months before meaningful contributions.         |
| **GNOME**      | C/Vala, not C++. KDE is the C++ desktop org.                                                  |
| **QEMU**       | C, not C++. Virtualization domain knowledge required. Triple elimination.                     |

---

### 1.7 Phase 1: Daily Execution Plan

This ends Phase 1 analysis. The remaining phases of the roadmap are built around the primary organization (KDE) with the backup (CERN-HSF) as a parallel track.

---

## Phase 2: Build Environment & Codebase Orientation (Days 1-7)

### Objective

Build the organization's core software from source, run the test suite, navigate the codebase well enough to understand where different subsystems live, and identify exactly which subsystem you will target for your first contribution.

### Why This Phase Matters

You cannot fix what you cannot build. The single biggest predictor of GSoC success is how quickly a contributor can go from "I found an issue" to "I have a working patch." The build environment is the foundation.

### Exit Criteria

- [ ] Core software builds from source with zero errors on first attempt
- [ ] Test suite runs and you understand what "all green" looks like
- [ ] You can navigate from a UI element (e.g., a button in Dolphin) to the C++ code that renders it
- [ ] You have identified one subsystem for your first contribution
- [ ] You have built and tested at least one trivial change (e.g., changing a string, recompiling, verifying)

### Deliverables

1. Build environment script (repeatable)
2. Architecture notes: 1-page document mapping subsystems to source directories
3. Test suite output (baseline)

### Estimated Duration

7 days (21-28 hours total)

### Common Mistakes

| Mistake                                                      | Consequence                                    |
| ------------------------------------------------------------ | ---------------------------------------------- |
| Trying to understand the entire codebase before contributing | You never start contributing                   |
| Skipping the "change a string, recompile, verify" step       | You don't trust your build pipeline            |
| Not documenting dependencies                                 | You waste hours when you need to rebuild later |
| Reading code without a specific question to answer           | Passive reading = zero retention               |

### Success Metrics

- [ ] `kdesrc-build` or equivalent completes in under 60 minutes
- [ ] Test suite passes with zero failures
- [ ] You can answer: "If I want to fix a bug in Dolphin's file rename dialog, which files do I touch?"

---

### Phase 2: Daily Execution Plan

---

#### Day 1: Environment Bootstrap

**Objective:** Set up build dependencies and begin building the KDE development environment.

**Time Allocation:** 3-4 hours

**Tasks:**

- [ ] Install build dependencies for your OS
  - macOS: `brew install cmake extra-cmake-modules qt@6 kf6-kcoreaddons kf6-kwidgetsaddons kf6-kconfig kf6-ki18n kf6-kio`
  - Linux (Fedora): `sudo dnf install qt6-qtbase-devel kf6-kcoreaddons-devel kf6-kwidgetsaddons-devel kf6-kconfig-devel kf6-ki18n-devel kf6-kio-devel cmake extra-cmake-modules git`
- [ ] Install `kdesrc-build` — the official KDE source builder
  - Read: https://community.kde.org/Get_Involved/development#Set_up_your_development_environment
  - Command: `mkdir -p ~/kde/src && cd ~/kde/src && git clone https://invent.kde.org/sdk/kdesrc-build.git`
- [ ] Configure `kdesrc-buildrc` to build only the subsystem you'll target first (Dolphin + its dependencies)
  - Read only: The `kdesrc-buildrc` section relevant to selecting modules
- [ ] Start the build: `kdesrc-build dolphin`
  - This runs in the background. While it builds, move to next task.
- [ ] Read exactly these sections of the KDE contribution guide:
  - "Getting Started" (first page only)
  - "Development Workflow" (first half)

**Expected Output:**

- `kdesrc-build` installed and configured
- Dolphin build initiated
- KDE contribution workflow understood

**Deliverables:**

- [ ] Screenshot of build starting successfully
- [ ] `~/.config/kdesrc-buildrc` file exists and is configured

**End-of-Day Checklist:**

- [ ] Dependencies installed without errors
- [ ] `kdesrc-build` cloned and configured
- [ ] Build started (okay if it runs overnight)
- [ ] Contribution guide read

**Definition of Done:** `kdesrc-build dolphin` has been invoked and is either running or completed.

---

#### Day 2: Build Verification

**Objective:** Verify the build completed, run tests, and make a trivial change to validate the build pipeline.

**Time Allocation:** 3-4 hours

**Tasks:**

- [ ] Check build status from Day 1. If failed, debug and fix using build logs
- [ ] If build succeeded: navigate to Dolphin's build directory
  - `cd ~/kde/build/dolphin`
- [ ] Run Dolphin's test suite: `ctest --output-on-failure`
  - Document any failures
- [ ] Run Dolphin from the build directory: `source ~/kde/build/dolphin/prefix.sh && dolphin`
  - Verify it launches and is functional
- [ ] Make a trivial change to prove your pipeline:
  - Find a user-visible string in Dolphin's source (e.g., a menu label)
  - Change it to `"[YOUR_NAME] was here"`
  - Rebuild: `kdesrc-build dolphin --no-src --no-include-dependencies`
  - Launch and verify the string changed
- [ ] Revert the change

**Expected Output:**

- Dolphin running from your build
- Test suite results documented
- Verified: you can change code → build → see result

**Deliverables:**

- [ ] Test suite output (paste into a notes file)
- [ ] Screenshot of Dolphin running from your build
- [ ] Confirmation that trivial change → build → verify works

**End-of-Day Checklist:**

- [ ] Dolphin builds AND runs from source
- [ ] Test suite executed (all passing or identified failures documented)
- [ ] Pipeline verified end-to-end

**Definition of Done:** You can change a line of code, rebuild, and see the result in under 5 minutes.

---

#### Day 3: Codebase Mapping (Dolphin)

**Objective:** Build a mental map of Dolphin's source tree. Answer: "What lives where?"

**Time Allocation:** 3-4 hours

**Tasks:**

- [ ] Read Dolphin's source tree structure at `~/kde/src/dolphin/src/`
  - Identify top-level directories
- [ ] For each directory, identify its purpose by reading the first 20 lines of 2-3 files in it
  - Do NOT read entire files. Skim headers and class declarations only.
- [ ] Create a 1-page architecture note with this structure:
  ```
  dolphin/src/
  ├── views/       → Icon view, details view, column view widgets
  ├── kitemviews/  → Custom item view framework
  ├── panels/      → Side panels (places, info, folders)
  ├── settings/    → Configuration dialogs and state
  └── ...
  ```
- [ ] Trace one user action to its code path:
  - Action: "Right-click a file → Properties"
  - Find: The class that handles this, the method called, and how the dialog is constructed
  - Use `grep -r "Properties" ~/kde/src/dolphin/src/` as starting point
- [ ] Read exactly these files in full (they teach you Dolphin's patterns):
  - `dolphinmainwindow.h` (class declaration)
  - `dolphinmainwindow.cpp` (first 100 lines only — constructor and setup)

**Expected Output:**

- 1-page architecture note
- One code path traced end-to-end

**Deliverables:**

- [ ] Markdown file: `~/kde/notes/dolphin-architecture.md`
- [ ] Hand-drawn or typed call chain for "right-click → Properties"

**End-of-Day Checklist:**

- [ ] Every top-level source directory has a 1-sentence purpose in your notes
- [ ] At least one user action traced from UI to code
- [ ] `dolphinmainwindow` class understood at a high level

**Definition of Done:** Given a bug report about Dolphin's file operations, you can name the directory and likely the file where the fix would go.

---

#### Day 4: Issue Discovery

**Objective:** Find beginner-appropriate issues in KDE's bug tracker and select one to fix.

**Time Allocation:** 3-4 hours

**Tasks:**

- [ ] Go to https://bugs.kde.org
- [ ] Search for issues tagged "junior-jobs" in Dolphin
  - Use the advanced search: product=Dolphin, keywords=junior-jobs, status=CONFIRMED or REPORTED
- [ ] Read 10 junior jobs. For each, classify:
  - Can I reproduce this? (Yes/No/Need more info)
  - Do I understand what code would need to change? (Yes/Maybe/No)
  - Estimated time to fix? (<1h / 1-4h / >4h)
- [ ] Pick 3 candidates and attempt to reproduce each one
  - If you can't reproduce a bug, eliminate it
- [ ] Select ONE issue to fix
  - Read the bug report, comments, and any linked patches
- [ ] Comment on the bug: "I'd like to work on this. [One sentence about your approach.]"
- [ ] Read the KDE patch submission policy:
  - Read: https://community.kde.org/Infrastructure/GitLab#Submitting_a_merge_request

**Expected Output:**

- 3 candidate issues reproduced
- 1 issue selected with a comment posted

**Deliverables:**

- [ ] List of 10 junior jobs evaluated (paste bug URLs into notes)
- [ ] Comment posted on your selected bug

**End-of-Day Checklist:**

- [ ] You can reproduce your chosen bug
- [ ] A maintainer knows you're working on it (comment posted)
- [ ] You've read the merge request submission process

**Definition of Done:** You have a specific, reproducible bug with an approach in mind and have declared intent on the tracker.

---

#### Day 5: First Fix Attempt

**Objective:** Write, build, and locally test a fix for your selected issue.

**Time Allocation:** 3-4 hours

**Tasks:**

- [ ] Navigate to the relevant source file(s) from Day 3's architecture map
- [ ] Read the surrounding 200 lines of context around the bug location
- [ ] Implement the fix
  - Keep it minimal. A junior job should be a 5-50 line change.
  - If you're writing >100 lines, you're solving the wrong problem
- [ ] Build: `kdesrc-build dolphin --no-src --no-include-dependencies`
- [ ] Test manually: reproduce the original bug, verify it's gone
- [ ] Test that you didn't break anything:
  - Run the test suite again: `ctest --output-on-failure`
  - Verify no new failures
- [ ] If fix doesn't work: debug with `gdb dolphin` or add `qDebug()` statements
  - Do NOT spend more than 2 hours debugging. If stuck, ask on #kde-devel IRC/Matrix

**Expected Output:**

- A working fix, manually verified
- Test suite pass confirmed

**Deliverables:**

- [ ] Diff of your change
- [ ] Test results (before and after)

**End-of-Day Checklist:**

- [ ] Fix works locally
- [ ] No regressions (test suite passes)
- [ ] Code follows KDE style (check surrounding code for patterns)

**Definition of Done:** Bug is fixed on your machine. You've verified it manually and the test suite passes.

---

#### Day 6: Patch Preparation & Submission

**Objective:** Prepare the patch according to KDE's submission standards and create a merge request.

**Time Allocation:** 3-4 hours

**Tasks:**

- [ ] Format your commit:
  - Commit message format: Read KDE's commit policy
  - Short summary (≤72 chars)
  - Body explaining what and why (not how — the code says how)
  - `BUG: <bug-id>` tag
- [ ] Run `git clang-format` if KDE uses it (check existing commits for style)
- [ ] Create a fork of Dolphin on KDE's GitLab: https://invent.kde.org
- [ ] Push your branch: `git push origin fix-<bug-id>`
- [ ] Create a merge request (MR) on invent.kde.org
  - Title: same as commit summary
  - Description: what the MR does, how to test it, which bug it fixes
  - Link to the bug report
  - Mark as draft if you want review but don't think it's ready
- [ ] Add the bug's assignee or dolphin maintainer as reviewer
- [ ] Read the first 5 merged MRs in Dolphin to understand what "accepted" looks like:
  - Go to https://invent.kde.org/system/dolphin/-/merge_requests?state=merged
  - Read 5 of them. Note: MR size, number of review iterations, reviewer comments

**Expected Output:**

- Merge request submitted

**Deliverables:**

- [ ] Merge request URL
- [ ] Notes on 5 merged MRs (pattern recognition)

**End-of-Day Checklist:**

- [ ] MR is publicly visible on invent.kde.org
- [ ] Commit message follows KDE conventions
- [ ] MR description explains what, why, and how to test

**Definition of Done:** MR is submitted and visible. You've requested review.

---

#### Day 7: Review Response & Iteration

**Objective:** Respond to reviewer feedback, iterate on your patch, and get approved.

**Time Allocation:** 3-4 hours

**Note:** Review may take 1-3 days. If no response by end of Day 7, begin Phase 3 (next issue) while waiting. Do NOT idle.

**Tasks:**

- [ ] Check MR for reviewer comments every 2 hours during your work window
- [ ] When you receive review:
  - Read every comment twice before responding
  - Do NOT argue. If reviewer suggests a different approach, implement it.
  - If you don't understand feedback, say: "I don't understand [specific thing]. Could you elaborate?"
  - Address ALL comments before requesting re-review
- [ ] Push updated commits (force-push to your branch is fine for MRs)
- [ ] Resolve comment threads as you fix them
- [ ] When all comments are resolved, remove draft status if applicable, and re-request review
- [ ] **While waiting for review:** Start Phase 3 — find your next issue
  - Read 5 more junior jobs
  - Reproduce 2 more bugs
  - Pick your second issue

**Expected Output:**

- MR either merged or in active review with all comments resolved

**Deliverables:**

- [ ] All review comments acknowledged and addressed
- [ ] Second issue identified and reproduced (parallel work)

**End-of-Day Checklist:**

- [ ] All reviewer comments are resolved
- [ ] Next issue is queued up
- [ ] You understand WHY the reviewer made each suggestion (patterns to apply to future MRs)

**Definition of Done:** MR is merged OR all comments are resolved and awaiting final approval. Second issue is identified.

---

### Phase 2: PASS / FAIL Criteria

**PASS:** You can build Dolphin from source, make a change, and submit an MR within 7 days. Your MR is under review.

**FAIL:** After 7 days, you have not submitted an MR. If FAIL, re-evaluate:

- Is KDE the right org? (Try a smaller KDE project like Kate or Elisa)
- Is your build working? (Debug environment issues)
- Did you pick a bug that was too hard? (Pick a simpler one)

**Decision point:** If FAIL on Day 7, give yourself 3 more days. If FAIL on Day 10, activate the backup plan (CERN-HSF).

---

## Phase 3: First Contribution (Days 8-21)

### Objective

Land your first merged patch and begin a second. Establish the pattern: find bug → fix → submit → iterate on review → merged. Do this 3 times.

### Why This Phase Matters

One merged patch is proof you can navigate the workflow. Two merged patches is proof you're reliable. Three merged patches is credibility — maintainers will advocate for your GSoC proposal.

### Exit Criteria

- [ ] 3 merged MRs in the primary organization
- [ ] At least one MR required substantive code changes (>20 lines)
- [ ] You have received and incorporated feedback from at least 2 different reviewers
- [ ] You can predict with reasonable accuracy whether your next MR will be accepted

### Deliverables

1. 3 merged MR URLs
2. Notes on recurring review feedback patterns (your personal "things reviewers catch" list)
3. A document: "What I've learned about this codebase's conventions"

### Estimated Duration

14 days (42-56 hours total)

### Common Mistakes

| Mistake                                         | Consequence                                                |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Writing large patches before landing small ones | Reviewers don't trust you yet; large MRs get ignored       |
| Abandoning an MR because review is slow         | You have 1 MR, not 3. Find reviewers actively              |
| Making the same mistake across MRs              | Shows you don't learn from review                          |
| Not testing edge cases                          | Reviewer finds bugs you should have caught → reduces trust |

### Success Metrics

- [ ] 3 merged MRs
- [ ] Median review-to-merge time under 5 days
- [ ] Zero MRs rejected (minor feedback is fine; "this approach is wrong" is a rejection)
- [ ] At least one MR was merged with <2 iterations

---

### Phase 3: Daily Execution Plan

#### Days 8-14: Second Contribution

Follow the same daily pattern as Days 5-7, applied to your second issue (identified on Day 7).

**Specific additions for second contribution:**

- [ ] Before writing code: read 10 more merged MRs in your target subsystem. Note the review feedback patterns. Apply them before submitting.
- [ ] Internalize KDE's coding style. Read: https://community.kde.org/Policies/Frameworks_Coding_Style
- [ ] Your commit message should now reference the subsystem convention you're following
- [ ] If review feedback overlaps with feedback from first MR, fix it preemptively

**Parallel task:** While waiting for review on MR #2, find and begin work on issue #3.

#### Days 15-21: Third Contribution & Mentorship Activation

- [ ] Submit MR #3 using all patterns learned from MRs #1 and #2
- [ ] Your third MR should target a different subsystem than the first two (breadth signal)
- [ ] Begin Phase 5 (Mentor Relationship Building) — see below
- [ ] If all 3 MRs are merged by Day 21, move to Phase 4

---

### Phase 3: PASS / FAIL Criteria

**PASS:** 3 merged MRs within 21 days (counting from Phase 2 start — Day 28 total)

**FAIL:** After 28 total days, fewer than 3 merged MRs. If FAIL:

- If 2 merged: continue but extend timeline. You need 5+ before proposal.
- If 1 merged: serious problem. Debug whether it's your code quality or issue selection.
- If 0 merged: Change approach entirely. Likely building the wrong thing or working on the wrong issues.

---

## Phase 4: Medium Contributions (Days 22-60)

### Objective

Transition from junior jobs to substantive feature work. Take ownership of a small feature or bug area. Demonstrate that you can design and implement more than trivial fixes.

### Why This Phase Matters

Junior jobs get you in the door. Medium contributions prove you can handle a GSoC-sized project. Your proposal will reference the work you did in this phase as evidence that you can deliver the project you're proposing.

### Exit Criteria

- [ ] 2 medium-complexity contributions merged (50-200 lines each, multi-file changes)
- [ ] At least one contribution includes new tests
- [ ] At least one contribution required design discussion (not just bug fix)
- [ ] You have interacted with the subsystem maintainer directly (not just MR comments)
- [ ] You have a clear understanding of which subsystem you want to propose a GSoC project for

### Deliverables

1. 2 medium MR URLs
2. Notes on design discussions (what was proposed, what feedback was given, what was accepted)
3. A document: "Proposed GSoC Project Areas" — 3 ideas with 1-paragraph descriptions

### Estimated Duration

30 days (90-120 hours total)

### Common Mistakes

| Mistake                                                     | Consequence                                        |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Proposing a feature without discussing it first             | Wasted work if maintainer disagrees with approach  |
| Implementing a feature that already exists or is deprecated | Shows you don't understand the codebase            |
| Skipping tests for medium changes                           | Reviewer will block merge                          |
| Not asking for design feedback before coding                | You code for 5 days, get feedback, need to rewrite |

### Success Metrics

- [ ] 2 medium MRs merged
- [ ] At least one design discussion documented in a bug report or mailing list thread
- [ ] You've received unsolicited positive feedback ("nice work", "good approach")
- [ ] You can name 3 maintainers who know your name and your contributions

---

### Phase 4: Execution Strategy

Unlike Phase 3, medium contributions are not day-by-day predictable. Instead, follow this loop:

```
1. Find a bug report or feature request marked "help wanted" (not junior-jobs)
2. Comment: "I'd like to take this. Here's my approach: [2-3 sentences]. Any concerns?"
3. WAIT for maintainer response (continue working on other things)
4. If maintainer approves approach → implement
5. If maintainer suggests changes → incorporate, ask for re-confirmation
6. Implement, test, add tests, submit MR
7. Iterate on review
```

**Key rule:** Never implement before getting approach approval on medium work. Junior jobs are simple enough to fix directly. Medium work requires design alignment first.

**Target subsystems for medium work:**

- The same subsystem as your junior jobs (depth)
- OR a new subsystem that shows breadth (e.g., if you fixed 3 Dolphin bugs, try a Kate or KDE Connect bug)

---

## Phase 5: Mentor Relationship Building (Starts Day 15, Ongoing)

### Objective

Build genuine working relationships with potential mentors. By the time proposals open, at least one maintainer should have your name in mind when thinking about GSoC candidates.

### Why This Phase Matters

GSoC selection is not blind. Org admins ask maintainers: "Who do you want to mentor?" If a maintainer already knows you and your work, they will advocate for you. If you're a name on a proposal with no prior interaction, you're competing against names they recognize.

### Exit Criteria

- [ ] You can name 3+ potential mentors by name and describe what they work on
- [ ] At least one maintainer has reviewed 2+ of your MRs
- [ ] You've had a substantive conversation with a potential mentor (not just "LGTM" or "fix this")
- [ ] You know which maintainer is most likely to mentor your proposed project

### Deliverables

1. List of 3-5 potential mentors with notes on their subsystems and communication style
2. At least one mailing list or IRC/Matrix conversation where you asked a thoughtful question about architecture/design (not just "how do I fix this bug")

### How to Build Relationships (Do NOT do these as forced networking)

**Natural relationship building:**

1. After your 3rd merged MR, join the KDE development Matrix/IRC channel (#kde-devel on Matrix)
2. When you encounter something confusing in the codebase, ask: "I noticed [pattern X] in [file]. Is there a historical reason for this, or is it just how it evolved?" — This signals design thinking, not helplessness.
3. When someone else asks a question you can answer, answer it.
4. When a maintainer makes a suggestion in your MR that you don't fully understand, ask: "I implemented it your way, but I notice [tradeoff Y]. Was that intentional?" — This shows you think about consequences.
5. Review other people's MRs in your subsystem. You don't need to be an expert — catching a typo or a missing null check is valuable and signals engagement.

**What NOT to do:**

- Do NOT DM maintainers asking to be mentored
- Do NOT say "I'm applying for GSoC, can you help me?"
- Do NOT ask generic career advice questions
- Do NOT send unsolicited messages to anyone

**The rule:** Your name becomes known through your work product, not through outreach.

---

## Phase 6: Proposal Preparation (February - March 2027)

### Objective

Write a GSoC proposal that demonstrates deep understanding of the codebase, clearly defines the project scope, and proves you can execute.

### Estimated Duration

21 days (63-84 hours)

### Exit Criteria

- [ ] Proposal draft completed
- [ ] Proposal reviewed by at least one potential mentor (informally — ask in your MR or on the dev channel: "I'm drafting a proposal for [topic]. Would anyone be willing to give me feedback?")
- [ ] Proposal addresses: problem statement, approach, timeline, deliverables, stretch goals, risk mitigation
- [ ] Proposal references your prior contributions ("As demonstrated in my fix for [bug #]...")

### Deliverables

1. Final proposal document
2. Mentor feedback incorporated

**Full Phase 6 details will be generated when organizations announce their GSoC 2027 project ideas lists (typically January-February 2027). The proposal must target a specific project from the ideas list.**

---

## Parallel Track: CERN-HSF Backup

While your primary effort targets KDE, maintain awareness of CERN-HSF:

- [ ] **Week 2:** Subscribe to CERN-HSF mailing list. Read 1 thread per week to understand community norms.
- [ ] **Week 4:** Build one CERN-HSF project from source (choose the one closest to your skills — likely ROOT or a Python/C++ analysis tool).
  - Follow the same Day 1-3 pattern from Phase 2.
- [ ] **Week 6:** Find and reproduce one beginner bug in the CERN-HSF project.
- [ ] **If KDE fails Phase 2:** Switch to CERN-HSF immediately. Do not wait.

**Activation triggers:**

1. KDE announces non-participation in GSoC 2027
2. KDE build environment is unfixable on your machine after 10 days of effort
3. You have zero merged MRs after 30 days of KDE contributions

---

## Summary: Critical Path

```
Day  1-3:   Build KDE env, read contribution guide
Day  4:     Find and reproduce first bug
Day  5-6:   Fix and submit first MR
Day  7:     Review iteration, find second bug
Day  8-14:  MR #2 merged, MR #3 in progress
Day 15-21:  MR #3 merged, begin mentor interaction
Day 22-60:  2 medium MRs, design discussions, build mentor relationships
Month 4-5:  (Buffer / depth building / backup activation if needed)
Month 6:    Proposal preparation (Feb-Mar 2027)
```

---

## Rules of Engagement

1. **No passive learning.** If you're not writing code or reading code with a specific question, you're off plan.
2. **No tutorial rabbit holes.** The documentation you need is the code and the KDE community wiki. Nothing else.
3. **No waiting.** If blocked on review, start the next task. There is always a next task.
4. **No scope creep.** Fix the bug. Don't refactor the file. Don't improve unrelated code. Save that for Phase 4.
5. **Ship it.** A merged 5-line fix beats a perfect 500-line MR that's stuck in review.
6. **Document your blockers.** If something takes >2x the estimated time, write down why. The answer is usually: wrong issue selection.
7. **Ask after 2 hours.** If you're stuck debugging for 2 hours, ask on #kde-devel. Include: what you tried, what you expected, what happened.

---

> **Next step:** Confirm this roadmap meets your expectations. Do you want me to expand any phase? Do the recommendations align with your interests? Once confirmed, move to execution starting with Phase 1, Day 1.
