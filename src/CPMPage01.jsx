import { useState } from "react";

// Brand tokens — CPM official palette
const B = {
  // Core blues
  deepBlue:    "#005587",   // header bar, deepest blue
  darkBlue:    "#0076A8",   // active tabs, primary buttons
  midBlue:     "#00A3E0",   // accents, highlights, active states
  lightBlue:   "#62B5E5",   // light fills, borders, subtle backgrounds

  // Page structure
  pageBg:      "#F2F6FA",   // very light blue-grey page background
  cardBg:      "#FFFFFF",
  border:      "#C8DFF0",   // light blue-tinted border
  borderLight: "#E2EFF8",

  // Text
  textDark:    "#0D2E45",   // near-black with blue tint
  textMid:     "#2A5070",   // medium blue-grey
  textMuted:   "#6A90A8",   // muted label colour
  headerText:  "#C8E8F8",   // light text on dark header

  // Status colours (functional indicators only)
  green:       "#1A8A4A",
  greenLight:  "#EAF7EF",
  amber:       "#B86A00",
  amberLight:  "#FFF4E0",
  red:         "#C0392B",
  redLight:    "#FDECEA",

  // Derived
  activeBg:    "#E8F4FC",   // active tab / selected item background
  inputBg:     "#FAFCFE",
  lineColor:   "#C8DFF0",
  sectionLbl:  "#005587",
};

// CPM app pages
const APP_PAGES = [
  { id: "strategy",    short: "01  Strategy & Initiation" },
  { id: "rfp",         short: "02  RFP & Procurement" },
  { id: "contracting", short: "03  Contracting & Award" },
  { id: "execution",   short: "04  Weekly Execution" },
  { id: "qa",          short: "05  QA Workflow" },
  { id: "dashboard",   short: "06  CISO Dashboard" },
];

// Form sections (timeline steps inside Page 01)
const SECTIONS = [
  { id: "identity",       label: "Project Identity" },
  { id: "vision",         label: "Strategic Vision" },
  { id: "scope",          label: "Scope & Milestones" },
  { id: "prioritization", label: "Prioritization" },
  { id: "budget",         label: "Budget & Timeline" },
  { id: "risks",          label: "Dependencies" },
  { id: "submit",         label: "Submit" },
];

const DOMAINS = [
  "Identity & Access Management",
  "Network Security",
  "GRC & Compliance",
  "Security Operations (SOC)",
  "Application Security",
  "Cloud Security",
  "Data Protection",
  "Threat Intelligence",
  "Third-Party Risk",
  "Cyber Transformation",
];
const PILLARS = [
  "Cyber Resilience",
  "Risk Reduction",
  "Regulatory Compliance",
  "Digital Transformation Enablement",
  "Talent & Culture",
  "Operational Excellence",
];
const FRAMEWORKS = [
  "NIST CSF",
  "ISO 27001",
  "NIST 800-53",
  "CIS Controls",
  "DORA",
  "NCA ECC",
  "PCI DSS",
  "GDPR",
  "SOC 2",
];

// Scoring criteria
const CRITERIA = [
  {
    key: "strategic", label: "Strategic Impact", weight: 0.25, color: B.darkBlue,
    questions: [
      { q: "How directly does this initiative support the CISO's current strategic pillars?",
        opts: [
          "Directly supports a named CISO strategic pillar",
          "Partially supports a strategic pillar",
          "Supports general cyber hygiene but not a named pillar",
          "Not directly linked to current strategy",
        ] },
      { q: "What is the expected organizational reach / impact?",
        opts: [
          "Organization-wide impact across multiple business units",
          "Significant impact on one major business unit",
          "Limited to one team or department",
          "Minimal organizational impact",
        ] },
      { q: "Does this initiative enable or accelerate other strategic cyber initiatives?",
        opts: [
          "Yes — foundational enabler for multiple initiatives",
          "Yes — enables one other initiative",
          "Neutral — no enabling effect",
          "No — may slow other initiatives",
        ] },
    ],
  },
  {
    key: "regulatory", label: "Regulatory Urgency", weight: 0.20, color: "#7A5500",
    questions: [
      { q: "Is this initiative driven by a mandatory regulatory requirement?",
        opts: [
          "Yes — regulatory deadline within 6 months",
          "Yes — regulatory deadline within 12 months",
          "Compliance improvement but no hard deadline",
          "No regulatory driver",
        ] },
      { q: "What is the consequence of non-compliance if delayed?",
        opts: [
          "Significant fines, sanctions, or loss of license",
          "Regulatory warning or formal notice",
          "Minor audit finding",
          "No direct compliance consequence",
        ] },
      { q: "How many regulatory frameworks does this initiative address?",
        opts: [
          "3 or more frameworks",
          "2 frameworks",
          "1 framework",
          "No specific framework",
        ] },
    ],
  },
  {
    key: "risk", label: "Risk Reduction", weight: 0.20, color: B.red,
    questions: [
      { q: "How many existing identified cyber risks does this initiative address?",
        opts: [
          "5 or more risks from the risk register",
          "3-4 risks",
          "1-2 risks",
          "No direct link to risk register",
        ] },
      { q: "What is the severity of risks this initiative mitigates?",
        opts: [
          "Critical risks (major breach or outage potential)",
          "High risks (significant exposure)",
          "Medium risks (moderate exposure)",
          "Low risks (minor exposure)",
        ] },
      { q: "How quickly will risk reduction be realized after implementation?",
        opts: [
          "Immediate — within 1 month of go-live",
          "Short-term — within 3 months",
          "Medium-term — within 6 months",
          "Long-term — beyond 6 months",
        ] },
    ],
  },
  {
    key: "time", label: "Time Sensitivity", weight: 0.15, color: B.amber,
    questions: [
      { q: "Is there a hard external deadline driving this initiative?",
        opts: [
          "Yes — board or executive mandate with fixed date",
          "Yes — contractual or vendor-driven deadline",
          "Soft internal target, flexible",
          "No specific deadline",
        ] },
      { q: "What is the cost or risk of delaying this initiative by 6 months?",
        opts: [
          "Critical — major business or security impact",
          "Significant — notable risk or cost",
          "Minor — manageable impact",
          "Negligible — no meaningful consequence",
        ] },
      { q: "Does a time-sensitive external event depend on this?",
        opts: [
          "Yes — directly tied to an upcoming event",
          "Indirectly linked to an upcoming event",
          "No dependency but timing is preferred",
          "No relationship to any external event",
        ] },
    ],
  },
  {
    key: "dependency", label: "Initiative Dependencies", weight: 0.10, color: B.midBlue,
    questions: [
      { q: "How many other active initiatives depend on this one completing first?",
        opts: [
          "3 or more initiatives are blocked by this",
          "2 initiatives depend on this",
          "1 initiative depends on this",
          "No other initiatives are dependent",
        ] },
      { q: "Does this initiative depend on others being completed first?",
        opts: [
          "No dependencies — can start independently",
          "Minor dependency — one input needed",
          "Moderate dependency — partially blocked",
          "Fully blocked — cannot start until another completes",
        ] },
      { q: "What is the risk if a linked initiative is delayed?",
        opts: [
          "High — this initiative would be severely impacted",
          "Medium — partial workaround available",
          "Low — easily absorbed",
          "Not applicable",
        ] },
    ],
  },
  {
    key: "value", label: "Value Realization", weight: 0.10, color: B.green,
    questions: [
      { q: "How clearly can the value of this initiative be measured after completion?",
        opts: [
          "Fully measurable — clear KPIs with baseline and target",
          "Mostly measurable — some KPIs defined, others qualitative",
          "Partially measurable — value expected but hard to quantify",
          "Difficult to measure — largely intangible benefit",
        ] },
      { q: "What is the expected timeline to realize value?",
        opts: [
          "Immediate — value realized upon go-live",
          "Short-term — within 3 months post go-live",
          "Medium-term — 3-12 months post go-live",
          "Long-term — beyond 12 months",
        ] },
      { q: "Does this initiative generate cost savings, revenue protection, or efficiency gains?",
        opts: [
          "Yes — quantifiable financial value",
          "Yes — operational efficiency gains",
          "Indirect value only (improved posture)",
          "Value is primarily reputational or compliance-driven",
        ] },
      { q: "Has the expected value been validated with a business stakeholder?",
        opts: [
          "Yes — formally documented and signed off",
          "Yes — verbally agreed with senior stakeholder",
          "Under discussion, not confirmed",
          "No stakeholder validation yet",
        ] },
    ],
  },
];

// Score calculation
function calcScore(answers) {
  let total = 0, filled = 0;
  CRITERIA.forEach(c => {
    let s = 0, n = 0;
    c.questions.forEach((_, qi) => {
      if (answers[c.key]?.[qi] !== undefined) {
        s += (3 - answers[c.key][qi]);
        n++;
        filled++;
      }
    });
    if (n > 0) total += (s / (n * 3)) * c.weight * 100;
  });
  const totalQ = CRITERIA.reduce((a, c) => a + c.questions.length, 0);
  return { score: Math.round(total), filled, totalQ };
}

function scoreColor(s) {
  if (s >= 75) return B.green;
  if (s >= 50) return B.amber;
  if (s >= 25) return "#C07020";
  return B.red;
}
function scoreLabel(s) {
  if (s >= 75) return "HIGH";
  if (s >= 50) return "MEDIUM";
  if (s >= 25) return "LOW";
  return "—";
}

// Primitive UI components
const Lbl = ({ children, req }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: B.textMuted, letterSpacing: "0.06em", marginBottom: 5, textTransform: "uppercase" }}>
    {children}{req && <span style={{ color: B.red, marginLeft: 3 }}>*</span>}
  </div>
);

const Inp = ({ placeholder, value, onChange, type = "text", disabled }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value || ""}
    onChange={e => onChange?.(e.target.value)}
    disabled={disabled}
    style={{
      width: "100%", boxSizing: "border-box", border: `1px solid ${B.border}`, borderRadius: 4,
      padding: "8px 10px", fontSize: 13, color: B.textDark, background: disabled ? B.pageBg : B.inputBg,
      fontFamily: "inherit", outline: "none",
    }}
    onFocus={e => !disabled && (e.target.style.borderColor = B.midBlue)}
    onBlur={e => (e.target.style.borderColor = B.border)}
  />
);

const Sel = ({ options, value, onChange, placeholder }) => (
  <select
    value={value || ""}
    onChange={e => onChange?.(e.target.value)}
    style={{
      width: "100%", boxSizing: "border-box", border: `1px solid ${B.border}`, borderRadius: 4,
      padding: "8px 10px", fontSize: 13, color: value ? B.textDark : B.textMuted,
      background: B.inputBg, fontFamily: "inherit", outline: "none", appearance: "none", cursor: "pointer",
    }}
  >
    <option value="" disabled>{placeholder}</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Txt = ({ placeholder, value, onChange, rows = 3 }) => (
  <textarea
    placeholder={placeholder}
    value={value || ""}
    onChange={e => onChange?.(e.target.value)}
    rows={rows}
    style={{
      width: "100%", boxSizing: "border-box", border: `1px solid ${B.border}`, borderRadius: 4,
      padding: "8px 10px", fontSize: 13, color: B.textDark, background: B.inputBg,
      fontFamily: "inherit", outline: "none", resize: "vertical",
    }}
    onFocus={e => (e.target.style.borderColor = B.midBlue)}
    onBlur={e => (e.target.style.borderColor = B.border)}
  />
);

const AutoVal = ({ value }) => (
  <div style={{
    border: `1px solid ${B.border}`, borderRadius: 4, padding: "8px 10px",
    fontSize: 13, color: B.textMuted, background: B.pageBg,
    display: "flex", alignItems: "center", gap: 8,
  }}>
    <span style={{ fontSize: 9, background: B.activeBg, color: B.darkBlue, padding: "1px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: "0.08em" }}>AUTO</span>
    {value}
  </div>
);

const SectionLine = ({ title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 16px" }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: B.sectionLbl, letterSpacing: "0.08em", whiteSpace: "nowrap", textTransform: "uppercase" }}>{title}</div>
    <div style={{ flex: 1, height: 1, background: B.lineColor }} />
  </div>
);

const G = ({ cols = 2, gap = 14, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>{children}</div>
);

const AddBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={{
    marginTop: 8, background: "none", border: `1px dashed ${B.midBlue}`,
    color: B.darkBlue, borderRadius: 4, padding: "6px 14px", fontSize: 12,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  }}>+ {label}</button>
);

const DelBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: "none", border: "none", color: B.textMuted,
    cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 3, alignSelf: "center",
  }}>×</button>
);

const TH = ({ children, w }) => (
  <th style={{
    padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700,
    color: B.textMuted, letterSpacing: "0.07em", background: B.pageBg,
    borderBottom: `1px solid ${B.border}`, width: w, textTransform: "uppercase",
  }}>{children}</th>
);

const TD = ({ children }) => (
  <td style={{
    padding: "8px 10px", fontSize: 12, color: B.textDark,
    borderBottom: `1px solid ${B.borderLight}`, verticalAlign: "middle",
  }}>{children}</td>
);

// Main component
export default function CPMPage01() {
  const [activePage, setActivePage] = useState("strategy");
  const [section, setSection]       = useState(0);
  const [form, setForm] = useState({
    name: "", domain: "", subDomain: "", owner: "", domainLead: "",
    problemStatement: "", visionStatement: "", cisoPillar: "", businessOutcome: "",
    frameworks: [],
    kpis:         [{ name: "", baseline: "", target: "", method: "" }],
    inScope: "", outOfScope: [{ item: "", reason: "" }], assumptions: "",
    stakeholders: [{ name: "", role: "" }],
    milestones:   [{ name: "", date: "", deliverable: "" }],
    integrations: [{ initiative: "", nature: "", risk: "" }],
    answers: {},
    budget: "", capex: "", opex: "", startDate: "", endDate: "", budgetStatus: "",
    depRisks: [{ initiative: "", dependency: "", risk: "", severity: "" }],
    note: "",
  });

  const set  = (k, v)        => setForm(f => ({ ...f, [k]: v }));
  const setA = (k, i, f2, v) => setForm(f => { const a = [...f[k]]; a[i] = { ...a[i], [f2]: v }; return { ...f, [k]: a }; });
  const add  = (k, t)        => setForm(f => ({ ...f, [k]: [...f[k], t] }));
  const rem  = (k, i)        => setForm(f => ({ ...f, [k]: f[k].filter((_, j) => j !== i) }));
  const togFw = fw => set("frameworks", form.frameworks.includes(fw) ? form.frameworks.filter(x => x !== fw) : [...form.frameworks, fw]);
  const setAns = (ck, qi, v) => setForm(f => ({ ...f, answers: { ...f.answers, [ck]: { ...(f.answers[ck] || {}), [qi]: v } } }));

  const { score, filled, totalQ } = calcScore(form.answers);
  const today  = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const initId = "CPM-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900) + 100);

  return (
    <div style={{ fontFamily: "'Segoe UI','Trebuchet MS',system-ui,sans-serif", background: B.pageBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* HEADER BAR */}
      <div style={{ background: B.deepBlue, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 15, letterSpacing: "0.14em" }}>CPM</div>
          <div style={{ width: 1, height: 20, background: "#FFFFFF30" }} />
          <div style={{ color: B.headerText, fontSize: 12 }}>Cyber Portfolio Management</div>
          <div style={{ width: 1, height: 20, background: "#FFFFFF30" }} />
          <div style={{ color: "#FFFFFF90", fontSize: 12, fontStyle: "italic" }}>
            Initiative: <span style={{ color: "#FFFFFF", fontStyle: "normal" }}>{form.name || "New Initiative"}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: B.headerText, fontSize: 11 }}>ID: <span style={{ fontFamily: "monospace", color: "#FFFFFF" }}>{initId}</span></div>
          <div style={{ background: B.midBlue + "40", border: `1px solid ${B.midBlue}`, color: "#FFFFFF", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 3, letterSpacing: "0.06em" }}>DRAFT</div>
          <div style={{ color: B.headerText, fontSize: 11 }}>{today}</div>
        </div>
      </div>

      {/* PAGE NAVIGATION TABS */}
      <div style={{ background: "#FFFFFF", borderBottom: `1px solid ${B.border}`, padding: "0 28px", display: "flex", alignItems: "center", gap: 2, overflowX: "auto", flexShrink: 0 }}>
        {APP_PAGES.map(p => {
          const active    = p.id === activePage;
          const completed = APP_PAGES.findIndex(x => x.id === p.id) < APP_PAGES.findIndex(x => x.id === activePage);
          return (
            <button key={p.id} onClick={() => setActivePage(p.id)} style={{
              padding: "12px 18px", background: active ? B.darkBlue : "transparent",
              color: active ? "#FFFFFF" : completed ? B.darkBlue : B.textMuted,
              border: "none", borderBottom: active ? "none" : "2px solid transparent",
              fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
              whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s",
              borderRadius: active ? "4px 4px 0 0" : 0,
              marginBottom: active ? -1 : 0,
            }}>{p.short}</button>
          );
        })}
        <div style={{ marginLeft: "auto", padding: "0 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: B.textMuted }}>Priority Score:</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: filled > 0 ? scoreColor(score) : B.textMuted }}>{filled > 0 ? score : "—"}</div>
          {filled > 0 && (
            <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(score), background: scoreColor(score) + "18", border: `1px solid ${scoreColor(score)}40`, padding: "2px 8px", borderRadius: 3 }}>{scoreLabel(score)}</div>
          )}
        </div>
      </div>

      {/* PAGE SUBTITLE */}
      <div style={{ background: "#FFFFFF", padding: "7px 28px", borderBottom: `1px solid ${B.borderLight}` }}>
        <span style={{ fontSize: 12, color: B.textMuted }}>This page captures the strategic initiation of a new cyber initiative — before a project is formally created or procured.</span>
      </div>

      {/* SECTION TIMELINE */}
      <div style={{ background: "#FFFFFF", padding: "16px 28px 0", borderBottom: `2px solid ${B.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>Page Sections</div>
        <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
          <div style={{ position: "absolute", top: 15, left: 16, right: 16, height: 2, background: B.borderLight, zIndex: 0 }} />
          {/* Filled progress line */}
          <div style={{
            position: "absolute", top: 15, left: 16, height: 2, zIndex: 0,
            background: B.midBlue,
            width: `calc(${(section / (SECTIONS.length - 1)) * 100}% - 32px)`,
            transition: "width 0.3s",
          }} />
          {SECTIONS.map((s, i) => {
            const done    = section > i;
            const current = section === i;
            return (
              <div key={s.id} onClick={() => setSection(i)} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                flex: 1, cursor: "pointer", position: "relative", zIndex: 1, paddingBottom: 14,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? B.darkBlue : "#FFFFFF",
                  border: `2px solid ${done || current ? B.darkBlue : B.border}`,
                  fontSize: 11, fontWeight: 700,
                  color: done ? "#FFFFFF" : current ? B.darkBlue : B.textMuted,
                  boxShadow: current ? `0 0 0 4px ${B.lightBlue}60` : "none",
                  transition: "all 0.2s",
                }}>{done ? "✓" : i + 1}</div>
                <div style={{
                  marginTop: 7, fontSize: 10, fontWeight: current ? 700 : 500,
                  color: current ? B.darkBlue : done ? B.midBlue : B.textMuted,
                  textAlign: "center", lineHeight: 1.3, maxWidth: 82,
                }}>{s.label}</div>
                {current && <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${B.darkBlue}`, marginTop: 4 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN FORM AREA */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* SECTION 0: Project Identity */}
          {section === 0 && (
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px" }}>
              <SectionLine title="Project Identity" />
              <G cols={3} gap={16}>
                <div><Lbl req>Initiative Name</Lbl><Inp placeholder="e.g. IAM Modernisation Programme" value={form.name} onChange={v => set("name", v)} /></div>
                <div><Lbl>Unique Initiative ID</Lbl><AutoVal value={initId} /></div>
                <div><Lbl>Date Created</Lbl><AutoVal value={today} /></div>
              </G>
              <div style={{ height: 14 }} />
              <G cols={3} gap={16}>
                <div><Lbl req>Domain / Pillar</Lbl><Sel options={DOMAINS} value={form.domain} onChange={v => set("domain", v)} placeholder="Select domain..." /></div>
                <div><Lbl>Sub-domain / Capability Area</Lbl><Inp placeholder="e.g. Privileged Access Management" value={form.subDomain} onChange={v => set("subDomain", v)} /></div>
                <div />
              </G>
              <div style={{ height: 14 }} />
              <G cols={2} gap={16}>
                <div>
                  <Lbl req>Initiative Owner</Lbl>
                  <Inp placeholder="Search user or enter name..." value={form.owner} onChange={v => set("owner", v)} />
                  <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>May be the Domain Lead or a different accountable owner</div>
                </div>
                <div><Lbl req>Domain Lead</Lbl><Inp placeholder="Search user or enter name..." value={form.domainLead} onChange={v => set("domainLead", v)} /></div>
              </G>

              {/* Page connection note */}
              <div style={{ marginTop: 24, background: B.activeBg, border: `1px solid ${B.lightBlue}`, borderLeft: `4px solid ${B.darkBlue}`, borderRadius: 5, padding: "14px 16px", display: "flex", gap: 12 }}>
                <div style={{ fontSize: 18, color: B.darkBlue, flexShrink: 0, lineHeight: 1 }}>→</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: B.deepBlue, marginBottom: 4 }}>How this connects to other pages</div>
                  <div style={{ fontSize: 12, color: B.textMid, lineHeight: 1.6 }}>
                    Once the CISO approves this initiative, it automatically flows into <strong>Page 02 — RFP & Procurement</strong> when an RFP is drafted. The Initiative Name, ID, Domain, and Owner fields are locked and auto-carried forward to all subsequent pages.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: Strategic Vision */}
          {section === 1 && (
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px" }}>
              <SectionLine title="Strategic Alignment & Vision" />
              <G cols={2} gap={16}>
                <div><Lbl req>Problem Statement</Lbl><Txt rows={4} placeholder="What specific problem, gap, or risk does this initiative address? Describe the current state clearly." value={form.problemStatement} onChange={v => set("problemStatement", v)} /></div>
                <div><Lbl req>Vision Statement</Lbl><Txt rows={4} placeholder="What does success look like? Describe the desired future state upon completion." value={form.visionStatement} onChange={v => set("visionStatement", v)} /></div>
              </G>
              <div style={{ height: 14 }} />
              <G cols={2} gap={16}>
                <div><Lbl req>Link to CISO Strategic Objective / Pillar</Lbl><Sel options={PILLARS} value={form.cisoPillar} onChange={v => set("cisoPillar", v)} placeholder="Select pillar..." /></div>
                <div><Lbl req>Expected Business Outcome</Lbl><Inp placeholder="e.g. Reduce privileged access incidents by 80%" value={form.businessOutcome} onChange={v => set("businessOutcome", v)} /></div>
              </G>
              <div style={{ height: 14 }} />
              <Lbl>Framework Alignment</Lbl>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                {FRAMEWORKS.map(fw => (
                  <button key={fw} onClick={() => togFw(fw)} style={{
                    padding: "5px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    background: form.frameworks.includes(fw) ? B.darkBlue : B.cardBg,
                    color: form.frameworks.includes(fw) ? "#FFFFFF" : B.textMid,
                    border: `1px solid ${form.frameworks.includes(fw) ? B.darkBlue : B.border}`,
                    fontWeight: form.frameworks.includes(fw) ? 700 : 400,
                  }}>{fw}</button>
                ))}
              </div>

              <SectionLine title="KPIs & Success Metrics" />
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                <thead><tr><TH w="30%">KPI Name</TH><TH w="15%">Baseline</TH><TH w="15%">Target</TH><TH>Measurement Method</TH><TH w="30px" /></tr></thead>
                <tbody>
                  {form.kpis.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? B.cardBg : B.pageBg }}>
                      <TD><Inp placeholder="e.g. MFA coverage rate" value={r.name} onChange={v => setA("kpis", i, "name", v)} /></TD>
                      <TD><Inp placeholder="e.g. 40%" value={r.baseline} onChange={v => setA("kpis", i, "baseline", v)} /></TD>
                      <TD><Inp placeholder="e.g. 95%" value={r.target} onChange={v => setA("kpis", i, "target", v)} /></TD>
                      <TD><Inp placeholder="e.g. Monthly audit report" value={r.method} onChange={v => setA("kpis", i, "method", v)} /></TD>
                      <TD>{form.kpis.length > 1 && <DelBtn onClick={() => rem("kpis", i)} />}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddBtn onClick={() => add("kpis", { name: "", baseline: "", target: "", method: "" })} label="Add KPI" />
            </div>
          )}

          {/* SECTION 2: Scope & Milestones */}
          {section === 2 && (
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px" }}>
              <SectionLine title="Scope Definition" />
              <div><Lbl req>In Scope Description</Lbl><Txt rows={4} placeholder="Describe clearly what this initiative will deliver, cover, or address." value={form.inScope} onChange={v => set("inScope", v)} /></div>
              <div style={{ height: 14 }} />
              <Lbl>Out of Scope / Exclusions</Lbl>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                <thead><tr><TH w="45%">Exclusion Item</TH><TH>Reason / Rationale</TH><TH w="30px" /></tr></thead>
                <tbody>
                  {form.outOfScope.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? B.cardBg : B.pageBg }}>
                      <TD><Inp placeholder="What is excluded..." value={r.item} onChange={v => setA("outOfScope", i, "item", v)} /></TD>
                      <TD><Inp placeholder="Why it is excluded..." value={r.reason} onChange={v => setA("outOfScope", i, "reason", v)} /></TD>
                      <TD>{form.outOfScope.length > 1 && <DelBtn onClick={() => rem("outOfScope", i)} />}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddBtn onClick={() => add("outOfScope", { item: "", reason: "" })} label="Add Exclusion" />
              <div style={{ height: 14 }} />
              <div><Lbl>Assumptions</Lbl><Txt rows={2} placeholder="What conditions are assumed to be true for this initiative to proceed as planned?" value={form.assumptions} onChange={v => set("assumptions", v)} /></div>

              <SectionLine title="Key Milestones & Deliverables" />
              <div style={{ fontSize: 12, color: B.textMuted, marginBottom: 10 }}>High-level milestones at strategy stage — these will be refined and locked at the Contracting phase.</div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                <thead><tr><TH w="35%">Milestone Name</TH><TH w="18%">Target Date</TH><TH>Linked Deliverable(s)</TH><TH w="30px" /></tr></thead>
                <tbody>
                  {form.milestones.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? B.cardBg : B.pageBg }}>
                      <TD><Inp placeholder="e.g. Discovery & Assessment complete" value={r.name} onChange={v => setA("milestones", i, "name", v)} /></TD>
                      <TD><Inp type="date" value={r.date} onChange={v => setA("milestones", i, "date", v)} /></TD>
                      <TD><Inp placeholder="e.g. Gap Analysis Report" value={r.deliverable} onChange={v => setA("milestones", i, "deliverable", v)} /></TD>
                      <TD>{form.milestones.length > 1 && <DelBtn onClick={() => rem("milestones", i)} />}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddBtn onClick={() => add("milestones", { name: "", date: "", deliverable: "" })} label="Add Milestone" />

              <SectionLine title="Key Stakeholders & Affected Teams" />
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                <thead><tr><TH w="45%">Stakeholder / Team</TH><TH>Role / Involvement</TH><TH w="30px" /></tr></thead>
                <tbody>
                  {form.stakeholders.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? B.cardBg : B.pageBg }}>
                      <TD><Inp placeholder="e.g. IT Operations, Legal, CISO Office" value={r.name} onChange={v => setA("stakeholders", i, "name", v)} /></TD>
                      <TD><Inp placeholder="e.g. Impacted, Contributor, Approver" value={r.role} onChange={v => setA("stakeholders", i, "role", v)} /></TD>
                      <TD>{form.stakeholders.length > 1 && <DelBtn onClick={() => rem("stakeholders", i)} />}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddBtn onClick={() => add("stakeholders", { name: "", role: "" })} label="Add Stakeholder" />

              <SectionLine title="Integration Touchpoints with Other Initiatives" />
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                <thead><tr><TH w="28%">Related Initiative</TH><TH w="30%">Nature of Integration</TH><TH>Risk if Misaligned</TH><TH w="30px" /></tr></thead>
                <tbody>
                  {form.integrations.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? B.cardBg : B.pageBg }}>
                      <TD><Inp placeholder="Initiative name..." value={r.initiative} onChange={v => setA("integrations", i, "initiative", v)} /></TD>
                      <TD><Inp placeholder="e.g. Shared data feed" value={r.nature} onChange={v => setA("integrations", i, "nature", v)} /></TD>
                      <TD><Inp placeholder="e.g. Duplicate tooling, scope gap" value={r.risk} onChange={v => setA("integrations", i, "risk", v)} /></TD>
                      <TD>{form.integrations.length > 1 && <DelBtn onClick={() => rem("integrations", i)} />}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddBtn onClick={() => add("integrations", { initiative: "", nature: "", risk: "" })} label="Add Integration" />
            </div>
          )}

          {/* SECTION 3: Prioritization */}
          {section === 3 && (
            <div>
              {/* Score summary — KPI card style */}
              <div style={{ display: "grid", gridTemplateColumns: "200px repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
                <div style={{ background: B.deepBlue, borderRadius: 6, padding: "16px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: B.headerText, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Priority Score</div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: filled > 0 ? scoreColor(score) : "#FFFFFF30", lineHeight: 1 }}>{filled > 0 ? score : "—"}</div>
                  {filled > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor(score), marginTop: 4 }}>{scoreLabel(score)} PRIORITY</div>}
                  <div style={{ fontSize: 11, color: B.headerText + "80", marginTop: 6 }}>{filled} / {totalQ} answered</div>
                  {filled > 0 && <div style={{ marginTop: 10, height: 3, background: "#FFFFFF20", borderRadius: 2 }}><div style={{ width: `${score}%`, height: "100%", background: scoreColor(score), borderRadius: 2, transition: "width 0.3s" }} /></div>}
                </div>
                {CRITERIA.map(c => {
                  const n = c.questions.filter((_, qi) => form.answers[c.key]?.[qi] !== undefined).length;
                  return (
                    <div key={c.key} style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "12px 14px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: B.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{c.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{Math.round(c.weight * 100)}%</div>
                      <div style={{ fontSize: 11, color: n === c.questions.length ? B.green : B.textMuted, marginTop: 4 }}>{n}/{c.questions.length} done</div>
                    </div>
                  );
                })}
              </div>

              {CRITERIA.map(c => (
                <div key={c.key} style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "20px 24px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${B.borderLight}` }}>
                    <div style={{ background: c.color + "18", border: `1px solid ${c.color}40`, color: c.color, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 3 }}>{Math.round(c.weight * 100)}% WEIGHT</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: B.textDark }}>{c.label}</div>
                    <div style={{ marginLeft: "auto", fontSize: 11, color: c.questions.filter((_, qi) => form.answers[c.key]?.[qi] !== undefined).length === c.questions.length ? B.green : B.textMuted }}>
                      {c.questions.filter((_, qi) => form.answers[c.key]?.[qi] !== undefined).length}/{c.questions.length} answered
                    </div>
                  </div>
                  {c.questions.map((q, qi) => {
                    const sel = form.answers[c.key]?.[qi];
                    return (
                      <div key={qi} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 13, color: B.textDark, fontWeight: 600, marginBottom: 8 }}>
                          <span style={{ color: B.textMuted, marginRight: 6, fontSize: 11 }}>Q{qi + 1}</span>{q.q}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {q.opts.map((opt, oi) => (
                            <button key={oi} onClick={() => setAns(c.key, qi, oi)} style={{
                              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                              borderRadius: 4, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                              border: `1px solid ${sel === oi ? c.color : B.border}`,
                              background: sel === oi ? c.color + "10" : B.inputBg,
                              transition: "all 0.12s",
                            }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                                border: `2px solid ${sel === oi ? c.color : B.border}`,
                                background: sel === oi ? c.color : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {sel === oi && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF" }} />}
                              </div>
                              <span style={{ fontSize: 12, color: sel === oi ? B.textDark : B.textMid, fontWeight: sel === oi ? 600 : 400, flex: 1 }}>{opt}</span>
                              <span style={{ fontSize: 10, color: B.textMuted, fontWeight: 600, flexShrink: 0 }}>Score {4 - oi}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4: Budget */}
          {section === 4 && (
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px" }}>
              <SectionLine title="Budget & Timeline Estimates" />
              <div style={{ background: B.amberLight, border: `1px solid ${B.amber}40`, borderRadius: 4, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: B.amber }}>
                Budget figures at this stage are indicative only. Final figures will be locked at the Contracting phase.
              </div>
              <G cols={3} gap={16}>
                <div>
                  <Lbl req>Estimated Budget (Single Point)</Lbl>
                  <Inp placeholder="e.g. 500,000" value={form.budget} onChange={v => set("budget", v)} />
                  <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>USD — best estimate at strategy stage</div>
                </div>
                <div>
                  <Lbl>CAPEX Portion</Lbl>
                  <Inp placeholder="e.g. 300,000" value={form.capex} onChange={v => set("capex", v)} />
                  <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>Capital expenditure</div>
                </div>
                <div>
                  <Lbl>OPEX Portion</Lbl>
                  <Inp placeholder="e.g. 200,000" value={form.opex} onChange={v => set("opex", v)} />
                  <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4 }}>Operational expenditure</div>
                </div>
              </G>
              {(form.capex || form.opex) && form.budget && (
                <div style={{
                  marginTop: 8, padding: "7px 12px", borderRadius: 4, fontSize: 12,
                  background: Number(form.capex || 0) + Number(form.opex || 0) === Number(form.budget) ? B.greenLight : B.redLight,
                  color: Number(form.capex || 0) + Number(form.opex || 0) === Number(form.budget) ? B.green : B.red,
                  border: `1px solid ${Number(form.capex || 0) + Number(form.opex || 0) === Number(form.budget) ? B.green : B.red}30`,
                }}>
                  {Number(form.capex || 0) + Number(form.opex || 0) === Number(form.budget) ? "✓ CAPEX + OPEX matches total estimate" : "⚠ CAPEX + OPEX does not match total estimate"}
                </div>
              )}
              <div style={{ height: 16 }} />
              <G cols={3} gap={16}>
                <div><Lbl req>Estimated Start Date</Lbl><Inp type="date" value={form.startDate} onChange={v => set("startDate", v)} /></div>
                <div><Lbl req>Estimated End Date</Lbl><Inp type="date" value={form.endDate} onChange={v => set("endDate", v)} /></div>
                <div><Lbl>Budget Approval Status</Lbl><Sel options={["Pending", "Approved", "Rejected"]} value={form.budgetStatus} onChange={v => set("budgetStatus", v)} placeholder="Select..." /></div>
              </G>
            </div>
          )}

          {/* SECTION 5: Dependencies */}
          {section === 5 && (
            <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px" }}>
              <SectionLine title="Risk & Dependency Flags" />
              <div style={{ background: B.activeBg, border: `1px solid ${B.lightBlue}`, borderLeft: `4px solid ${B.midBlue}`, borderRadius: 4, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: B.textMid }}>
                At strategy stage, only dependency risks are captured here. A full risk register is built at the Contracting phase.
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                <thead><tr><TH w="22%">Related Initiative</TH><TH w="25%">Nature of Dependency</TH><TH>Risk if Delayed</TH><TH w="12%">Severity</TH><TH w="30px" /></tr></thead>
                <tbody>
                  {form.depRisks.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? B.cardBg : B.pageBg }}>
                      <TD><Inp placeholder="Initiative name..." value={r.initiative} onChange={v => setA("depRisks", i, "initiative", v)} /></TD>
                      <TD><Inp placeholder="e.g. Shared data pipeline" value={r.dependency} onChange={v => setA("depRisks", i, "dependency", v)} /></TD>
                      <TD><Inp placeholder="e.g. Scope gap in Phase 2" value={r.risk} onChange={v => setA("depRisks", i, "risk", v)} /></TD>
                      <TD><Sel options={["High", "Medium", "Low"]} value={r.severity} onChange={v => setA("depRisks", i, "severity", v)} placeholder="..." /></TD>
                      <TD>{form.depRisks.length > 1 && <DelBtn onClick={() => rem("depRisks", i)} />}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
              <AddBtn onClick={() => add("depRisks", { initiative: "", dependency: "", risk: "", severity: "" })} label="Add Dependency Risk" />
            </div>
          )}

          {/* SECTION 6: Submit */}
          {section === 6 && (
            <div>
              {/* Summary KPI cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Initiative",        value: form.name || "—" },
                  { label: "Domain",            value: form.domain || "—" },
                  { label: "Owner",             value: form.owner || "—" },
                  { label: "CISO Pillar",       value: form.cisoPillar || "—" },
                  { label: "Est. Budget (USD)", value: form.budget ? `$${Number(form.budget).toLocaleString()}` : "—", color: B.darkBlue },
                  { label: "Priority Score",    value: filled > 0 ? `${score} / 100` : "Not scored", color: filled > 0 ? scoreColor(score) : B.textMuted },
                ].map((item, i) => (
                  <div key={i} style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "14px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: B.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color || B.textDark, lineHeight: 1.3 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px", marginBottom: 16 }}>
                <SectionLine title="Note to Strategy Team (optional)" />
                <Txt rows={3} placeholder="Add any context, caveats, or notes for the strategy team reviewer..." value={form.note} onChange={v => set("note", v)} />
              </div>

              {/* Approval workflow */}
              <div style={{ background: B.cardBg, border: `1px solid ${B.border}`, borderRadius: 6, padding: "24px 28px", marginBottom: 20 }}>
                <SectionLine title="Review & Approval Workflow" />
                <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                  {[
                    { role: "Domain / Capability Lead", action: "Fills & submits this form", status: "SUBMITTED", color: B.darkBlue },
                    { role: "Strategy Team",            action: "Reviews for completeness & strategic fit", status: "NEXT", color: B.midBlue },
                    { role: "CISO",                     action: "Final approval, rejection, or return for revision", status: "PENDING", color: B.textMuted },
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                      <div style={{ flex: 1, background: B.pageBg, border: `1px solid ${step.color}40`, borderLeft: `4px solid ${step.color}`, borderRadius: 5, padding: "14px 16px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: step.color, letterSpacing: "0.07em", marginBottom: 4 }}>{step.status}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: B.textDark, marginBottom: 3 }}>{step.role}</div>
                        <div style={{ fontSize: 11, color: B.textMuted }}>{step.action}</div>
                      </div>
                      {i < 2 && <div style={{ color: B.lightBlue, fontSize: 22, margin: "0 8px", flexShrink: 0 }}>→</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button style={{
                  background: B.darkBlue, color: "#FFFFFF", fontWeight: 700, fontSize: 14,
                  padding: "12px 36px", borderRadius: 5, border: "none", cursor: "pointer",
                  fontFamily: "inherit", letterSpacing: "0.03em",
                }}>Submit for Strategy Review →</button>
              </div>
            </div>
          )}

          {/* Prev / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
            {section > 0 ? (
              <button onClick={() => setSection(s => s - 1)} style={{
                background: B.cardBg, border: `1px solid ${B.border}`, color: B.textMid,
                padding: "9px 22px", borderRadius: 4, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>← Previous</button>
            ) : <div />}
            {section < SECTIONS.length - 1 && (
              <button onClick={() => setSection(s => s + 1)} style={{
                background: B.darkBlue, border: "none", color: "#FFFFFF",
                padding: "9px 24px", borderRadius: 4, fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>Next: {SECTIONS[section + 1].label} →</button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
