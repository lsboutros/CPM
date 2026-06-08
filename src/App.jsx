import React, { useState, useMemo } from "react";

// ══════════════════════════════════════════════════════════════════════════════
//                  CYBER PORTFOLIO SUITE — COMBINED ARTIFACT
//
//  This file merges two applications behind a single launcher:
//    • Cyber Budgeting App         — initiative definition, prioritization,
//                                    leadership review, budget cycle
//    • Cyber Portfolio Management  — strategy, RFP, contracting, weekly
//                                    updates, project execution
//
//  Both apps read from and write to a SHARED CANONICAL initiative store.
//  Endorsed initiatives from Budgeting auto-appear in CPM's Strategy pipeline.
// ══════════════════════════════════════════════════════════════════════════════

// ── Canonical domain reference ────────────────────────────────────────────────
// The CPM app uses 10 long domain labels; the Budgeting app uses 6 short keys.
// We map between them so a single initiative can flow across both views.

const CANON_DOMAINS = [
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

const DOMAIN_KEY_TO_LABEL = {
  IAM:    "Identity & Access Management",
  NET:    "Network Security",
  GRC:    "GRC & Compliance",
  SECOPS: "Security Operations (SOC)",
  APPSEC: "Application Security",
  DATA:   "Data Protection",
};

const DOMAIN_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(DOMAIN_KEY_TO_LABEL).map(([k, v]) => [v, k])
);

const keysToLabels = (keys = []) =>
  keys.map(k => DOMAIN_KEY_TO_LABEL[k] || k);

// ── Adapter: canonical initiative record → CPM pipeline/project item ─────────
function toCpmItem(rec) {
  const domainLabel = DOMAIN_KEY_TO_LABEL[rec.domainId] || rec.domainId || "";
  const phase = rec.cpmPhase || "Strategy";
  const item = {
    id:              rec.initiativeId || rec.id,
    name:            rec.name || "",
    domain:          domainLabel,
    phase,
    score:           rec.priorityScore ?? rec.score ?? 0,
    owner:           rec.initiativeOwnerId || rec.owner || "",
    budget:          rec.estimatedBudget || rec.budget || "",
    submitted:       rec.submittedOn || rec.submitted || "",
    pillar:          rec.cisoPillar || rec.pillar || "",
    status:          rec.status === "ENDORSED" ? (phase === "Strategy" ? "Pending CISO Review" : "Endorsed") : (rec.status || ""),
    frameworks:      rec.frameworkAlignment || rec.frameworks || [],
    problemStatement:rec.problemStatement || "",
    visionStatement: rec.visionStatement  || "",
    businessOutcome: rec.expectedBusinessOutcome || rec.businessOutcome || "",
    inScope:         rec.inScopeDescription || rec.inScope || "",
    assumptions:     rec.assumptions || "",
    milestones:      rec.milestones || [],
    kpis:            (rec.kpis || []).map(k => ({
                       name:     k.name || "",
                       baseline: k.baseline || "",
                       target:   k.target || "",
                       method:   k.measurementMethod || k.method || "",
                     })),
    depRisks:        rec.depRisks || rec.dependencies || [],
    sponsorId:       rec.sponsorId || "",
    rfpData:         rec.rfpData,
  };
  // Carry through project-only fields if present
  ["progress","risks","issues","pm","pmEmail","contractStart","contractEnd","contractValue","spent","dueDate","closureDate","milestone","milestoneStatus","deliverables","milestonesList","risksList","dependenciesList","contractData"].forEach(k => {
    if (rec[k] !== undefined) item[k] = rec[k];
  });
  return item;
}

// ── Adapter: CPM item → patch to canonical initiative record ─────────────────
function mergeCpmItem(item, existing) {
  const base = existing || {};
  const domainKey = DOMAIN_LABEL_TO_KEY[item.domain] || base.domainId || "";
  const patch = {
    initiativeId:           item.id,
    name:                   item.name ?? base.name,
    domainId:               domainKey,
    cpmPhase:               item.phase || base.cpmPhase || "Strategy",
    priorityScore:          item.score ?? base.priorityScore,
    initiativeOwnerId:      item.owner || base.initiativeOwnerId,
    estimatedBudget:        item.budget || base.estimatedBudget,
    submittedOn:            item.submitted || base.submittedOn,
    cisoPillar:             item.pillar || base.cisoPillar,
    status:                 base.status || (item.status === "Pending CISO Review" ? "PENDING_CISO" : (base.status || "DRAFT")),
    frameworkAlignment:     item.frameworks ?? base.frameworkAlignment,
    problemStatement:       item.problemStatement ?? base.problemStatement,
    visionStatement:        item.visionStatement  ?? base.visionStatement,
    expectedBusinessOutcome:item.businessOutcome  ?? base.expectedBusinessOutcome,
    inScopeDescription:     item.inScope          ?? base.inScopeDescription,
    assumptions:            item.assumptions      ?? base.assumptions,
    milestones:             item.milestones       ?? base.milestones,
    kpis:                  (item.kpis || base.kpis || []).map(k => ({
                              name: k.name, baseline: k.baseline, target: k.target,
                              measurementMethod: k.method || k.measurementMethod || ""
                            })),
    depRisks:               item.depRisks         ?? base.depRisks,
    sponsorId:              item.sponsorId        ?? base.sponsorId,
    rfpData:                item.rfpData          ?? base.rfpData,
  };
  // Project-only fields
  ["progress","risks","issues","pm","pmEmail","contractStart","contractEnd","contractValue","spent","dueDate","closureDate","milestone","milestoneStatus","deliverables","milestonesList","risksList","dependenciesList","contractData"].forEach(k => {
    if (item[k] !== undefined) patch[k] = item[k];
  });
  return { ...base, ...patch };
}

// Helper used inside CPMApp — finds existing canonical record and writes back
function syncCpmItem(item, upsertInitiative, sharedInitiatives) {
  const existing = (sharedInitiatives || []).find(r => (r.initiativeId || r.id) === item.id);
  const merged = mergeCpmItem(item, existing);
  upsertInitiative(merged);
}


// ── Brand tokens ──────────────────────────────────────────────────────────────
const B = {
  deepBlue:    "#005587",
  darkBlue:    "#0076A8",
  midBlue:     "#00A3E0",
  lightBlue:   "#62B5E5",
  pageBg:      "#F2F6FA",
  cardBg:      "#FFFFFF",
  border:      "#C8DFF0",
  borderLight: "#E2EFF8",
  activeBg:    "#E8F4FC",
  inputBg:     "#FAFCFE",
  textDark:    "#0D2E45",
  textMid:     "#2A5070",
  textMuted:   "#6A90A8",
  headerText:  "#C8E8F8",
  green:       "#1A8A4A",
  greenLight:  "#EAF7EF",
  amber:       "#B86A00",
  amberLight:  "#FFF4E0",
  red:         "#C0392B",
  redLight:    "#FDECEA",
  critical:    "#7A1530",
  criticalLight:"#F6E4E9",
  lineColor:   "#C8DFF0",
};

// ── Reference data ────────────────────────────────────────────────────────────
const CPM_DOMAINS     = ["Identity & Access Management","Network Security","GRC & Compliance","Security Operations (SOC)","Application Security","Cloud Security","Data Protection","Threat Intelligence","Third-Party Risk","Cyber Transformation"];
const CPM_PILLARS     = ["Cyber Resilience","Risk Reduction","Regulatory Compliance","Digital Transformation Enablement","Talent & Culture","Operational Excellence"];
const CPM_FRAMEWORKS  = ["NIST CSF","ISO 27001","NIST 800-53","CIS Controls","DORA","NCA ECC","PCI DSS","GDPR","SOC 2"];
const DELIV_TYPES = ["Document","System","Report","Workshop","Training","Assessment","Tool"];
const RFP_STATUS_STEPS = ["Draft","Internally Approved","Issued","Q&A Period","Closed"];

const RISK_CATS       = ["Strategic","Technical","Operational","Regulatory","Vendor"];
const RISK_LEVELS     = ["High","Medium","Low"];
const RISK_STATUSES   = ["Open","Mitigated","Accepted","Escalated to Issue","Closed"];
const DELIV_STATUSES  = ["Not Started","In Progress","Submitted for QA","Approved","Rejected"];
const MS_STATUSES     = ["Not Started","In Progress","Completed","Delayed"];

const ACTION_PRIORITY = ["High","Medium","Low"];
const ACTION_STATUS   = ["Open","In Progress","Completed","Blocked"];
const OVERRIDE_STATUS = ["On Track","At Risk","Delayed"];

const REPORT_CADENCES = ["Weekly","Bi-weekly","Monthly"];
const REPORT_DAYS     = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const REPORT_FORMATS  = ["Executive summary","Full detail","Both"];
const REPORT_ROLES    = ["CISO","Sponsor","Stakeholder","PMO","Other"];

const CRITERIA = [
  { key:"strategic",  label:"Strategic Impact",        weight:0.25, color:B.darkBlue,
    questions:[
      {q:"How directly does this initiative support the CISO's current strategic pillars?",opts:["Directly supports a named CISO strategic pillar","Partially supports a strategic pillar","Supports general cyber hygiene but not a named pillar","Not directly linked to current strategy"]},
      {q:"What is the expected organizational reach / impact?",opts:["Organization-wide impact across multiple business units","Significant impact on one major business unit","Limited to one team or department","Minimal organizational impact"]},
      {q:"Does this initiative enable or accelerate other strategic cyber initiatives?",opts:["Yes — foundational enabler for multiple initiatives","Yes — enables one other initiative","Neutral — no enabling effect","No — may slow other initiatives"]},
    ]},
  { key:"regulatory", label:"Regulatory Urgency",      weight:0.20, color:"#7A5500",
    questions:[
      {q:"Is this initiative driven by a mandatory regulatory requirement?",opts:["Yes — regulatory deadline within 6 months","Yes — regulatory deadline within 12 months","Compliance improvement but no hard deadline","No regulatory driver"]},
      {q:"What is the consequence of non-compliance if delayed?",opts:["Significant fines, sanctions, or loss of license","Regulatory warning or formal notice","Minor audit finding","No direct compliance consequence"]},
      {q:"How many regulatory frameworks does this initiative address?",opts:["3 or more frameworks","2 frameworks","1 framework","No specific framework"]},
    ]},
  { key:"risk",       label:"Risk Reduction",          weight:0.20, color:B.red,
    questions:[
      {q:"How many existing identified cyber risks does this initiative address?",opts:["5 or more risks from the risk register","3–4 risks","1–2 risks","No direct link to risk register"]},
      {q:"What is the severity of risks this initiative mitigates?",opts:["Critical risks (major breach or outage potential)","High risks (significant exposure)","Medium risks (moderate exposure)","Low risks (minor exposure)"]},
      {q:"How quickly will risk reduction be realized after implementation?",opts:["Immediate — within 1 month of go-live","Short-term — within 3 months","Medium-term — within 6 months","Long-term — beyond 6 months"]},
    ]},
  { key:"time",       label:"Time Sensitivity",        weight:0.15, color:B.amber,
    questions:[
      {q:"Is there a hard external deadline driving this initiative?",opts:["Yes — board or executive mandate with fixed date","Yes — contractual or vendor-driven deadline","Soft internal target, flexible","No specific deadline"]},
      {q:"What is the cost or risk of delaying this initiative by 6 months?",opts:["Critical — major business or security impact","Significant — notable risk or cost","Minor — manageable impact","Negligible — no meaningful consequence"]},
      {q:"Does a time-sensitive external event depend on this?",opts:["Yes — directly tied to an upcoming event","Indirectly linked to an upcoming event","No dependency but timing is preferred","No relationship to any external event"]},
    ]},
  { key:"dependency", label:"Initiative Dependencies", weight:0.10, color:B.midBlue,
    questions:[
      {q:"How many other active initiatives depend on this one completing first?",opts:["3 or more initiatives are blocked by this","2 initiatives depend on this","1 initiative depends on this","No other initiatives are dependent"]},
      {q:"Does this initiative depend on others being completed first?",opts:["No dependencies — can start independently","Minor dependency — one input needed","Moderate dependency — partially blocked","Fully blocked — cannot start until another completes"]},
      {q:"What is the risk if a linked initiative is delayed?",opts:["High — this initiative would be severely impacted","Medium — partial workaround available","Low — easily absorbed","Not applicable"]},
    ]},
  { key:"value",      label:"Value Realization",       weight:0.10, color:B.green,
    questions:[
      {q:"How clearly can the value of this initiative be measured after completion?",opts:["Fully measurable — clear KPIs with baseline and target","Mostly measurable — some KPIs defined, others qualitative","Partially measurable — value expected but hard to quantify","Difficult to measure — largely intangible benefit"]},
      {q:"What is the expected timeline to realize value?",opts:["Immediate — value realized upon go-live","Short-term — within 3 months post go-live","Medium-term — 3–12 months post go-live","Long-term — beyond 12 months"]},
      {q:"Does this initiative generate cost savings, revenue protection, or efficiency gains?",opts:["Yes — quantifiable financial value","Yes — operational efficiency gains","Indirect value only (improved posture)","Value is primarily reputational or compliance-driven"]},
      {q:"Has the expected value been validated with a business stakeholder?",opts:["Yes — formally documented and signed off","Yes — verbally agreed with senior stakeholder","Under discussion, not confirmed","No stakeholder validation yet"]},
    ]},
];

const STRATEGY_SECTIONS = [
  {id:"identity",label:"Project Identity"},
  {id:"vision",label:"Strategic Vision"},
  {id:"scope",label:"Scope & Milestones"},
  {id:"prioritization",label:"Prioritization"},
  {id:"budget",label:"Budget & Timeline"},
  {id:"risks",label:"Dependencies"},
  {id:"submit",label:"Submit"},
];

const RFP_SECTIONS = [
  {id:"reference",    label:"Strategy Reference"},
  {id:"vision",       label:"Vision & KPIs"},
  {id:"scope",        label:"Scope Revision"},
  {id:"milestones",   label:"Milestones & Deliverables"},
  {id:"requirements", label:"Requirements"},
  {id:"rfpstatus",    label:"RFP Status"},
  {id:"submit",       label:"Submit"},
];

// ── Mock data ─────────────────────────────────────────────────────────────────
const INIT_PIPELINE = [
  { id:"CPM-2025-001", name:"IAM Modernisation Programme",         domain:"Identity & Access Management", phase:"Strategy",    score:88, owner:"Sarah Al-Mansouri", budget:"$1.2M",  submitted:"12 Apr 2025", pillar:"Risk Reduction",       status:"Pending CISO Review", frameworks:["NIST CSF","ISO 27001"], problemStatement:"Lack of centralised identity controls across business units.", visionStatement:"A unified IAM platform covering all users and privileged accounts.", businessOutcome:"Reduce identity-related incidents by 80%.", inScope:"All user identities across HQ and subsidiaries.", assumptions:"Executive sponsorship confirmed.", milestones:[{name:"Discovery",date:"2025-06-01",deliverable:"As-Is Report"}], kpis:[{name:"MFA Coverage",baseline:"40%",target:"95%",method:"Monthly audit"}], depRisks:[{initiative:"Network Segmentation",dependency:"Shared directory",risk:"Delays IAM rollout",severity:"High"}] },
  { id:"CPM-2025-004", name:"Cloud Security Baseline Framework",   domain:"Cloud Security",               phase:"Strategy",    score:74, owner:"Khalid Ibrahim",    budget:"$680K",  submitted:"18 Apr 2025", pillar:"Cyber Resilience",     status:"Pending CISO Review", frameworks:["CIS Controls","NIST CSF"], problemStatement:"No consistent security baseline across cloud environments.", visionStatement:"Standardised controls across all cloud workloads.", businessOutcome:"Eliminate misconfiguration incidents.", inScope:"AWS and Azure production environments.", assumptions:"Cloud team available.", milestones:[{name:"Baseline Assessment",date:"2025-07-01",deliverable:"Gap Report"}], kpis:[{name:"Misconfiguration rate",baseline:"12%",target:"<2%",method:"Weekly CSPM scan"}], depRisks:[] },
  { id:"CPM-2025-002", name:"SOC Uplift & SIEM Migration",         domain:"Security Operations (SOC)",    phase:"RFP",         score:91, owner:"Ahmed Rashid",      budget:"$3.4M",  submitted:"02 Mar 2025", pillar:"Cyber Resilience",     status:"RFP Issued",          frameworks:["NIST CSF","CIS Controls"], problemStatement:"Current SIEM lacks coverage and correlation capability.", visionStatement:"Modern SOC with 24/7 detection and response.", businessOutcome:"MTTD reduced from 72hrs to under 4hrs.", inScope:"All IT and OT environments.", assumptions:"Vendor shortlist approved.", milestones:[{name:"RFP Close",date:"2025-05-30",deliverable:"Vendor Proposals"},{name:"Evaluation",date:"2025-06-30",deliverable:"Evaluation Report"}], kpis:[{name:"MTTD",baseline:"72hrs",target:"<4hrs",method:"SOC metrics dashboard"}], depRisks:[] },
  { id:"CPM-2025-005", name:"Data Loss Prevention Implementation", domain:"Data Protection",              phase:"RFP",         score:79, owner:"Fatima Al-Zahra",   budget:"$900K",  submitted:"14 Mar 2025", pillar:"Risk Reduction",       status:"RFP Draft",           frameworks:["GDPR","ISO 27001"], problemStatement:"No automated controls preventing sensitive data exfiltration.", visionStatement:"Organisation-wide DLP covering endpoints, email and cloud.", businessOutcome:"Zero data loss incidents post-implementation.", inScope:"All endpoints and email systems.", assumptions:"Data classification completed first.", milestones:[{name:"Requirements",date:"2025-06-01",deliverable:"Requirements Doc"}], kpis:[{name:"Data incidents",baseline:"8/yr",target:"0",method:"Incident register"}], depRisks:[] },
];

const INIT_PROJECTS = [
  {
    id:"CPM-2024-011", name:"PAM Solution Deployment", domain:"Identity & Access Management",
    progress:78, status:"On Track", risks:1, issues:0,
    pm:"Rania Yousef", pmEmail:"rania.yousef@org.com",
    budget:"$850,000", spent:"$612,000",
    contractStart:"2024-09-01", contractEnd:"2025-06-30",
    contractValue:"850000", dueDate:"30 Jun 2025",
    milestone:"Phase 3 UAT", milestoneStatus:"On Track",
    deliverables:[
      {id:"D-001",name:"As-Is Architecture Report",     description:"Current state assessment of identity infrastructure",       type:"Document",  milestone:"Discovery & Assessment", dueDate:"2024-10-15", responsibleParty:"Vendor",     qaReviewer:"Ahmed Rashid",      approver:"CISO",        status:"Approved"},
      {id:"D-002",name:"Gap Analysis Document",          description:"Gap analysis vs PAM industry best practice",                type:"Document",  milestone:"Discovery & Assessment", dueDate:"2024-10-30", responsibleParty:"Vendor",     qaReviewer:"Ahmed Rashid",      approver:"CISO",        status:"Approved"},
      {id:"D-003",name:"PAM Target Architecture",        description:"Target state PAM architecture aligned to vision",           type:"Document",  milestone:"Design Phase",            dueDate:"2024-12-15", responsibleParty:"Vendor",     qaReviewer:"Sarah Al-Mansouri", approver:"Domain Lead", status:"Approved"},
      {id:"D-004",name:"Implementation Plan",            description:"Detailed implementation and rollout plan",                  type:"Document",  milestone:"Design Phase",            dueDate:"2024-12-30", responsibleParty:"Vendor",     qaReviewer:"Sarah Al-Mansouri", approver:"Domain Lead", status:"Approved"},
      {id:"D-005",name:"PAM Solution Deployed (Pilot)",  description:"Pilot environment with selected user groups",               type:"System",    milestone:"Pilot Deployment",        dueDate:"2025-03-15", responsibleParty:"Vendor",     qaReviewer:"Omar Al-Hashimi",   approver:"CISO",        status:"Submitted for QA"},
      {id:"D-006",name:"UAT Results & Sign-off",         description:"User acceptance test results and formal sign-off",          type:"Report",    milestone:"Pilot Deployment",        dueDate:"2025-04-30", responsibleParty:"Internal",   qaReviewer:"Omar Al-Hashimi",   approver:"CISO",        status:"In Progress"},
      {id:"D-007",name:"Full Production Rollout",        description:"Production deployment to all in-scope user groups",         type:"System",    milestone:"Production Rollout",      dueDate:"2025-05-30", responsibleParty:"Vendor",     qaReviewer:"Omar Al-Hashimi",   approver:"CISO",        status:"Not Started"},
      {id:"D-008",name:"Handover & Training Materials",  description:"Documentation, runbooks, and training for ops team",        type:"Training",  milestone:"Production Rollout",      dueDate:"2025-06-15", responsibleParty:"Vendor",     qaReviewer:"Sarah Al-Mansouri", approver:"Domain Lead", status:"Not Started"},
    ],
    milestonesList:[
      {name:"Discovery & Assessment", startDate:"2024-09-01", endDate:"2024-10-30", weight:15, status:"Completed"},
      {name:"Design Phase",            startDate:"2024-11-01", endDate:"2024-12-30", weight:20, status:"Completed"},
      {name:"Pilot Deployment",        startDate:"2025-01-15", endDate:"2025-04-30", weight:30, status:"In Progress"},
      {name:"Production Rollout",      startDate:"2025-05-01", endDate:"2025-06-30", weight:35, status:"Not Started"},
    ],
    risksList:[
      {id:"R-001",category:"Vendor",      description:"Vendor resource availability during Q3 holiday season may delay deployment", likelihood:"Medium",impact:"High",  mitigation:"Resource plan agreed in advance; backup engineers identified", owner:"Rania Yousef",   status:"Open",       overrideRating:"",overrideComment:""},
      {id:"R-002",category:"Technical",   description:"Legacy AD integration may require custom connectors not in scope",           likelihood:"Medium",impact:"Medium",mitigation:"Technical workshop scheduled with vendor for week 4",         owner:"Ahmed Rashid",   status:"Mitigated",  overrideRating:"",overrideComment:""},
      {id:"R-003",category:"Operational", description:"Production cutover may require extended maintenance window",                  likelihood:"Low",   impact:"High",  mitigation:"Cutover plan to be reviewed with operations team by week 20", owner:"Omar Al-Hashimi",status:"Closed",     overrideRating:"",overrideComment:""},
    ],
    dependenciesList:[
      {initiative:"Network Segmentation Project", nature:"Shared directory services", riskIfDelayed:"PAM rollout cannot complete without network controls", severity:"High", owner:"Yusuf Al-Farsi", linkedStatus:"In Progress"},
    ],
    contractData:{
      vendorName:"Accenture Security", contractRef:"CTR-2024-0421", procurementRef:"PO-2024-1187",
      contractStart:"2024-09-01", contractEnd:"2025-06-30",
      contractValue:"850000", capex:"550000", opex:"300000",
      visionStatement:"A unified Privileged Access Management platform covering all administrative accounts across HQ and subsidiaries, with full session monitoring and just-in-time access workflows.",
      problemStatement:"Current privileged access is managed manually with shared credentials, no session recording, and no just-in-time access controls — exposing the organisation to significant risk in the event of credential compromise.",
      businessOutcome:"Eliminate shared privileged credentials, enable session recording on 100% of privileged sessions, and reduce time-to-revoke for departed administrators from days to minutes.",
      valueRealization:[
        {valueCommitted:"100% of privileged accounts vaulted in PAM", measurementMethod:"Monthly PAM audit report",      targetDate:"2025-07-15"},
        {valueCommitted:"Session recording on all privileged sessions", measurementMethod:"PAM session logs review",      targetDate:"2025-06-30"},
        {valueCommitted:"Time-to-revoke reduced to under 5 minutes",    measurementMethod:"Quarterly access lifecycle audit", targetDate:"2025-09-30"},
      ],
      inScope:"All privileged accounts across HQ, regional offices, and subsidiaries, including domain admins, server admins, database admins, application admins, and network device administrators.",
      assumptions:"Active Directory integration is feasible without major modifications. Operations team available for cutover planning.",
      pm:"Rania Yousef", pmEmail:"rania.yousef@org.com", escalationContact:"Sarah Al-Mansouri",
      team:[
        {name:"Rania Yousef",       role:"Project Manager",           organisation:"Internal", allocation:"100%"},
        {name:"Ahmed Rashid",       role:"Technical Lead",            organisation:"Internal", allocation:"60%"},
        {name:"Omar Al-Hashimi",    role:"Security Architect",        organisation:"Internal", allocation:"40%"},
        {name:"Accenture Team",     role:"Implementation Vendor",     organisation:"Accenture",allocation:"100%"},
      ],
    }
  },
  { id:"CPM-2024-008", name:"GRC Platform Implementation",         domain:"GRC & Compliance",             progress:45, status:"At Risk",  risks:3, issues:2, pm:"Tariq Al-Dosari", budget:"$1.5M",  spent:"$780K",  dueDate:"15 Aug 2025", milestone:"Requirements Sign-off",    milestoneStatus:"Delayed"  },
  { id:"CPM-2024-015", name:"Application Security Programme",      domain:"Application Security",         progress:62, status:"On Track", risks:0, issues:1, pm:"Nadia Karimi",    budget:"$620K",  spent:"$390K",  dueDate:"31 Jul 2025", milestone:"Pen Test Phase 2",         milestoneStatus:"On Track" },
  { id:"CPM-2024-019", name:"Threat Intelligence Platform",        domain:"Threat Intelligence",          progress:31, status:"Delayed",  risks:4, issues:2, pm:"Hassan Al-Amri",  budget:"$1.1M",  spent:"$420K",  dueDate:"01 Sep 2025", milestone:"Vendor Integration",       milestoneStatus:"Delayed"  },
  { id:"CPM-2024-022", name:"Employee Cyber Awareness Programme",  domain:"GRC & Compliance",             progress:89, status:"On Track", risks:0, issues:0, pm:"Sara Mahmoud",    budget:"$280K",  spent:"$248K",  dueDate:"30 May 2025", milestone:"Final Assessment",         milestoneStatus:"On Track" },
  { id:"CPM-2024-017", name:"Network Segmentation Project",        domain:"Network Security",             progress:54, status:"At Risk",  risks:2, issues:1, pm:"Yusuf Al-Farsi",  budget:"$740K",  spent:"$435K",  dueDate:"15 Sep 2025", milestone:"Firewall Rule Deployment", milestoneStatus:"At Risk"  },
  { id:"CPM-2024-003", name:"Zero Trust Network Architecture",     domain:"Network Security",             progress:12, status:"On Track", risks:0, issues:0, pm:"Omar Al-Hashimi", budget:"$2.1M",  spent:"$180K",  dueDate:"31 Dec 2025", milestone:"Contracting & Onboarding", milestoneStatus:"In Progress" },
  { id:"CPM-2023-007", name:"Email Security Gateway Upgrade",      domain:"Application Security",         progress:100,status:"Closed",   risks:0, issues:0, pm:"Sara Mahmoud",    budget:"$420K",  spent:"$415K",  dueDate:"15 Dec 2024", milestone:"Closure & Handover",       milestoneStatus:"Completed", closureDate:"22 Dec 2024" },
  { id:"CPM-2023-012", name:"Cloud Posture Management Tool",       domain:"Cloud Security",               progress:100,status:"Closed",   risks:0, issues:0, pm:"Khalid Ibrahim",  budget:"$590K",  spent:"$572K",  dueDate:"30 Nov 2024", milestone:"Closure & Handover",       milestoneStatus:"Completed", closureDate:"03 Dec 2024" },
];

const EMPTY_STRATEGY = {
  name:"",domain:"",subDomain:"",owner:"",domainLead:"",
  problemStatement:"",visionStatement:"",cisoPillar:"",businessOutcome:"",frameworks:[],
  kpis:[{name:"",baseline:"",target:"",method:""}],
  inScope:"",outOfScope:[{item:"",reason:""}],assumptions:"",
  stakeholders:[{name:"",role:""}],milestones:[{name:"",date:"",deliverable:""}],
  integrations:[{initiative:"",nature:"",risk:""}],
  answers:{},budget:"",capex:"",opex:"",startDate:"",endDate:"",budgetStatus:"",
  depRisks:[{initiative:"",dependency:"",risk:"",severity:""}],note:"",
};

const EMPTY_RFP = (strategy) => ({
  visionStatement:   strategy.visionStatement   || "",
  problemStatement:  strategy.problemStatement  || "",
  businessOutcome:   strategy.businessOutcome   || "",
  frameworks:        strategy.frameworks        || [],
  kpis:             (strategy.kpis || []).map(k=>({...k})),
  scopeRevisionNotes:"",
  inScope:           strategy.inScope           || "",
  outOfScope:       (strategy.outOfScope || [{item:"",reason:""}]).map(r=>({...r})),
  assumptions:       strategy.assumptions       || "",
  milestones:       (strategy.milestones || []).map(m=>({...m, deliverableDesc:"", deliverableType:"", responsibleParty:""})),
  functionalReqs:   [{id:"FR-001",description:"",priority:"Mandatory",acceptance:""}],
  nonFunctionalReqs:[{id:"NFR-001",description:"",priority:"Mandatory",acceptance:""}],
  rfpStatus:        "Draft",
  rfpNotes:"",
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcScore(answers) {
  let total=0,filled=0;
  CRITERIA.forEach(c=>{
    let s=0,n=0;
    c.questions.forEach((_,qi)=>{if(answers[c.key]?.[qi]!==undefined){s+=(3-answers[c.key][qi]);n++;filled++;}});
    if(n>0) total+=(s/(n*3))*c.weight*100;
  });
  const totalQ=CRITERIA.reduce((a,c)=>a+c.questions.length,0);
  return {score:Math.round(total),filled,totalQ};
}
const scoreColor  = s => s>=75?B.green:s>=50?B.amber:B.red;
const scoreLabel  = s => s>=75?"HIGH":s>=50?"MEDIUM":s>=25?"LOW":"—";
const phaseColor  = p => ({Strategy:B.darkBlue,RFP:B.midBlue,Active:B.green,Closed:B.textMuted,Contracting:B.deepBlue}[p]||B.textMuted);
const phaseBg     = p => ({Strategy:"#E8F4FC",RFP:"#D0EDFA",Active:B.greenLight,Closed:B.pageBg,Contracting:"#C0E0F0"}[p]||B.pageBg);
const statusColor = s => ({"On Track":B.green,"At Risk":B.amber,"Delayed":B.red,"Closed":B.textMuted}[s]||B.textMuted);
const statusBg    = s => ({"On Track":B.greenLight,"At Risk":B.amberLight,"Delayed":B.redLight,"Closed":B.pageBg}[s]||B.pageBg);
const nextPhase   = {Strategy:"RFP",RFP:"Active"};
const nextLabel   = {Strategy:"Move to RFP →",RFP:"Activate Project →"};
const cpmToday = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
let reqCounter = 1;
const newReqId = (prefix) => `${prefix}-${String(reqCounter++).padStart(3,"0")}`;

// ── Primitive UI ──────────────────────────────────────────────────────────────
const Lbl = ({children,req}) => (
  <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",marginBottom:5,textTransform:"uppercase"}}>
    {children}{req&&<span style={{color:B.red,marginLeft:3}}>*</span>}
  </div>
);
const Inp = ({placeholder,value,onChange,type="text",disabled,readOnly}) => (
  <input type={type} placeholder={readOnly?"—":placeholder} value={value||""} onChange={e=>onChange?.(e.target.value)}
    disabled={disabled} readOnly={readOnly}
    style={{width:"100%",boxSizing:"border-box",
      border:readOnly?"none":`1px solid ${B.border}`,
      borderBottom:readOnly?`1px solid ${B.borderLight}`:"",
      borderRadius:readOnly?0:4,padding:"8px 10px",fontSize:13,
      color:B.textDark,background:readOnly?"transparent":disabled?B.pageBg:B.inputBg,
      fontFamily:"inherit",outline:"none",fontWeight:readOnly?600:400}}
    onFocus={e=>!disabled&&!readOnly&&(e.target.style.borderColor=B.midBlue)}
    onBlur={e=>!readOnly&&(e.target.style.borderColor=B.border)}
  />
);
const Sel = ({options,value,onChange,placeholder,readOnly,small}) => readOnly
  ? <div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>{value||"—"}</div>
  : <select value={value||""} onChange={e=>onChange?.(e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1px solid ${B.border}`,borderRadius:4,padding:small?"6px 8px":"8px 10px",fontSize:small?12:13,color:value?B.textDark:B.textMuted,background:B.inputBg,fontFamily:"inherit",outline:"none",appearance:"none",cursor:"pointer"}}>
      <option value="" disabled>{placeholder}</option>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>;
const Txt = ({placeholder,value,onChange,rows=3,readOnly}) => readOnly
  ? <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`,minHeight:40}}>{value||"—"}</div>
  : <textarea placeholder={placeholder} value={value||""} onChange={e=>onChange?.(e.target.value)} rows={rows}
      style={{width:"100%",boxSizing:"border-box",border:`1px solid ${B.border}`,borderRadius:4,padding:"8px 10px",fontSize:13,color:B.textDark,background:B.inputBg,fontFamily:"inherit",outline:"none",resize:"vertical"}}
      onFocus={e=>(e.target.style.borderColor=B.midBlue)} onBlur={e=>(e.target.style.borderColor=B.border)}/>;
const AutoVal = ({value}) => (
  <div style={{border:`1px solid ${B.border}`,borderRadius:4,padding:"8px 10px",fontSize:13,color:B.textMuted,background:B.pageBg,display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:9,background:B.activeBg,color:B.darkBlue,padding:"1px 6px",borderRadius:3,fontWeight:700,letterSpacing:"0.08em"}}>AUTO</span>{value}
  </div>
);
const SLine = ({title}) => (
  <div style={{display:"flex",alignItems:"center",gap:12,margin:"22px 0 16px"}}>
    <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",whiteSpace:"nowrap",textTransform:"uppercase"}}>{title}</div>
    <div style={{flex:1,height:1,background:B.lineColor}}/>
  </div>
);
const G = ({cols=2,gap=14,children}) => <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap}}>{children}</div>;
const AddBtn = ({onClick,label}) => <button onClick={onClick} style={{marginTop:8,background:"none",border:`1px dashed ${B.midBlue}`,color:B.darkBlue,borderRadius:4,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>+ {label}</button>;
const DelBtn = ({onClick}) => <button onClick={onClick} style={{background:"none",border:"none",color:B.textMuted,cursor:"pointer",fontSize:16,padding:"4px 6px",borderRadius:3,alignSelf:"center"}}>×</button>;
const TH = ({children,w}) => <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",background:B.pageBg,borderBottom:`1px solid ${B.border}`,width:w,textTransform:"uppercase"}}>{children}</th>;
const TD = ({children}) => <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`,verticalAlign:"middle"}}>{children}</td>;
const CBadge = ({children,color,bg}) => <span style={{fontSize:10,fontWeight:700,color:color||B.darkBlue,background:bg||B.activeBg,border:`1px solid ${(color||B.darkBlue)+"30"}`,borderRadius:3,padding:"2px 8px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{children}</span>;
const ProgressBar = ({pct,color}) => <div style={{height:6,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color||B.darkBlue,borderRadius:3,transition:"width 0.4s"}}/></div>;

// ── Shared header ─────────────────────────────────────────────────────────────
const CPMHeader = ({subtitle,right,onExit}) => (
  <div style={{background:B.deepBlue,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",gap:24}}>
      {onExit && <button onClick={onExit} title="Back to Suite" style={{background:"#FFFFFF20",border:"1px solid #FFFFFF40",color:"#FFFFFF",borderRadius:4,padding:"3px 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⊞ Suite</button>}
      <div style={{color:"#FFFFFF",fontWeight:800,fontSize:15,letterSpacing:"0.14em"}}>CPM</div>
      <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
      <div style={{color:B.headerText,fontSize:12}}>Cyber Portfolio Management</div>
      <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
      <div style={{color:"#FFFFFF90",fontSize:12}}>{subtitle}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:16}}>{right}<div style={{width:30,height:30,borderRadius:"50%",background:B.midBlue,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:12,fontWeight:700}}>CX</div></div>
  </div>
);

// ── Section timeline ──────────────────────────────────────────────────────────
const SectionTimeline = ({sections,section,setSection}) => (
  <div style={{background:"#FFFFFF",padding:"16px 28px 0",borderBottom:`2px solid ${B.border}`,flexShrink:0}}>
    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.08em",marginBottom:12,textTransform:"uppercase"}}>Sections</div>
    <div style={{display:"flex",alignItems:"flex-start",position:"relative"}}>
      <div style={{position:"absolute",top:15,left:16,right:16,height:2,background:B.borderLight,zIndex:0}}/>
      <div style={{position:"absolute",top:15,left:16,height:2,zIndex:0,background:B.midBlue,width:`calc(${(section/(sections.length-1))*100}% - 32px)`,transition:"width 0.3s"}}/>
      {sections.map((s,i)=>{
        const done=section>i,current=section===i;
        return(
          <div key={s.id} onClick={()=>setSection(i)} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,cursor:"pointer",position:"relative",zIndex:1,paddingBottom:14}}>
            <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:done?B.darkBlue:"#FFFFFF",border:`2px solid ${done||current?B.darkBlue:B.border}`,fontSize:11,fontWeight:700,color:done?"#FFFFFF":current?B.darkBlue:B.textMuted,boxShadow:current?`0 0 0 4px ${B.lightBlue}60`:"none",transition:"all 0.2s"}}>{done?"✓":i+1}</div>
            <div style={{marginTop:7,fontSize:10,fontWeight:current?700:500,color:current?B.darkBlue:done?B.midBlue:B.textMuted,textAlign:"center",lineHeight:1.3,maxWidth:82}}>{s.label}</div>
            {current&&<div style={{width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:`5px solid ${B.darkBlue}`,marginTop:4}}/>}
          </div>
        );
      })}
    </div>
  </div>
);

// ══ STRATEGY FORM SECTIONS ════════════════════════════════════════════════════
function StrategyFormSections({section,setSection,form,setForm,readOnly}) {
  const set  = (k,v)       => setForm(f=>({...f,[k]:v}));
  const setA = (k,i,f2,v) => setForm(f=>{const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)       => setForm(f=>({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)       => setForm(f=>({...f,[k]:f[k].filter((_,j)=>j!==i)}));
  const togFw= fw          => set("frameworks",form.frameworks.includes(fw)?form.frameworks.filter(x=>x!==fw):[...form.frameworks,fw]);
  const setAns=(ck,qi,v)   => setForm(f=>({...f,answers:{...f.answers,[ck]:{...(f.answers[ck]||{}),[qi]:v}}}));
  const {score,filled,totalQ}=calcScore(form.answers);
  const initId=form.id||("CPM-"+new Date().getFullYear()+"-"+String(Math.floor(Math.random()*900)+100));

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>

        {section===0&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Project Identity"/>
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Initiative Name</Lbl><Inp readOnly={readOnly} placeholder="e.g. IAM Modernisation Programme" value={form.name} onChange={v=>set("name",v)}/></div>
              <div><Lbl>Unique Initiative ID</Lbl><AutoVal value={initId}/></div>
              <div><Lbl>Date Created</Lbl><AutoVal value={form.submitted||cpmToday}/></div>
            </G>
            <div style={{height:14}}/>
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Domain / Pillar</Lbl><Sel readOnly={readOnly} options={CPM_DOMAINS} value={form.domain} onChange={v=>set("domain",v)} placeholder="Select domain..."/></div>
              <div><Lbl>Sub-domain / Capability Area</Lbl><Inp readOnly={readOnly} placeholder="e.g. Privileged Access Management" value={form.subDomain} onChange={v=>set("subDomain",v)}/></div>
              <div/>
            </G>
            <div style={{height:14}}/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Initiative Owner</Lbl><Inp readOnly={readOnly} placeholder="Search user or enter name..." value={form.owner} onChange={v=>set("owner",v)}/>{!readOnly&&<div style={{fontSize:11,color:B.textMuted,marginTop:4}}>May be the Domain Lead or a different accountable owner</div>}</div>
              <div><Lbl req={!readOnly}>Domain Lead</Lbl><Inp readOnly={readOnly} placeholder="Search user or enter name..." value={form.domainLead} onChange={v=>set("domainLead",v)}/></div>
            </G>
            {!readOnly&&(
              <div style={{marginTop:24,background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,borderRadius:5,padding:"14px 16px",display:"flex",gap:12}}>
                <div style={{fontSize:18,color:B.darkBlue,flexShrink:0}}>→</div>
                <div><div style={{fontSize:12,fontWeight:700,color:B.deepBlue,marginBottom:4}}>How this connects to other pages</div><div style={{fontSize:12,color:B.textMid,lineHeight:1.6}}>Once the CISO approves this initiative, it automatically flows into <strong>Page 02 — RFP & Procurement</strong>. All fields carry forward and are pre-filled for the team to review and refine.</div></div>
              </div>
            )}
          </div>
        )}

        {section===1&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Strategic Alignment & Vision"/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Problem Statement</Lbl><Txt readOnly={readOnly} rows={4} placeholder="What specific problem or gap does this initiative address?" value={form.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
              <div><Lbl req={!readOnly}>Vision Statement</Lbl><Txt readOnly={readOnly} rows={4} placeholder="What does success look like?" value={form.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
            </G>
            <div style={{height:14}}/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Link to CISO Strategic Objective / Pillar</Lbl><Sel readOnly={readOnly} options={CPM_PILLARS} value={form.cisoPillar} onChange={v=>set("cisoPillar",v)} placeholder="Select pillar..."/></div>
              <div><Lbl req={!readOnly}>Expected Business Outcome</Lbl><Inp readOnly={readOnly} placeholder="e.g. Reduce incidents by 80%" value={form.businessOutcome} onChange={v=>set("businessOutcome",v)}/></div>
            </G>
            <div style={{height:14}}/>
            <Lbl>Framework Alignment</Lbl>
            {readOnly
              ?<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{(form.frameworks||[]).map(fw=><CBadge key={fw}>{fw}</CBadge>)}</div>
              :<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{CPM_FRAMEWORKS.map(fw=><button key={fw} onClick={()=>togFw(fw)} style={{padding:"5px 12px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:form.frameworks.includes(fw)?B.darkBlue:B.cardBg,color:form.frameworks.includes(fw)?"#FFFFFF":B.textMid,border:`1px solid ${form.frameworks.includes(fw)?B.darkBlue:B.border}`,fontWeight:form.frameworks.includes(fw)?700:400}}>{fw}</button>)}</div>}
            <SLine title="KPIs & Success Metrics"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="30%">KPI Name</TH><TH w="15%">Baseline</TH><TH w="15%">Target</TH><TH>Measurement Method</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.kpis.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. MFA coverage rate" value={r.name} onChange={v=>setA("kpis",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. 40%" value={r.baseline} onChange={v=>setA("kpis",i,"baseline",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. 95%" value={r.target} onChange={v=>setA("kpis",i,"target",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Monthly audit" value={r.method} onChange={v=>setA("kpis",i,"method",v)}/></TD>
                  {!readOnly&&<TD>{form.kpis.length>1&&<DelBtn onClick={()=>rem("kpis",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("kpis",{name:"",baseline:"",target:"",method:""})} label="Add KPI"/>}
          </div>
        )}

        {section===2&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Scope Definition"/>
            <div><Lbl req={!readOnly}>In Scope Description</Lbl><Txt readOnly={readOnly} rows={4} placeholder="Describe clearly what this initiative will deliver." value={form.inScope} onChange={v=>set("inScope",v)}/></div>
            <div style={{height:14}}/>
            <Lbl>Out of Scope / Exclusions</Lbl>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="45%">Exclusion Item</TH><TH>Reason / Rationale</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.outOfScope.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} placeholder="What is excluded..." value={r.item} onChange={v=>setA("outOfScope",i,"item",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="Why it is excluded..." value={r.reason} onChange={v=>setA("outOfScope",i,"reason",v)}/></TD>
                  {!readOnly&&<TD>{form.outOfScope.length>1&&<DelBtn onClick={()=>rem("outOfScope",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("outOfScope",{item:"",reason:""})} label="Add Exclusion"/>}
            <div style={{height:14}}/>
            <div><Lbl>Assumptions</Lbl><Txt readOnly={readOnly} rows={2} placeholder="Conditions assumed to be true for this initiative to proceed." value={form.assumptions} onChange={v=>set("assumptions",v)}/></div>
            <SLine title="Key Milestones & Deliverables"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="35%">Milestone Name</TH><TH w="18%">Target Date</TH><TH>Linked Deliverable(s)</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.milestones.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Discovery complete" value={r.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} type="date" value={r.date} onChange={v=>setA("milestones",i,"date",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Gap Analysis Report" value={r.deliverable} onChange={v=>setA("milestones",i,"deliverable",v)}/></TD>
                  {!readOnly&&<TD>{form.milestones.length>1&&<DelBtn onClick={()=>rem("milestones",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("milestones",{name:"",date:"",deliverable:""})} label="Add Milestone"/>}
            <SLine title="Key Stakeholders & Affected Teams"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="45%">Stakeholder / Team</TH><TH>Role / Involvement</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.stakeholders.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. IT Operations" value={r.name} onChange={v=>setA("stakeholders",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Impacted, Approver" value={r.role} onChange={v=>setA("stakeholders",i,"role",v)}/></TD>
                  {!readOnly&&<TD>{form.stakeholders.length>1&&<DelBtn onClick={()=>rem("stakeholders",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("stakeholders",{name:"",role:""})} label="Add Stakeholder"/>}
            <SLine title="Integration Touchpoints"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="28%">Related Initiative</TH><TH w="30%">Nature of Integration</TH><TH>Risk if Misaligned</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.integrations.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} placeholder="Initiative name..." value={r.initiative} onChange={v=>setA("integrations",i,"initiative",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Shared data feed" value={r.nature} onChange={v=>setA("integrations",i,"nature",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Scope gap" value={r.risk} onChange={v=>setA("integrations",i,"risk",v)}/></TD>
                  {!readOnly&&<TD>{form.integrations.length>1&&<DelBtn onClick={()=>rem("integrations",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("integrations",{initiative:"",nature:"",risk:""})} label="Add Integration"/>}
          </div>
        )}

        {section===3&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"200px repeat(6,1fr)",gap:10,marginBottom:20}}>
              <div style={{background:B.deepBlue,borderRadius:6,padding:"16px 18px"}}>
                <div style={{fontSize:10,fontWeight:700,color:B.headerText,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Priority Score</div>
                <div style={{fontSize:42,fontWeight:800,color:filled>0?scoreColor(score):"#FFFFFF30",lineHeight:1}}>{filled>0?score:"—"}</div>
                {filled>0&&<div style={{fontSize:11,fontWeight:700,color:scoreColor(score),marginTop:4}}>{scoreLabel(score)} PRIORITY</div>}
                <div style={{fontSize:11,color:B.headerText+"80",marginTop:6}}>{filled}/{totalQ} answered</div>
                {filled>0&&<div style={{marginTop:10,height:3,background:"#FFFFFF20",borderRadius:2}}><div style={{width:`${score}%`,height:"100%",background:scoreColor(score),borderRadius:2}}/></div>}
              </div>
              {CRITERIA.map(c=>{const n=c.questions.filter((_,qi)=>form.answers[c.key]?.[qi]!==undefined).length;return(
                <div key={c.key} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"12px 14px"}}>
                  <div style={{fontSize:9,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:c.color}}>{Math.round(c.weight*100)}%</div>
                  <div style={{fontSize:11,color:n===c.questions.length?B.green:B.textMuted,marginTop:4}}>{n}/{c.questions.length} done</div>
                </div>
              );})}
            </div>
            {CRITERIA.map(c=>(
              <div key={c.key} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,paddingBottom:12,borderBottom:`1px solid ${B.borderLight}`}}>
                  <div style={{background:c.color+"18",border:`1px solid ${c.color}40`,color:c.color,fontWeight:700,fontSize:11,padding:"3px 10px",borderRadius:3}}>{Math.round(c.weight*100)}% WEIGHT</div>
                  <div style={{fontWeight:700,fontSize:14,color:B.textDark}}>{c.label}</div>
                </div>
                {c.questions.map((q,qi)=>{const sel=form.answers[c.key]?.[qi];return(
                  <div key={qi} style={{marginBottom:18}}>
                    <div style={{fontSize:13,color:B.textDark,fontWeight:600,marginBottom:8}}><span style={{color:B.textMuted,marginRight:6,fontSize:11}}>Q{qi+1}</span>{q.q}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {q.opts.map((opt,oi)=>(
                        <button key={oi} onClick={()=>!readOnly&&setAns(c.key,qi,oi)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:4,cursor:readOnly?"default":"pointer",textAlign:"left",fontFamily:"inherit",border:`1px solid ${sel===oi?c.color:B.border}`,background:sel===oi?c.color+"10":B.inputBg}}>
                          <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,border:`2px solid ${sel===oi?c.color:B.border}`,background:sel===oi?c.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{sel===oi&&<div style={{width:6,height:6,borderRadius:"50%",background:"#FFFFFF"}}/>}</div>
                          <span style={{fontSize:12,color:sel===oi?B.textDark:B.textMid,fontWeight:sel===oi?600:400,flex:1}}>{opt}</span>
                          <span style={{fontSize:10,color:B.textMuted,fontWeight:600,flexShrink:0}}>Score {4-oi}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );})}
              </div>
            ))}
          </div>
        )}

        {section===4&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Budget & Timeline Estimates"/>
            {!readOnly&&<div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>Budget figures at this stage are indicative only. Final figures will be locked at the Contracting phase.</div>}
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Estimated Budget</Lbl><Inp readOnly={readOnly} placeholder="e.g. 500,000" value={form.budget} onChange={v=>set("budget",v)}/><div style={{fontSize:11,color:B.textMuted,marginTop:4}}>USD</div></div>
              <div><Lbl>CAPEX Portion</Lbl><Inp readOnly={readOnly} placeholder="e.g. 300,000" value={form.capex} onChange={v=>set("capex",v)}/></div>
              <div><Lbl>OPEX Portion</Lbl><Inp readOnly={readOnly} placeholder="e.g. 200,000" value={form.opex} onChange={v=>set("opex",v)}/></div>
            </G>
            <div style={{height:16}}/>
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Estimated Start Date</Lbl><Inp readOnly={readOnly} type="date" value={form.startDate} onChange={v=>set("startDate",v)}/></div>
              <div><Lbl req={!readOnly}>Estimated End Date</Lbl><Inp readOnly={readOnly} type="date" value={form.endDate} onChange={v=>set("endDate",v)}/></div>
              <div><Lbl>Budget Approval Status</Lbl><Sel readOnly={readOnly} options={["Pending","Approved","Rejected"]} value={form.budgetStatus} onChange={v=>set("budgetStatus",v)} placeholder="Select..."/></div>
            </G>
          </div>
        )}

        {section===5&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Risk & Dependency Flags"/>
            <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.textMid}}>At strategy stage, only dependency risks are captured. A full risk register is built at the Contracting phase.</div>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="22%">Related Initiative</TH><TH w="25%">Nature of Dependency</TH><TH>Risk if Delayed</TH><TH w="12%">Severity</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.depRisks.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} placeholder="Initiative name..." value={r.initiative} onChange={v=>setA("depRisks",i,"initiative",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Shared pipeline" value={r.dependency} onChange={v=>setA("depRisks",i,"dependency",v)}/></TD>
                  <TD><Inp readOnly={readOnly} placeholder="e.g. Scope gap" value={r.risk} onChange={v=>setA("depRisks",i,"risk",v)}/></TD>
                  <TD>{readOnly?<CBadge color={r.severity==="High"?B.red:r.severity==="Medium"?B.amber:B.green} bg={r.severity==="High"?B.redLight:r.severity==="Medium"?B.amberLight:B.greenLight}>{r.severity||"—"}</CBadge>:<Sel options={["High","Medium","Low"]} value={r.severity} onChange={v=>setA("depRisks",i,"severity",v)} placeholder="..."/>}</TD>
                  {!readOnly&&<TD>{form.depRisks.length>1&&<DelBtn onClick={()=>rem("depRisks",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("depRisks",{initiative:"",dependency:"",risk:"",severity:""})} label="Add Dependency Risk"/>}
          </div>
        )}

        {section===6&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
              {[
                {label:"Initiative",value:form.name||"—"},
                {label:"Domain",value:form.domain||"—"},
                {label:"Owner",value:form.owner||"—"},
                {label:"CISO Pillar",value:form.cisoPillar||"—"},
                {label:"Est. Budget (USD)",value:form.budget?`$${Number(form.budget).toLocaleString()}`:"—",color:B.darkBlue},
                {label:"Priority Score",value:filled>0?`${score} / 100`:"Not scored",color:filled>0?scoreColor(score):B.textMuted},
              ].map((item,i)=>(
                <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:item.color||B.textDark,lineHeight:1.3}}>{item.value}</div>
                </div>
              ))}
            </div>
            {!readOnly&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title="Note to Strategy Team (optional)"/>
                <Txt rows={3} placeholder="Add any context or notes for the strategy team reviewer..." value={form.note} onChange={v=>set("note",v)}/>
              </div>
            )}
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:20}}>
              <SLine title="Review & Approval Workflow"/>
              <div style={{display:"flex",alignItems:"stretch",gap:0}}>
                {[
                  {role:"Domain / Capability Lead",action:"Fills & submits this form",status:"SUBMITTED",color:B.darkBlue},
                  {role:"Strategy Team",action:"Reviews for completeness & strategic fit",status:"NEXT",color:B.midBlue},
                  {role:"CISO",action:"Final approval or return for revision",status:"PENDING",color:B.textMuted},
                ].map((step,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
                    <div style={{flex:1,background:B.pageBg,border:`1px solid ${step.color}40`,borderLeft:`4px solid ${step.color}`,borderRadius:5,padding:"14px 16px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:step.color,letterSpacing:"0.07em",marginBottom:4}}>{step.status}</div>
                      <div style={{fontSize:13,fontWeight:700,color:B.textDark,marginBottom:3}}>{step.role}</div>
                      <div style={{fontSize:11,color:B.textMuted}}>{step.action}</div>
                    </div>
                    {i<2&&<div style={{color:B.lightBlue,fontSize:22,margin:"0 8px",flexShrink:0}}>→</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
          {section>0?<button onClick={()=>setSection(s=>s-1)} style={{background:B.cardBg,border:`1px solid ${B.border}`,color:B.textMid,padding:"9px 22px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Previous</button>:<div/>}
          {section<STRATEGY_SECTIONS.length-1&&<button onClick={()=>setSection(s=>s+1)} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"9px 24px",borderRadius:4,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Next: {STRATEGY_SECTIONS[section+1].label} →</button>}
        </div>
      </div>
    </div>
  );
}

// ══ RFP FORM SECTIONS ════════════════════════════════════════════════════════
function RFPFormSections({section,setSection,rfp,setRfp,strategy,readOnly}) {
  const set  = (k,v)       => setRfp(f=>({...f,[k]:v}));
  const setA = (k,i,f2,v) => setRfp(f=>{const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)       => setRfp(f=>({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)       => setRfp(f=>({...f,[k]:f[k].filter((_,j)=>j!==i)}));
  const togFw= fw          => set("frameworks",rfp.frameworks.includes(fw)?rfp.frameworks.filter(x=>x!==fw):[...rfp.frameworks,fw]);
  const [reqTab,setReqTab] = useState("functional");

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>

        {section===0&&(
          <div>
            <div style={{background:B.deepBlue,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Carried Forward from Strategy Phase — Read Only</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                {[
                  {label:"Initiative Name", value:strategy.name},
                  {label:"Initiative ID",   value:strategy.id},
                  {label:"Domain",          value:strategy.domain},
                  {label:"Initiative Owner",value:strategy.owner},
                  {label:"CISO Pillar",     value:strategy.pillar||strategy.cisoPillar},
                  {label:"Priority Score",  value:strategy.score, color:scoreColor(strategy.score||0)},
                  {label:"Est. Budget",     value:strategy.budget},
                  {label:"Submitted",       value:strategy.submitted},
                ].map((f,i)=>(
                  <div key={i} style={{background:"#FFFFFF15",borderRadius:5,padding:"10px 14px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.headerText,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>{f.label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:f.color||"#FFFFFF"}}>{f.value||"—"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px"}}>
              <SLine title="Original Vision Statement"/>
              <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"10px 14px",background:B.pageBg,borderRadius:5,border:`1px solid ${B.border}`,marginBottom:16}}>{strategy.visionStatement||"—"}</div>
              <SLine title="Original Scope Summary"/>
              <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"10px 14px",background:B.pageBg,borderRadius:5,border:`1px solid ${B.border}`}}>{strategy.inScope||"—"}</div>
              <div style={{marginTop:20,background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,borderRadius:5,padding:"14px 16px",display:"flex",gap:12}}>
                <div style={{fontSize:18,color:B.darkBlue,flexShrink:0}}>→</div>
                <div><div style={{fontSize:12,fontWeight:700,color:B.deepBlue,marginBottom:4}}>RFP Stage Instructions</div><div style={{fontSize:12,color:B.textMid,lineHeight:1.6}}>Review the strategy content above. In the sections that follow, all fields are pre-filled from strategy and fully editable. Update the vision, KPIs, scope, and milestones to reflect the refined understanding at procurement stage.</div></div>
              </div>
            </div>
          </div>
        )}

        {section===1&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Vision & Strategic Alignment — Review & Refine"/>
            <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
              All fields below are pre-filled from the Strategy phase. Update them to reflect any refinements agreed at the RFP stage.
            </div>
            <G cols={2} gap={16}>
              <div><Lbl req>Problem Statement</Lbl><Txt rows={4} placeholder="What specific problem or gap does this initiative address?" value={rfp.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
              <div><Lbl req>Vision Statement</Lbl><Txt rows={4} placeholder="What does success look like?" value={rfp.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
            </G>
            <div style={{height:14}}/>
            <div><Lbl req>Expected Business Outcome</Lbl><Inp placeholder="e.g. Reduce incidents by 80%" value={rfp.businessOutcome} onChange={v=>set("businessOutcome",v)}/></div>
            <div style={{height:14}}/>
            <Lbl>Framework Alignment</Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:6}}>
              {CPM_FRAMEWORKS.map(fw=><button key={fw} onClick={()=>togFw(fw)} style={{padding:"5px 12px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:rfp.frameworks.includes(fw)?B.darkBlue:B.cardBg,color:rfp.frameworks.includes(fw)?"#FFFFFF":B.textMid,border:`1px solid ${rfp.frameworks.includes(fw)?B.darkBlue:B.border}`,fontWeight:rfp.frameworks.includes(fw)?700:400}}>{fw}</button>)}
            </div>
            <SLine title="KPIs & Success Metrics — Review & Refine"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="30%">KPI Name</TH><TH w="15%">Baseline</TH><TH w="15%">Target</TH><TH>Measurement Method</TH><TH w="30px"/></tr></thead>
              <tbody>{rfp.kpis.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp placeholder="e.g. MFA coverage rate" value={r.name} onChange={v=>setA("kpis",i,"name",v)}/></TD>
                  <TD><Inp placeholder="e.g. 40%" value={r.baseline} onChange={v=>setA("kpis",i,"baseline",v)}/></TD>
                  <TD><Inp placeholder="e.g. 95%" value={r.target} onChange={v=>setA("kpis",i,"target",v)}/></TD>
                  <TD><Inp placeholder="e.g. Monthly audit" value={r.method} onChange={v=>setA("kpis",i,"method",v)}/></TD>
                  <TD>{rfp.kpis.length>1&&<DelBtn onClick={()=>rem("kpis",i)}/>}</TD>
                </tr>
              ))}</tbody>
            </table>
            <AddBtn onClick={()=>add("kpis",{name:"",baseline:"",target:"",method:""})} label="Add KPI"/>
          </div>
        )}

        {section===2&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Scope Revision"/>
            <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
              Pre-filled from strategy. Update as required to reflect procurement-stage clarity.
            </div>
            <div style={{marginBottom:16}}>
              <Lbl req>Scope Revision Notes</Lbl>
              <Txt rows={3} placeholder="Describe what has changed from the original strategy scope and why — e.g. added systems, removed workstreams, updated boundaries." value={rfp.scopeRevisionNotes} onChange={v=>set("scopeRevisionNotes",v)}/>
            </div>
            <div><Lbl req>Updated In-Scope Description</Lbl><Txt rows={4} placeholder="Updated scope description for the RFP stage." value={rfp.inScope} onChange={v=>set("inScope",v)}/></div>
            <div style={{height:14}}/>
            <Lbl>Updated Out of Scope / Exclusions</Lbl>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="45%">Exclusion Item</TH><TH>Reason / Rationale</TH><TH w="30px"/></tr></thead>
              <tbody>{rfp.outOfScope.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp placeholder="What is excluded..." value={r.item} onChange={v=>setA("outOfScope",i,"item",v)}/></TD>
                  <TD><Inp placeholder="Why it is excluded..." value={r.reason} onChange={v=>setA("outOfScope",i,"reason",v)}/></TD>
                  <TD>{rfp.outOfScope.length>1&&<DelBtn onClick={()=>rem("outOfScope",i)}/>}</TD>
                </tr>
              ))}</tbody>
            </table>
            <AddBtn onClick={()=>add("outOfScope",{item:"",reason:""})} label="Add Exclusion"/>
            <div style={{height:14}}/>
            <div><Lbl>Updated Assumptions</Lbl><Txt rows={2} placeholder="Updated assumptions for this RFP stage." value={rfp.assumptions} onChange={v=>set("assumptions",v)}/></div>
          </div>
        )}

        {section===3&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Refined Milestones & Deliverables"/>
            <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
              Pre-filled from strategy. Add full detail — deliverable descriptions, types, and responsible parties are required at this stage.
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead>
                <tr>
                  <TH w="20%">Milestone Name</TH>
                  <TH w="28%">Deliverable Description</TH>
                  <TH w="14%">Deliverable Type</TH>
                  <TH w="14%">Due Date</TH>
                  <TH>Responsible Party</TH>
                  <TH w="30px"/>
                </tr>
              </thead>
              <tbody>{rfp.milestones.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp placeholder="e.g. Discovery complete" value={r.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                  <TD><Inp placeholder="Detailed description of the deliverable..." value={r.deliverableDesc||r.deliverable||""} onChange={v=>setA("milestones",i,"deliverableDesc",v)}/></TD>
                  <TD><Sel small options={DELIV_TYPES} value={r.deliverableType} onChange={v=>setA("milestones",i,"deliverableType",v)} placeholder="Type..."/></TD>
                  <TD><Inp type="date" value={r.date} onChange={v=>setA("milestones",i,"date",v)}/></TD>
                  <TD><Inp placeholder="Team or role..." value={r.responsibleParty} onChange={v=>setA("milestones",i,"responsibleParty",v)}/></TD>
                  <TD><DelBtn onClick={()=>rfp.milestones.length>1&&rem("milestones",i)}/></TD>
                </tr>
              ))}</tbody>
            </table>
            <AddBtn onClick={()=>add("milestones",{name:"",deliverable:"",deliverableDesc:"",deliverableType:"",date:"",responsibleParty:""})} label="Add Milestone"/>
          </div>
        )}

        {section===4&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Requirements Table"/>
            <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.textMid}}>
              Define what the vendor must deliver. Use <strong>Mandatory</strong> for must-have requirements and <strong>Optional</strong> for nice-to-have. These will feed the vendor evaluation at the Contracting stage.
            </div>
            <div style={{display:"flex",gap:0,marginBottom:16,border:`1px solid ${B.border}`,borderRadius:5,overflow:"hidden",width:"fit-content"}}>
              {["functional","nonFunctional"].map(tab=>(
                <button key={tab} onClick={()=>setReqTab(tab)} style={{padding:"8px 20px",background:reqTab===tab?B.darkBlue:"#FFFFFF",color:reqTab===tab?"#FFFFFF":B.textMid,border:"none",fontSize:12,fontWeight:reqTab===tab?700:500,cursor:"pointer",fontFamily:"inherit"}}>
                  {tab==="functional"?"Functional Requirements":"Non-Functional Requirements"}
                </button>
              ))}
            </div>
            {reqTab==="functional"&&(
              <>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                  <thead><tr><TH w="10%">ID</TH><TH w="40%">Requirement Description</TH><TH w="14%">Priority</TH><TH>Acceptance Criteria</TH><TH w="30px"/></tr></thead>
                  <tbody>{rfp.functionalReqs.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{r.id}</div></TD>
                      <TD><Inp placeholder="Describe the functional requirement..." value={r.description} onChange={v=>setA("functionalReqs",i,"description",v)}/></TD>
                      <TD>
                        <select value={r.priority} onChange={e=>setA("functionalReqs",i,"priority",e.target.value)} style={{width:"100%",border:`1px solid ${B.border}`,borderRadius:4,padding:"7px 8px",fontSize:12,background:r.priority==="Mandatory"?B.redLight:B.greenLight,color:r.priority==="Mandatory"?B.red:B.green,fontFamily:"inherit",fontWeight:700,outline:"none",appearance:"none",cursor:"pointer"}}>
                          <option value="Mandatory">Mandatory</option>
                          <option value="Optional">Optional</option>
                        </select>
                      </TD>
                      <TD><Inp placeholder="How will this requirement be verified?" value={r.acceptance} onChange={v=>setA("functionalReqs",i,"acceptance",v)}/></TD>
                      <TD>{rfp.functionalReqs.length>1&&<DelBtn onClick={()=>rem("functionalReqs",i)}/>}</TD>
                    </tr>
                  ))}</tbody>
                </table>
                <AddBtn onClick={()=>add("functionalReqs",{id:`FR-${String(rfp.functionalReqs.length+1).padStart(3,"0")}`,description:"",priority:"Mandatory",acceptance:""})} label="Add Functional Requirement"/>
              </>
            )}
            {reqTab==="nonFunctional"&&(
              <>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                  <thead><tr><TH w="10%">ID</TH><TH w="40%">Requirement Description</TH><TH w="14%">Priority</TH><TH>Acceptance Criteria</TH><TH w="30px"/></tr></thead>
                  <tbody>{rfp.nonFunctionalReqs.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.midBlue,fontWeight:700}}>{r.id}</div></TD>
                      <TD><Inp placeholder="e.g. System must support 99.9% uptime..." value={r.description} onChange={v=>setA("nonFunctionalReqs",i,"description",v)}/></TD>
                      <TD>
                        <select value={r.priority} onChange={e=>setA("nonFunctionalReqs",i,"priority",e.target.value)} style={{width:"100%",border:`1px solid ${B.border}`,borderRadius:4,padding:"7px 8px",fontSize:12,background:r.priority==="Mandatory"?B.redLight:B.greenLight,color:r.priority==="Mandatory"?B.red:B.green,fontFamily:"inherit",fontWeight:700,outline:"none",appearance:"none",cursor:"pointer"}}>
                          <option value="Mandatory">Mandatory</option>
                          <option value="Optional">Optional</option>
                        </select>
                      </TD>
                      <TD><Inp placeholder="How will this requirement be verified?" value={r.acceptance} onChange={v=>setA("nonFunctionalReqs",i,"acceptance",v)}/></TD>
                      <TD>{rfp.nonFunctionalReqs.length>1&&<DelBtn onClick={()=>rem("nonFunctionalReqs",i)}/>}</TD>
                    </tr>
                  ))}</tbody>
                </table>
                <AddBtn onClick={()=>add("nonFunctionalReqs",{id:`NFR-${String(rfp.nonFunctionalReqs.length+1).padStart(3,"0")}`,description:"",priority:"Mandatory",acceptance:""})} label="Add Non-Functional Requirement"/>
              </>
            )}
          </div>
        )}

        {section===5&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="RFP Status"/>
            <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:24,fontSize:12,color:B.textMid}}>
              RFP timelines and procurement approvals are managed by the procurement team outside of this tool. Use the status field below to keep the portfolio view current.
            </div>
            <G cols={2} gap={20}>
              <div>
                <Lbl req>RFP Status</Lbl>
                <select value={rfp.rfpStatus} onChange={e=>set("rfpStatus",e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1px solid ${B.border}`,borderRadius:4,padding:"10px 12px",fontSize:13,fontWeight:700,color:B.darkBlue,background:B.activeBg,fontFamily:"inherit",outline:"none",appearance:"none",cursor:"pointer"}}>
                  {RFP_STATUS_STEPS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{marginTop:10}}>
                  <CBadge color={B.darkBlue} bg={B.activeBg}>CURRENT: {rfp.rfpStatus.toUpperCase()}</CBadge>
                </div>
              </div>
            </G>
            <div style={{height:20}}/>
            <div><Lbl>RFP Notes</Lbl><Txt rows={4} placeholder="Any notes about the RFP process, vendor queries, or updates from the procurement team..." value={rfp.rfpNotes} onChange={v=>set("rfpNotes",v)}/></div>
          </div>
        )}

        {section===6&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
              {[
                {label:"Initiative",     value:strategy.name},
                {label:"Domain",         value:strategy.domain},
                {label:"Owner",          value:strategy.owner},
                {label:"RFP Status",     value:rfp.rfpStatus,    color:B.darkBlue},
                {label:"Priority Score", value:strategy.score,   color:scoreColor(strategy.score||0)},
              ].map((item,i)=>(
                <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:item.color||B.textDark}}>{item.value||"—"}</div>
                </div>
              ))}
            </div>
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
              <SLine title="Review & Approval Workflow"/>
              <div style={{display:"flex",alignItems:"stretch",gap:0}}>
                {[
                  {role:"Domain Lead / Strategy Team",action:"Refines RFP content & submits",  status:"SUBMITTED", color:B.darkBlue},
                  {role:"CISO",                       action:"Reviews & approves before RFP is issued to market", status:"PENDING",   color:B.textMuted},
                ].map((step,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
                    <div style={{flex:1,background:B.pageBg,border:`1px solid ${step.color}40`,borderLeft:`4px solid ${step.color}`,borderRadius:5,padding:"14px 16px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:step.color,letterSpacing:"0.07em",marginBottom:4}}>{step.status}</div>
                      <div style={{fontSize:13,fontWeight:700,color:B.textDark,marginBottom:3}}>{step.role}</div>
                      <div style={{fontSize:11,color:B.textMuted}}>{step.action}</div>
                    </div>
                    {i<1&&<div style={{color:B.lightBlue,fontSize:22,margin:"0 8px",flexShrink:0}}>→</div>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:B.pageBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:B.textDark,marginBottom:3}}>Export RFP Document</div>
                <div style={{fontSize:12,color:B.textMuted}}>Generate a structured RFP document from all data entered in this page.</div>
              </div>
              <div style={{background:B.borderLight,color:B.textMuted,fontWeight:700,fontSize:11,padding:"6px 16px",borderRadius:4,letterSpacing:"0.06em"}}>COMING SOON</div>
            </div>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
          {section>0?<button onClick={()=>setSection(s=>s-1)} style={{background:B.cardBg,border:`1px solid ${B.border}`,color:B.textMid,padding:"9px 22px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Previous</button>:<div/>}
          {section<RFP_SECTIONS.length-1&&<button onClick={()=>setSection(s=>s+1)} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"9px 24px",borderRadius:4,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Next: {RFP_SECTIONS[section+1].label} →</button>}
        </div>
      </div>
    </div>
  );
}

// ══ PAGE: NEW INITIATIVE (STRATEGY) ══════════════════════════════════════════
function PageNewInitiative({onDiscard,onSubmit,onExit}) {
  const [section,setSection]=useState(0);
  const [form,setForm]=useState({...EMPTY_STRATEGY});
  const {score,filled}=calcScore(form.answers);
  const initId="CPM-"+new Date().getFullYear()+"-"+String(Math.floor(Math.random()*900)+100);
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <CPMHeader subtitle="New Initiative — Strategy & Initiation" onExit={onExit}
        right={<><div style={{color:B.headerText,fontSize:11}}>ID: <span style={{fontFamily:"monospace",color:"#FFFFFF"}}>{initId}</span></div><CBadge color={B.midBlue} bg={B.midBlue+"40"}>DRAFT</CBadge></>}
      />
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onDiscard} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:B.textMuted}}>Priority Score:</div>
          <div style={{fontSize:15,fontWeight:800,color:filled>0?scoreColor(score):B.textMuted}}>{filled>0?score:"—"}</div>
          {filled>0&&<CBadge color={scoreColor(score)} bg={scoreColor(score)+"18"}>{scoreLabel(score)}</CBadge>}
          <div style={{width:1,height:20,background:B.border}}/>
          <button onClick={onDiscard} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Discard Changes</button>
          <button onClick={()=>onSubmit({...form,id:initId,phase:"Strategy",score,submitted:cpmToday,status:"Pending CISO Review"})} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit Initiative →</button>
        </div>
      </div>
      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>Capture the strategic intent of this initiative before formal project creation or procurement.</span>
      </div>
      <SectionTimeline sections={STRATEGY_SECTIONS} section={section} setSection={setSection}/>
      <StrategyFormSections section={section} setSection={setSection} form={form} setForm={setForm} readOnly={false}/>
    </div>
  );
}

// ══ PAGE: VIEW INITIATIVE (STRATEGY READ-ONLY) ════════════════════════════════
function PageViewInitiative({item,onBack,onMoveToRFP,onOpenWeekly,onViewWeeklyReports,onExit}) {
  const [section,setSection]=useState(0);

  const isProject = item && (item.progress !== undefined || item.status === "On Track" || item.status === "At Risk" || item.status === "Delayed" || item.status === "Closed");
  const isClosed  = isProject && item.status === "Closed";
  const isRFP     = !isProject && item.phase === "RFP";

  if (isProject) {
    const c = item.contractData || {};
    const hasFullRecord = Object.keys(c).length > 0;

    return(
      <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <CPMHeader subtitle={`Viewing: ${item.name}`} onExit={onExit}
          right={<><CBadge color={isClosed?B.textMuted:B.green} bg={(isClosed?B.textMuted:B.green)+"30"}>{isClosed?"CLOSED PROJECT":"ACTIVE PROJECT"}</CBadge><CBadge color={statusColor(item.status)} bg={statusBg(item.status)}>{item.status}</CBadge></>}
        />
        <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:11,color:B.textMuted}}>Progress: <span style={{fontWeight:800,color:statusColor(item.status)}}>{item.progress}%</span></div>
            <div style={{width:1,height:20,background:B.border}}/>
            {!isClosed&&onOpenWeekly&&<button onClick={()=>onOpenWeekly(item)} style={{background:B.midBlue,border:"none",color:"#FFFFFF",padding:"6px 18px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit New Weekly Update →</button>}
            {onViewWeeklyReports&&<button onClick={()=>onViewWeeklyReports(item)} style={{background:"#FFFFFF",border:`1px solid ${B.darkBlue}`,color:B.darkBlue,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>View Weekly Reports →</button>}
          </div>
        </div>
        <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
          <span style={{fontSize:12,color:B.textMuted}}>Read-only project record · {item.id} · PM: {item.pm}</span>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>

            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
              {[
                {label:"Status",       value:item.status, color:statusColor(item.status)},
                {label:"Progress",     value:`${item.progress}%`, color:statusColor(item.status)},
                {label:"Budget",       value:item.budget, color:B.darkBlue},
                {label:"Spent",        value:item.spent},
                {label:"Open Risks",   value:item.risks,  color:item.risks>0?B.red:B.green},
                {label:"Open Issues",  value:item.issues, color:item.issues>0?B.amber:B.green},
              ].map((k,i)=>(
                <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${k.color||B.border}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{k.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:k.color||B.textDark,lineHeight:1.2}}>{k.value}</div>
                </div>
              ))}
            </div>

            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Project Identity</div>
                <div style={{flex:1,height:1,background:B.lineColor}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
                {[
                  {label:"Project ID",       value:item.id},
                  {label:"Project Name",     value:item.name},
                  {label:"Domain",           value:item.domain},
                  {label:"Project Manager",  value:item.pm},
                  {label:"PM Email",         value:item.pmEmail||c.pmEmail},
                  {label:"Escalation Contact",value:c.escalationContact},
                ].map((f,i)=>(
                  <div key={i}>
                    <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>{f.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>{f.value||"—"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Vendor & Contract</div>
                <div style={{flex:1,height:1,background:B.lineColor}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
                {[
                  {label:"Awarded Vendor",       value:c.vendorName},
                  {label:"Contract Reference",   value:c.contractRef},
                  {label:"Procurement Reference",value:c.procurementRef},
                  {label:"Contract Value (USD)", value:c.contractValue?`$${Number(c.contractValue).toLocaleString()}`:item.budget},
                  {label:"CAPEX Portion",        value:c.capex?`$${Number(c.capex).toLocaleString()}`:""},
                  {label:"OPEX Portion",         value:c.opex?`$${Number(c.opex).toLocaleString()}`:""},
                  {label:"Contract Start",       value:c.contractStart||item.contractStart},
                  {label:"Contract End",         value:c.contractEnd||item.contractEnd||item.dueDate},
                  {label:isClosed?"Closure Date":"Days Remaining",value:isClosed?(item.closureDate||"—"):"—"},
                ].map((f,i)=>(
                  <div key={i}>
                    <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>{f.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>{f.value||"—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {(c.visionStatement||c.problemStatement||c.businessOutcome||(c.valueRealization&&c.valueRealization.length>0))&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Vision & Value Realization</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:14}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>Problem Statement</div>
                    <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`,minHeight:40}}>{c.problemStatement||"—"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>Vision Statement</div>
                    <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`,minHeight:40}}>{c.visionStatement||"—"}</div>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>Expected Business Outcome</div>
                  <div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>{c.businessOutcome||"—"}</div>
                </div>
                {c.valueRealization&&c.valueRealization.filter(r=>r.valueCommitted).length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8,marginTop:10}}>Value Commitments</div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>
                        <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",background:B.pageBg,borderBottom:`1px solid ${B.border}`,textTransform:"uppercase"}}>Value Committed</th>
                        <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",background:B.pageBg,borderBottom:`1px solid ${B.border}`,textTransform:"uppercase"}}>Measurement Method</th>
                        <th style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",background:B.pageBg,borderBottom:`1px solid ${B.border}`,textTransform:"uppercase"}}>Target Date</th>
                      </tr></thead>
                      <tbody>{c.valueRealization.filter(r=>r.valueCommitted).map((r,i)=>(
                        <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                          <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`}}>{r.valueCommitted}</td>
                          <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`}}>{r.measurementMethod||"—"}</td>
                          <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`}}>{r.targetDate||"—"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {(c.inScope||c.assumptions)&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Scope</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>In Scope</div>
                  <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>{c.inScope||"—"}</div>
                </div>
                {c.assumptions&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>Assumptions</div>
                    <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>{c.assumptions}</div>
                  </div>
                )}
              </div>
            )}

            {item.deliverables&&item.deliverables.length>0&&item.deliverables[0].name&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Deliverables Register ({item.deliverables.length})</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                    <thead><tr style={{background:B.pageBg}}>
                      {["ID","Name","Type","Milestone","Due","QA Reviewer","Approver","Status"].map(h=>(
                        <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",borderBottom:`1px solid ${B.border}`,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{item.deliverables.map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <td style={{padding:"8px 10px",fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700,borderBottom:`1px solid ${B.borderLight}`}}>{d.id}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`,fontWeight:600}}>{d.name}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{d.type||"—"}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{d.milestone||"—"}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`,whiteSpace:"nowrap"}}>{d.dueDate||"—"}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{d.qaReviewer||"—"}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{d.approver||"—"}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${B.borderLight}`}}><CBadge color={statusColor(d.status||"Not Started")} bg={statusBg(d.status||"Not Started")}>{(d.status||"Not Started").toUpperCase()}</CBadge></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {item.milestonesList&&item.milestonesList.length>0&&item.milestonesList[0].name&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Milestones ({item.milestonesList.length})</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.pageBg}}>
                    {["Milestone","Start","End","Weight","Status"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",borderBottom:`1px solid ${B.border}`,textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{item.milestonesList.map((m,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,fontWeight:600,borderBottom:`1px solid ${B.borderLight}`}}>{m.name}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{m.startDate||"—"}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{m.endDate||m.date||"—"}</td>
                      <td style={{padding:"8px 10px",fontSize:12,fontWeight:700,color:B.darkBlue,borderBottom:`1px solid ${B.borderLight}`}}>{m.weight?`${m.weight}%`:"—"}</td>
                      <td style={{padding:"8px 10px",borderBottom:`1px solid ${B.borderLight}`}}><CBadge color={statusColor(m.status||"Not Started")} bg={statusBg(m.status||"Not Started")}>{(m.status||"Not Started").toUpperCase()}</CBadge></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {c.team&&c.team.filter(t=>t.name).length>0&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Project Team</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.pageBg}}>
                    {["Name","Role","Organisation","Allocation"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",borderBottom:`1px solid ${B.border}`,textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{c.team.filter(t=>t.name).map((t,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,fontWeight:600,borderBottom:`1px solid ${B.borderLight}`}}>{t.name}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{t.role||"—"}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{t.organisation||"—"}</td>
                      <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{t.allocation||"—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {item.risksList&&item.risksList.length>0&&item.risksList[0].description&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Risk Register ({item.risksList.length})</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.pageBg}}>
                    {["ID","Category","Description","Likelihood","Impact","Rating","Owner","Status"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",borderBottom:`1px solid ${B.border}`,textTransform:"uppercase"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{item.risksList.map((r,i)=>{
                    const rating = r.overrideRating || (r.likelihood&&r.impact ? RISK_MATRIX[`${r.likelihood}-${r.impact}`] : "—");
                    return(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <td style={{padding:"8px 10px",fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700,borderBottom:`1px solid ${B.borderLight}`}}>{r.id}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{r.category||"—"}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`}}>{r.description}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{r.likelihood||"—"}</td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{r.impact||"—"}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${B.borderLight}`}}><CBadge color={ratingColor(rating)} bg={ratingBg(rating)}>{rating.toUpperCase()}</CBadge></td>
                        <td style={{padding:"8px 10px",fontSize:12,color:B.textMid,borderBottom:`1px solid ${B.borderLight}`}}>{r.owner||"—"}</td>
                        <td style={{padding:"8px 10px",borderBottom:`1px solid ${B.borderLight}`}}><CBadge color={statusColor(r.status)} bg={statusBg(r.status)}>{r.status?.toUpperCase()}</CBadge></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}

            {!hasFullRecord&&(
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,borderRadius:5,padding:"14px 16px",display:"flex",gap:12,marginBottom:16}}>
                <div style={{fontSize:18,color:B.darkBlue,flexShrink:0}}>ℹ</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:B.deepBlue,marginBottom:4}}>Limited record data</div>
                  <div style={{fontSize:12,color:B.textMid,lineHeight:1.6}}>
                    This project predates the current data model. Full contracting record will be available for newly activated projects.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isRFP && item.rfpData) {
    return(
      <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <CPMHeader subtitle={`Viewing: ${item.name}`} onExit={onExit}
          right={<><CBadge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</CBadge><CBadge color={B.amber} bg={B.amberLight}>{item.status}</CBadge></>}
        />
        <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:11,color:B.textMuted}}>Priority Score: <span style={{fontWeight:800,color:scoreColor(item.score)}}>{item.score}</span></div>
            <div style={{width:1,height:20,background:B.border}}/>
            <button style={{background:B.greenLight,border:`1px solid ${B.green}30`,color:B.green,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓ Approve</button>
            <button style={{background:B.redLight,border:`1px solid ${B.red}30`,color:B.red,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Return for Revision</button>
          </div>
        </div>
        <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
          <span style={{fontSize:12,color:B.textMuted}}>Read-only RFP record · {item.id} · Submitted by {item.owner}</span>
        </div>
        <SectionTimeline sections={RFP_SECTIONS} section={section} setSection={setSection}/>
        <RFPFormSections section={section} setSection={setSection} rfp={item.rfpData} setRfp={()=>{}} strategy={item} readOnly={true}/>
      </div>
    );
  }

  const form={...EMPTY_STRATEGY,...item,frameworks:item.frameworks||[],kpis:item.kpis||[{name:"",baseline:"",target:"",method:""}],outOfScope:item.outOfScope||[{item:"",reason:""}],stakeholders:item.stakeholders||[{name:"",role:""}],integrations:item.integrations||[{initiative:"",nature:"",risk:""}],depRisks:item.depRisks||[],milestones:item.milestones||[],answers:item.answers||{}};
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <CPMHeader subtitle={`Viewing: ${item.name}`} onExit={onExit}
        right={<><CBadge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</CBadge><CBadge color={B.amber} bg={B.amberLight}>{item.status}</CBadge></>}
      />
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:11,color:B.textMuted}}>Priority Score: <span style={{fontWeight:800,color:scoreColor(item.score)}}>{item.score}</span></div>
          <div style={{width:1,height:20,background:B.border}}/>
          {item.phase==="Strategy"&&<button onClick={()=>onMoveToRFP(item)} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 18px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Move to RFP →</button>}
          <button style={{background:B.greenLight,border:`1px solid ${B.green}30`,color:B.green,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓ Approve</button>
          <button style={{background:B.redLight,border:`1px solid ${B.red}30`,color:B.red,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Return for Revision</button>
        </div>
      </div>
      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>Read-only view · {item.id} · Submitted {item.submitted} by {item.owner}</span>
      </div>
      <SectionTimeline sections={STRATEGY_SECTIONS} section={section} setSection={setSection}/>
      <StrategyFormSections section={section} setSection={setSection} form={form} setForm={()=>{}} readOnly={true}/>
    </div>
  );
}

// ══ PAGE: RFP ════════════════════════════════════════════════════════════════
function PageRFP({strategy,onBack,onSubmit,onExit}) {
  const [section,setSection]=useState(0);
  const [rfp,setRfp]=useState(EMPTY_RFP(strategy));
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <CPMHeader subtitle={`RFP — ${strategy.name}`} onExit={onExit}
        right={<><CBadge color={B.midBlue} bg={B.midBlue+"30"}>RFP PHASE</CBadge><CBadge color={B.amber} bg={B.amberLight}>{rfp.rfpStatus.toUpperCase()}</CBadge></>}
      />
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:B.textMuted}}>Initiative: <span style={{fontWeight:700,color:B.textDark}}>{strategy.name}</span></div>
          <div style={{fontSize:11,color:B.textMuted}}>Score: <span style={{fontWeight:800,color:scoreColor(strategy.score||0)}}>{strategy.score}</span></div>
          <div style={{width:1,height:20,background:B.border}}/>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Discard Changes</button>
          <button onClick={()=>onSubmit({...strategy,phase:"RFP",rfpData:rfp,status:"RFP Draft"})} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save RFP Record →</button>
        </div>
      </div>
      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>Review and refine the initiative scope, vision, and KPIs for procurement. All fields are pre-filled from the Strategy phase.</span>
      </div>
      <SectionTimeline sections={RFP_SECTIONS} section={section} setSection={setSection}/>
      <RFPFormSections section={section} setSection={setSection} rfp={rfp} setRfp={setRfp} strategy={strategy} readOnly={false}/>
    </div>
  );
}

// ══ PAGE: LANDING ════════════════════════════════════════════════════════════
function PageLanding({pipeline,projects,onNewInitiative,onNewRFP,onNewActiveProject,onNewClosedProject,onViewInitiative,onOpenRFP,onOpenContracting,onOpenWeekly,onViewWeeklyReports,onMovePhase,onExit}) {
  const [activeTab,setActiveTab]=useState("overview");
  const [pipelineFilter,setPipelineFilter]=useState("All");
  const [projectFilter,setProjectFilter]=useState("All");
  const [selectedItem,setSelectedItem]=useState(null);

  const filteredPipeline=pipelineFilter==="All"?pipeline:pipeline.filter(p=>p.phase===pipelineFilter);
  const filteredProjects=projectFilter==="All"?projects.filter(p=>p.status!=="Closed"):projects.filter(p=>p.status===projectFilter);
  const kpis=[
    {label:"Strategy Initiatives",        value:pipeline.filter(p=>p.phase==="Strategy").length,                            sub:"Pending CISO review",    color:B.darkBlue},
    {label:"RFP Initiatives",             value:pipeline.filter(p=>p.phase==="RFP").length,                                 sub:"Under procurement",      color:B.midBlue},
    {label:"Active Projects",             value:projects.filter(p=>p.status!=="Closed").length,                             sub:"In execution",           color:B.green},
    {label:"Closed Projects",             value:projects.filter(p=>p.status==="Closed").length,                             sub:"Completed & approved",   color:B.textMuted},
    {label:"At Risk / Delayed",           value:projects.filter(p=>p.status==="At Risk"||p.status==="Delayed").length,      sub:"Require attention",      color:B.red},
  ];

  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <CPMHeader subtitle="CISO Portfolio Overview" onExit={onExit} right={<div style={{color:B.headerText,fontSize:11}}>Data as of {cpmToday}</div>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
        {[{id:"overview",label:"Portfolio Overview"},{id:"pipeline",label:"Initiatives"},{id:"projects",label:"Active Projects"},{id:"risks",label:"Risks & Issues"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"12px 20px",background:activeTab===t.id?B.darkBlue:"transparent",color:activeTab===t.id?"#FFFFFF":B.textMuted,border:"none",fontSize:12,fontWeight:activeTab===t.id?700:500,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",borderRadius:activeTab===t.id?"4px 4px 0 0":0,marginBottom:activeTab===t.id?-1:0}}>{t.label}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:8,padding:"8px 0"}}>
          <button onClick={onNewInitiative} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"7px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Initiative</button>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 28px 48px"}}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>

          {activeTab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:24}}>
                {kpis.map((k,i)=>(
                  <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"16px 18px",borderTop:`3px solid ${k.color}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
                    <div style={{fontSize:36,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                    <div style={{fontSize:11,color:B.textMuted,marginTop:6}}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Portfolio Pipeline — Stage Distribution</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
                  {[
                    {key:"Strategy", label:"Strategy Initiatives", items:pipeline.filter(p=>p.phase==="Strategy"), source:"pipeline", newLabel:"+ New Strategy",       newAction:()=>onNewInitiative()},
                    {key:"RFP",      label:"RFP Initiatives",       items:pipeline.filter(p=>p.phase==="RFP"),      source:"pipeline", newLabel:"+ New RFP",            newAction:()=>onNewRFP&&onNewRFP()},
                    {key:"Active",   label:"Active Projects",       items:projects.filter(p=>p.status!=="Closed"),  source:"project",  newLabel:"+ New Active Project", newAction:()=>onNewActiveProject&&onNewActiveProject()},
                    {key:"Closed",   label:"Closed Projects",       items:projects.filter(p=>p.status==="Closed"),  source:"project",  newLabel:"+ New Closed Project", newAction:()=>onNewClosedProject&&onNewClosedProject()},
                  ].map((col,pi)=>{
                    return(
                      <div key={col.key} style={{flex:1,position:"relative"}}>
                        <div style={{background:phaseBg(col.key),border:`1px solid ${phaseColor(col.key)}40`,borderRadius:6,padding:"14px 16px",height:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                            <CBadge color={phaseColor(col.key)} bg={phaseBg(col.key)}>{col.label.toUpperCase()}</CBadge>
                            <div style={{fontSize:22,fontWeight:800,color:phaseColor(col.key)}}>{col.items.length}</div>
                          </div>
                          <div style={{flex:1}}>
                          {col.items.map(item=>(
                            col.source==="pipeline"?(
                              <div key={item.id} onClick={()=>setSelectedItem({...item,_cardType:"pipeline"})} style={{background:"#FFFFFF",border:`1px solid ${B.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,85,135,0.06)"}}>
                                <div style={{fontSize:12,fontWeight:700,color:B.textDark,marginBottom:3}}>{item.name}</div>
                                <div style={{fontSize:11,color:B.textMuted,marginBottom:6}}>{item.domain}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <span style={{fontSize:11,color:B.textMuted}}>{(item.owner||"").split(" ")[0]}</span>
                                  <div style={{fontSize:11,fontWeight:700,color:scoreColor(item.score)}}>Score: {item.score}</div>
                                </div>
                              </div>
                            ):(
                              <div key={item.id} onClick={()=>setSelectedItem({...item,_cardType:"project"})} style={{background:"#FFFFFF",border:`1px solid ${B.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,85,135,0.06)"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                                  <div style={{fontSize:12,fontWeight:700,color:B.textDark,flex:1,marginRight:8}}>{item.name}</div>
                                  <CBadge color={statusColor(item.status)} bg={statusBg(item.status)}>{item.status.toUpperCase()}</CBadge>
                                </div>
                                <ProgressBar pct={item.progress} color={statusColor(item.status)}/>
                                <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>{item.progress}% complete</div>
                              </div>
                            )
                          ))}
                          {col.items.length===0&&<div style={{fontSize:12,color:B.textMuted,fontStyle:"italic",textAlign:"center",padding:"12px 0"}}>None</div>}
                          </div>
                          <button onClick={col.newAction} style={{marginTop:10,background:"#FFFFFF",border:`1px dashed ${phaseColor(col.key)}`,color:phaseColor(col.key),borderRadius:4,padding:"7px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.03em",width:"100%"}}>{col.newLabel}</button>
                        </div>
                        {pi<3&&<div style={{position:"absolute",right:-14,top:"50%",transform:"translateY(-50%)",color:B.lightBlue,fontSize:22,zIndex:1}}>›</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Requires CISO Attention</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>Awaiting CISO Sign-off</div>
                    {pipeline.filter(p=>p.phase==="Strategy").map(item=>(
                      <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderRadius:5,marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700,color:B.textDark}}>{item.name}</div>
                          <div style={{fontSize:11,color:B.textMuted}}>Score: <span style={{color:scoreColor(item.score),fontWeight:700}}>{item.score}</span> · {item.owner}</div>
                        </div>
                        <button onClick={()=>onViewInitiative(item)} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Review</button>
                      </div>
                    ))}
                    {pipeline.filter(p=>p.phase==="Strategy").length===0&&<div style={{fontSize:12,color:B.textMuted,fontStyle:"italic"}}>No pending sign-offs</div>}
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>Projects Needing Attention</div>
                    {projects.filter(p=>p.status==="At Risk"||p.status==="Delayed").map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:statusBg(p.status),border:`1px solid ${statusColor(p.status)}30`,borderRadius:5,marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700,color:B.textDark}}>{p.name}</div>
                          <div style={{fontSize:11,color:B.textMuted}}>{p.risks} risk{p.risks!==1?"s":""} · {p.issues} issue{p.issues!==1?"s":""} · {p.progress}% complete</div>
                        </div>
                        <CBadge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</CBadge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab==="pipeline"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {["All","Strategy","RFP"].map(f=>(
                  <button key={f} onClick={()=>setPipelineFilter(f)} style={{padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:pipelineFilter===f?B.darkBlue:B.cardBg,color:pipelineFilter===f?"#FFFFFF":B.textMid,border:`1px solid ${pipelineFilter===f?B.darkBlue:B.border}`,fontWeight:pipelineFilter===f?700:400}}>
                    {f}{f!=="All"&&` (${pipeline.filter(p=>p.phase===f).length})`}
                  </button>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.deepBlue}}>{["Initiative","Domain","Phase","Priority Score","Owner","Budget","Submitted","Actions"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#FFFFFF",letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredPipeline.map((item,i)=>(
                      <tr key={item.id} style={{background:i%2===0?B.cardBg:B.pageBg,borderBottom:`1px solid ${B.borderLight}`}}>
                        <td style={{padding:"12px 14px"}}><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{item.name}</div><div style={{fontSize:11,color:B.textMuted,fontFamily:"monospace"}}>{item.id}</div></td>
                        <td style={{padding:"12px 14px",fontSize:12,color:B.textMid}}>{item.domain}</td>
                        <td style={{padding:"12px 14px"}}><CBadge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</CBadge></td>
                        <td style={{padding:"12px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontSize:16,fontWeight:800,color:scoreColor(item.score)}}>{item.score}</div>
                            <div style={{flex:1,maxWidth:60}}><ProgressBar pct={item.score} color={scoreColor(item.score)}/></div>
                          </div>
                        </td>
                        <td style={{padding:"12px 14px",fontSize:12,color:B.textMid,whiteSpace:"nowrap"}}>{item.owner}</td>
                        <td style={{padding:"12px 14px",fontSize:12,fontWeight:600,color:B.darkBlue,whiteSpace:"nowrap"}}>{item.budget}</td>
                        <td style={{padding:"12px 14px",fontSize:11,color:B.textMuted,whiteSpace:"nowrap"}}>{item.submitted}</td>
                        <td style={{padding:"12px 14px"}}>
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>onViewInitiative(item)} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,borderRadius:3,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>View</button>
                            {item.phase==="Strategy"&&<button onClick={()=>onOpenRFP(item)} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Open RFP →</button>}{item.phase==="RFP"&&<button onClick={()=>onOpenContracting(item)} style={{background:B.green,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Activate Project →</button>}
                            {item.phase!=="Strategy"&&<button onClick={()=>onMovePhase(item)} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{nextLabel[item.phase]}</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab==="projects"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {["All","On Track","At Risk","Delayed","Closed"].map(f=>(
                  <button key={f} onClick={()=>setProjectFilter(f)} style={{padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:projectFilter===f?B.darkBlue:B.cardBg,color:projectFilter===f?"#FFFFFF":B.textMid,border:`1px solid ${projectFilter===f?B.darkBlue:B.border}`,fontWeight:projectFilter===f?700:400}}>
                    {f==="All"?`All (${projects.filter(p=>p.status!=="Closed").length})`:`${f} (${projects.filter(p=>p.status===f).length})`}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {filteredProjects.map(p=>(
                  <div key={p.id} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderLeft:`4px solid ${statusColor(p.status)}`,borderRadius:6,padding:"18px 22px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr auto",gap:16,alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><div style={{fontSize:13,fontWeight:700,color:B.textDark}}>{p.name}</div><CBadge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</CBadge></div>
                        <div style={{fontSize:11,color:B.textMuted,marginBottom:8}}>{p.domain} · PM: {p.pm}</div>
                        <ProgressBar pct={p.progress} color={statusColor(p.status)}/>
                        <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>{p.progress}% complete</div>
                      </div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Current Milestone</div><div style={{fontSize:12,fontWeight:600,color:B.textDark,marginBottom:4}}>{p.milestone}</div><CBadge color={statusColor(p.milestoneStatus)} bg={statusBg(p.milestoneStatus)}>{(p.milestoneStatus||"").toUpperCase()}</CBadge></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>{p.status==="Closed"?"Closure Date":"Due Date"}</div><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{p.status==="Closed"?(p.closureDate||"—"):p.dueDate}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Budget</div><div style={{fontSize:13,fontWeight:700,color:B.darkBlue}}>{p.budget}</div><div style={{fontSize:11,color:B.textMuted}}>Spent: {p.spent}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Risks</div><div style={{fontSize:20,fontWeight:800,color:p.risks>0?B.red:B.green}}>{p.risks}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Issues</div><div style={{fontSize:20,fontWeight:800,color:p.issues>0?B.amber:B.green}}>{p.issues}</div></div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <button onClick={()=>onViewInitiative(p)} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>View Project</button>
                        {p.status!=="Closed"&&<button onClick={()=>onOpenWeekly(p)} style={{background:B.midBlue,border:"none",color:"#FFFFFF",borderRadius:3,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Weekly Update →</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==="risks"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                {[{label:"Open Risks",value:projects.filter(p=>p.status!=="Closed").reduce((a,p)=>a+p.risks,0),color:B.red,bg:B.redLight},{label:"Open Issues",value:projects.filter(p=>p.status!=="Closed").reduce((a,p)=>a+p.issues,0),color:B.amber,bg:B.amberLight},{label:"Projects Affected",value:projects.filter(p=>p.status!=="Closed"&&(p.risks>0||p.issues>0)).length,color:B.darkBlue,bg:B.activeBg}].map((k,i)=>(
                  <div key={i} style={{background:k.bg,border:`1px solid ${k.color}30`,borderRadius:6,padding:"18px 20px",borderTop:`3px solid ${k.color}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
                    <div style={{fontSize:40,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.deepBlue}}>{["Project","Domain","PM","Risks","Issues","Status","Progress","Action"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#FFFFFF",letterSpacing:"0.07em",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
                  <tbody>{projects.filter(p=>p.status!=="Closed"&&(p.risks>0||p.issues>0)).map((p,i)=>(
                    <tr key={p.id} style={{background:i%2===0?B.cardBg:B.pageBg,borderBottom:`1px solid ${B.borderLight}`}}>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{p.name}</div><div style={{fontSize:11,color:B.textMuted,fontFamily:"monospace"}}>{p.id}</div></td>
                      <td style={{padding:"12px 14px",fontSize:12,color:B.textMid}}>{p.domain}</td>
                      <td style={{padding:"12px 14px",fontSize:12,color:B.textMid,whiteSpace:"nowrap"}}>{p.pm}</td>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:18,fontWeight:800,color:p.risks>0?B.red:B.green}}>{p.risks}</div></td>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:18,fontWeight:800,color:p.issues>0?B.amber:B.green}}>{p.issues}</div></td>
                      <td style={{padding:"12px 14px"}}><CBadge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</CBadge></td>
                      <td style={{padding:"12px 14px",minWidth:100}}><ProgressBar pct={p.progress} color={statusColor(p.status)}/><div style={{fontSize:11,color:B.textMuted,marginTop:3}}>{p.progress}%</div></td>
                      <td style={{padding:"12px 14px"}}><button onClick={()=>onViewInitiative(p)} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Risks</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {selectedItem&&(()=>{
        const isProject = selectedItem._cardType==="project";
        const isClosed  = isProject && selectedItem.status==="Closed";
        const rows = isProject?[
          {label:"Domain",       value:selectedItem.domain},
          {label:"PM",           value:selectedItem.pm},
          {label:"Status",       value:selectedItem.status, color:statusColor(selectedItem.status)},
          {label:"Progress",     value:`${selectedItem.progress}%`, color:statusColor(selectedItem.status)},
          {label:"Budget",       value:selectedItem.budget},
          {label:"Spent",        value:selectedItem.spent},
          {label:isClosed?"Closure Date":"Due Date", value:isClosed?(selectedItem.closureDate||"—"):selectedItem.dueDate},
          {label:"Current Milestone", value:selectedItem.milestone},
          {label:"Open Risks",   value:selectedItem.risks,  color:selectedItem.risks>0?B.red:B.green},
          {label:"Open Issues",  value:selectedItem.issues, color:selectedItem.issues>0?B.amber:B.green},
        ]:[
          {label:"Domain",       value:selectedItem.domain},
          {label:"Owner",        value:selectedItem.owner},
          {label:"Phase",        value:selectedItem.phase},
          {label:"Priority Score", value:selectedItem.score, color:scoreColor(selectedItem.score||0)},
          {label:"Status",       value:selectedItem.status},
          {label:"Est. Budget",  value:selectedItem.budget},
          {label:"CISO Pillar",  value:selectedItem.pillar||selectedItem.cisoPillar},
          {label:"Submitted",    value:selectedItem.submitted},
        ];
        return(
        <div style={{position:"fixed",top:0,right:0,bottom:0,width:400,background:B.cardBg,boxShadow:"-4px 0 24px rgba(0,85,135,0.15)",zIndex:100,display:"flex",flexDirection:"column"}}>
          <div style={{background:isProject?(isClosed?B.textMuted:B.green):B.deepBlue,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{color:"#FFFFFFAA",fontSize:10,fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>{selectedItem.id} · {isProject?(isClosed?"CLOSED PROJECT":"ACTIVE PROJECT"):(selectedItem.phase.toUpperCase()+" INITIATIVE")}</div>
              <div style={{color:"#FFFFFF",fontWeight:700,fontSize:14}}>{selectedItem.name}</div>
            </div>
            <button onClick={()=>setSelectedItem(null)} style={{background:"none",border:"none",color:"#FFFFFF",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
            {rows.map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                <div style={{fontSize:12,color:B.textMuted,fontWeight:600}}>{row.label}</div>
                <div style={{fontSize:12,fontWeight:700,color:row.color||B.textDark}}>{row.value??"—"}</div>
              </div>
            ))}
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{onViewInitiative(selectedItem);setSelectedItem(null);}} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Record →</button>

              {!isProject&&selectedItem.phase==="Strategy"&&(
                <button onClick={()=>{onOpenRFP(selectedItem);setSelectedItem(null);}} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open RFP Page →</button>
              )}
              {!isProject&&selectedItem.phase==="RFP"&&(
                <button onClick={()=>{onOpenContracting(selectedItem);setSelectedItem(null);}} style={{background:B.green,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Activate Project →</button>
              )}

              {isProject&&!isClosed&&(
                <button onClick={()=>{onOpenWeekly(selectedItem);setSelectedItem(null);}} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit New Weekly Update →</button>
              )}
              {isProject&&(
                <button onClick={()=>{onViewWeeklyReports&&onViewWeeklyReports(selectedItem);setSelectedItem(null);}} style={{background:"#FFFFFF",color:B.darkBlue,border:`1px solid ${B.darkBlue}`,borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Weekly Reports →</button>
              )}

              {!isProject&&(
                <>
                  <button style={{background:B.greenLight,border:`1px solid ${B.green}30`,color:B.green,borderRadius:4,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓ Approve Initiative</button>
                  <button style={{background:B.redLight,border:`1px solid ${B.red}30`,color:B.red,borderRadius:4,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Return for Revision</button>
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

// ══ CONTRACTING PAGE — UNIQUE CONSTANTS ════════════════════════════════════
const RISK_MATRIX = {
  "High-High":"Critical","High-Medium":"High","High-Low":"Medium",
  "Medium-High":"High","Medium-Medium":"Medium","Medium-Low":"Low",
  "Low-High":"Medium","Low-Medium":"Low","Low-Low":"Low",
};
const ratingColor = r => ({Critical:B.critical,High:B.red,Medium:B.amber,Low:B.green}[r]||B.textMuted);
const ratingBg    = r => ({Critical:B.criticalLight,High:B.redLight,Medium:B.amberLight,Low:B.greenLight}[r]||B.pageBg);

const CONTRACT_SECTIONS = [
  {id:"reference",    label:"Contract Reference"},
  {id:"vendor",       label:"Vendor & Contract"},
  {id:"vision",       label:"Vision & Value"},
  {id:"scope",        label:"Scope & Deliverables"},
  {id:"timeline",     label:"Timeline & Milestones"},
  {id:"team",         label:"Project Team"},
  {id:"risks",        label:"Risk Register"},
  {id:"dependencies", label:"Dependencies"},
  {id:"submit",       label:"Submit & Activate"},
];

const EMPTY_CONTRACT = (rfp, strategy) => ({
  vendorName:"", contractRef:"", contractStart:"", contractEnd:"",
  contractValue:"", capex:"", opex:"", procurementRef:"",
  visionStatement:  rfp?.visionStatement  || strategy?.visionStatement  || "",
  problemStatement: rfp?.problemStatement || strategy?.problemStatement || "",
  businessOutcome:  rfp?.businessOutcome  || strategy?.businessOutcome  || "",
  valueRealization: [{valueCommitted:"", measurementMethod:"", targetDate:""}],
  inScope:    rfp?.inScope    || strategy?.inScope    || "",
  outOfScope: rfp?.outOfScope || [{item:"",reason:""}],
  assumptions:rfp?.assumptions|| strategy?.assumptions|| "",
  deliverables:[{
    id:"D-001", name:"", description:"", type:"", milestone:"",
    dueDate:"", responsibleParty:"", qaReviewer:"", approver:"",
    status:"Not Started",
  }],
  milestones:(rfp?.milestones||strategy?.milestones||[]).map((m,i)=>({
    ...m,
    startDate: m.date||"",
    endDate:   "",
    weight:    "",
    linkedDeliverables:"",
    status:    "Not Started",
  })),
  pm:"", pmEmail:"", escalationContact:"",
  team:[{name:"",role:"",organisation:"",allocation:""}],
  risks:[{
    id:"R-001", category:"", description:"", likelihood:"",
    impact:"", overrideRating:"", overrideComment:"",
    mitigation:"", owner:"", status:"Open",
  }],
  dependencies:(strategy?.depRisks||[]).map(d=>({
    initiative:d.initiative||"", nature:d.dependency||"",
    riskIfDelayed:d.risk||"", severity:d.severity||"",
    owner:"", linkedStatus:"",
  })),
  reportCadence:    "Weekly",
  reportDay:        "Monday",
  reportRecipients: [{name:"",email:"",role:""}],
  reportFormat:     "Executive summary",
  firstReportDate:  "",
  note:"",
});

function GanttChart({milestones}) {
  const parsed = useMemo(()=>milestones.filter(m=>m.startDate&&m.endDate).map(m=>({
    ...m,
    start: new Date(m.startDate),
    end:   new Date(m.endDate),
  })).filter(m=>!isNaN(m.start)&&!isNaN(m.end)&&m.end>=m.start),[milestones]);

  if(parsed.length===0) return(
    <div style={{background:B.pageBg,border:`1px dashed ${B.border}`,borderRadius:6,
      padding:"28px",textAlign:"center",fontSize:12,color:B.textMuted}}>
      Enter start and end dates for milestones above to generate the Gantt chart.
    </div>
  );

  const minDate = new Date(Math.min(...parsed.map(m=>m.start)));
  const maxDate = new Date(Math.max(...parsed.map(m=>m.end)));
  const totalDays = Math.max((maxDate-minDate)/(1000*60*60*24),1);
  const msColors = [B.darkBlue,B.midBlue,B.lightBlue,"#0091C7","#0058A0","#004578"];

  const months = [];
  const cursor = new Date(minDate.getFullYear(),minDate.getMonth(),1);
  while(cursor<=maxDate){
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth()+1);
  }

  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:600}}>
        <div style={{display:"flex",marginLeft:180,marginBottom:4}}>
          {months.map((m,i)=>{
            const monthStart = new Date(Math.max(m,minDate));
            const monthEnd   = new Date(Math.min(
              new Date(m.getFullYear(),m.getMonth()+1,0), maxDate));
            const leftPct  = ((monthStart-minDate)/(totalDays*86400000))*100;
            const widthPct = ((monthEnd-monthStart)/(totalDays*86400000))*100+
                             (1/(totalDays))*100;
            return(
              <div key={i} style={{position:"absolute",left:`calc(180px + ${leftPct}%)`,
                width:`${widthPct}%`,fontSize:9,fontWeight:700,color:B.textMuted,
                letterSpacing:"0.06em",textTransform:"uppercase",paddingLeft:4}}>
                {m.toLocaleDateString("en-GB",{month:"short",year:"2-digit"})}
              </div>
            );
          })}
        </div>
        <div style={{position:"relative",paddingTop:18}}>
          <div style={{position:"absolute",top:0,left:180,right:0,bottom:0,display:"flex",pointerEvents:"none"}}>
            {months.map((m,i)=>{
              const leftPct=((new Date(Math.max(m,minDate))-minDate)/(totalDays*86400000))*100;
              return <div key={i} style={{position:"absolute",left:`${leftPct}%`,top:0,bottom:0,width:1,background:B.borderLight}}/>;
            })}
          </div>
          {parsed.map((m,i)=>{
            const leftPct  = ((m.start-minDate)/(totalDays*86400000))*100;
            const widthPct = Math.max(((m.end-m.start)/(totalDays*86400000))*100,1);
            const color    = msColors[i%msColors.length];
            const sc       = statusColor(m.status||"Not Started");
            return(
              <div key={i} style={{display:"flex",alignItems:"center",marginBottom:8,height:32}}>
                <div style={{width:180,flexShrink:0,paddingRight:12,overflow:"hidden"}}>
                  <div style={{fontSize:11,fontWeight:600,color:B.textDark,whiteSpace:"nowrap",
                    overflow:"hidden",textOverflow:"ellipsis"}}>{m.name||`Milestone ${i+1}`}</div>
                  <CBadge color={sc} bg={statusBg(m.status||"Not Started")}>{m.status||"Not Started"}</CBadge>
                </div>
                <div style={{flex:1,height:32,background:B.pageBg,
                  border:`1px solid ${B.borderLight}`,borderRadius:4,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:`${leftPct}%`,width:`${widthPct}%`,
                    top:4,bottom:4,background:color,borderRadius:3,
                    display:"flex",alignItems:"center",paddingLeft:8,overflow:"hidden",minWidth:8}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#FFFFFF",whiteSpace:"nowrap"}}>
                      {widthPct>8?`${m.startDate} → ${m.endDate}`:""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{fontSize:10,color:B.textMuted,marginTop:8,textAlign:"right"}}>
          Project span: {minDate.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})} → {maxDate.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
        </div>
      </div>
    </div>
  );
}

// ══ MAIN CONTRACTING PAGE ════════════════════════════════════════════════════
function PageContracting({strategy,rfp,onBack,onActivate,mode,onExit}) {
  const [section,setSection] = useState(0);
  const [form,setForm]       = useState(EMPTY_CONTRACT(rfp,strategy));
  const [activated,setActivated] = useState(false);

  const set  = (k,v)        => setForm(f=>({...f,[k]:v}));
  const setA = (k,i,f2,v)  => setForm(f=>{const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)        => setForm(f=>({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)        => setForm(f=>({...f,[k]:f[k].filter((_,j)=>j!==i)}));

  const autoId = (prefix,arr,i) => arr[i]?.id || `${prefix}-${String(i+1).padStart(3,"0")}`;

  const kpiSummary = [
    {label:"Awarded Vendor",   value:form.vendorName||"—"},
    {label:"Project Manager",  value:form.pm||"—"},
    {label:"Contract Value",   value:form.contractValue?`$${Number(form.contractValue).toLocaleString()}`:"—", color:B.darkBlue},
    {label:"Start → End",      value:form.contractStart&&form.contractEnd?`${form.contractStart} → ${form.contractEnd}`:"—"},
    {label:"Deliverables",     value:form.deliverables.length, color:B.midBlue},
    {label:"Open Risks",       value:form.risks.filter(r=>r.status==="Open").length, color:B.red},
  ];

  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>

      <div style={{background:B.deepBlue,padding:"0 28px",display:"flex",alignItems:"center",
        justifyContent:"space-between",height:48,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          {onExit && <button onClick={onExit} title="Back to Suite" style={{background:"#FFFFFF20",border:"1px solid #FFFFFF40",color:"#FFFFFF",borderRadius:4,padding:"3px 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⊞ Suite</button>}
          <div style={{color:"#FFFFFF",fontWeight:800,fontSize:15,letterSpacing:"0.14em"}}>CPM</div>
          <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
          <div style={{color:B.headerText,fontSize:12}}>Cyber Portfolio Management</div>
          <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
          <div style={{color:"#FFFFFF90",fontSize:12}}>Contracting & Award — <span style={{color:"#FFFFFF"}}>{strategy?.name}</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <CBadge color={B.midBlue} bg={B.midBlue+"30"}>CONTRACTING PHASE</CBadge>
          <div style={{width:30,height:30,borderRadius:"50%",background:B.midBlue,
            display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:12,fontWeight:700}}>CX</div>
        </div>
      </div>

      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",
        display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,
          fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:B.textMuted}}>
            Priority Score: <span style={{fontWeight:800,color:scoreColor(strategy?.score||0)}}>{strategy?.score||"—"}</span>
          </div>
          <div style={{width:1,height:20,background:B.border}}/>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,
            color:B.textMid,padding:"6px 16px",borderRadius:4,fontSize:12,
            cursor:"pointer",fontFamily:"inherit"}}>Discard Changes</button>
          <button onClick={()=>setSection(8)} style={{background:"none",border:`1px solid ${B.darkBlue}`,
            color:B.darkBlue,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,
            cursor:"pointer",fontFamily:"inherit"}}>Save Draft</button>
          <button onClick={()=>{setActivated(true);onActivate&&onActivate({...strategy,...form,phase:"Active Project",status:"Active"});}}
            style={{background:B.green,border:"none",color:"#FFFFFF",padding:"6px 20px",
            borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            {mode==="new-closed"?"Create Closed Project →":"Activate Project →"}
          </button>
        </div>
      </div>

      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>
          Finalise all project details following contract award. Once submitted and approved by the CISO, the project moves into active execution.
        </span>
      </div>

      <SectionTimeline sections={CONTRACT_SECTIONS} section={section} setSection={setSection}/>

      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>

          {section===0&&(
            <div>
              <div style={{background:B.deepBlue,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.08em",
                  textTransform:"uppercase",marginBottom:16}}>
                  Carried Forward — Strategy & RFP Phase (Read Only)
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                  {[
                    {label:"Initiative Name", value:strategy?.name},
                    {label:"Initiative ID",   value:strategy?.id},
                    {label:"Domain",          value:strategy?.domain},
                    {label:"Owner",           value:strategy?.owner},
                    {label:"CISO Pillar",     value:strategy?.pillar||strategy?.cisoPillar},
                    {label:"Priority Score",  value:strategy?.score, color:scoreColor(strategy?.score||0)},
                    {label:"Est. Budget",     value:strategy?.budget},
                    {label:"RFP Status",      value:rfp?.rfpStatus||strategy?.status},
                  ].map((f,i)=>(
                    <div key={i} style={{background:"#FFFFFF18",borderRadius:5,padding:"10px 14px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:B.headerText,
                        letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>{f.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:f.color||"#FFFFFF"}}>{f.value||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <SLine title="RFP Scope Summary (Reference)"/>
                <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"10px 14px",
                  background:B.pageBg,borderRadius:5,border:`1px solid ${B.border}`,marginBottom:16}}>
                  {rfp?.inScope||strategy?.inScope||"—"}
                </div>
                <SLine title="RFP Milestones (Reference)"/>
                {(rfp?.milestones||strategy?.milestones||[]).length>0?(
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr><TH w="35%">Milestone</TH><TH w="20%">Target Date</TH><TH>Deliverable</TH></tr></thead>
                    <tbody>{(rfp?.milestones||strategy?.milestones||[]).map((m,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD>{m.name||"—"}</TD>
                        <TD>{m.date||m.endDate||"—"}</TD>
                        <TD>{m.deliverable||m.deliverableDesc||"—"}</TD>
                      </tr>
                    ))}</tbody>
                  </table>
                ):<div style={{fontSize:12,color:B.textMuted,fontStyle:"italic"}}>No milestones from RFP stage.</div>}
              </div>

              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,
                borderRadius:5,padding:"14px 16px",display:"flex",gap:12}}>
                <div style={{fontSize:18,color:B.darkBlue,flexShrink:0}}>→</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:B.deepBlue,marginBottom:4}}>Contracting Stage Instructions</div>
                  <div style={{fontSize:12,color:B.textMid,lineHeight:1.6}}>
                    All content from the Strategy and RFP phases is referenced above. In the sections that follow, enter the confirmed contract details, finalise the vision, scope, milestones, and deliverables in line with the awarded contract, assign the project team, and complete the risk register. Once submitted and approved by the CISO, this project moves into active execution.
                  </div>
                </div>
              </div>
            </div>
          )}

          {section===1&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Contract & Vendor Details"/>
              <div style={{background:B.greenLight,border:`1px solid ${B.green}40`,borderRadius:4,
                padding:"10px 14px",marginBottom:20,fontSize:12,color:B.green,fontWeight:600}}>
                ✓ Contract awarded — enter the confirmed vendor and contract details below.
              </div>
              <G cols={3} gap={16}>
                <div><Lbl req>Awarded Vendor Name</Lbl><Inp placeholder="e.g. Accenture Security" value={form.vendorName} onChange={v=>set("vendorName",v)}/></div>
                <div><Lbl req>Contract Reference Number</Lbl><Inp placeholder="e.g. CTR-2025-0042" value={form.contractRef} onChange={v=>set("contractRef",v)}/></div>
                <div><Lbl>Procurement Reference Number</Lbl><Inp placeholder="e.g. PO-2025-0198" value={form.procurementRef} onChange={v=>set("procurementRef",v)}/></div>
              </G>
              <div style={{height:16}}/>
              <G cols={2} gap={16}>
                <div><Lbl req>Contract Start Date</Lbl><Inp type="date" value={form.contractStart} onChange={v=>set("contractStart",v)}/></div>
                <div><Lbl req>Contract End Date</Lbl><Inp type="date" value={form.contractEnd} onChange={v=>set("contractEnd",v)}/></div>
              </G>
              <div style={{height:16}}/>
              <SLine title="Confirmed Budget"/>
              <G cols={3} gap={16}>
                <div>
                  <Lbl req>Contract Value (Confirmed)</Lbl>
                  <Inp placeholder="e.g. 1,200,000" value={form.contractValue} onChange={v=>set("contractValue",v)}/>
                  <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>USD — confirmed contract figure</div>
                </div>
                <div>
                  <Lbl>CAPEX Portion</Lbl>
                  <Inp placeholder="e.g. 800,000" value={form.capex} onChange={v=>set("capex",v)}/>
                </div>
                <div>
                  <Lbl>OPEX Portion</Lbl>
                  <Inp placeholder="e.g. 400,000" value={form.opex} onChange={v=>set("opex",v)}/>
                </div>
              </G>
              {(form.capex||form.opex)&&form.contractValue&&(
                <div style={{marginTop:8,padding:"7px 12px",borderRadius:4,fontSize:12,
                  background:Number(form.capex||0)+Number(form.opex||0)===Number(form.contractValue)?B.greenLight:B.redLight,
                  color:Number(form.capex||0)+Number(form.opex||0)===Number(form.contractValue)?B.green:B.red}}>
                  {Number(form.capex||0)+Number(form.opex||0)===Number(form.contractValue)
                    ?"✓ CAPEX + OPEX matches contract value"
                    :"⚠ CAPEX + OPEX does not match contract value"}
                </div>
              )}
            </div>
          )}

          {section===2&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Final Vision & Strategic Alignment"/>
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,
                padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
                Pre-filled from the RFP phase. Make any final adjustments to align with the awarded contract scope.
              </div>
              <G cols={2} gap={16}>
                <div><Lbl req>Problem Statement</Lbl><Txt rows={4} placeholder="Final problem statement." value={form.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
                <div><Lbl req>Vision Statement</Lbl><Txt rows={4} placeholder="Final vision statement." value={form.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
              </G>
              <div style={{height:14}}/>
              <div><Lbl req>Expected Business Outcome</Lbl><Inp placeholder="e.g. Reduce privileged access incidents by 80% within 12 months of go-live" value={form.businessOutcome} onChange={v=>set("businessOutcome",v)}/></div>

              <SLine title="Value Realization Commitments"/>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,
                borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.textMid}}>
                Define the specific, measurable value this project commits to delivering. This is the CISO's vision translated into concrete, trackable outcomes.
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr>
                  <TH w="35%">Value Committed</TH>
                  <TH w="35%">Measurement Method</TH>
                  <TH>Target Realization Date</TH>
                  <TH w="30px"/>
                </tr></thead>
                <tbody>{form.valueRealization.map((r,i)=>(
                  <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                    <TD><Inp placeholder="e.g. MFA coverage reaches 95% of all users" value={r.valueCommitted} onChange={v=>setA("valueRealization",i,"valueCommitted",v)}/></TD>
                    <TD><Inp placeholder="e.g. Monthly IAM audit report" value={r.measurementMethod} onChange={v=>setA("valueRealization",i,"measurementMethod",v)}/></TD>
                    <TD><Inp type="date" value={r.targetDate} onChange={v=>setA("valueRealization",i,"targetDate",v)}/></TD>
                    <TD>{form.valueRealization.length>1&&<DelBtn onClick={()=>rem("valueRealization",i)}/>}</TD>
                  </tr>
                ))}</tbody>
              </table>
              <AddBtn onClick={()=>add("valueRealization",{valueCommitted:"",measurementMethod:"",targetDate:""})} label="Add Value Commitment"/>
            </div>
          )}

          {section===3&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Final Scope"/>
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,
                padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
                Pre-filled from RFP. Finalise to match the awarded contract scope exactly.
              </div>
              <div><Lbl req>Final In-Scope Description</Lbl><Txt rows={4} value={form.inScope} onChange={v=>set("inScope",v)} placeholder="Final confirmed scope as per the signed contract."/></div>
              <div style={{height:14}}/>
              <Lbl>Final Exclusions</Lbl>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr><TH w="45%">Exclusion Item</TH><TH>Reason / Rationale</TH><TH w="30px"/></tr></thead>
                <tbody>{form.outOfScope.map((r,i)=>(
                  <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                    <TD><Inp placeholder="What is excluded..." value={r.item} onChange={v=>setA("outOfScope",i,"item",v)}/></TD>
                    <TD><Inp placeholder="Why it is excluded..." value={r.reason} onChange={v=>setA("outOfScope",i,"reason",v)}/></TD>
                    <TD>{form.outOfScope.length>1&&<DelBtn onClick={()=>rem("outOfScope",i)}/>}</TD>
                  </tr>
                ))}</tbody>
              </table>
              <AddBtn onClick={()=>add("outOfScope",{item:"",reason:""})} label="Add Exclusion"/>
              <div style={{height:14}}/>
              <div><Lbl>Final Assumptions</Lbl><Txt rows={2} value={form.assumptions} onChange={v=>set("assumptions",v)} placeholder="Final assumptions as agreed with the vendor."/></div>

              <SLine title="Deliverables Register"/>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,
                borderRadius:4,padding:"10px 14px",marginBottom:14,fontSize:12,color:B.textMid}}>
                Register every contractual deliverable. Assign a QA Reviewer (technical review) and an Approver (formal sign-off). Status defaults to <strong>Not Started</strong> and becomes editable in the Execution phase.
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:900}}>
                  <thead><tr>
                    <TH w="6%">ID</TH>
                    <TH w="14%">Deliverable Name</TH>
                    <TH w="18%">Description</TH>
                    <TH w="9%">Type</TH>
                    <TH w="12%">Linked Milestone</TH>
                    <TH w="10%">Due Date</TH>
                    <TH w="10%">Responsible Party</TH>
                    <TH w="9%">QA Reviewer</TH>
                    <TH w="9%">Approver</TH>
                    <TH w="30px"/>
                  </tr></thead>
                  <tbody>{form.deliverables.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{autoId("D",form.deliverables,i)}</div></TD>
                      <TD><Inp placeholder="Deliverable name..." value={d.name} onChange={v=>setA("deliverables",i,"name",v)}/></TD>
                      <TD><Inp placeholder="Brief description..." value={d.description} onChange={v=>setA("deliverables",i,"description",v)}/></TD>
                      <TD><Sel small options={DELIV_TYPES} value={d.type} onChange={v=>setA("deliverables",i,"type",v)} placeholder="Type..."/></TD>
                      <TD><Inp placeholder="Milestone name..." value={d.milestone} onChange={v=>setA("deliverables",i,"milestone",v)}/></TD>
                      <TD><Inp type="date" value={d.dueDate} onChange={v=>setA("deliverables",i,"dueDate",v)}/></TD>
                      <TD><Inp placeholder="Team / role..." value={d.responsibleParty} onChange={v=>setA("deliverables",i,"responsibleParty",v)}/></TD>
                      <TD><Inp placeholder="Reviewer..." value={d.qaReviewer} onChange={v=>setA("deliverables",i,"qaReviewer",v)}/></TD>
                      <TD><Inp placeholder="Approver..." value={d.approver} onChange={v=>setA("deliverables",i,"approver",v)}/></TD>
                      <TD><DelBtn onClick={()=>form.deliverables.length>1&&rem("deliverables",i)}/></TD>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <AddBtn onClick={()=>add("deliverables",{id:`D-${String(form.deliverables.length+1).padStart(3,"0")}`,name:"",description:"",type:"",milestone:"",dueDate:"",responsibleParty:"",qaReviewer:"",approver:"",status:"Not Started"})} label="Add Deliverable"/>
            </div>
          )}

          {section===4&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Confirmed Project Milestones"/>
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,
                padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
                Pre-filled from RFP. Confirm start and end dates for each milestone as per the signed contract. The Gantt chart below updates automatically.
              </div>
              <div style={{overflowX:"auto",marginBottom:8}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:800}}>
                  <thead><tr>
                    <TH w="22%">Milestone Name</TH>
                    <TH w="13%">Start Date</TH>
                    <TH w="13%">End Date</TH>
                    <TH w="8%">Weight %</TH>
                    <TH w="22%">Linked Deliverables</TH>
                    <TH>Status</TH>
                    <TH w="30px"/>
                  </tr></thead>
                  <tbody>{form.milestones.map((m,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp placeholder="Milestone name..." value={m.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                      <TD><Inp type="date" value={m.startDate} onChange={v=>setA("milestones",i,"startDate",v)}/></TD>
                      <TD><Inp type="date" value={m.endDate} onChange={v=>setA("milestones",i,"endDate",v)}/></TD>
                      <TD><Inp placeholder="e.g. 25" value={m.weight} onChange={v=>setA("milestones",i,"weight",v)}/></TD>
                      <TD><Inp placeholder="D-001, D-002..." value={m.linkedDeliverables} onChange={v=>setA("milestones",i,"linkedDeliverables",v)}/></TD>
                      <TD>
                        <Sel small options={MS_STATUSES} value={m.status} onChange={v=>setA("milestones",i,"status",v)} placeholder="Status..."/>
                      </TD>
                      <TD><DelBtn onClick={()=>form.milestones.length>1&&rem("milestones",i)}/></TD>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <AddBtn onClick={()=>add("milestones",{name:"",startDate:"",endDate:"",weight:"",linkedDeliverables:"",status:"Not Started"})} label="Add Milestone"/>

              <SLine title="Project Gantt Chart"/>
              <GanttChart milestones={form.milestones}/>
            </div>
          )}

          {section===5&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Project Team"/>
              <G cols={3} gap={16}>
                <div>
                  <Lbl req>Assigned Project Manager</Lbl>
                  <Inp placeholder="Full name or user search..." value={form.pm} onChange={v=>set("pm",v)}/>
                  <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>Mandatory — responsible for weekly updates</div>
                </div>
                <div><Lbl req>PM Email / Contact</Lbl><Inp placeholder="e.g. pm@organisation.com" value={form.pmEmail} onChange={v=>set("pmEmail",v)}/></div>
                <div><Lbl>Escalation Contact</Lbl><Inp placeholder="Senior sponsor or domain lead..." value={form.escalationContact} onChange={v=>set("escalationContact",v)}/></div>
              </G>

              <SLine title="Core Project Team"/>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr>
                  <TH w="25%">Full Name</TH>
                  <TH w="25%">Role</TH>
                  <TH w="25%">Organisation</TH>
                  <TH>% Allocation</TH>
                  <TH w="30px"/>
                </tr></thead>
                <tbody>{form.team.map((r,i)=>(
                  <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                    <TD><Inp placeholder="Full name..." value={r.name} onChange={v=>setA("team",i,"name",v)}/></TD>
                    <TD><Inp placeholder="e.g. Technical Lead" value={r.role} onChange={v=>setA("team",i,"role",v)}/></TD>
                    <TD><Inp placeholder="e.g. Vendor / Internal" value={r.organisation} onChange={v=>setA("team",i,"organisation",v)}/></TD>
                    <TD><Inp placeholder="e.g. 80%" value={r.allocation} onChange={v=>setA("team",i,"allocation",v)}/></TD>
                    <TD>{form.team.length>1&&<DelBtn onClick={()=>rem("team",i)}/>}</TD>
                  </tr>
                ))}</tbody>
              </table>
              <AddBtn onClick={()=>add("team",{name:"",role:"",organisation:"",allocation:""})} label="Add Team Member"/>
            </div>
          )}

          {section===6&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Risk Register"/>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,
                borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.textMid}}>
                Risk Rating is auto-calculated from Likelihood × Impact. You may override the rating with a comment if needed.
              </div>

              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {["Critical","High","Medium","Low"].map((lvl,i)=>(
                  <CBadge key={i} color={ratingColor(lvl)} bg={ratingBg(lvl)}>{lvl}</CBadge>
                ))}
                <span style={{fontSize:11,color:B.textMuted,alignSelf:"center",marginLeft:4}}>Rating matrix: H×H=Critical · H×M or M×H=High · M×M=Medium · any Low=Low</span>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {form.risks.map((r,i)=>{
                  const autoRating = r.likelihood&&r.impact ? RISK_MATRIX[`${r.likelihood}-${r.impact}`] : null;
                  const finalRating = r.overrideRating || autoRating || "—";
                  return(
                    <div key={i} style={{border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden",
                      borderLeft:`4px solid ${autoRating?ratingColor(finalRating):B.border}`}}>
                      <div style={{background:B.pageBg,padding:"10px 16px",display:"flex",
                        alignItems:"center",gap:12,borderBottom:`1px solid ${B.borderLight}`}}>
                        <div style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:B.darkBlue}}>
                          {autoId("R",form.risks,i)}
                        </div>
                        <div style={{flex:1}}/>
                        {finalRating!=="—"&&(
                          <CBadge color={ratingColor(finalRating)} bg={ratingBg(finalRating)}>
                            {r.overrideRating?"OVERRIDE: ":""}{finalRating.toUpperCase()}
                          </CBadge>
                        )}
                        <CBadge color={statusColor(r.status||"Open")} bg={statusBg(r.status||"Open")}>{(r.status||"Open").toUpperCase()}</CBadge>
                        {form.risks.length>1&&<DelBtn onClick={()=>rem("risks",i)}/>}
                      </div>
                      <div style={{padding:"14px 16px"}}>
                        <G cols={3} gap={12}>
                          <div><Lbl req>Category</Lbl><Sel options={RISK_CATS} value={r.category} onChange={v=>setA("risks",i,"category",v)} placeholder="Select..."/></div>
                          <div><Lbl req>Likelihood</Lbl><Sel options={RISK_LEVELS} value={r.likelihood} onChange={v=>setA("risks",i,"likelihood",v)} placeholder="Select..."/></div>
                          <div><Lbl req>Impact</Lbl><Sel options={RISK_LEVELS} value={r.impact} onChange={v=>setA("risks",i,"impact",v)} placeholder="Select..."/></div>
                        </G>
                        <div style={{height:10}}/>
                        <div><Lbl req>Risk Description</Lbl><Txt rows={2} placeholder="Describe the risk clearly..." value={r.description} onChange={v=>setA("risks",i,"description",v)}/></div>
                        <div style={{height:10}}/>
                        <G cols={2} gap={12}>
                          <div><Lbl>Mitigation Plan</Lbl><Txt rows={2} placeholder="How will this risk be mitigated or managed?" value={r.mitigation} onChange={v=>setA("risks",i,"mitigation",v)}/></div>
                          <div>
                            <G cols={2} gap={10}>
                              <div><Lbl>Risk Owner</Lbl><Inp placeholder="Name or role..." value={r.owner} onChange={v=>setA("risks",i,"owner",v)}/></div>
                              <div><Lbl>Status</Lbl><Sel options={RISK_STATUSES} value={r.status} onChange={v=>setA("risks",i,"status",v)} placeholder="Status..."/></div>
                            </G>
                            <div style={{height:10}}/>
                            <div><Lbl>Override Rating</Lbl>
                              <Sel options={["Critical","High","Medium","Low"]} value={r.overrideRating} onChange={v=>setA("risks",i,"overrideRating",v)} placeholder="Override auto-rating..."/>
                            </div>
                            {r.overrideRating&&(
                              <div style={{marginTop:8}}>
                                <Lbl req>Override Comment</Lbl>
                                <Inp placeholder="Reason for overriding the calculated rating..." value={r.overrideComment} onChange={v=>setA("risks",i,"overrideComment",v)}/>
                              </div>
                            )}
                          </div>
                        </G>
                      </div>
                    </div>
                  );
                })}
              </div>
              <AddBtn onClick={()=>add("risks",{id:`R-${String(form.risks.length+1).padStart(3,"0")}`,category:"",description:"",likelihood:"",impact:"",overrideRating:"",overrideComment:"",mitigation:"",owner:"",status:"Open"})} label="Add Risk"/>
            </div>
          )}

          {section===7&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Project Dependencies"/>
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,
                padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>
                Pre-filled from the Strategy phase dependency flags. Extend and update as required now that the project is confirmed.
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:800}}>
                  <thead><tr>
                    <TH w="18%">Linked Initiative</TH>
                    <TH w="20%">Nature of Dependency</TH>
                    <TH w="20%">Risk if Delayed</TH>
                    <TH w="10%">Severity</TH>
                    <TH w="14%">Owner</TH>
                    <TH>Status of Linked Initiative</TH>
                    <TH w="30px"/>
                  </tr></thead>
                  <tbody>{form.dependencies.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp placeholder="Initiative name..." value={d.initiative} onChange={v=>setA("dependencies",i,"initiative",v)}/></TD>
                      <TD><Inp placeholder="e.g. Shared data pipeline" value={d.nature} onChange={v=>setA("dependencies",i,"nature",v)}/></TD>
                      <TD><Inp placeholder="e.g. Scope gap in Phase 2" value={d.riskIfDelayed} onChange={v=>setA("dependencies",i,"riskIfDelayed",v)}/></TD>
                      <TD>
                        <select value={d.severity||""} onChange={e=>setA("dependencies",i,"severity",e.target.value)}
                          style={{width:"100%",border:`1px solid ${B.border}`,borderRadius:4,padding:"7px 8px",fontSize:12,
                            background:d.severity==="High"?B.redLight:d.severity==="Medium"?B.amberLight:d.severity==="Low"?B.greenLight:B.inputBg,
                            color:d.severity==="High"?B.red:d.severity==="Medium"?B.amber:d.severity==="Low"?B.green:B.textMuted,
                            fontFamily:"inherit",fontWeight:d.severity?700:400,outline:"none",appearance:"none",cursor:"pointer"}}>
                          <option value="">Select...</option>
                          {["High","Medium","Low"].map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                      </TD>
                      <TD><Inp placeholder="Owner name..." value={d.owner} onChange={v=>setA("dependencies",i,"owner",v)}/></TD>
                      <TD><Inp placeholder="e.g. In Strategy Phase, Active" value={d.linkedStatus} onChange={v=>setA("dependencies",i,"linkedStatus",v)}/></TD>
                      <TD>{form.dependencies.length>0&&<DelBtn onClick={()=>rem("dependencies",i)}/>}</TD>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <AddBtn onClick={()=>add("dependencies",{initiative:"",nature:"",riskIfDelayed:"",severity:"",owner:"",linkedStatus:""})} label="Add Dependency"/>
            </div>
          )}

          {section===8&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
                {kpiSummary.map((item,i)=>(
                  <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,
                    borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${item.color||B.border}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,
                      letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                    <div style={{fontSize:typeof item.value==="number"?28:13,fontWeight:700,
                      color:item.color||B.textDark,lineHeight:1.3}}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <SLine title="Activation Readiness Checklist"/>
                {[
                  {label:"Contract details entered",   done:!!(form.vendorName&&form.contractRef&&form.contractValue)},
                  {label:"Vision & value realization defined", done:!!(form.visionStatement&&form.valueRealization[0]?.valueCommitted)},
                  {label:"Deliverables register complete", done:form.deliverables.length>0&&form.deliverables[0].name!==""},
                  {label:"Milestones confirmed with dates", done:form.milestones.length>0&&form.milestones[0].startDate!==""},
                  {label:"Project Manager assigned",    done:!!form.pm},
                  {label:"At least one risk identified",done:form.risks.length>0&&form.risks[0].description!==""},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",
                    borderBottom:`1px solid ${B.borderLight}`}}>
                    <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,
                      background:item.done?B.green:B.pageBg,
                      border:`2px solid ${item.done?B.green:B.border}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#FFFFFF",fontSize:12,fontWeight:700}}>
                      {item.done?"✓":""}
                    </div>
                    <div style={{fontSize:13,color:item.done?B.textDark:B.textMuted,
                      fontWeight:item.done?600:400}}>{item.label}</div>
                    {!item.done&&<span style={{fontSize:11,color:B.amber,marginLeft:"auto"}}>Incomplete</span>}
                  </div>
                ))}
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Automated Reporting Settings</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                  <CBadge color={B.amber} bg={B.amberLight}>COMING SOON</CBadge>
                </div>
                <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.textMid}}>
                  Configure email distribution for weekly project reports. Fields below capture the configuration; automated emails will be enabled in a future release.
                </div>
                <G cols={3} gap={16}>
                  <div><Lbl req>Report Cadence</Lbl><Sel options={REPORT_CADENCES} value={form.reportCadence} onChange={v=>set("reportCadence",v)} placeholder="Select cadence..."/></div>
                  <div><Lbl req>Report Day</Lbl><Sel options={REPORT_DAYS} value={form.reportDay} onChange={v=>set("reportDay",v)} placeholder="Day of week..."/></div>
                  <div><Lbl req>First Report Date</Lbl><Inp type="date" value={form.firstReportDate} onChange={v=>set("firstReportDate",v)}/></div>
                </G>
                <div style={{height:16}}/>
                <div>
                  <Lbl req>Default Report Format Preference</Lbl>
                  <Sel options={REPORT_FORMATS} value={form.reportFormat} onChange={v=>set("reportFormat",v)} placeholder="Select format..."/>
                  <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>Individual recipients can override this in their row below</div>
                </div>
                <SLine title="Report Recipients"/>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                  <thead><tr><TH w="30%">Recipient Name</TH><TH w="35%">Email Address</TH><TH>Role</TH><TH w="30px"/></tr></thead>
                  <tbody>{form.reportRecipients.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp placeholder="Full name..." value={r.name} onChange={v=>setA("reportRecipients",i,"name",v)}/></TD>
                      <TD><Inp type="email" placeholder="email@organisation.com" value={r.email} onChange={v=>setA("reportRecipients",i,"email",v)}/></TD>
                      <TD><Sel small options={REPORT_ROLES} value={r.role} onChange={v=>setA("reportRecipients",i,"role",v)} placeholder="Role..."/></TD>
                      <TD>{form.reportRecipients.length>1&&<DelBtn onClick={()=>rem("reportRecipients",i)}/>}</TD>
                    </tr>
                  ))}</tbody>
                </table>
                <AddBtn onClick={()=>add("reportRecipients",{name:"",email:"",role:""})} label="Add Recipient"/>
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,
                padding:"20px 24px",marginBottom:16}}>
                <SLine title="Submission Note to CISO (optional)"/>
                <Txt rows={3} placeholder="Add any context or notes for the CISO before project activation..." value={form.note} onChange={v=>set("note",v)}/>
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:20}}>
                <SLine title="Approval & Activation Workflow"/>
                <div style={{display:"flex",alignItems:"stretch",gap:0}}>
                  {[
                    {role:"Domain Lead / PM",    action:"Completes all contracting details & submits",  status:"SUBMITTED", color:B.darkBlue},
                    {role:"CISO",                action:"Reviews & approves — project formally activated", status:"PENDING",   color:B.textMuted},
                    {role:"Project Execution",   action:"PM weekly updates become available immediately", status:"ON ACTIVATION", color:B.green},
                  ].map((step,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
                      <div style={{flex:1,background:B.pageBg,border:`1px solid ${step.color}40`,
                        borderLeft:`4px solid ${step.color}`,borderRadius:5,padding:"14px 16px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:step.color,
                          letterSpacing:"0.07em",marginBottom:4}}>{step.status}</div>
                        <div style={{fontSize:13,fontWeight:700,color:B.textDark,marginBottom:3}}>{step.role}</div>
                        <div style={{fontSize:11,color:B.textMuted}}>{step.action}</div>
                      </div>
                      {i<2&&<div style={{color:B.lightBlue,fontSize:22,margin:"0 8px",flexShrink:0}}>→</div>}
                    </div>
                  ))}
                </div>
              </div>

              {activated?(
                <div style={{background:B.greenLight,border:`2px solid ${B.green}`,borderRadius:6,
                  padding:"20px 24px",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:8}}>✓</div>
                  <div style={{fontSize:16,fontWeight:700,color:B.green,marginBottom:4}}>Project Activated</div>
                  <div style={{fontSize:13,color:B.textMid}}>This project has moved into the Execution phase. The PM can now submit weekly updates.</div>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
                  <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,
                    color:B.textMid,padding:"10px 24px",borderRadius:5,fontSize:13,
                    cursor:"pointer",fontFamily:"inherit"}}>Save & Return to Portfolio</button>
                  <button onClick={()=>{setActivated(true);onActivate&&onActivate({...strategy,...form,phase:"Active Project",status:"Active"});}}
                    style={{background:B.green,border:"none",color:"#FFFFFF",fontWeight:700,
                    fontSize:14,padding:"12px 36px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",
                    boxShadow:`0 4px 16px ${B.green}40`}}>
                    {mode==="new-closed"?"Submit & Create Closed Project →":"Submit for CISO Approval & Activate Project →"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
            {section>0
              ?<button onClick={()=>setSection(s=>s-1)} style={{background:B.cardBg,border:`1px solid ${B.border}`,
                  color:B.textMid,padding:"9px 22px",borderRadius:4,fontSize:13,fontWeight:600,
                  cursor:"pointer",fontFamily:"inherit"}}>← Previous</button>
              :<div/>}
            {section<CONTRACT_SECTIONS.length-1&&(
              <button onClick={()=>setSection(s=>s+1)} style={{background:B.darkBlue,border:"none",
                color:"#FFFFFF",padding:"9px 24px",borderRadius:4,fontSize:13,fontWeight:700,
                cursor:"pointer",fontFamily:"inherit"}}>
                Next: {CONTRACT_SECTIONS[section+1].label} →
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ══ WEEKLY UPDATE PAGE — HELPERS & CONSTANTS ════════════════════════════════
function getWeekInfo(date = new Date()) {
  const d = new Date(date);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const tmp = new Date(d.getFullYear(),0,1);
  const week = Math.ceil((((d - tmp) / 86400000) + tmp.getDay() + 1) / 7);
  const fmt = (x) => x.toLocaleDateString("en-GB",{day:"2-digit",month:"short"});
  return {
    weekNumber: week,
    year: d.getFullYear(),
    label: `Week ${week} · ${fmt(monday)} – ${fmt(sunday)} ${sunday.getFullYear()}`,
    shortLabel: `W${week}`,
    monday, sunday,
  };
}

function autoStatus(projectPct, expectedPct, risks) {
  const openCritical = risks.filter(r => r.status === "Open" && (r.overrideRating || RISK_MATRIX[`${r.likelihood}-${r.impact}`]) === "Critical").length;
  const openHigh     = risks.filter(r => r.status === "Open" && (r.overrideRating || RISK_MATRIX[`${r.likelihood}-${r.impact}`]) === "High").length;
  const escalated    = risks.filter(r => r.status === "Escalated to Issue").length;
  const gap = expectedPct - projectPct;
  if (openCritical > 0 || escalated > 0 || gap > 10) return "Delayed";
  if (openHigh > 0 || gap > 0)                       return "At Risk";
  return "On Track";
}

function expectedProgress(startDate, endDate, asOf = new Date()) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate), e = new Date(endDate);
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  const total = e - s;
  const elapsed = Math.max(0, Math.min(asOf - s, total));
  return Math.round((elapsed / total) * 100);
}

const WU_SECTIONS = [
  {id:"header",     label:"Week Header"},
  {id:"progress",   label:"Progress Update"},
  {id:"narrative",  label:"Weekly Narrative"},
  {id:"risks",      label:"Risks & Issues"},
  {id:"actions",    label:"Dependencies & Actions"},
  {id:"submit",     label:"Submit"},
];

const MOCK_PROJECT = {
  id:"CPM-2024-011",
  name:"PAM Solution Deployment",
  domain:"Identity & Access Management",
  pm:"Rania Yousef",
  pmEmail:"rania.yousef@org.com",
  contractStart:"2025-01-15",
  contractEnd:"2025-12-30",
  contractValue:"850000",
  deliverables:[
    {id:"D-001",name:"As-Is Architecture Report",     milestone:"Discovery & Assessment", dueDate:"2025-03-15", qaReviewer:"Ahmed Rashid",   approver:"CISO"},
    {id:"D-002",name:"Gap Analysis Document",          milestone:"Discovery & Assessment", dueDate:"2025-03-30", qaReviewer:"Ahmed Rashid",   approver:"CISO"},
    {id:"D-003",name:"PAM Target Architecture",        milestone:"Design Phase",            dueDate:"2025-05-15", qaReviewer:"Sarah Al-Mansouri", approver:"Domain Lead"},
    {id:"D-004",name:"Implementation Plan",            milestone:"Design Phase",            dueDate:"2025-06-01", qaReviewer:"Sarah Al-Mansouri", approver:"Domain Lead"},
    {id:"D-005",name:"PAM Solution Deployed (Pilot)",  milestone:"Pilot Deployment",        dueDate:"2025-08-15", qaReviewer:"Omar Al-Hashimi", approver:"CISO"},
    {id:"D-006",name:"UAT Results & Sign-off",         milestone:"Pilot Deployment",        dueDate:"2025-09-30", qaReviewer:"Omar Al-Hashimi", approver:"CISO"},
    {id:"D-007",name:"Full Production Rollout",        milestone:"Production Rollout",      dueDate:"2025-11-30", qaReviewer:"Omar Al-Hashimi", approver:"CISO"},
    {id:"D-008",name:"Handover & Training Materials",  milestone:"Production Rollout",      dueDate:"2025-12-15", qaReviewer:"Sarah Al-Mansouri", approver:"Domain Lead"},
  ],
  milestones:[
    {name:"Discovery & Assessment", weight:15, startDate:"2025-01-15", endDate:"2025-03-30"},
    {name:"Design Phase",            weight:20, startDate:"2025-04-01", endDate:"2025-06-01"},
    {name:"Pilot Deployment",        weight:30, startDate:"2025-06-15", endDate:"2025-09-30"},
    {name:"Production Rollout",      weight:35, startDate:"2025-10-01", endDate:"2025-12-15"},
  ],
  initialRisks:[
    {id:"R-001",category:"Vendor",      description:"Vendor resource availability during Q3 holiday season may delay deployment",  likelihood:"Medium",impact:"High",  mitigation:"Resource plan agreed in advance; backup engineers identified", owner:"Rania Yousef",  status:"Open",       overrideRating:"",overrideComment:""},
    {id:"R-002",category:"Technical",   description:"Legacy AD integration may require custom connectors not in scope",            likelihood:"Medium",impact:"Medium",mitigation:"Technical workshop scheduled with vendor for week 4",       owner:"Ahmed Rashid",  status:"Mitigated",  overrideRating:"",overrideComment:""},
    {id:"R-003",category:"Operational", description:"Production cutover may require extended maintenance window",                   likelihood:"Low",   impact:"High",  mitigation:"Cutover plan to be reviewed with operations team by week 20",owner:"Omar Al-Hashimi",status:"Open",       overrideRating:"",overrideComment:""},
  ],
  initialDependencies:[
    {initiative:"Network Segmentation Project", nature:"Shared directory services",       riskIfDelayed:"PAM rollout cannot complete without network controls", severity:"High",   owner:"Yusuf Al-Farsi", linkedStatus:"In Progress"},
  ],
};

const MOCK_HISTORY = [
  { weekNumber:1, year:2025, label:"Week 1 · 13 Jan – 19 Jan",  status:"On Track", projectPct:5,  narrative:"Project kicked off. Vendor onboarding completed and team mobilised. Initial discovery workshops scheduled with all in-scope business units." },
  { weekNumber:2, year:2025, label:"Week 2 · 20 Jan – 26 Jan",  status:"On Track", projectPct:12, narrative:"Discovery workshops underway. Stakeholder interviews completed for 60% of in-scope teams. As-Is architecture report drafting started." },
  { weekNumber:3, year:2025, label:"Week 3 · 27 Jan – 02 Feb",  status:"On Track", projectPct:22, narrative:"As-Is architecture report submitted for QA review. Initial gap analysis findings shared with the Domain Lead. No major risks identified." },
  { weekNumber:4, year:2025, label:"Week 4 · 03 Feb – 09 Feb",  status:"At Risk",  projectPct:28, narrative:"Vendor flagged a potential resource constraint for Phase 2. Mitigation plan being drafted. Gap analysis document 70% complete." },
  { weekNumber:5, year:2025, label:"Week 5 · 10 Feb – 16 Feb",  status:"On Track", projectPct:38, narrative:"Vendor resource issue resolved with additional engineers committed. Gap analysis document submitted and approved. Target architecture design started." },
  { weekNumber:6, year:2025, label:"Week 6 · 17 Feb – 23 Feb",  status:"On Track", projectPct:45, narrative:"Target architecture design 50% complete. Integration touchpoints with Network Segmentation project mapped. CISO review scheduled for next week." },
];

const ProjectGauge = ({pct,expected,status}) => {
  const sc = statusColor(status);
  const gap = expected - pct;
  return(
    <div style={{background:B.deepBlue,borderRadius:8,padding:"24px 28px",color:"#FFFFFF"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:32}}>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Project Completion</div>
          <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:14}}>
            <div style={{fontSize:64,fontWeight:800,color:sc,lineHeight:1}}>{pct}<span style={{fontSize:32,marginLeft:4}}>%</span></div>
            <div>
              <CBadge color={sc} bg={sc+"30"}>{status.toUpperCase()}</CBadge>
              <div style={{fontSize:11,color:B.headerText+"AA",marginTop:6}}>
                Expected at this point: <strong style={{color:"#FFFFFF"}}>{expected}%</strong>
                {gap!==0&&<span style={{color:gap>0?B.red:B.green,marginLeft:8}}>{gap>0?`▼ ${gap}% behind`:`▲ ${-gap}% ahead`}</span>}
              </div>
            </div>
          </div>
          <div style={{position:"relative",height:14,background:"#FFFFFF15",borderRadius:7,overflow:"hidden"}}>
            <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:sc,borderRadius:7,transition:"width 0.5s"}}/>
            {expected>0&&expected<=100&&(
              <div style={{position:"absolute",left:`${expected}%`,top:-3,bottom:-3,width:2,background:"#FFFFFF",boxShadow:"0 0 0 1px rgba(0,0,0,0.2)"}}/>
            )}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:B.headerText+"80",marginTop:4}}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function PageWeeklyUpdate({project=MOCK_PROJECT,onBack,onSubmit,onExit}) {
  const [view,setView]       = useState("current");
  const [historyWeek,setHistoryWeek] = useState(null);
  const [section,setSection] = useState(0);
  const [submitted,setSubmitted] = useState(false);

  const week = useMemo(()=>getWeekInfo(),[]);
  const expectedPct = useMemo(()=>expectedProgress(project.contractStart,project.contractEnd),[project]);

  const [form,setForm] = useState(()=>({
    weekLabel: week.label,
    submissionDate: new Date().toISOString().split("T")[0],
    deliverables: project.deliverables.map(d => ({
      ...d,
      previousPct: 0,
      thisWeekPct: 0,
      status: "Not Started",
      notes: "",
    })),
    completedNarrative:"",
    plannedNarrative:"",
    decisionsNeeded:"",
    risks: project.initialRisks.map(r => ({...r,issueDescription:"",issueOwner:"",issueTargetDate:""})),
    dependencies: project.initialDependencies.map(d => ({...d,weekUpdate:""})),
    actions:[],
    statusOverride:"",
    statusOverrideComment:"",
  }));

  const set  = (k,v)         => setForm(f => ({...f,[k]:v}));
  const setA = (k,i,f2,v)   => setForm(f => {const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)         => setForm(f => ({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)         => setForm(f => ({...f,[k]:f[k].filter((_,j)=>j!==i)}));

  const milestoneSummary = useMemo(()=>{
    return project.milestones.map(ms => {
      const linked = form.deliverables.filter(d => d.milestone === ms.name);
      const totalProgress = linked.reduce((sum,d) => sum + Number(d.thisWeekPct||0), 0);
      const pct = linked.length>0 ? Math.round(totalProgress/linked.length) : 0;
      const allCompleted = linked.length>0 && linked.every(d => Number(d.thisWeekPct)>=100);
      const anyStarted   = linked.some(d => Number(d.thisWeekPct)>0);
      const status = allCompleted ? "Completed" : anyStarted ? "In Progress" : "Not Started";
      const expected = expectedProgress(ms.startDate, ms.endDate);
      return {...ms, deliverableCount:linked.length, pct, status, expected};
    });
  },[form.deliverables,project.milestones]);

  const projectPct = useMemo(()=>{
    const totalWeight = milestoneSummary.reduce((s,m)=>s+Number(m.weight||0),0);
    if(totalWeight===0) return 0;
    const weighted = milestoneSummary.reduce((s,m)=>s+(Number(m.weight||0)*m.pct),0);
    return Math.round(weighted/totalWeight);
  },[milestoneSummary]);

  const derivedStatus = useMemo(()=>autoStatus(projectPct,expectedPct,form.risks),[projectPct,expectedPct,form.risks]);
  const finalStatus   = form.statusOverride || derivedStatus;

  const openRisks      = form.risks.filter(r=>r.status==="Open").length;
  const escalatedIssues= form.risks.filter(r=>r.status==="Escalated to Issue").length;
  const openActions    = form.actions.filter(a=>a.status==="Open"||a.status==="In Progress"||a.status==="Blocked").length;
  const deliverablesCompletedThisWeek = form.deliverables.filter(d => Number(d.thisWeekPct)>=100 && Number(d.previousPct)<100).length;

  if(view==="history" && historyWeek){
    return(
      <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:B.deepBlue,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:24}}>
            {onExit && <button onClick={onExit} title="Back to Suite" style={{background:"#FFFFFF20",border:"1px solid #FFFFFF40",color:"#FFFFFF",borderRadius:4,padding:"3px 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⊞ Suite</button>}
            <div style={{color:"#FFFFFF",fontWeight:800,fontSize:15,letterSpacing:"0.14em"}}>CPM</div>
            <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
            <div style={{color:B.headerText,fontSize:12}}>Weekly Update — Historical Record</div>
            <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
            <div style={{color:"#FFFFFF",fontSize:12,fontWeight:600}}>{historyWeek.label} · {project.name}</div>
          </div>
          <CBadge color={statusColor(historyWeek.status)} bg={statusColor(historyWeek.status)+"40"}>{historyWeek.status.toUpperCase()} · READ ONLY</CBadge>
        </div>
        <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"10px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>{setHistoryWeek(null);setView("current");}} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Current Week</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
              <SLine title={`${historyWeek.label} — Snapshot`}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                <div style={{background:B.pageBg,borderRadius:5,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>Project Status</div>
                  <CBadge color={statusColor(historyWeek.status)} bg={statusBg(historyWeek.status)}>{historyWeek.status.toUpperCase()}</CBadge>
                </div>
                <div style={{background:B.pageBg,borderRadius:5,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>Project %</div>
                  <div style={{fontSize:22,fontWeight:800,color:statusColor(historyWeek.status)}}>{historyWeek.projectPct}%</div>
                </div>
              </div>
              <SLine title="Weekly Narrative"/>
              <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"10px 14px",background:B.pageBg,borderRadius:5,border:`1px solid ${B.border}`}}>{historyWeek.narrative}</div>
              <div style={{marginTop:20,fontSize:12,color:B.textMuted,fontStyle:"italic",textAlign:"center"}}>This is a summary of the historical record. Full historical data would render here in the production system.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>

      <div style={{background:B.deepBlue,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          {onExit && <button onClick={onExit} title="Back to Suite" style={{background:"#FFFFFF20",border:"1px solid #FFFFFF40",color:"#FFFFFF",borderRadius:4,padding:"3px 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⊞ Suite</button>}
          <div style={{color:"#FFFFFF",fontWeight:800,fontSize:15,letterSpacing:"0.14em"}}>CPM</div>
          <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
          <div style={{color:B.headerText,fontSize:12}}>Weekly Project Update</div>
          <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
          <div style={{color:"#FFFFFF",fontSize:12,fontWeight:600}}>{project.name}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <CBadge color={statusColor(finalStatus)} bg={statusColor(finalStatus)+"30"}>{finalStatus.toUpperCase()}</CBadge>
          <CBadge color={B.midBlue} bg={B.midBlue+"30"}>{week.shortLabel} · {week.year}</CBadge>
        </div>
      </div>

      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginRight:4}}>History:</div>
          {MOCK_HISTORY.map(h=>(
            <button key={h.weekNumber} onClick={()=>{setHistoryWeek(h);setView("history");}} style={{padding:"5px 12px",borderRadius:14,border:`1px solid ${statusColor(h.status)}40`,background:statusBg(h.status),color:statusColor(h.status),fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
              {`W${h.weekNumber}`}
              <span style={{fontSize:10,opacity:0.8}}>{h.status==="On Track"?"✓":h.status==="At Risk"?"⚠":"✕"}</span>
            </button>
          ))}
          <div style={{width:1,height:20,background:B.border,margin:"0 6px"}}/>
          <CBadge color={B.green} bg={B.greenLight}>CURRENT: {week.shortLabel}</CBadge>
        </div>
      </div>

      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>
          {week.label} · PM: <strong style={{color:B.textDark}}>{project.pm}</strong> · Submission cadence: Weekly, due by Monday 09:00
        </span>
      </div>

      <SectionTimeline sections={WU_SECTIONS} section={section} setSection={setSection}/>

      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>

          {section===0&&(
            <div>
              <div style={{marginBottom:20}}>
                <ProjectGauge pct={projectPct} expected={expectedPct} status={finalStatus}/>
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
                <SLine title="Week Identification"/>
                <G cols={3} gap={16}>
                  <div><Lbl>Week</Lbl>
                    <div style={{fontSize:14,fontWeight:700,color:B.textDark,padding:"8px 0"}}>{week.label}</div>
                  </div>
                  <div><Lbl>Project</Lbl>
                    <div style={{fontSize:14,fontWeight:700,color:B.textDark,padding:"8px 0"}}>{project.name}</div>
                    <div style={{fontSize:11,color:B.textMuted,fontFamily:"monospace"}}>{project.id}</div>
                  </div>
                  <div><Lbl>Project Manager</Lbl>
                    <div style={{fontSize:14,fontWeight:700,color:B.textDark,padding:"8px 0"}}>{project.pm}</div>
                    <div style={{fontSize:11,color:B.textMuted}}>{project.pmEmail}</div>
                  </div>
                </G>

                <SLine title="Overall Project Status"/>
                <div style={{background:B.pageBg,border:`1px solid ${B.border}`,borderRadius:5,padding:"16px 18px",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>Auto-derived Status</div>
                      <CBadge color={statusColor(derivedStatus)} bg={statusBg(derivedStatus)}>{derivedStatus.toUpperCase()}</CBadge>
                      <div style={{fontSize:11,color:B.textMuted,marginTop:8,lineHeight:1.5}}>
                        Based on: Project {projectPct}% vs expected {expectedPct}% · Open critical risks: {form.risks.filter(r=>r.status==="Open"&&(r.overrideRating||RISK_MATRIX[`${r.likelihood}-${r.impact}`])==="Critical").length} · Escalated issues: {escalatedIssues}
                      </div>
                    </div>
                    <div style={{width:1,height:48,background:B.border}}/>
                    <div style={{flex:1}}>
                      <Lbl>PM Override (optional)</Lbl>
                      <Sel options={OVERRIDE_STATUS} value={form.statusOverride} onChange={v=>set("statusOverride",v)} placeholder="Use auto-derived..."/>
                    </div>
                  </div>
                  {form.statusOverride&&(
                    <div style={{marginTop:14,padding:"12px 14px",background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:5}}>
                      <Lbl req>Justification for Override</Lbl>
                      <Txt rows={2} placeholder="Explain why the status differs from the auto-derived value..." value={form.statusOverrideComment} onChange={v=>set("statusOverrideComment",v)}/>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {section===1&&(
            <div>
              <div style={{marginBottom:16}}>
                <ProjectGauge pct={projectPct} expected={expectedPct} status={finalStatus}/>
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title="Milestones — Auto-Calculated Completion"/>
                <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:14,fontSize:12,color:B.textMid}}>
                  Milestone completion is calculated as the average of its linked deliverables' progress. Project % is the weighted average of all milestones by their weight.
                </div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>
                    <TH w="28%">Milestone</TH>
                    <TH w="10%">Weight</TH>
                    <TH w="10%">Deliverables</TH>
                    <TH w="22%">Completion</TH>
                    <TH w="14%">Status</TH>
                    <TH>Expected vs Actual</TH>
                  </tr></thead>
                  <tbody>{milestoneSummary.map((m,i)=>{
                    const onTrack = m.pct >= m.expected;
                    return(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD><div style={{fontWeight:600}}>{m.name}</div></TD>
                        <TD><div style={{fontWeight:700,color:B.darkBlue}}>{m.weight}%</div></TD>
                        <TD>{m.deliverableCount}</TD>
                        <TD>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontSize:14,fontWeight:800,color:onTrack?B.green:B.amber,minWidth:40}}>{m.pct}%</div>
                            <div style={{flex:1}}><ProgressBar pct={m.pct} color={onTrack?B.green:B.amber}/></div>
                          </div>
                        </TD>
                        <TD><CBadge color={statusColor(m.status)} bg={statusBg(m.status)}>{m.status.toUpperCase()}</CBadge></TD>
                        <TD>
                          <span style={{fontSize:11,color:B.textMuted}}>
                            Expected {m.expected}% · {m.pct>=m.expected?<span style={{color:B.green,fontWeight:700}}>+{m.pct-m.expected}%</span>:<span style={{color:B.red,fontWeight:700}}>{m.pct-m.expected}%</span>}
                          </span>
                        </TD>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
                <SLine title="Deliverables — Update Progress for This Week"/>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
                    <thead><tr>
                      <TH w="7%">ID</TH>
                      <TH w="20%">Deliverable</TH>
                      <TH w="14%">Milestone</TH>
                      <TH w="10%">Due Date</TH>
                      <TH w="8%">Prev %</TH>
                      <TH w="16%">This Week %</TH>
                      <TH w="13%">Status</TH>
                      <TH>Notes</TH>
                    </tr></thead>
                    <tbody>{form.deliverables.map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{d.id}</div></TD>
                        <TD><div style={{fontWeight:600}}>{d.name}</div></TD>
                        <TD><div style={{fontSize:11,color:B.textMid}}>{d.milestone}</div></TD>
                        <TD><div style={{fontSize:11,color:B.textMuted}}>{d.dueDate}</div></TD>
                        <TD><div style={{fontSize:12,color:B.textMuted}}>{d.previousPct}%</div></TD>
                        <TD>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <input type="range" min="0" max="100" step="5" value={d.thisWeekPct||0}
                              onChange={e=>setA("deliverables",i,"thisWeekPct",Number(e.target.value))}
                              style={{flex:1,accentColor:B.darkBlue}}/>
                            <div style={{minWidth:36,fontSize:12,fontWeight:700,color:B.darkBlue,textAlign:"right"}}>{d.thisWeekPct||0}%</div>
                          </div>
                        </TD>
                        <TD><Sel small options={DELIV_STATUSES} value={d.status} onChange={v=>setA("deliverables",i,"status",v)} placeholder="Status..."/></TD>
                        <TD><Inp placeholder="Brief note..." value={d.notes} onChange={v=>setA("deliverables",i,"notes",v)}/></TD>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section===2&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Weekly Narrative"/>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.textMid}}>
                Provide a clear, concise narrative of what was achieved this week, what is planned next week, and any decisions or escalations required.
              </div>
              <div style={{marginBottom:18}}>
                <Lbl req>Completed This Week</Lbl>
                <Txt rows={6} placeholder="• Key activities completed&#10;• Decisions made&#10;• Meetings held&#10;• Deliverables submitted..." value={form.completedNarrative} onChange={v=>set("completedNarrative",v)}/>
              </div>
              <div style={{marginBottom:18}}>
                <Lbl req>Planned for Next Week</Lbl>
                <Txt rows={6} placeholder="• Main workstreams&#10;• Deliverables to be submitted&#10;• Workshops and key meetings&#10;• Decisions expected..." value={form.plannedNarrative} onChange={v=>set("plannedNarrative",v)}/>
              </div>
              <div>
                <Lbl>Key Decisions or Escalations Needed</Lbl>
                <Txt rows={4} placeholder="Escalations to leadership, decisions awaiting CISO input, blockers needing intervention..." value={form.decisionsNeeded} onChange={v=>set("decisionsNeeded",v)}/>
              </div>
            </div>
          )}

          {section===3&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Risk & Issue Register"/>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.textMid}}>
                Update existing risks and add new ones. To convert a risk that has materialised into an issue, change its status to <strong>"Escalated to Issue"</strong> — additional issue fields will appear.
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {form.risks.map((r,i)=>{
                  const autoRating = r.likelihood&&r.impact ? RISK_MATRIX[`${r.likelihood}-${r.impact}`] : null;
                  const finalRating = r.overrideRating || autoRating || "—";
                  const isIssue = r.status === "Escalated to Issue";
                  return(
                    <div key={i} style={{border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden",
                      borderLeft:`4px solid ${isIssue?B.critical:autoRating?ratingColor(finalRating):B.border}`}}>
                      <div style={{background:isIssue?B.criticalLight:B.pageBg,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${B.borderLight}`}}>
                        <div style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:isIssue?B.critical:B.darkBlue}}>
                          {r.id}{isIssue&&" → ISSUE"}
                        </div>
                        <div style={{flex:1}}/>
                        {finalRating!=="—"&&!isIssue&&<CBadge color={ratingColor(finalRating)} bg={ratingBg(finalRating)}>{finalRating.toUpperCase()}</CBadge>}
                        {isIssue&&<CBadge color={B.critical} bg={B.criticalLight}>ISSUE (ESCALATED)</CBadge>}
                        <CBadge color={statusColor(r.status)} bg={statusBg(r.status)}>{r.status.toUpperCase()}</CBadge>
                        {form.risks.length>1&&<DelBtn onClick={()=>rem("risks",i)}/>}
                      </div>
                      <div style={{padding:"14px 16px"}}>
                        <G cols={3} gap={12}>
                          <div><Lbl req>Category</Lbl><Sel options={RISK_CATS} value={r.category} onChange={v=>setA("risks",i,"category",v)} placeholder="Select..."/></div>
                          <div><Lbl req>Likelihood</Lbl><Sel options={RISK_LEVELS} value={r.likelihood} onChange={v=>setA("risks",i,"likelihood",v)} placeholder="Select..."/></div>
                          <div><Lbl req>Impact</Lbl><Sel options={RISK_LEVELS} value={r.impact} onChange={v=>setA("risks",i,"impact",v)} placeholder="Select..."/></div>
                        </G>
                        <div style={{height:10}}/>
                        <Lbl req>Risk Description</Lbl><Txt rows={2} value={r.description} onChange={v=>setA("risks",i,"description",v)}/>
                        <div style={{height:10}}/>
                        <G cols={2} gap={12}>
                          <div><Lbl>Mitigation Plan</Lbl><Txt rows={2} value={r.mitigation} onChange={v=>setA("risks",i,"mitigation",v)}/></div>
                          <div>
                            <G cols={2} gap={10}>
                              <div><Lbl>Owner</Lbl><Inp placeholder="Name..." value={r.owner} onChange={v=>setA("risks",i,"owner",v)}/></div>
                              <div><Lbl>Status</Lbl><Sel options={RISK_STATUSES} value={r.status} onChange={v=>setA("risks",i,"status",v)} placeholder="Status..."/></div>
                            </G>
                          </div>
                        </G>
                        {isIssue&&(
                          <div style={{marginTop:14,padding:"14px 16px",background:B.criticalLight,border:`1px solid ${B.critical}40`,borderRadius:5}}>
                            <div style={{fontSize:11,fontWeight:700,color:B.critical,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>
                              ⚠ Issue Details — Required
                            </div>
                            <Lbl req>Issue Description (what materialised)</Lbl>
                            <Txt rows={2} placeholder="Describe what has happened, current impact, and immediate response..." value={r.issueDescription} onChange={v=>setA("risks",i,"issueDescription",v)}/>
                            <div style={{height:10}}/>
                            <G cols={2} gap={12}>
                              <div><Lbl req>Issue Owner</Lbl><Inp placeholder="Person managing the issue..." value={r.issueOwner} onChange={v=>setA("risks",i,"issueOwner",v)}/></div>
                              <div><Lbl req>Target Resolution Date</Lbl><Inp type="date" value={r.issueTargetDate} onChange={v=>setA("risks",i,"issueTargetDate",v)}/></div>
                            </G>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <AddBtn onClick={()=>add("risks",{id:`R-${String(form.risks.length+1).padStart(3,"0")}`,category:"",description:"",likelihood:"",impact:"",overrideRating:"",overrideComment:"",mitigation:"",owner:"",status:"Open",issueDescription:"",issueOwner:"",issueTargetDate:""})} label="Add New Risk"/>
            </div>
          )}

          {section===4&&(
            <div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title="Cross-Project Dependencies"/>
                <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.amber}}>
                  Pre-filled from contracting. Update the status and add a brief weekly comment for each.
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                    <thead><tr>
                      <TH w="16%">Initiative</TH>
                      <TH w="18%">Nature</TH>
                      <TH w="18%">Risk if Delayed</TH>
                      <TH w="9%">Severity</TH>
                      <TH w="12%">Owner</TH>
                      <TH w="11%">Linked Status</TH>
                      <TH>This Week's Update</TH>
                      <TH w="30px"/>
                    </tr></thead>
                    <tbody>{form.dependencies.map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD><Inp placeholder="Initiative..." value={d.initiative} onChange={v=>setA("dependencies",i,"initiative",v)}/></TD>
                        <TD><Inp placeholder="Nature..." value={d.nature} onChange={v=>setA("dependencies",i,"nature",v)}/></TD>
                        <TD><Inp placeholder="Risk..." value={d.riskIfDelayed} onChange={v=>setA("dependencies",i,"riskIfDelayed",v)}/></TD>
                        <TD><Sel small options={RISK_LEVELS} value={d.severity} onChange={v=>setA("dependencies",i,"severity",v)} placeholder="..."/></TD>
                        <TD><Inp placeholder="Owner..." value={d.owner} onChange={v=>setA("dependencies",i,"owner",v)}/></TD>
                        <TD><Inp placeholder="e.g. In Progress" value={d.linkedStatus} onChange={v=>setA("dependencies",i,"linkedStatus",v)}/></TD>
                        <TD><Inp placeholder="Brief update for this week..." value={d.weekUpdate} onChange={v=>setA("dependencies",i,"weekUpdate",v)}/></TD>
                        <TD>{form.dependencies.length>0&&<DelBtn onClick={()=>rem("dependencies",i)}/>}</TD>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <AddBtn onClick={()=>add("dependencies",{initiative:"",nature:"",riskIfDelayed:"",severity:"",owner:"",linkedStatus:"",weekUpdate:""})} label="Add Dependency"/>
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
                <SLine title="Action Items — Cross-Team Interactions"/>
                <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.textMid}}>
                  Track specific actions, requests, or interactions needed from other teams this week (e.g. "Need security review from InfoSec team by Friday"). Open actions automatically carry forward to next week's update.
                </div>
                {form.actions.length===0?(
                  <div style={{padding:"40px 20px",textAlign:"center",background:B.pageBg,borderRadius:6,border:`1px dashed ${B.border}`}}>
                    <div style={{fontSize:13,color:B.textMuted,marginBottom:8}}>No action items recorded for this week.</div>
                    <div style={{fontSize:11,color:B.textMuted}}>Add an action below to track cross-team requests, blockers, or commitments.</div>
                  </div>
                ):(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                      <thead><tr>
                        <TH w="7%">ID</TH>
                        <TH w="25%">Action Description</TH>
                        <TH w="15%">Owner</TH>
                        <TH w="14%">Team / Dept</TH>
                        <TH w="11%">Due Date</TH>
                        <TH w="9%">Priority</TH>
                        <TH>Status</TH>
                        <TH w="30px"/>
                      </tr></thead>
                      <tbody>{form.actions.map((a,i)=>(
                        <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                          <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{a.id}</div></TD>
                          <TD><Inp placeholder="What needs to happen..." value={a.description} onChange={v=>setA("actions",i,"description",v)}/></TD>
                          <TD><Inp placeholder="Person responsible..." value={a.owner} onChange={v=>setA("actions",i,"owner",v)}/></TD>
                          <TD><Inp placeholder="e.g. Legal, InfoSec..." value={a.team} onChange={v=>setA("actions",i,"team",v)}/></TD>
                          <TD><Inp type="date" value={a.dueDate} onChange={v=>setA("actions",i,"dueDate",v)}/></TD>
                          <TD><Sel small options={ACTION_PRIORITY} value={a.priority} onChange={v=>setA("actions",i,"priority",v)} placeholder="..."/></TD>
                          <TD><Sel small options={ACTION_STATUS} value={a.status} onChange={v=>setA("actions",i,"status",v)} placeholder="..."/></TD>
                          <TD><DelBtn onClick={()=>rem("actions",i)}/></TD>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <AddBtn onClick={()=>add("actions",{id:`A-${String(form.actions.length+1).padStart(3,"0")}`,description:"",owner:"",team:"",dueDate:"",priority:"",status:"Open"})} label="Add Action Item"/>
              </div>
            </div>
          )}

          {section===5&&(
            <div>
              <div style={{marginBottom:16}}>
                <ProjectGauge pct={projectPct} expected={expectedPct} status={finalStatus}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
                {[
                  {label:"Project Completion",       value:`${projectPct}%`,                color:statusColor(finalStatus)},
                  {label:"Status",                   value:finalStatus,                      color:statusColor(finalStatus)},
                  {label:"Deliverables Completed",   value:`${deliverablesCompletedThisWeek} this week`, color:B.darkBlue},
                  {label:"Open Risks / Issues",      value:`${openRisks} / ${escalatedIssues}`, color:openRisks+escalatedIssues>0?B.red:B.green},
                  {label:"Open Action Items",        value:openActions,                     color:openActions>0?B.amber:B.green},
                ].map((item,i)=>(
                  <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${item.color}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                    <div style={{fontSize:18,fontWeight:700,color:item.color,lineHeight:1.2}}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <SLine title="Submission Readiness"/>
                {[
                  {label:"Deliverable progress updated",         done:form.deliverables.some(d=>Number(d.thisWeekPct)>0)},
                  {label:"Weekly narrative written",              done:!!form.completedNarrative&&!!form.plannedNarrative},
                  {label:"Risks reviewed",                        done:form.risks.length>0},
                  {label:"Status override comment (if applicable)", done:!form.statusOverride||!!form.statusOverrideComment},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                    <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:item.done?B.green:B.pageBg,border:`2px solid ${item.done?B.green:B.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:12,fontWeight:700}}>{item.done?"✓":""}</div>
                    <div style={{fontSize:13,color:item.done?B.textDark:B.textMuted,fontWeight:item.done?600:400}}>{item.label}</div>
                    {!item.done&&<span style={{fontSize:11,color:B.amber,marginLeft:"auto"}}>Incomplete</span>}
                  </div>
                ))}
              </div>

              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Automated Email Report</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                  <CBadge color={B.amber} bg={B.amberLight}>COMING SOON</CBadge>
                </div>
                <div style={{padding:"14px 16px",background:B.pageBg,borderRadius:5,border:`1px solid ${B.border}`}}>
                  <div style={{fontSize:12,color:B.textMid,lineHeight:1.7}}>
                    On submission, a formatted weekly report will be emailed to the recipients configured in the contracting page:
                    <ul style={{marginTop:8,paddingLeft:20,color:B.textDark}}>
                      <li>CISO — Executive summary format</li>
                      <li>Domain Lead — Full detail format</li>
                      <li>Project Sponsor — Executive summary format</li>
                    </ul>
                    <div style={{marginTop:8}}>Cadence: <strong>Weekly</strong> · Day: <strong>Monday</strong> · First report scheduled: <strong>To be configured</strong></div>
                  </div>
                </div>
              </div>

              {submitted?(
                <div style={{background:B.greenLight,border:`2px solid ${B.green}`,borderRadius:6,padding:"24px 28px",textAlign:"center"}}>
                  <div style={{fontSize:26,marginBottom:8}}>✓</div>
                  <div style={{fontSize:16,fontWeight:700,color:B.green,marginBottom:4}}>Weekly Update Submitted</div>
                  <div style={{fontSize:13,color:B.textMid}}>This update is now locked as a historical record. Email distribution will trigger once the reporting feature is enabled.</div>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
                  <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"10px 24px",borderRadius:5,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Save Draft & Exit</button>
                  <button onClick={()=>{setSubmitted(true);onSubmit&&onSubmit(form);}} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",fontWeight:700,fontSize:14,padding:"12px 36px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px ${B.darkBlue}40`}}>Submit Weekly Update →</button>
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
            {section>0?<button onClick={()=>setSection(s=>s-1)} style={{background:B.cardBg,border:`1px solid ${B.border}`,color:B.textMid,padding:"9px 22px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Previous</button>:<div/>}
            {section<WU_SECTIONS.length-1&&<button onClick={()=>setSection(s=>s+1)} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"9px 24px",borderRadius:4,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Next: {WU_SECTIONS[section+1].label} →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ PAGE: WEEKLY REPORTS HISTORY ═════════════════════════════════════════════
function PageWeeklyReportsHistory({project,history,onBack,onSubmitNew,onViewWeek,onExit}) {
  const isClosed = project?.status === "Closed";
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <div style={{background:B.deepBlue,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          {onExit && <button onClick={onExit} title="Back to Suite" style={{background:"#FFFFFF20",border:"1px solid #FFFFFF40",color:"#FFFFFF",borderRadius:4,padding:"3px 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⊞ Suite</button>}
          <div style={{color:"#FFFFFF",fontWeight:800,fontSize:15,letterSpacing:"0.14em"}}>CPM</div>
          <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
          <div style={{color:B.headerText,fontSize:12}}>Weekly Reports History</div>
          <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
          <div style={{color:"#FFFFFF",fontSize:12,fontWeight:600}}>{project?.name}</div>
        </div>
        <CBadge color={isClosed?B.textMuted:B.green} bg={(isClosed?B.textMuted:B.green)+"30"}>{isClosed?"CLOSED PROJECT":"ACTIVE PROJECT"}</CBadge>
      </div>

      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        {!isClosed&&(
          <button onClick={onSubmitNew} style={{background:B.midBlue,border:"none",color:"#FFFFFF",padding:"7px 18px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Submit New Weekly Update →</button>
        )}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>

          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Project Summary</div>
              <div style={{flex:1,height:1,background:B.lineColor}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
              {[
                {label:"Project ID", value:project?.id},
                {label:"PM",         value:project?.pm},
                {label:"Progress",   value:`${project?.progress||0}%`, color:statusColor(project?.status)},
                {label:"Status",     value:project?.status, color:statusColor(project?.status)},
                {label:isClosed?"Closure Date":"Due Date", value:isClosed?(project?.closureDate||"—"):project?.dueDate},
              ].map((f,i)=>(
                <div key={i} style={{background:B.pageBg,border:`1px solid ${B.border}`,borderRadius:5,padding:"12px 14px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{f.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:f.color||B.textDark}}>{f.value||"—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>All Weekly Reports ({history.length})</div>
              <div style={{flex:1,height:1,background:B.lineColor}}/>
            </div>

            {history.length===0?(
              <div style={{padding:"40px 20px",textAlign:"center",background:B.pageBg,borderRadius:6,border:`1px dashed ${B.border}`}}>
                <div style={{fontSize:13,color:B.textMuted,marginBottom:8}}>No weekly reports submitted yet for this project.</div>
                {!isClosed&&<div style={{fontSize:11,color:B.textMuted}}>Click "Submit New Weekly Update" to create the first weekly report.</div>}
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {history.map((h,i)=>(
                  <div key={i} onClick={()=>onViewWeek&&onViewWeek(h)} style={{
                    background:B.cardBg,
                    border:`1px solid ${B.border}`,
                    borderLeft:`4px solid ${statusColor(h.status)}`,
                    borderRadius:6,padding:"16px 20px",cursor:"pointer",
                    display:"grid",gridTemplateColumns:"auto 2fr 1fr 1fr auto",gap:16,alignItems:"center",
                    transition:"box-shadow 0.15s"
                  }} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,85,135,0.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                    <div style={{fontSize:18,fontWeight:800,color:B.darkBlue,fontFamily:"monospace",minWidth:60}}>{`W${h.weekNumber}`}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:B.textDark,marginBottom:3}}>{h.label}</div>
                      <div style={{fontSize:11,color:B.textMuted,lineHeight:1.5}}>{h.narrative}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Project %</div>
                      <div style={{fontSize:18,fontWeight:800,color:statusColor(h.status)}}>{h.projectPct}%</div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Status</div>
                      <CBadge color={statusColor(h.status)} bg={statusBg(h.status)}>{h.status.toUpperCase()}</CBadge>
                    </div>
                    <button style={{background:"none",border:`1px solid ${B.border}`,color:B.darkBlue,borderRadius:3,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>View →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ ROOT APP ═════════════════════════════════════════════════════════════════
function CPMApp({ onExit, sharedInitiatives, upsertInitiative, patchInitiative }) {
  const [page,          setPage]         = useState("landing");
  const [viewing,       setViewing]      = useState(null);
  const [rfpItem,       setRfpItem]      = useState(null);
  const [contractItem,  setContractItem] = useState(null);
  const [contractMode,  setContractMode] = useState(null);
  const [weeklyProject, setWeeklyProject]= useState(null);
  const [reportsProject,setReportsProject]=useState(null);

  const sharedAsCpm = useMemo(() => {
    return (sharedInitiatives || [])
      .filter(rec => rec.status === "ENDORSED" || rec.cpmPhase)
      .map(rec => toCpmItem(rec));
  }, [sharedInitiatives]);

  const sharedPipeline = useMemo(() => sharedAsCpm.filter(c => c.phase === "Strategy" || c.phase === "RFP"), [sharedAsCpm]);
  const sharedProjects = useMemo(() => sharedAsCpm.filter(c => c.phase === "Active" || c.phase === "Closed"), [sharedAsCpm]);

  const pipeline = useMemo(() => {
    const sharedIds = new Set(sharedPipeline.map(s => s.id));
    return [...sharedPipeline, ...INIT_PIPELINE.filter(p => !sharedIds.has(p.id))];
  }, [sharedPipeline]);

  const projects = useMemo(() => {
    const sharedIds = new Set(sharedProjects.map(s => s.id));
    return [...sharedProjects, ...INIT_PROJECTS.filter(p => !sharedIds.has(p.id))];
  }, [sharedProjects]);

  const setPipeline = (updater) => {
    const next = typeof updater === "function" ? updater(pipeline) : updater;
    next.forEach(item => syncCpmItem(item, upsertInitiative, sharedInitiatives));
  };
  const setProjects = (updater) => {
    const next = typeof updater === "function" ? updater(projects) : updater;
    next.forEach(item => syncCpmItem(item, upsertInitiative, sharedInitiatives));
  };

  const genId = () => "CPM-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random()*900)+100);
  const todayLocal = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  const blankPipelineRecord = (phase) => ({
    id: genId(), name: "", domain: "", phase, score: 0,
    owner: "", budget: "", submitted: todayLocal, pillar: "",
    status: phase==="Strategy" ? "Pending CISO Review" : "RFP Draft",
    frameworks: [], problemStatement: "", visionStatement: "",
    businessOutcome: "", inScope: "", assumptions: "",
    milestones: [], kpis: [], depRisks: [],
  });

  const handleSubmitStrategy = (newItem) => {
    syncCpmItem(newItem, upsertInitiative, sharedInitiatives);
    setPage("landing");
  };

  const handleSaveRFP = (updatedItem) => {
    syncCpmItem(updatedItem, upsertInitiative, sharedInitiatives);
    setPage("landing");
  };

  const handleMoveToRFP = (item) => {
    const updated = { ...item, phase: "RFP" };
    syncCpmItem(updated, upsertInitiative, sharedInitiatives);
    setRfpItem(updated);
    setPage("rfp");
  };

  const handleOpenRFP = (item) => {
    setRfpItem(item);
    setPage("rfp");
  };

  const handleNewStrategy = () => setPage("new");

  const handleNewRFP = () => {
    setRfpItem(blankPipelineRecord("RFP"));
    setPage("rfp");
  };

  const handleNewActiveProject = () => {
    setContractItem({ ...blankPipelineRecord("RFP"), name: "" });
    setContractMode("new-active");
    setPage("contracting");
  };

  const handleNewClosedProject = () => {
    setContractItem({ ...blankPipelineRecord("RFP"), name: "" });
    setContractMode("new-closed");
    setPage("contracting");
  };

  const handleOpenContracting = (item) => {
    setContractItem(item);
    setContractMode(null);
    setPage("contracting");
  };

  const handleActivateProject = (activatedItem) => {
    const willBeClosed = contractMode === "new-closed";
    const projectRecord = {
      id:              activatedItem.id,
      name:            activatedItem.name,
      domain:          activatedItem.domain,
      progress:        willBeClosed ? 100 : 0,
      status:          willBeClosed ? "Closed" : "On Track",
      phase:           willBeClosed ? "Closed" : "Active",
      risks:           activatedItem.risks?.filter(r => r.status === "Open").length || 0,
      issues:          0,
      pm:              activatedItem.pm,
      pmEmail:         activatedItem.pmEmail,
      contractStart:   activatedItem.contractStart,
      contractEnd:     activatedItem.contractEnd,
      budget:          activatedItem.contractValue ? `$${Number(activatedItem.contractValue).toLocaleString()}` : activatedItem.budget,
      contractValue:   activatedItem.contractValue,
      spent:           willBeClosed ? activatedItem.contractValue ? `$${Number(activatedItem.contractValue).toLocaleString()}` : "$0" : "$0",
      dueDate:         activatedItem.contractEnd || "TBD",
      closureDate:     willBeClosed ? todayLocal : undefined,
      milestone:       willBeClosed ? "Closure & Handover" : (activatedItem.milestones?.[0]?.name || "Project Kick-off"),
      milestoneStatus: willBeClosed ? "Completed" : "Not Started",
      deliverables:    activatedItem.deliverables || [],
      milestonesList:  activatedItem.milestones || [],
      risksList:       activatedItem.risks || [],
      dependenciesList:activatedItem.dependencies || [],
      contractData:    activatedItem,
    };
    syncCpmItem(projectRecord, upsertInitiative, sharedInitiatives);
    setContractMode(null);
    setPage("landing");
  };

  const handleOpenWeekly = (project) => {
    const proj = {
      id:              project.id,
      name:            project.name,
      domain:          project.domain,
      pm:              project.pm,
      pmEmail:         project.pmEmail || `${(project.pm||"pm").split(" ")[0].toLowerCase()}@org.com`,
      contractStart:   project.contractStart   || "2025-01-15",
      contractEnd:     project.contractEnd     || project.dueDate || "2025-12-31",
      contractValue:   project.contractValue   || "0",
      deliverables:    (project.deliverables && project.deliverables.length>0) ? project.deliverables : MOCK_PROJECT.deliverables,
      milestones:      (project.milestonesList && project.milestonesList.length>0) ? project.milestonesList : MOCK_PROJECT.milestones,
      initialRisks:    (project.risksList && project.risksList.length>0) ? project.risksList : MOCK_PROJECT.initialRisks,
      initialDependencies: (project.dependenciesList && project.dependenciesList.length>0) ? project.dependenciesList : MOCK_PROJECT.initialDependencies,
    };
    setWeeklyProject(proj);
    setPage("weekly");
  };

  const handleSubmitWeekly = (weeklyData) => {
    setPage("landing");
  };

  const handleViewWeeklyReports = (project) => {
    setReportsProject(project);
    setPage("reports");
  };

  const handleMovePhase = (item) => {
    if (item.phase === "RFP") {
      handleOpenContracting(item);
    } else {
      const next = { ...item, phase: nextPhase[item.phase] };
      syncCpmItem(next, upsertInitiative, sharedInitiatives);
    }
  };

  if (page === "new")
    return <PageNewInitiative
      onDiscard={() => setPage("landing")}
      onSubmit={handleSubmitStrategy}
      onExit={onExit}
    />;

  if (page === "view")
    return <PageViewInitiative
      item={viewing}
      onBack={() => setPage("landing")}
      onMoveToRFP={handleMoveToRFP}
      onOpenWeekly={handleOpenWeekly}
      onViewWeeklyReports={handleViewWeeklyReports}
      onExit={onExit}
    />;

  if (page === "rfp")
    return <PageRFP
      strategy={rfpItem}
      onBack={() => setPage("landing")}
      onSubmit={handleSaveRFP}
      onExit={onExit}
    />;

  if (page === "contracting")
    return <PageContracting
      strategy={contractItem}
      rfp={contractItem?.rfpData}
      onBack={() => { setContractMode(null); setPage("landing"); }}
      onActivate={handleActivateProject}
      mode={contractMode}
      onExit={onExit}
    />;

  if (page === "weekly")
    return <PageWeeklyUpdate
      project={weeklyProject}
      onBack={() => setPage("landing")}
      onSubmit={handleSubmitWeekly}
      onExit={onExit}
    />;

  if (page === "reports")
    return <PageWeeklyReportsHistory
      project={reportsProject}
      history={MOCK_HISTORY}
      onBack={() => setPage("landing")}
      onSubmitNew={() => handleOpenWeekly(reportsProject)}
      onViewWeek={(w) => { }}
      onExit={onExit}
    />;

  return (
    <PageLanding
      pipeline={pipeline}
      projects={projects}
      onNewInitiative={handleNewStrategy}
      onNewRFP={handleNewRFP}
      onNewActiveProject={handleNewActiveProject}
      onNewClosedProject={handleNewClosedProject}
      onViewInitiative={(item) => { setViewing(item); setPage("view"); }}
      onOpenRFP={handleOpenRFP}
      onOpenContracting={handleOpenContracting}
      onOpenWeekly={handleOpenWeekly}
      onViewWeeklyReports={handleViewWeeklyReports}
      onMovePhase={handleMovePhase}
      onExit={onExit}
    />
  );
}

/* =====================================================================
   CYBER BUDGETING TOOL — Merged App (Modules 1 + 2)
   ===================================================================== */

const C = {
  deepest: "#005587", dark: "#0076A8", medium: "#00A3E0", light: "#62B5E5",
  pageBg: "#F2F6FA", cardBg: "#FFFFFF", border: "#C8DFF0",
  textDark: "#0D2E45", textMuted: "#6A90A8",
  green: "#1A8A4A", amber: "#B86A00", red: "#C0392B", grey: "#6A90A8",
};
const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

const DOMAINS = {
  IAM: "Identity & Access", GRC: "Governance, Risk & Compliance",
  SECOPS: "Security Operations", APPSEC: "Application Security",
  DATA: "Data Protection", NET: "Network Security",
};
const ALL_DOMAINS = Object.keys(DOMAINS);
const SUBDOMAINS = {
  IAM: ["Workforce Identity", "Privileged Access", "Customer Identity"],
  GRC: ["Policy & Compliance", "Third-Party Risk", "Audit & Assurance"],
  SECOPS: ["Threat Detection", "Incident Response", "Vulnerability Mgmt"],
  APPSEC: ["Secure SDLC", "Product Security", "AI Assurance"],
  DATA: ["Data Protection", "Encryption & Keys", "Data Residency"],
  NET: ["Network Security", "Cloud Security", "Segmentation"],
};
const INITIATIVE_TYPES = {
  NEW_CAPABILITY: "New Capability", ENHANCEMENT: "Enhancement",
  RENEWAL: "Renewal", COMPLIANCE: "Compliance-driven",
};
const PILLARS = {
  P1: "Protect the Core", P2: "Enable the Business Securely",
  P3: "Operational Resilience", P4: "Trust & Compliance",
};
const FRAMEWORKS = ["NIST CSF","ISO 27001","NIST 800-53","CIS Controls","DORA","NCA ECC","PCI DSS","GDPR","SOC 2"];

const CATEGORIES = {
  REGULATORY: { label: "Regulatory", color: C.dark },
  THREAT: { label: "Threat", color: C.red },
  TECH_SHIFT: { label: "Tech Shift", color: C.medium },
  STRATEGY: { label: "Strategy", color: C.deepest },
  AUDIT_INCIDENT: { label: "Audit / Incident", color: C.amber },
};
const IMPACT = {
  HIGH: { label: "High", color: C.red },
  MEDIUM: { label: "Medium", color: C.amber },
  LOW: { label: "Low", color: C.green },
};
const OBS_STATUS = {
  OPEN: { label: "Open", color: C.medium },
  TRIAGED: { label: "Triaged · drafting", color: C.dark },
  LINKED_TO_INITIATIVE: { label: "Linked", color: C.green },
  DISMISSED: { label: "Dismissed", color: C.grey },
  ARCHIVED: { label: "Archived", color: C.grey },
};

const KPI_LIBRARY = [
  { id:"K1", name:"Mean time to detect (MTTD)", unit:"hours", direction:"LOWER_IS_BETTER", measurementMethod:"Median detection time across incidents", domains:["SECOPS"] },
  { id:"K2", name:"Phishing-resistant MFA coverage", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"Share of workforce identities on phishing-resistant MFA", domains:["IAM"] },
  { id:"K3", name:"Access recertification completion", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"Recertifications completed on time vs. due", domains:["IAM","GRC"] },
  { id:"K4", name:"High-risk findings remediated in SLA", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"High/critical findings closed within SLA", domains:["APPSEC","SECOPS"] },
  { id:"K5", name:"Third-party assessments current", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"Critical vendors with an in-date assessment", domains:["GRC"] },
  { id:"K6", name:"AI systems with assurance sign-off", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"Production AI systems passing the assurance gate", domains:["APPSEC","GRC","DATA"] },
  { id:"K7", name:"Acquired-entity onboarding time", unit:"days", direction:"LOWER_IS_BETTER", measurementMethod:"Median days to bring an acquired entity to baseline", domains:["IAM","NET","GRC"] },
];

const LEADS = {
  "A. Haddad": { name: "A. Haddad (GRC Lead)", role: "DOMAIN_LEAD", domains: ["GRC","DATA"] },
  "R. Okafor": { name: "R. Okafor (IAM Lead)", role: "DOMAIN_LEAD", domains: ["IAM"] },
  "M. Lindqvist": { name: "M. Lindqvist (SecOps Lead)", role: "DOMAIN_LEAD", domains: ["SECOPS","NET"] },
  "S. Nair": { name: "S. Nair (AppSec Lead)", role: "DOMAIN_LEAD", domains: ["APPSEC"] },
  "L. Romano": { name: "L. Romano (COO · CSSMO)", role: "CSSMO", domains: ALL_DOMAINS },
  "CISO": { name: "CISO Office", role: "CISO", domains: ALL_DOMAINS },
};
const DOMAIN_LEAD_NAME = {};
Object.values(LEADS).forEach((v) => {
  if (v.role === "DOMAIN_LEAD") v.domains.forEach((d) => (DOMAIN_LEAD_NAME[d] = v.name));
});
const SPONSORS = ["D. Mensah (CTO)","L. Romano (COO)","P. Andersson (CFO)","K. Yusuf (Chief Digital Officer)"];
const USERS = [
  "A. Haddad (GRC Lead)","R. Okafor (IAM Lead)","M. Lindqvist (SecOps Lead)","S. Nair (AppSec Lead)",
  ...SPONSORS,
];

const EXISTING_INITIATIVES = [
  { id:"CPM-2026-009", name:"Third-Party Risk Management uplift", domain:"GRC" },
  { id:"CPM-2026-014", name:"Phishing-resistant MFA rollout", domain:"IAM" },
  { id:"CPM-2026-001", name:"Identity Governance automation", domain:"IAM" },
];

const DEMO_TODAY = "2026-06-12";
const seedCampaign = {
  campaignId: "SCAN-2026", cycleName: "FY2027 Budget Cycle",
  windowStart: "2026-06-01", windowEnd: "2026-07-01",
  status: "ACTIVE", autoOpened: true,
};
function daysBetween(a, b) {
  return Math.round((new Date(b+"T00:00:00") - new Date(a+"T00:00:00")) / 86400000);
}
function rid(p) { return `${p}${Math.floor(Math.random()*900)+100}`; }

const seedBudgetCycle = {
  cycleId: "CYC-2027",
  cycleName: "FY2027 Budget Cycle",
  cycleYear: 2027,
  estimatedOpenDate: "2026-07-01",
  windowStart: null,
  corporateSubmissionDate: "2026-08-15",
  status: "PLANNED",
  autoOpened: false,
  openedManually: false,
  milestones: [
    { key: "ESTIMATES", name: "Estimates complete", date: "2026-07-10" },
    { key: "REVIEW", name: "Leadership review complete", date: "2026-08-01" },
    { key: "SUBMIT", name: "Corporate submission", date: "2026-08-15" },
  ],
};

const seedObservations = [
  { observationId:"OBS-2026-001", title:"Group strategy commits to enterprise-wide AI adoption",
    description:"The board's three-year strategy names AI as a primary growth lever, with business units expected to deploy generative-AI capabilities. Cyber must enable this safely, not block it.",
    inputCategory:"STRATEGY", impactTag:"HIGH", source:"Group Strategy 2026–2028 (board-approved)", sourceLink:"",
    strategyImpact:"Requires a new AI security & governance capability — model risk, data-leakage controls, AI usage policy, assurance over third-party AI. Likely multi-year funded.",
    affectedDomains:["GRC","APPSEC","DATA"], scanMode:"CYCLE_INTENSIVE", scanCampaignId:"SCAN-2026", cycleDeferred:false,
    dateObserved:"2026-06-05", capturedBy:"A. Haddad (GRC Lead)", status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null },
  { observationId:"OBS-2026-002", title:"Acquisition of US-based firm brings new regulatory exposure",
    description:"The group acquired a US-headquartered company processing US customer and health-adjacent data, bringing us into scope for US federal and state regimes not previously addressed.",
    inputCategory:"REGULATORY", impactTag:"HIGH", source:"Corporate Development — deal completion memo", sourceLink:"",
    strategyImpact:"New compliance obligations (state privacy laws, sectoral US regulation, breach notification). Needs a gap assessment of the acquired entity and a remediation budget.",
    affectedDomains:["GRC","DATA"], scanMode:"CYCLE_INTENSIVE", scanCampaignId:"SCAN-2026", cycleDeferred:false,
    dateObserved:"2026-06-07", capturedBy:"A. Haddad (GRC Lead)", status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null },
  { observationId:"OBS-2026-003", title:"Digital strategy to offer M&A integration as a service",
    description:"The group will productise M&A integration — onboarding and providing shared services to acquired companies on an ongoing basis. Cyber must repeatably absorb unknown environments at speed.",
    inputCategory:"STRATEGY", impactTag:"HIGH", source:"Digital Strategy roadmap FY26", sourceLink:"",
    strategyImpact:"Needs a repeatable cyber integration playbook — rapid posture assessment, identity onboarding, segmentation — with budget that scales with deal volume.",
    affectedDomains:["IAM","NET","SECOPS","GRC"], scanMode:"CYCLE_INTENSIVE", scanCampaignId:"SCAN-2026", cycleDeferred:false,
    dateObserved:"2026-06-08", capturedBy:"R. Okafor (IAM Lead)", status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null },
  { observationId:"OBS-2026-004", title:"EU DORA technical standards now in force",
    description:"Final RTS for ICT risk management and third-party oversight are in effect for regulated EU entities, tightening incident-reporting windows.",
    inputCategory:"REGULATORY", impactTag:"HIGH", source:"ESA Joint Committee bulletin", sourceLink:"https://example.org/dora-rts",
    strategyImpact:"Uplift to third-party risk tooling and incident-reporting automation. Reinforces the existing TPRM initiative.",
    affectedDomains:["GRC","SECOPS"], scanMode:"CONTINUOUS", scanCampaignId:null, cycleDeferred:false,
    dateObserved:"2026-04-28", capturedBy:"A. Haddad (GRC Lead)", status:"LINKED_TO_INITIATIVE", triagedBy:"A. Haddad (GRC Lead)", triageOutcome:"LINKED_EXISTING", linkedInitiativeId:"CPM-2026-009" },
  { observationId:"OBS-2026-005", title:"Surge in identity-based attacks across the sector",
    description:"Sector threat intel reports a rise in token theft and MFA-fatigue campaigns against peers, with several breaches stemming from legacy MFA.",
    inputCategory:"THREAT", impactTag:"HIGH", source:"Sector ISAC quarterly threat report", sourceLink:"",
    strategyImpact:"Strengthens the case to accelerate phishing-resistant MFA, especially as M&A integration will expand the identity perimeter.",
    affectedDomains:["IAM","SECOPS"], scanMode:"CONTINUOUS", scanCampaignId:null, cycleDeferred:false,
    dateObserved:"2026-05-11", capturedBy:"R. Okafor (IAM Lead)", status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null },
  { observationId:"OBS-2026-006", title:"Cloud provider shifts core service to consumption pricing",
    description:"A primary cloud provider is moving a relied-upon security service from fixed licensing to consumption pricing, changing the cost profile as workloads scale.",
    inputCategory:"TECH_SHIFT", impactTag:"MEDIUM", source:"Vendor account manager briefing", sourceLink:"",
    strategyImpact:"Cost may rise sharply with AI workloads. Warrants an RFI to model spend and compare alternatives before the cycle locks.",
    affectedDomains:["SECOPS","NET"], scanMode:"CONTINUOUS", scanCampaignId:null, cycleDeferred:false,
    dateObserved:"2026-05-12", capturedBy:"M. Lindqvist (SecOps Lead)", status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null },
  { observationId:"OBS-2026-007", title:"Internal audit flags stale access reviews post-acquisition",
    description:"Audit found access recertification overdue in onboarded units, with elevated risk where acquired-entity identities were migrated without full review.",
    inputCategory:"AUDIT_INCIDENT", impactTag:"MEDIUM", source:"Internal Audit FY26 report", sourceLink:"",
    strategyImpact:"Reinforces identity-governance and connects to M&A integration — acquired identities need a controlled onboarding path.",
    affectedDomains:["IAM","GRC"], scanMode:"CONTINUOUS", scanCampaignId:null, cycleDeferred:false,
    dateObserved:"2026-04-22", capturedBy:"A. Haddad (GRC Lead)", status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null },
  { observationId:"OBS-2026-008", title:"Open-source crypto library deprecation",
    description:"A widely used cryptographic dependency announced deprecation, with downstream impact on a few internal services.",
    inputCategory:"TECH_SHIFT", impactTag:"LOW", source:"Engineering mailing list", sourceLink:"",
    strategyImpact:"Minor; absorbed within BAU engineering, no budget line.",
    affectedDomains:["APPSEC"], scanMode:"CONTINUOUS", scanCampaignId:null, cycleDeferred:false,
    dateObserved:"2026-03-30", capturedBy:"S. Nair (AppSec Lead)", status:"DISMISSED", triagedBy:"S. Nair (AppSec Lead)", triageOutcome:"DISMISSED", dismissalReason:"Handled within BAU engineering; no strategic impact.", linkedInitiativeId:null },
];

const seedInitiatives = [
  {
    initiativeId:"CPM-2026-014", name:"Phishing-resistant MFA rollout",
    domainId:"IAM", subDomainId:"Workforce Identity", initiativeTypeId:"ENHANCEMENT",
    initiativeOwnerId:"R. Okafor (IAM Lead)", domainLeadId:"R. Okafor (IAM Lead)",
    problemStatement:"Legacy MFA is being bypassed by token theft and MFA-fatigue attacks seen across the sector.",
    visionStatement:"All workforce identities protected by phishing-resistant MFA.",
    expectedBusinessOutcome:"Materially reduced account-takeover risk ahead of M&A-driven identity growth.",
    inScopeDescription:"Rollout of FIDO2/passkeys across workforce identities; legacy MFA decommission.",
    outOfScope:[], assumptions:"", cisoStrategicPillarId:"P1",
    frameworkAlignment:["NIST CSF","ISO 27001"],
    kpis:[{ uid:"a1", source:"LIBRARY", kpiLibraryId:"K2", name:"Phishing-resistant MFA coverage", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"Share of workforce identities on phishing-resistant MFA", baseline:"40", target:"98", targetDate:"2027-06-30", wasEditedByUser:false }],
    dependencies:[], sponsorId:"D. Mensah (CTO)",
    status:"ENDORSED",
    originatingObservation:"OBS-2026-005",
    endorsements:[
      { step:"CSSMO", decision:"ENDORSED", by:"L. Romano (COO · CSSMO)", date:"2026-05-20", comment:"" },
      { step:"CISO", decision:"ENDORSED", by:"CISO Office", date:"2026-05-22", comment:"" },
    ],
  },
  {
    initiativeId:"CPM-2026-009", name:"Third-Party Risk Management uplift",
    domainId:"GRC", subDomainId:"Third-Party Risk", initiativeTypeId:"ENHANCEMENT",
    initiativeOwnerId:"A. Haddad (GRC Lead)", domainLeadId:"A. Haddad (GRC Lead)",
    problemStatement:"Manual third-party assessments can't keep pace with DORA's tightened oversight expectations.",
    visionStatement:"Automated, continuous third-party risk monitoring for critical vendors.",
    expectedBusinessOutcome:"Faster, evidence-based vendor risk decisions and DORA-aligned oversight.",
    inScopeDescription:"TPRM platform, continuous monitoring feeds, and assessment workflow automation.",
    outOfScope:[], assumptions:"", cisoStrategicPillarId:"P4",
    frameworkAlignment:["DORA","ISO 27001"],
    kpis:[{ uid:"b1", source:"LIBRARY", kpiLibraryId:"K5", name:"Third-party assessments current", unit:"%", direction:"HIGHER_IS_BETTER", measurementMethod:"Critical vendors with an in-date assessment", baseline:"55", target:"95", targetDate:"2027-12-31", wasEditedByUser:false }],
    dependencies:[], sponsorId:"L. Romano (COO)",
    status:"ENDORSED",
    originatingObservation:"OBS-2026-004",
    endorsements:[
      { step:"CSSMO", decision:"ENDORSED", by:"L. Romano (COO · CSSMO)", date:"2026-05-18", comment:"" },
      { step:"CISO", decision:"ENDORSED", by:"CISO Office", date:"2026-05-21", comment:"" },
    ],
  },
];

const STEPS = ["Identity","Strategic Definition","Scope","Alignment","KPIs","Sponsor & Submit"];

const CONFIDENCE = {
  HIGH: { label:"High", color:C.green },
  MEDIUM: { label:"Medium", color:C.amber },
  LOW: { label:"Low", color:C.red },
};
const VENDOR_STATUS = {
  CONTACTED: { label:"Contacted", color:C.grey },
  RESPONDED: { label:"Responded", color:C.green },
  NO_RESPONSE: { label:"No response", color:C.amber },
  DECLINED: { label:"Declined", color:C.red },
};
const PLAN_STAGE = {
  RESEARCH: { label:"Research", color:C.amber },
  RFI: { label:"RFI", color:C.amber },
  ESTIMATING: { label:"Estimating", color:C.amber },
  READY_FOR_REVIEW: { label:"Ready for review", color:C.dark },
  LEADERSHIP_REVIEW: { label:"With CSSMO", color:C.dark },
  CISO_APPROVAL: { label:"With CISO", color:C.dark },
  PLAN_APPROVED: { label:"Approved", color:C.green },
};
const USD = (n) => (n === "" || n === null || isNaN(n) ? "—" : "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 }));
const num = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
function planId() { return `PLAN-2026-${Math.floor(Math.random()*900)+100}`; }
function emptyRows(years) { return years.reduce((a,y)=>{ a[y]={service:"",license:"",capex:"",opex:""}; return a; }, {}); }
function gridValid(years, rows) {
  return years.every((y) => { const r=rows[y]||{}; return (num(r.service)+num(r.license))===(num(r.capex)+num(r.opex)); });
}
function gridHasData(years, rows) {
  return years.some((y) => { const r=rows[y]||{}; return num(r.service)+num(r.license)+num(r.capex)+num(r.opex) > 0; });
}
function rowsTotalsByYear(years, rows) {
  return years.map((y)=>{ const r=rows[y]||{}; return { year:y, total:num(r.service)+num(r.license), service:num(r.service), license:num(r.license), capex:num(r.capex), opex:num(r.opex) }; });
}
function planProposedTotal(plan) {
  if (!plan) return 0;
  const years = plan.coveredYears;
  return years.reduce((a,y)=>{
    const src = plan.sourceByYear?.[y] || (plan.research ? "RESEARCH" : "RFI");
    const rows = src === "RESEARCH" ? plan.research?.rows : plan.rfi?.rows;
    if (!rows) return a;
    const r = rows[y]||{}; return a + num(r.service)+num(r.license);
  }, 0);
}
function planStageLabel(plan) {
  return PLAN_STAGE[plan.currentStage]?.label || plan.currentStage;
}
const TYPE_TRACKS = {
  NEW_CAPABILITY: { research:true, rfi:true },
  ENHANCEMENT: { research:true, rfi:true },
  RENEWAL: { research:false, rfi:true },
  COMPLIANCE: { research:true, rfi:false },
};

const seedPlans = [
  {
    planId: "PLAN-2026-101",
    initiativeId: "CPM-2026-014",
    planType: "INITIAL",
    currentStage: "RESEARCH",
    coveredYears: [2027, 2028, 2029],
    firstYear: 2027,
    tracks: { research:true, rfi:true },
    createdBy: "R. Okafor (IAM Lead)",
    createdDate: "2026-05-20",
    research: {
      scope: "Sized FIDO2 security keys + passkey rollout across ~4,000 workforce identities, plus IdP configuration effort.",
      assumptions: "Hardware keys for 30% of users; passkeys for the rest. Existing IdP supports WebAuthn.",
      risks: "Key logistics for remote staff; help-desk load during cutover.",
      confidence: "MEDIUM",
      rows: {
        2027: { service:"180000", license:"120000", capex:"200000", opex:"100000" },
        2028: { service:"90000", license:"110000", capex:"0", opex:"200000" },
        2029: { service:"60000", license:"110000", capex:"0", opex:"170000" },
      },
      completed: true,
    },
    rfi: {
      scope: "Requested pricing from three passwordless vendors for keys + platform licensing over three years.",
      confidence: "MEDIUM",
      notes: "",
      vendors: [
        { id:"v1", vendorName:"Yubico", contactName:"", contactEmail:"", dateContacted:"2026-05-10", responseDate:"2026-05-15", status:"RESPONDED", notes:"",
          quote:{ 2027:{service:"170000",license:"130000"}, 2028:{service:"80000",license:"115000"}, 2029:{service:"55000",license:"115000"} } },
        { id:"v2", vendorName:"Okta", contactName:"", contactEmail:"", dateContacted:"2026-05-10", responseDate:"2026-05-16", status:"RESPONDED", notes:"",
          quote:{ 2027:{service:"200000",license:"140000"}, 2028:{service:"95000",license:"120000"}, 2029:{service:"65000",license:"120000"} } },
      ],
      rows: {
        2027: { service:"170000", license:"130000", capex:"190000", opex:"110000" },
        2028: { service:"80000", license:"115000", capex:"0", opex:"195000" },
        2029: { service:"55000", license:"115000", capex:"0", opex:"170000" },
      },
      completed: false,
    },
    sourceByYear: { 2027:"RESEARCH", 2028:"RESEARCH", 2029:"RESEARCH" },
  },
  {
    planId: "PLAN-2026-102",
    initiativeId: "CPM-2026-009",
    planType: "INITIAL",
    currentStage: "LEADERSHIP_REVIEW",
    coveredYears: [2027, 2028],
    firstYear: 2027,
    tracks: { research:true, rfi:false },
    createdBy: "A. Haddad (GRC Lead)",
    createdDate: "2026-05-21",
    research: {
      scope: "Sized a TPRM platform plus continuous monitoring feeds for ~120 critical vendors.",
      assumptions: "SaaS platform; integration with existing GRC tooling.",
      risks: "Data-feed coverage for smaller vendors uncertain.",
      confidence: "HIGH",
      rows: {
        2027: { service:"140000", license:"160000", capex:"100000", opex:"200000" },
        2028: { service:"60000", license:"160000", capex:"0", opex:"220000" },
      },
      completed: true,
    },
    rfi: null,
    sourceByYear: { 2027:"RESEARCH", 2028:"RESEARCH" },
    proposedSnapshot: [
      { year:2027, total:300000, service:140000, license:160000, capex:100000, opex:200000 },
      { year:2028, total:220000, service:60000, license:160000, capex:0, opex:220000 },
    ],
    agreedRows: {
      2027: { service:"140000", license:"160000", capex:"100000", opex:"200000" },
      2028: { service:"60000", license:"160000", capex:"0", opex:"220000" },
    },
    review: { sponsorConfirmed:false, sponsorChangeRequested:false, newSponsorId:null, log:[], cssmoAgreed:false },
  },
];

function Badge({ text, color }) {
  return <span style={{ display:"inline-block", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color, border:`1px solid ${color}`, background:`${color}14`, borderRadius:4, padding:"2px 8px", whiteSpace:"nowrap" }}>{text}</span>;
}
function Btn({ children, kind="primary", onClick, disabled }) {
  const s = { primary:{bg:C.dark,fg:"#fff",bd:C.dark}, secondary:{bg:"#fff",fg:C.dark,bd:C.dark}, success:{bg:C.green,fg:"#fff",bd:C.green}, danger:{bg:"#fff",fg:C.red,bd:C.red}, ghost:{bg:"transparent",fg:C.textMuted,bd:"transparent"} }[kind];
  return <button onClick={onClick} disabled={disabled} style={{ font:FONT, fontSize:13, fontWeight:600, color:s.fg, background:s.bg, border:`1px solid ${s.bd}`, borderRadius:6, padding:"8px 14px", cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.45:1 }}>{children}</button>;
}
function SectionLabel({ children }) {
  return <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.deepest, borderBottom:`1px solid ${C.border}`, paddingBottom:6, marginBottom:14 }}>{children}</div>;
}
function Field({ label, required, hint, children }) {
  return <label style={{ display:"block", marginBottom:16 }}><div style={{ fontSize:12, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.4, marginBottom:5 }}>{label}{required && <span style={{color:C.red}}> *</span>}</div>{children}{hint && <div style={{ fontSize:11.5, color:C.textMuted, marginTop:5 }}>{hint}</div>}</label>;
}
const inputStyle = { width:"100%", font:FONT, fontSize:14, color:C.textDark, background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:6, padding:"9px 11px", boxSizing:"border-box", outline:"none" };
function Pill({ on, onClick, children, title }) {
  return <button onClick={onClick} title={title} style={{ font:FONT, fontSize:12.5, fontWeight:600, color:on?"#fff":C.dark, background:on?C.dark:"#fff", border:`1px solid ${C.dark}`, borderRadius:20, padding:"6px 13px", cursor:"pointer" }}>{children}</button>;
}
function Meta({ label, value }) {
  return <div><div style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>{label}</div><div style={{ fontSize:13, color:C.textDark, marginTop:2 }}>{value}</div></div>;
}

function BudgetingApp({ onExit, sharedInitiatives, upsertInitiative, patchInitiative }) {
  const [identityKey, setIdentityKey] = useState("A. Haddad");
  const identity = LEADS[identityKey];
  const isLead = identity.role === "DOMAIN_LEAD";
  const isOversight = identity.role === "CSSMO" || identity.role === "CISO";

  const [nav, setNav] = useState("scan");
  const [observations, setObservations] = useState(seedObservations);
  const initiatives = sharedInitiatives;
  const setInitiatives = (updater) => {
    const next = typeof updater === "function" ? updater(sharedInitiatives) : updater;
    next.forEach((rec) => upsertInitiative(rec));
  };
  const [plans, setPlans] = useState(seedPlans);
  const [campaign, setCampaign] = useState(seedCampaign);
  const [budgetCycle, setBudgetCycle] = useState(seedBudgetCycle);
  const [activeInitiativeId, setActiveInitiativeId] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);
  const [pendingPlanInitiativeId, setPendingPlanInitiativeId] = useState(null);

  function updateObs(id, patch) {
    setObservations((prev) => prev.map((o) => (o.observationId === id ? { ...o, ...patch } : o)));
  }
  function updateInit(id, patch) {
    setInitiatives((prev) => prev.map((i) => (i.initiativeId === id ? { ...i, ...patch } : i)));
  }
  function updatePlan(id, patch) {
    setPlans((prev) => prev.map((p) => (p.planId === id ? { ...p, ...patch } : p)));
  }

  function proceedToBudgeting(initiativeId) {
    const existing = plans.find((p) => p.initiativeId === initiativeId);
    if (existing) {
      setActivePlanId(existing.planId);
    } else {
      setActivePlanId(null);
      setPendingPlanInitiativeId(initiativeId);
    }
    setNav("budgeting");
    setActiveInitiativeId(null);
  }
  function createPlan(planObj) {
    setPlans((prev) => [planObj, ...prev]);
    setActivePlanId(planObj.planId);
    setPendingPlanInitiativeId(null);
  }

  function createInitiativeFromObs(obs) {
    const newId = `CPM-2026-${rid("")}`;
    const draft = {
      initiativeId: newId,
      name: obs.title,
      domainId: obs.affectedDomains[0],
      subDomainId: "",
      initiativeTypeId: "NEW_CAPABILITY",
      initiativeOwnerId: identity.name,
      domainLeadId: DOMAIN_LEAD_NAME[obs.affectedDomains[0]] || identity.name,
      problemStatement: obs.strategyImpact || obs.description,
      visionStatement: "",
      expectedBusinessOutcome: "",
      inScopeDescription: "",
      outOfScope: [],
      assumptions: "",
      cisoStrategicPillarId: "",
      frameworkAlignment: [],
      kpis: [],
      dependencies: [],
      sponsorId: null,
      status: "DRAFT",
      originatingObservation: obs.observationId,
      endorsements: [],
    };
    setInitiatives((prev) => [draft, ...prev]);
    updateObs(obs.observationId, {
      status: "TRIAGED",
      triagedBy: identity.name,
      triageOutcome: "NEW_INITIATIVE",
      linkedInitiativeId: newId,
    });
    setActiveInitiativeId(newId);
    setNav("initiatives");
  }

  function openInitiative(id) {
    setActiveInitiativeId(id);
    setNav("initiatives");
  }

  return (
    <div style={{ font:FONT, background:C.pageBg, minHeight:"100vh", color:C.textDark }}>
      <div style={{ background:C.deepest, color:"#fff", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:26 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {onExit && <button onClick={onExit} title="Back to Suite" style={{ background:"#FFFFFF20", border:"1px solid #FFFFFF40", color:"#FFFFFF", borderRadius:4, padding:"3px 10px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginRight:6 }}>⊞ Suite</button>}
            <div style={{ width:30, height:30, borderRadius:7, background:C.medium, display:"grid", placeItems:"center", fontWeight:800, fontSize:16 }}>◆</div>
            <div style={{ fontSize:15.5, fontWeight:700, letterSpacing:0.3 }}>Cyber Budgeting</div>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[{k:"scan",label:"Horizon Scan"},{k:"initiatives",label:"Initiatives"},{k:"budgeting",label:"Budgeting"}].map((t) => (
              <button key={t.k} onClick={() => { setNav(t.k); if (t.k==="initiatives") setActiveInitiativeId(null); if (t.k==="budgeting") setActivePlanId(null); }}
                style={{ font:FONT, fontSize:13.5, fontWeight:600, color:nav===t.k?C.deepest:"#fff", background:nav===t.k?"#fff":"transparent", border:"none", borderRadius:6, padding:"7px 14px", cursor:"pointer" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, opacity:0.8 }}>Signed in as</span>
          <select value={identityKey} onChange={(e) => setIdentityKey(e.target.value)}
            style={{ font:FONT, fontSize:13, fontWeight:600, color:C.deepest, background:"#fff", border:"none", borderRadius:6, padding:"7px 10px", cursor:"pointer" }}>
            {Object.entries(LEADS).map(([k,v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {nav === "scan" ? (
        <HorizonScan
          identity={identity} isLead={isLead} isOversight={isOversight}
          observations={observations} updateObs={updateObs}
          addObservation={(o) => setObservations((p) => [o, ...p])}
          onCreateInitiative={createInitiativeFromObs}
          onOpenInitiative={openInitiative}
          campaign={campaign} setCampaign={setCampaign}
        />
      ) : nav === "initiatives" ? (
        <Initiatives
          identity={identity} isLead={isLead} isOversight={isOversight}
          initiatives={initiatives} updateInit={updateInit} updateObs={updateObs}
          activeId={activeInitiativeId} setActiveId={setActiveInitiativeId}
          plans={plans} onProceedToBudgeting={proceedToBudgeting}
        />
      ) : (
        <Budgeting
          identity={identity} isOversight={isOversight}
          initiatives={initiatives} plans={plans}
          updatePlan={updatePlan} createPlan={createPlan}
          activePlanId={activePlanId} setActivePlanId={setActivePlanId}
          pendingInitiativeId={pendingPlanInitiativeId}
          setPendingInitiativeId={setPendingPlanInitiativeId}
          onOpenInitiative={openInitiative}
          cycle={budgetCycle} setCycle={setBudgetCycle}
          campaign={campaign}
        />
      )}
    </div>
  );
}

function HorizonScan({ identity, isLead, isOversight, observations, updateObs, addObservation, onCreateInitiative, onOpenInitiative, campaign, setCampaign }) {
  const myDomains = identity.domains;
  const [view, setView] = useState("inbox");
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("OPEN");
  const [showArchived, setShowArchived] = useState(false);
  const [domainState, setDomainState] = useState(() =>
    ALL_DOMAINS.reduce((a,d) => { a[d] = { status:"NOT_STARTED", completedBy:null, reopenCount:0 }; return a; }, {})
  );

  const campaignActive = campaign.status === "ACTIVE";

  const inScope = useMemo(() => {
    if (isOversight) return observations;
    return observations.filter((o) => o.affectedDomains.some((d) => myDomains.includes(d)));
  }, [observations, isOversight, myDomains]);

  const openByDomain = useMemo(() => {
    const m = {}; ALL_DOMAINS.forEach((d) => (m[d] = []));
    observations.forEach((o) => { if (o.status === "OPEN" && !o.cycleDeferred) o.affectedDomains.forEach((d) => m[d] && m[d].push(o)); });
    return m;
  }, [observations]);

  const completeCount = ALL_DOMAINS.filter((d) => domainState[d].status === "COMPLETE").length;

  const visible = useMemo(() => {
    let list = [...inScope];
    if (!showArchived) list = list.filter((o) => o.status !== "ARCHIVED");
    if (filterStatus === "DISMISSED") list = list.filter((o) => ["DISMISSED","ARCHIVED"].includes(o.status));
    else if (filterStatus !== "ALL") list = list.filter((o) => o.status === filterStatus);
    const rank = { HIGH:0, MEDIUM:1, LOW:2 };
    return list.sort((a,b) => rank[a.impactTag]-rank[b.impactTag] || b.dateObserved.localeCompare(a.dateObserved));
  }, [inScope, showArchived, filterStatus]);

  const counts = useMemo(() => ({
    open: inScope.filter((o)=>o.status==="OPEN").length,
    highOpen: inScope.filter((o)=>o.status==="OPEN"&&o.impactTag==="HIGH").length,
    triaged: inScope.filter((o)=>o.status==="TRIAGED").length,
    linked: inScope.filter((o)=>o.status==="LINKED_TO_INITIATIVE").length,
  }), [inScope]);

  function obsLocked(o) {
    const rel = o.affectedDomains.filter((d) => myDomains.includes(d));
    return rel.length>0 && rel.every((d) => domainState[d].status === "COMPLETE");
  }
  function declareComplete(d) {
    if (openByDomain[d].length>0) return;
    setDomainState((s)=>({ ...s, [d]:{ ...s[d], status:"COMPLETE", completedBy:identity.name } }));
  }
  function reopenDomain(d) {
    setDomainState((s)=>({ ...s, [d]:{ ...s[d], status:"IN_PROGRESS", completedBy:null, reopenCount:s[d].reopenCount+1 } }));
  }
  function startDomain(d) {
    setDomainState((s)=>({ ...s, [d]: s[d].status==="NOT_STARTED"?{...s[d],status:"IN_PROGRESS"}:s[d] }));
  }

  return (
    <div>
      <CampaignBanner campaign={campaign} today={DEMO_TODAY} completeCount={completeCount} totalDomains={ALL_DOMAINS.length}
        isOversight={isOversight}
        onExtend={() => setCampaign((c)=>{const e=new Date(c.windowEnd+"T00:00:00");e.setDate(e.getDate()+7);return{...c,windowEnd:e.toISOString().slice(0,10)};})}
        onClose={() => setCampaign((c)=>({...c,status:"CLOSED"}))}
        onGoToSweep={() => setView("sweep")} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, padding:"20px 28px 6px" }}>
        {[
          { label:isOversight?"Open (all)":"My Open Signals", value:counts.open, accent:C.medium },
          { label:"High Impact (Open)", value:counts.highOpen, accent:C.red },
          { label:"Triaged · Drafting", value:counts.triaged, accent:C.dark },
          { label:"Linked", value:counts.linked, accent:C.green },
          { label:"Domains Complete", value:`${completeCount}/${ALL_DOMAINS.length}`, accent:C.deepest },
        ].map((k) => (
          <div key={k.label} style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderTop:`3px solid ${k.accent}`, borderRadius:8, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, color:C.textMuted }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:700 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[{k:"OPEN",label:"Open"},{k:"TRIAGED",label:"Triaged"},{k:"LINKED_TO_INITIATIVE",label:"Linked"},{k:"DISMISSED",label:"Dismissed"},{k:"ALL",label:"All"}].map((f) => {
            const active = filterStatus===f.k && view==="inbox";
            return <button key={f.k} onClick={()=>{setFilterStatus(f.k);setView("inbox");}} style={{ font:FONT, fontSize:12.5, fontWeight:600, color:active?"#fff":C.dark, background:active?C.dark:"#fff", border:`1px solid ${C.dark}`, borderRadius:20, padding:"6px 13px", cursor:"pointer" }}>{f.label}</button>;
          })}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <label style={{ fontSize:12.5, color:C.textMuted, display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
            <input type="checkbox" checked={showArchived} onChange={(e)=>setShowArchived(e.target.checked)} /> Show archived
          </label>
          {isLead && <><Btn kind="secondary" onClick={()=>setView("sweep")}>My Cycle Sweep</Btn><Btn onClick={()=>setView("capture")}>+ New Observation</Btn></>}
        </div>
      </div>

      <div style={{ padding:"0 28px 40px" }}>
        {view==="capture" && isLead ? (
          <CaptureForm onCancel={()=>setView("inbox")} onSave={(o)=>{addObservation(o);setView("inbox");setFilterStatus("OPEN");}} actingUser={identity.name} myDomains={myDomains} campaignActive={campaignActive} campaignId={campaign.campaignId} />
        ) : view==="sweep" && isLead ? (
          <SweepView campaign={campaign} myDomains={myDomains} domainState={domainState} openByDomain={openByDomain} onStart={startDomain} onComplete={declareComplete} onReopen={reopenDomain} onOpenObs={(o)=>setSelected(o)} onBack={()=>setView("inbox")} campaignActive={campaignActive} />
        ) : view==="sweep" && isOversight ? (
          <OversightTracker domainState={domainState} openByDomain={openByDomain} onBack={()=>setView("inbox")} />
        ) : (
          <>
            <ObservationTable rows={visible} onOpen={(o)=>setSelected(o)} isOversight={isOversight} />
            {isOversight && <div style={{ marginTop:22 }}><OversightTracker domainState={domainState} openByDomain={openByDomain} compact /></div>}
          </>
        )}
      </div>

      {selected && (
        <TriagePanel obs={selected} onClose={()=>setSelected(null)} updateObs={updateObs}
          onCreateInitiative={(o)=>{onCreateInitiative(o);setSelected(null);}}
          onOpenInitiative={onOpenInitiative}
          actingUser={identity.name} campaignActive={campaignActive} locked={obsLocked(selected)} isOversight={isOversight} />
      )}
    </div>
  );
}

function CampaignBanner({ campaign, today, completeCount, totalDomains, isOversight, onExtend, onClose, onGoToSweep }) {
  const { status, windowStart, windowEnd, cycleName, autoOpened } = campaign;
  if (status === "CLOSED") {
    return <div style={{ margin:"16px 28px 0", background:"#F4F7F9", border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.grey}`, borderRadius:8, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div><div style={{ fontSize:13.5, fontWeight:700 }}>{cycleName} · Cycle scan closed</div><div style={{ fontSize:12.5, color:C.textMuted, marginTop:3 }}>Window ran {windowStart} → {windowEnd}. Continuous scanning continues.</div></div>
      <Badge text={`${completeCount}/${totalDomains} complete`} color={C.grey} />
    </div>;
  }
  const dRem = daysBetween(today, windowEnd), len = daysBetween(windowStart, windowEnd), el = daysBetween(windowStart, today);
  const pct = Math.max(0, Math.min(100, Math.round((el/len)*100))), urgent = dRem<=7;
  return (
    <div style={{ margin:"16px 28px 0", background:"linear-gradient(180deg,#fff,#F7FBFE)", border:`1px solid ${C.border}`, borderLeft:`4px solid ${urgent?C.amber:C.medium}`, borderRadius:8, padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:urgent?C.amber:C.green, display:"inline-block", boxShadow:`0 0 0 3px ${(urgent?C.amber:C.green)}22` }} />
            <span style={{ fontSize:13.5, fontWeight:700, color:C.deepest }}>{cycleName} · Cycle scan is OPEN</span>
            <Badge text={autoOpened?"Auto-opened":"Opened early"} color={C.dark} />
          </div>
          <div style={{ fontSize:12.5, color:C.textMuted, marginTop:5 }}>Capture new strategic signals, then sweep them — and standing open observations — into initiatives. Window {windowStart} → {windowEnd}.</div>
          <div style={{ marginTop:11, height:7, background:"#E4EFF7", borderRadius:5, overflow:"hidden", maxWidth:520 }}><div style={{ width:`${pct}%`, height:"100%", background:urgent?C.amber:C.medium }} /></div>
          <div style={{ fontSize:11.5, color:C.textMuted, marginTop:5 }}><strong style={{ color:urgent?C.amber:C.dark }}>{dRem>0?`${dRem} days to deadline`:"deadline today"}</strong> · {completeCount}/{totalDomains} domains declared complete</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Btn onClick={onGoToSweep}>{isOversight?"Completion Tracker →":"My Cycle Sweep →"}</Btn>
          {isOversight && <div style={{ display:"flex", gap:8 }}><Btn kind="secondary" onClick={onExtend}>Extend +1wk</Btn><Btn kind="danger" onClick={onClose}>Close</Btn></div>}
        </div>
      </div>
    </div>
  );
}

function ObservationTable({ rows, onOpen, isOversight }) {
  if (rows.length===0) return <div style={{ background:C.cardBg, border:`1px dashed ${C.border}`, borderRadius:8, padding:"48px", textAlign:"center", color:C.textMuted, fontSize:14 }}>Nothing in this view right now.</div>;
  const headers = ["Observation","Category","Impact","Domains","Scan", isOversight?"Captured by":"Captured","Status",""];
  return (
    <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr style={{ background:C.deepest }}>{headers.map((h)=><th key={h} style={{ textAlign:"left", color:"#fff", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, padding:"11px 14px" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((o,i)=>(
          <tr key={o.observationId} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
            <td style={{ padding:"12px 14px", maxWidth:320 }}><div style={{ fontWeight:600, fontSize:13.5 }}>{o.title}</div><div style={{ fontSize:11.5, color:C.textMuted, marginTop:2 }}>{o.observationId}{o.cycleDeferred && <span style={{color:C.amber,fontWeight:600}}> · deferred</span>}</div></td>
            <td style={{ padding:"12px 14px" }}><Badge text={CATEGORIES[o.inputCategory].label} color={CATEGORIES[o.inputCategory].color} /></td>
            <td style={{ padding:"12px 14px" }}><Badge text={IMPACT[o.impactTag].label} color={IMPACT[o.impactTag].color} /></td>
            <td style={{ padding:"12px 14px", fontSize:12.5 }}>{o.affectedDomains.join(", ")}</td>
            <td style={{ padding:"12px 14px", fontSize:11.5, color:C.textMuted }}>{o.scanMode==="CYCLE_INTENSIVE"?"Cycle":"Continuous"}</td>
            <td style={{ padding:"12px 14px", fontSize:12, color:C.textMuted }}>{isOversight?o.capturedBy:o.dateObserved}</td>
            <td style={{ padding:"12px 14px" }}><Badge text={OBS_STATUS[o.status]?.label||o.status} color={OBS_STATUS[o.status]?.color||C.grey} /></td>
            <td style={{ padding:"12px 14px", textAlign:"right" }}><Btn kind="secondary" onClick={()=>onOpen(o)}>{isOversight?"View →":"Open →"}</Btn></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function CaptureForm({ onCancel, onSave, actingUser, myDomains, campaignActive, campaignId }) {
  const [f, setF] = useState({ title:"", description:"", inputCategory:"STRATEGY", impactTag:"MEDIUM", affectedDomains:[], source:"", sourceLink:"", strategyImpact:"", scanMode:campaignActive?"CYCLE_INTENSIVE":"CONTINUOUS" });
  const valid = f.title.trim() && f.description.trim() && f.affectedDomains.length>0;
  function toggle(d){ setF((s)=>({ ...s, affectedDomains:s.affectedDomains.includes(d)?s.affectedDomains.filter(x=>x!==d):[...s.affectedDomains,d] })); }
  function save(){ onSave({ observationId:`OBS-2026-${rid("")}`, ...f, scanCampaignId:f.scanMode==="CYCLE_INTENSIVE"?campaignId:null, cycleDeferred:false, dateObserved:new Date().toISOString().slice(0,10), capturedBy:actingUser, status:"OPEN", triagedBy:null, triageOutcome:null, linkedInitiativeId:null }); }
  return (
    <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"26px 28px", maxWidth:760 }}>
      <SectionLabel>Capture Observation</SectionLabel>
      <p style={{ fontSize:13, color:C.textMuted, marginTop:-6, marginBottom:20 }}>{campaignActive?"Cycle scan is open — capture the strategic signals for this cycle. ":""}Only starred fields are required.</p>
      <Field label="Title" required><input style={inputStyle} value={f.title} onChange={(e)=>setF({...f,title:e.target.value})} placeholder="Short, recognisable label" /></Field>
      <Field label="Description" required><textarea style={{...inputStyle,minHeight:84,resize:"vertical"}} value={f.description} onChange={(e)=>setF({...f,description:e.target.value})} placeholder="What was observed, and why it matters" /></Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Field label="Category" required><select style={inputStyle} value={f.inputCategory} onChange={(e)=>setF({...f,inputCategory:e.target.value})}>{Object.entries(CATEGORIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
        <Field label="Strategy Impact" required><select style={inputStyle} value={f.impactTag} onChange={(e)=>setF({...f,impactTag:e.target.value})}>{Object.entries(IMPACT).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
      </div>
      <Field label="Affected Domains" required hint="★ = your domain. You can tag other domains too.">
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{ALL_DOMAINS.map((k)=>{const on=f.affectedDomains.includes(k),mine=myDomains.includes(k);return <button key={k} onClick={()=>toggle(k)} title={DOMAINS[k]} style={{ font:FONT, fontSize:12.5, fontWeight:600, color:on?"#fff":C.dark, background:on?C.dark:"#fff", border:`1px solid ${mine?C.dark:C.light}`, borderRadius:20, padding:"6px 13px", cursor:"pointer" }}>{k}{mine?" ★":""}</button>;})}</div>
      </Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Field label="Source"><input style={inputStyle} value={f.source} onChange={(e)=>setF({...f,source:e.target.value})} /></Field>
        <Field label="Source Link"><input style={inputStyle} value={f.sourceLink} onChange={(e)=>setF({...f,sourceLink:e.target.value})} placeholder="https://" /></Field>
      </div>
      <Field label="Strategy Impact Note"><textarea style={{...inputStyle,minHeight:60,resize:"vertical"}} value={f.strategyImpact} onChange={(e)=>setF({...f,strategyImpact:e.target.value})} placeholder="How might this affect the cyber strategy and what capability might it require?" /></Field>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20, borderTop:`1px solid ${C.border}`, paddingTop:18 }}>
        <Btn kind="secondary" onClick={onCancel}>Cancel</Btn><Btn onClick={save} disabled={!valid}>Capture Observation</Btn>
      </div>
    </div>
  );
}

function SweepView({ campaign, myDomains, domainState, openByDomain, onStart, onComplete, onReopen, onOpenObs, onBack, campaignActive }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div><div style={{ fontSize:16, fontWeight:700, color:C.deepest }}>My Cycle Sweep · {campaign.cycleName}</div>
          <div style={{ fontSize:12.5, color:C.textMuted, marginTop:3, maxWidth:680 }}>Clear every open signal (triage, link, dismiss, defer), then declare the horizon scan complete. Declaring locks the domain — you can reopen before the deadline.</div></div>
        <Btn kind="secondary" onClick={onBack}>← Back to Inbox</Btn>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:16 }}>
        {myDomains.map((d)=>{
          const st=domainState[d], open=openByDomain[d]||[], complete=st.status==="COMPLETE", canComplete=open.length===0&&!complete;
          const bc=complete?C.green:st.status==="IN_PROGRESS"?C.amber:C.border;
          return (
            <div key={d} style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderTop:`3px solid ${bc}`, borderRadius:8, padding:"16px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><div style={{ fontSize:14.5, fontWeight:700 }}>{d}</div><div style={{ fontSize:11.5, color:C.textMuted }}>{DOMAINS[d]}</div></div>
                <Badge text={complete?"Complete ✓":st.status==="IN_PROGRESS"?"In progress":"Not started"} color={bc===C.border?C.grey:bc} />
              </div>
              {complete ? (
                <div style={{ marginTop:12, background:"#F1F8F3", border:`1px solid ${C.green}44`, borderRadius:7, padding:"10px 12px", fontSize:12.5, lineHeight:1.5 }}>
                  Declared complete by <strong>{st.completedBy}</strong>.{st.reopenCount>0 && <span style={{color:C.amber}}> Reopened {st.reopenCount}×.</span>}
                  {campaignActive && <div style={{ marginTop:9 }}><Btn kind="secondary" onClick={()=>onReopen(d)}>Reopen Domain</Btn></div>}
                </div>
              ) : (
                <>
                  <div style={{ marginTop:12, fontSize:12.5, fontWeight:600, color:open.length?C.amber:C.green }}>{open.length?`${open.length} open signal${open.length>1?"s":""} to clear`:"No open signals — ready to declare complete"}</div>
                  {open.length>0 && <div style={{ marginTop:9, display:"flex", flexDirection:"column", gap:6 }}>{open.slice(0,5).map((o)=><button key={o.observationId} onClick={()=>onOpenObs(o)} style={{ textAlign:"left", font:FONT, fontSize:12.5, color:C.textDark, background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 10px", cursor:"pointer", display:"flex", justifyContent:"space-between", gap:8, alignItems:"center" }}><span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.title}</span><span style={{ color:IMPACT[o.impactTag].color, fontWeight:700, fontSize:11 }}>{IMPACT[o.impactTag].label}</span></button>)}{open.length>5 && <div style={{ fontSize:11.5, color:C.textMuted }}>+{open.length-5} more</div>}</div>}
                  <div style={{ display:"flex", gap:8, marginTop:13 }}>
                    {st.status==="NOT_STARTED" && <Btn kind="secondary" onClick={()=>onStart(d)}>Start</Btn>}
                    <Btn kind="success" onClick={()=>onComplete(d)} disabled={!canComplete}>Declare Complete</Btn>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OversightTracker({ domainState, openByDomain, onBack, compact }) {
  return (
    <div>
      {!compact ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div><div style={{ fontSize:16, fontWeight:700, color:C.deepest }}>Completion Tracker</div><div style={{ fontSize:12.5, color:C.textMuted, marginTop:3 }}>Where each domain stands. Tracking is for coordination — a slow domain doesn't block the others.</div></div>
          <Btn kind="secondary" onClick={onBack}>← Back</Btn>
        </div>
      ) : <SectionLabel>Domain Completion Tracker</SectionLabel>}
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:C.deepest }}>{["Domain","Lead","Open Signals","Status","Completed By","Reopens"].map((h)=><th key={h} style={{ textAlign:"left", color:"#fff", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, padding:"11px 14px" }}>{h}</th>)}</tr></thead>
          <tbody>{ALL_DOMAINS.map((d,i)=>{const st=domainState[d],open=(openByDomain[d]||[]).length,color=st.status==="COMPLETE"?C.green:st.status==="IN_PROGRESS"?C.amber:C.grey;return (
            <tr key={d} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
              <td style={{ padding:"11px 14px" }}><div style={{ fontWeight:700, fontSize:13.5 }}>{d}</div><div style={{ fontSize:11.5, color:C.textMuted }}>{DOMAINS[d]}</div></td>
              <td style={{ padding:"11px 14px", fontSize:12.5 }}>{DOMAIN_LEAD_NAME[d]||"—"}</td>
              <td style={{ padding:"11px 14px", fontSize:13, fontWeight:600, color:open?C.amber:C.green }}>{open}</td>
              <td style={{ padding:"11px 14px" }}><Badge text={st.status==="COMPLETE"?"Complete":st.status==="IN_PROGRESS"?"In progress":"Not started"} color={color} /></td>
              <td style={{ padding:"11px 14px", fontSize:12.5, color:C.textMuted }}>{st.completedBy||"—"}</td>
              <td style={{ padding:"11px 14px", fontSize:13 }}>{st.reopenCount>0?<span style={{color:C.amber,fontWeight:700}}>{st.reopenCount}</span>:<span style={{color:C.textMuted}}>0</span>}</td>
            </tr>
          );})}</tbody>
        </table>
      </div>
    </div>
  );
}

function TriagePanel({ obs, onClose, updateObs, onCreateInitiative, onOpenInitiative, actingUser, campaignActive, locked, isOversight }) {
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  const [linkId, setLinkId] = useState("");
  const canTriage = obs.status==="OPEN" && !locked && !isOversight;

  function linkExisting(){ if(!linkId.trim())return; updateObs(obs.observationId,{ status:"LINKED_TO_INITIATIVE", triagedBy:actingUser, triageOutcome:"LINKED_EXISTING", linkedInitiativeId:linkId.trim() }); setMode(null); }
  function dismiss(){ if(!reason.trim())return; updateObs(obs.observationId,{ status:"DISMISSED", triageOutcome:"DISMISSED", dismissalReason:reason.trim() }); setMode(null); }
  function defer(){ if(!reason.trim())return; updateObs(obs.observationId,{ cycleDeferred:true, cycleDeferralReason:reason.trim() }); setMode(null); }
  function revive(){ updateObs(obs.observationId,{ status:"OPEN", dismissalReason:null }); }

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(13,46,69,0.32)", zIndex:40 }} />
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:460, maxWidth:"92vw", background:C.cardBg, borderLeft:`1px solid ${C.border}`, boxShadow:"-12px 0 32px rgba(13,46,69,0.16)", zIndex:41, overflowY:"auto", font:FONT }}>
        <div style={{ background:C.deepest, color:"#fff", padding:"18px 22px", position:"sticky", top:0, zIndex:2 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div><div style={{ fontSize:11.5, opacity:0.8 }}>{obs.observationId}</div><div style={{ fontSize:16, fontWeight:700, marginTop:3, maxWidth:330 }}>{obs.title}</div></div>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:"#fff", fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
          </div>
          <div style={{ display:"flex", gap:7, marginTop:12, flexWrap:"wrap" }}><Badge text={CATEGORIES[obs.inputCategory].label} color="#fff" /><Badge text={`${IMPACT[obs.impactTag].label} impact`} color="#fff" /><Badge text={OBS_STATUS[obs.status]?.label||obs.status} color="#fff" /></div>
        </div>
        <div style={{ padding:"20px 22px" }}>
          <SectionLabel>Signal</SectionLabel>
          <p style={{ fontSize:13.5, lineHeight:1.55, marginTop:-4 }}>{obs.description}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}>
            <Meta label="Affected Domains" value={obs.affectedDomains.join(", ")} />
            <Meta label="Scan Mode" value={obs.scanMode==="CYCLE_INTENSIVE"?"Cycle-intensive":"Continuous"} />
            <Meta label="Source" value={obs.source||"—"} />
            <Meta label="Observed" value={obs.dateObserved} />
            <Meta label="Captured by" value={obs.capturedBy} />
            {obs.linkedInitiativeId && <Meta label="Initiative" value={obs.linkedInitiativeId} />}
          </div>
          {obs.strategyImpact && <div style={{ marginTop:14, background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:7, padding:"11px 13px", fontSize:13, lineHeight:1.5 }}><span style={{ fontWeight:700, color:C.deepest }}>Strategy impact: </span>{obs.strategyImpact}</div>}
          {obs.cycleDeferred && <div style={{ marginTop:14, background:"#FBF7EF", border:`1px solid ${C.amber}55`, borderRadius:7, padding:"11px 13px", fontSize:13 }}><span style={{ fontWeight:700, color:C.amber }}>Deferred this cycle: </span>{obs.cycleDeferralReason}</div>}
          {obs.dismissalReason && <div style={{ marginTop:14, background:"#FBF3EF", border:`1px solid ${C.amber}55`, borderRadius:7, padding:"11px 13px", fontSize:13 }}><span style={{ fontWeight:700, color:C.amber }}>Dismissed: </span>{obs.dismissalReason}</div>}

          <div style={{ height:22 }} />
          <SectionLabel>{isOversight?"Status":"Triage"}</SectionLabel>

          {isOversight && <p style={{ fontSize:13, color:C.textMuted, marginTop:-4 }}>Oversight view — read-only. Triage is done by the domain leads whose domains this signal is tagged to.</p>}
          {!isOversight && obs.status==="OPEN" && locked && <p style={{ fontSize:13, color:C.textMuted, marginTop:-4 }}>The relevant domain is declared complete and locked. Reopen it from the cycle sweep to triage this signal.</p>}

          {canTriage && mode===null && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:12.5, color:C.textMuted, marginTop:-4 }}>Creating a new initiative opens its definition form, pre-filled from this observation, with you as owner. Endorsement happens later.</p>
              <Btn onClick={()=>onCreateInitiative(obs)}>Create New Initiative (open definition) →</Btn>
              <Btn kind="secondary" onClick={()=>setMode("link")}>Link to Existing Initiative</Btn>
              <Btn kind="danger" onClick={()=>setMode("dismiss")}>Dismiss</Btn>
              {campaignActive && <Btn kind="ghost" onClick={()=>setMode("defer")}>Defer out of this cycle</Btn>}
            </div>
          )}
          {canTriage && mode==="link" && (
            <div>
              <Field label="Existing Initiative ID" required><input style={inputStyle} value={linkId} onChange={(e)=>setLinkId(e.target.value)} placeholder="e.g. CPM-2026-009" /></Field>
              <p style={{ fontSize:12, color:C.textMuted, marginTop:-6 }}>Attaches this signal as supporting context. No endorsement needed.</p>
              <div style={{ display:"flex", gap:9, marginTop:10 }}><Btn kind="secondary" onClick={()=>setMode(null)}>Back</Btn><Btn kind="success" onClick={linkExisting} disabled={!linkId.trim()}>Confirm Link</Btn></div>
            </div>
          )}
          {canTriage && mode==="dismiss" && <ReasonBox label="Dismissal Reason" placeholder="Why is this not being pursued?" reason={reason} setReason={setReason} onBack={()=>setMode(null)} confirmKind="danger" confirmText="Confirm Dismiss" onConfirm={dismiss} />}
          {canTriage && mode==="defer" && <div><ReasonBox label="Deferral Reason" placeholder="Why hold this out of the current cycle?" reason={reason} setReason={setReason} onBack={()=>setMode(null)} confirmKind="primary" confirmText="Confirm Defer" onConfirm={defer} /><p style={{ fontSize:12, color:C.textMuted }}>Deferring counts this as handled for the sweep without forcing it into the cycle.</p></div>}

          {obs.status==="TRIAGED" && (
            <div style={{ background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:7, padding:"13px 15px", fontSize:13, lineHeight:1.5 }}>
              Triaged into draft initiative <strong>{obs.linkedInitiativeId}</strong> by <strong>{obs.triagedBy}</strong>. Now being defined; then CSSMO → CISO endorsement.
              <div style={{ marginTop:11 }}><Btn kind="secondary" onClick={()=>onOpenInitiative(obs.linkedInitiativeId)}>Open Initiative Definition →</Btn></div>
            </div>
          )}
          {obs.status==="LINKED_TO_INITIATIVE" && <div style={{ background:"#F1F8F3", border:`1px solid ${C.green}44`, borderRadius:7, padding:"13px 15px", fontSize:13 }}>Linked to existing initiative <strong>{obs.linkedInitiativeId}</strong> as supporting context.</div>}
          {["DISMISSED","ARCHIVED"].includes(obs.status) && !isOversight && <div><p style={{ fontSize:12.5, color:C.textMuted, marginTop:-4 }}>Dismissed but searchable. Revive if the signal recurs.</p><Btn kind="secondary" onClick={revive}>Revive to Open</Btn></div>}
        </div>
      </div>
    </>
  );
}
function ReasonBox({ label, placeholder, reason, setReason, onBack, onConfirm, confirmKind, confirmText }) {
  return (
    <div>
      <Field label={label} required><textarea style={{ ...inputStyle, minHeight:70, resize:"vertical" }} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder={placeholder} /></Field>
      <div style={{ display:"flex", gap:9 }}><Btn kind="secondary" onClick={onBack}>Back</Btn><Btn kind={confirmKind} onClick={onConfirm} disabled={!reason.trim()}>{confirmText}</Btn></div>
    </div>
  );
}

function Initiatives({ identity, isLead, isOversight, initiatives, updateInit, updateObs, activeId, setActiveId, plans, onProceedToBudgeting }) {
  if (activeId) {
    const init = initiatives.find((i) => i.initiativeId === activeId);
    if (!init) { setActiveId(null); return null; }
    const inScope = isOversight || identity.domains.includes(init.domainId) || init.initiativeOwnerId === identity.name;
    if (!inScope) {
      return (
        <div style={{ padding:"40px 28px" }}>
          <Btn kind="secondary" onClick={() => setActiveId(null)}>← All Initiatives</Btn>
          <div style={{ marginTop:20, background:C.cardBg, border:`1px dashed ${C.border}`, borderRadius:8, padding:"40px", textAlign:"center", color:C.textMuted, fontSize:14 }}>
            This initiative is outside your domains. Only its owning domain leads and cyber leadership can view it.
          </div>
        </div>
      );
    }
    return <InitiativeDetail init={init} identity={identity} isOversight={isOversight} updateInit={updateInit} updateObs={updateObs} onBack={() => setActiveId(null)} plan={plans.find((p)=>p.initiativeId===init.initiativeId)} onProceedToBudgeting={onProceedToBudgeting} />;
  }
  return <InitiativeList initiatives={initiatives} identity={identity} isOversight={isOversight} onOpen={setActiveId} onProceedToBudgeting={onProceedToBudgeting} plans={plans} />;
}

function InitiativeList({ initiatives, identity, isOversight, onOpen, onProceedToBudgeting, plans = [] }) {
  const statusMeta = {
    DRAFT:{label:"Draft",color:C.amber},
    PENDING_CSSMO:{label:"Pending CSSMO",color:C.amber},
    PENDING_CISO:{label:"Pending CISO",color:C.amber},
    ENDORSED:{label:"Endorsed",color:C.green},
    SENT_BACK:{label:"Sent back",color:C.red},
    DISMISSED:{label:"Dismissed",color:C.grey},
  };

  const scoped = isOversight
    ? initiatives
    : initiatives.filter(
        (i) => identity.domains.includes(i.domainId) || i.initiativeOwnerId === identity.name
      );

  const awaitingMe = isOversight ? scoped.filter((i) => (identity.role==="CSSMO" && i.status==="PENDING_CSSMO") || (identity.role==="CISO" && i.status==="PENDING_CISO")) : [];

  return (
    <div style={{ padding:"22px 28px 40px" }}>
      {isOversight && awaitingMe.length>0 && (
        <div style={{ background:"#FBF7EF", border:`1px solid ${C.amber}55`, borderRadius:8, padding:"13px 16px", marginBottom:18, fontSize:13 }}>
          <strong style={{ color:C.amber }}>{awaitingMe.length} initiative{awaitingMe.length>1?"s":""} awaiting your endorsement.</strong> Open one to review and decide.
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.deepest }}>
          Initiatives
          {!isOversight && <span style={{ fontSize:12.5, fontWeight:500, color:C.textMuted }}> · {identity.domains.join(", ")}</span>}
        </div>
        <div style={{ fontSize:12.5, color:C.textMuted }}>{scoped.length} {isOversight ? "total" : "in your domains"}</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {scoped.map((it) => {
          const sm = statusMeta[it.status] || { label: it.status, color: C.grey };
          return (
            <div
              key={it.initiativeId}
              onClick={() => onOpen(it.initiativeId)}
              style={{
                background: C.cardBg,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${it.status === "ENDORSED" ? C.green : it.status === "SENT_BACK" ? C.red : it.status.startsWith("PENDING") ? C.amber : C.light}`,
                borderRadius: 10,
                padding: "16px 18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.textDark }}>{it.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                  {it.initiativeId} · {DOMAINS[it.domainId]} · {INITIATIVE_TYPES[it.initiativeTypeId]}
                  {it.originatingObservation && <> · from {it.originatingObservation}</>}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  Owner: {it.initiativeOwnerId}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: C.textMuted }}>Status</span>
                  <Badge text={sm.label} color={sm.color} />
                  {it.status === "ENDORSED" && <span style={{ fontSize: 11.5, color: C.green, fontWeight: 600 }}>✓ ready for budgeting</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                <Btn kind="secondary" onClick={() => onOpen(it.initiativeId)}>View Details →</Btn>
                {it.status === "ENDORSED" && (
                  <Btn kind="primary" onClick={(e) => { e.stopPropagation(); onProceedToBudgeting && onProceedToBudgeting(it.initiativeId); }}>
                    {plans.some((p)=>p.initiativeId===it.initiativeId) ? "Open Budget Plan →" : "Proceed to Budgeting →"}
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
        {scoped.length === 0 && (
          <div style={{ background:C.cardBg, border:`1px dashed ${C.border}`, borderRadius:8, padding:"40px", textAlign:"center", color:C.textMuted, fontSize:14 }}>
            {isOversight ? "No initiatives yet." : "No initiatives in your domains yet. Triage an observation in Horizon Scan to create one."}
          </div>
        )}
      </div>
    </div>
  );
}

function InitiativeDetail({ init, identity, isOversight, updateInit, updateObs, onBack, plan, onProceedToBudgeting }) {
  const isOwner = init.initiativeOwnerId === identity.name;
  const editable = isOwner && ["DRAFT", "SENT_BACK"].includes(init.status);
  const showEndorserView = isOversight;

  function set(patch) { updateInit(init.initiativeId, patch); }

  return (
    <div>
      <div style={{ padding:"16px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <Btn kind="secondary" onClick={onBack}>← All Initiatives</Btn>
        <div style={{ fontSize:12.5, color:C.textMuted }}>{init.initiativeId}</div>
      </div>
      <StatusRibbon init={init} />
      {showEndorserView ? (
        <EndorserView init={init} role={identity.role} set={set} updateObs={updateObs} readOnly={false} />
      ) : (
        <OwnerForm init={init} set={set} updateObs={updateObs} editable={editable} isOwner={isOwner} />
      )}
      <BudgetingGate init={init} plan={plan} onProceedToBudgeting={onProceedToBudgeting} />
    </div>
  );
}

function BudgetingGate({ init, plan, onProceedToBudgeting }) {
  const endorsed = init.status === "ENDORSED";
  const hasPlan = !!plan;
  return (
    <div style={{ padding:"0 28px 40px", maxWidth: 1100 }}>
      <div
        style={{
          marginTop: 8,
          background: endorsed ? "linear-gradient(180deg,#fff,#F1F8F3)" : "#F7FBFE",
          border: `1px solid ${endorsed ? C.green + "66" : C.border}`,
          borderLeft: `4px solid ${endorsed ? C.green : C.light}`,
          borderRadius: 10,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: endorsed ? C.green : C.textMuted }}>
            {endorsed ? (hasPlan ? "Budget Plan In Progress" : "Ready for Budgeting") : "Budgeting Locked"}
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, maxWidth: 620, lineHeight: 1.5 }}>
            {endorsed
              ? hasPlan
                ? `Plan ${plan.planId} covers ${plan.coveredYears[0]}–${plan.coveredYears[plan.coveredYears.length-1]} and is currently at the ${planStageLabel(plan)} stage.`
                : "This initiative is fully endorsed. Begin the budgeting workflow — Research, RFI, then Leadership Review."
              : "An initiative must be fully endorsed (CSSMO → CISO) before it can enter budgeting. Complete the definition and obtain endorsement first."}
          </div>
          {!endorsed && (
            <div style={{ marginTop: 8 }}>
              <Badge
                text={
                  init.status === "DRAFT"
                    ? "Still in draft — not yet submitted"
                    : init.status === "SENT_BACK"
                    ? "Sent back — needs rework"
                    : init.status === "DISMISSED"
                    ? "Dismissed"
                    : `Awaiting ${init.status === "PENDING_CSSMO" ? "CSSMO" : "CISO"} endorsement`
                }
                color={C.amber}
              />
            </div>
          )}
        </div>
        <div title={endorsed ? "" : "Available once the initiative is fully endorsed"}>
          <Btn kind={endorsed ? "primary" : "ghost"} disabled={!endorsed} onClick={() => endorsed && onProceedToBudgeting && onProceedToBudgeting(init.initiativeId)}>
            {endorsed ? (hasPlan ? "Open Budget Plan →" : "Proceed to Budgeting →") : "Proceed to Budgeting"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function StatusRibbon({ init }) {
  const missing = computeMissing(init);
  const statusMeta = {
    DRAFT:{label: missing.length ? `Draft · ${missing.length} field${missing.length===1?"":"s"} left` : "Draft · ready to submit", color:C.amber},
    PENDING_CSSMO:{label:"Pending CSSMO", color:C.amber},
    PENDING_CISO:{label:"Pending CISO", color:C.amber},
    ENDORSED:{label:"Endorsed", color:C.green},
    SENT_BACK:{label:"Sent back for rework", color:C.red},
    DISMISSED:{label:"Dismissed", color:C.grey},
  }[init.status] || { label: init.status, color: C.grey };

  const chain = ["DRAFT","PENDING_CSSMO","PENDING_CISO","ENDORSED"];
  const idx = chain.indexOf(init.status);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:18, padding:"13px 28px", background:"#fff", borderBottom:`1px solid ${C.border}`, flexWrap:"wrap" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, color:C.textMuted }}>Status</span>
        <Badge text={statusMeta.label} color={statusMeta.color} />
        {init.status === "ENDORSED" && <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>✓ ready for budgeting</span>}
      </div>
      {!["DISMISSED"].includes(init.status) && (
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {chain.map((s,i)=>{
            const done = idx>=0 && i<idx;
            const cur = i===idx;
            const color = done ? C.green : cur ? statusMeta.color : C.border;
            const labels = { DRAFT:"Draft", PENDING_CSSMO:"CSSMO", PENDING_CISO:"CISO", ENDORSED:"Endorsed" };
            return (
              <React.Fragment key={s}>
                {i>0 && <span style={{ width:18, height:2, background: done||cur ? color : C.border }} />}
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:9, height:9, borderRadius:"50%", background: done?C.green:cur?color:"#fff", border:`2px solid ${color}` }} />
                  <span style={{ fontSize:11, color: cur?C.textDark:C.textMuted, fontWeight: cur?700:500 }}>{labels[s]}</span>
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

function computeMissing(init) {
  const m = [];
  if (!init.name?.trim()) m.push("Name");
  if (!init.domainId) m.push("Domain");
  if (!init.subDomainId) m.push("Sub-domain");
  if (!init.initiativeTypeId) m.push("Type");
  if (!init.problemStatement?.trim()) m.push("Problem statement");
  if (!init.visionStatement?.trim()) m.push("Vision statement");
  if (!init.expectedBusinessOutcome?.trim()) m.push("Expected outcome");
  if (!init.inScopeDescription?.trim()) m.push("In-scope description");
  if (!init.cisoStrategicPillarId) m.push("Strategic pillar");
  if (!init.kpis || init.kpis.length===0) m.push("At least one KPI");
  if (!init.sponsorId) m.push("Sponsor");
  return m;
}

function OwnerForm({ init, set, updateObs, editable = true, isOwner = true }) {
  const [step, setStep] = useState(0);
  const missing = computeMissing(init);
  const definitionComplete = missing.length === 0;
  const locked = !editable;

  function submit() {
    if (!definitionComplete) return;
    set({ status:"PENDING_CSSMO" });
  }
  function resubmit() { set({ status:"PENDING_CSSMO" }); }

  return (
    <div style={{ display:"flex" }}>
      <div style={{ width:220, minHeight:"calc(100vh - 170px)", background:"#fff", borderRight:`1px solid ${C.border}`, padding:"22px 0" }}>
        {STEPS.map((s,i)=>{const active=i===step;return <button key={s} onClick={()=>setStep(i)} style={{ width:"100%", textAlign:"left", font:FONT, fontSize:13.5, fontWeight:active?700:500, color:active?C.deepest:C.textMuted, background:active?"#EAF4FB":"transparent", border:"none", borderLeft:`3px solid ${active?C.dark:"transparent"}`, padding:"11px 20px", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}><span style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${active?C.dark:C.border}`, display:"grid", placeItems:"center", fontSize:11.5, fontWeight:700, color:active?C.dark:C.textMuted }}>{i+1}</span>{s}</button>;})}
      </div>
      <div style={{ flex:1, padding:"26px 32px", maxWidth:860 }}>
        {!isOwner && (
          <div style={{ background:"#EEF4F8", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px", fontSize:13, marginBottom:20, lineHeight:1.5 }}>
            Viewing <strong>{init.initiativeOwnerId}</strong>'s initiative. You can review the full definition below; only the owner can edit it.
          </div>
        )}
        {isOwner && init.status==="ENDORSED" && (
          <div style={{ background:"#F1F8F3", border:`1px solid ${C.green}55`, borderRadius:8, padding:"14px 16px", fontSize:13, marginBottom:20, lineHeight:1.5 }}>
            <strong style={{ color:C.green }}>Fully endorsed and locked.</strong> The definition is fixed below for reference. This initiative is ready for budgeting.
          </div>
        )}
        {isOwner && ["PENDING_CSSMO","PENDING_CISO"].includes(init.status) && (
          <div style={{ background:"#FBF7EF", border:`1px solid ${C.amber}55`, borderRadius:8, padding:"12px 16px", fontSize:13, marginBottom:20, lineHeight:1.5 }}>
            Submitted for endorsement — currently {init.status.replace("_"," ").toLowerCase()}. The definition is shown below for reference but locked from editing while leadership reviews it. It reopens for editing if sent back.
          </div>
        )}
        {isOwner && init.status==="SENT_BACK" && <div style={{ background:"#FBEEEC", border:`1px solid ${C.red}55`, borderRadius:8, padding:"12px 16px", fontSize:13, marginBottom:20, lineHeight:1.5 }}><strong style={{ color:C.red }}>Sent back for rework.</strong> {init.endorsements.filter((e)=>e.decision==="SENT_BACK").slice(-1)[0]?.comment}<div style={{ marginTop:10 }}><Btn onClick={resubmit}>Resubmit for Endorsement</Btn></div></div>}

        <div style={{ pointerEvents:locked?"none":"auto", opacity:locked?0.65:1 }}>
          {step===0 && <StepIdentity init={init} set={set} />}
          {step===1 && <StepVision init={init} set={set} />}
          {step===2 && <StepScope init={init} set={set} />}
          {step===3 && <StepAlignment init={init} set={set} />}
          {step===4 && <StepKPIs init={init} set={set} />}
          {step===5 && <StepSubmit init={init} set={set} missing={missing} definitionComplete={definitionComplete} onSubmit={submit} locked={locked} />}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, borderTop:`1px solid ${C.border}`, paddingTop:18 }}>
          <Btn kind="secondary" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>← Back</Btn>
          {step<STEPS.length-1 ? <Btn onClick={()=>setStep(Math.min(STEPS.length-1,step+1))}>Next →</Btn> : <span />}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, blurb }) {
  return <div style={{ marginBottom:20 }}><div style={{ fontSize:18, fontWeight:700, color:C.deepest }}>{title}</div>{blurb && <div style={{ fontSize:13, color:C.textMuted, marginTop:4, lineHeight:1.5 }}>{blurb}</div>}</div>;
}
function StepIdentity({ init, set }) {
  const subs = SUBDOMAINS[init.domainId] || [];
  return (
    <div>
      <StepHeader title="Identity & Classification" blurb="Pre-filled from the triaging observation. This is the shared CPM initiative record." />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <Field label="Initiative Name" required><input style={inputStyle} value={init.name} onChange={(e)=>set({name:e.target.value})} /></Field>
        <Field label="Initiative ID"><input style={{ ...inputStyle, background:"#EEF4F8", color:C.textMuted }} value={init.initiativeId} readOnly /></Field>
        <Field label="Domain" required><select style={inputStyle} value={init.domainId} onChange={(e)=>set({domainId:e.target.value, subDomainId:""})}><option value="">— select —</option>{Object.entries(DOMAINS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Sub-domain / Capability" required><select style={inputStyle} value={init.subDomainId} onChange={(e)=>set({subDomainId:e.target.value})}><option value="">— select —</option>{subs.map((s)=><option key={s} value={s}>{s}</option>)}</select></Field>
        <Field label="Initiative Type" required hint="Drives which budgeting stages apply later."><select style={inputStyle} value={init.initiativeTypeId} onChange={(e)=>set({initiativeTypeId:e.target.value})}><option value="">— select —</option>{Object.entries(INITIATIVE_TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Initiative Owner" required><select style={inputStyle} value={init.initiativeOwnerId} onChange={(e)=>set({initiativeOwnerId:e.target.value})}>{USERS.map((u)=><option key={u} value={u}>{u}</option>)}</select></Field>
        <Field label="Domain Lead" required><select style={inputStyle} value={init.domainLeadId} onChange={(e)=>set({domainLeadId:e.target.value})}>{USERS.map((u)=><option key={u} value={u}>{u}</option>)}</select></Field>
      </div>
    </div>
  );
}
function StepVision({ init, set }) {
  return (
    <div>
      <StepHeader title="Strategic Definition" blurb="The substance Research and RFI will reason about. Be specific — thin definitions produce thin estimates." />
      <Field label="Problem Statement" required><textarea style={{ ...inputStyle, minHeight:90, resize:"vertical" }} value={init.problemStatement} onChange={(e)=>set({problemStatement:e.target.value})} /></Field>
      <Field label="Vision Statement" required hint="What does success look like once delivered?"><textarea style={{ ...inputStyle, minHeight:90, resize:"vertical" }} value={init.visionStatement} onChange={(e)=>set({visionStatement:e.target.value})} /></Field>
      <Field label="Expected Business Outcome" required><textarea style={{ ...inputStyle, minHeight:80, resize:"vertical" }} value={init.expectedBusinessOutcome} onChange={(e)=>set({expectedBusinessOutcome:e.target.value})} /></Field>
    </div>
  );
}
function StepScope({ init, set }) {
  function add(){ set({ outOfScope:[...init.outOfScope,{item:"",reason:""}] }); }
  function upd(i,k,v){ set({ outOfScope:init.outOfScope.map((x,idx)=>idx===i?{...x,[k]:v}:x) }); }
  function rem(i){ set({ outOfScope:init.outOfScope.filter((_,idx)=>idx!==i) }); }
  return (
    <div>
      <StepHeader title="Scope" blurb="What's in, what's explicitly out, and the assumptions the estimate will rest on." />
      <Field label="In-scope Description" required><textarea style={{ ...inputStyle, minHeight:90, resize:"vertical" }} value={init.inScopeDescription} onChange={(e)=>set({inScopeDescription:e.target.value})} /></Field>
      <Field label="Out-of-scope / Exclusions" hint="State what this will NOT cover, and why — protects the estimate.">
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {init.outOfScope.map((x,i)=><div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}><input style={{ ...inputStyle, flex:1 }} placeholder="Excluded item" value={x.item} onChange={(e)=>upd(i,"item",e.target.value)} /><input style={{ ...inputStyle, flex:1.4 }} placeholder="Reason" value={x.reason} onChange={(e)=>upd(i,"reason",e.target.value)} /><button onClick={()=>rem(i)} style={{ background:"transparent", border:"none", color:C.red, fontSize:18, cursor:"pointer" }}>×</button></div>)}
          <div><Btn kind="secondary" onClick={add}>+ Add Exclusion</Btn></div>
        </div>
      </Field>
      <Field label="Assumptions"><textarea style={{ ...inputStyle, minHeight:70, resize:"vertical" }} value={init.assumptions} onChange={(e)=>set({assumptions:e.target.value})} /></Field>
    </div>
  );
}
function StepAlignment({ init, set }) {
  function tog(f){ set({ frameworkAlignment:init.frameworkAlignment.includes(f)?init.frameworkAlignment.filter(x=>x!==f):[...init.frameworkAlignment,f] }); }
  return (
    <div>
      <StepHeader title="Strategic Alignment" blurb="How this ties to the CISO's strategy and which frameworks it advances." />
      <Field label="CISO Strategic Pillar" required><select style={inputStyle} value={init.cisoStrategicPillarId} onChange={(e)=>set({cisoStrategicPillarId:e.target.value})}><option value="">— select —</option>{Object.entries(PILLARS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Framework Alignment" hint="Select all that apply."><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{FRAMEWORKS.map((f)=><Pill key={f} on={init.frameworkAlignment.includes(f)} onClick={()=>tog(f)}>{f}</Pill>)}</div></Field>
    </div>
  );
}
function StepKPIs({ init, set }) {
  const [picker, setPicker] = useState(false);
  const sug = KPI_LIBRARY.filter((k)=>k.domains.includes(init.domainId));
  const other = KPI_LIBRARY.filter((k)=>!k.domains.includes(init.domainId));
  function addLib(k){ set({ kpis:[...init.kpis,{ uid:Math.random().toString(36).slice(2,8), source:"LIBRARY", kpiLibraryId:k.id, name:k.name, unit:k.unit, direction:k.direction, measurementMethod:k.measurementMethod, baseline:"", target:"", targetDate:"", wasEditedByUser:false }] }); setPicker(false); }
  function addMan(){ set({ kpis:[...init.kpis,{ uid:Math.random().toString(36).slice(2,8), source:"MANUAL", kpiLibraryId:null, name:"", unit:"", direction:"HIGHER_IS_BETTER", measurementMethod:"", baseline:"", target:"", targetDate:"", wasEditedByUser:true }] }); }
  function upd(uid,k,v){ set({ kpis:init.kpis.map((x)=>x.uid===uid?{...x,[k]:v,wasEditedByUser:true}:x) }); }
  function rem(uid){ set({ kpis:init.kpis.filter((x)=>x.uid!==uid) }); }
  return (
    <div>
      <StepHeader title="KPIs" blurb="Every initiative needs at least one. Pick from the library, add your own, or (soon) generate with AI." />
      <div style={{ display:"flex", gap:9, marginBottom:18, flexWrap:"wrap" }}>
        <Btn onClick={()=>setPicker((p)=>!p)}>＋ From Library</Btn>
        <Btn kind="secondary" onClick={addMan}>＋ Add Manually</Btn>
        <button disabled title="AI generation will be designed as its own piece." style={{ font:FONT, fontSize:13, fontWeight:600, color:C.textMuted, background:"#F2F6FA", border:`1px dashed ${C.light}`, borderRadius:6, padding:"8px 14px", cursor:"not-allowed", display:"flex", gap:7, alignItems:"center" }}>✦ Generate with AI <Badge text="Soon" color={C.medium} /></button>
      </div>
      {picker && (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"16px 18px", marginBottom:18 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.deepest, textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Suggested for {DOMAINS[init.domainId]}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>{sug.map((k)=><LibRow key={k.id} k={k} onAdd={()=>addLib(k)} disabled={init.kpis.some((x)=>x.kpiLibraryId===k.id)} />)}{sug.length===0 && <div style={{ fontSize:12.5, color:C.textMuted }}>No domain-specific suggestions; see others below.</div>}</div>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:0.6, margin:"14px 0 10px" }}>Other library KPIs</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>{other.map((k)=><LibRow key={k.id} k={k} onAdd={()=>addLib(k)} disabled={init.kpis.some((x)=>x.kpiLibraryId===k.id)} />)}</div>
        </div>
      )}
      {init.kpis.length===0 ? (
        <div style={{ background:"#fff", border:`1px dashed ${C.border}`, borderRadius:8, padding:"30px", textAlign:"center", color:C.textMuted, fontSize:13.5 }}>No KPIs yet. Add at least one to complete the definition.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{init.kpis.map((k)=>(
          <div key={k.uid} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
              <div style={{ flex:1 }}>{k.source==="MANUAL"?<input style={{ ...inputStyle, fontWeight:600 }} placeholder="KPI name" value={k.name} onChange={(e)=>upd(k.uid,"name",e.target.value)} />:<div style={{ fontSize:14.5, fontWeight:700 }}>{k.name}</div>}</div>
              <div style={{ display:"flex", gap:7, alignItems:"center" }}><Badge text={k.source==="LIBRARY"?"Library":k.source==="AI_GENERATED"?"AI":"Manual"} color={k.source==="LIBRARY"?C.dark:k.source==="AI_GENERATED"?C.medium:C.grey} /><button onClick={()=>rem(k.uid)} style={{ background:"transparent", border:"none", color:C.red, fontSize:18, cursor:"pointer" }}>×</button></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:12 }}>
              <MiniField label="Baseline"><input style={inputStyle} value={k.baseline} onChange={(e)=>upd(k.uid,"baseline",e.target.value)} /></MiniField>
              <MiniField label="Target"><input style={inputStyle} value={k.target} onChange={(e)=>upd(k.uid,"target",e.target.value)} /></MiniField>
              <MiniField label="Unit"><input style={inputStyle} value={k.unit} onChange={(e)=>upd(k.uid,"unit",e.target.value)} disabled={k.source==="LIBRARY"} /></MiniField>
              <MiniField label="Target Date"><input type="date" style={inputStyle} value={k.targetDate} onChange={(e)=>upd(k.uid,"targetDate",e.target.value)} /></MiniField>
            </div>
            {k.measurementMethod && <div style={{ fontSize:11.5, color:C.textMuted, marginTop:9 }}>Measurement: {k.measurementMethod} · {k.direction==="HIGHER_IS_BETTER"?"higher is better":"lower is better"}</div>}
          </div>
        ))}</div>
      )}
    </div>
  );
}
function LibRow({ k, onAdd, disabled }) {
  return <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:6, padding:"9px 12px" }}><div><div style={{ fontSize:13, fontWeight:600 }}>{k.name}</div><div style={{ fontSize:11.5, color:C.textMuted }}>{k.unit} · {k.direction==="HIGHER_IS_BETTER"?"↑ better":"↓ better"}</div></div><Btn kind="secondary" onClick={onAdd} disabled={disabled}>{disabled?"Added":"Add"}</Btn></div>;
}
function MiniField({ label, children }) {
  return <div><div style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted, marginBottom:4 }}>{label}</div>{children}</div>;
}
function StepSubmit({ init, set, missing, definitionComplete, onSubmit, locked }) {
  function add(){ set({ dependencies:[...init.dependencies,{dependsOnId:"",nature:"",riskIfDelayed:"",severity:"MEDIUM"}] }); }
  function upd(i,k,v){ set({ dependencies:init.dependencies.map((d,idx)=>idx===i?{...d,[k]:v}:d) }); }
  function rem(i){ set({ dependencies:init.dependencies.filter((_,idx)=>idx!==i) }); }
  return (
    <div>
      <StepHeader title="Sponsor, Dependencies & Submit" blurb="Name the executive sponsor, capture dependencies, then submit for CSSMO → CISO endorsement." />
      <Field label="Executive Sponsor" required hint="An organisational leader who backs this initiative. Sits on the initiative and persists across budget cycles.">
        <select style={inputStyle} value={init.sponsorId||""} onChange={(e)=>set({sponsorId:e.target.value||null})}><option value="">— select sponsor —</option>{SPONSORS.map((u)=><option key={u} value={u}>{u}</option>)}</select>
      </Field>
      <Field label="Dependencies" hint="Other initiatives this relies on. Soft gate later — warned at budget approval if a dependency isn't funded for the same years.">
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {init.dependencies.map((d,i)=><div key={i} style={{ background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:7, padding:"12px 13px" }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <select style={{ ...inputStyle, flex:1 }} value={d.dependsOnId} onChange={(e)=>upd(i,"dependsOnId",e.target.value)}><option value="">— depends on —</option>{EXISTING_INITIATIVES.map((x)=><option key={x.id} value={x.id}>{x.id} · {x.name}</option>)}</select>
              <select style={{ ...inputStyle, width:120 }} value={d.severity} onChange={(e)=>upd(i,"severity",e.target.value)}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
              <button onClick={()=>rem(i)} style={{ background:"transparent", border:"none", color:C.red, fontSize:18, cursor:"pointer" }}>×</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}><input style={inputStyle} placeholder="Nature of dependency" value={d.nature} onChange={(e)=>upd(i,"nature",e.target.value)} /><input style={inputStyle} placeholder="Risk if delayed" value={d.riskIfDelayed} onChange={(e)=>upd(i,"riskIfDelayed",e.target.value)} /></div>
          </div>)}
          <div><Btn kind="secondary" onClick={add}>+ Add Dependency</Btn></div>
        </div>
      </Field>
      <div style={{ background:definitionComplete?"#F1F8F3":"#FBF7EF", border:`1px solid ${definitionComplete?C.green+"55":C.amber+"55"}`, borderRadius:8, padding:"16px 18px", marginTop:8 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:definitionComplete?C.green:C.amber, marginBottom:definitionComplete?0:9 }}>{definitionComplete?"✓ Definition complete — ready to submit for endorsement":`${missing.length} item${missing.length===1?"":"s"} still needed`}</div>
        {!definitionComplete && <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>{missing.map((m)=><Badge key={m} text={m} color={C.amber} />)}</div>}
      </div>
      <div style={{ marginTop:18 }}><Btn onClick={onSubmit} disabled={!definitionComplete||locked}>Submit for Endorsement →</Btn>{locked && <span style={{ marginLeft:12, fontSize:12.5, color:C.textMuted }}>Already submitted — {init.status.replace("_"," ").toLowerCase()}.</span>}</div>
    </div>
  );
}

function EndorserView({ init, role, set, updateObs, readOnly }) {
  const [mode, setMode] = useState(null);
  const [comment, setComment] = useState("");
  const myStep = role;
  const canAct = !readOnly && ((role==="CSSMO" && init.status==="PENDING_CSSMO") || (role==="CISO" && init.status==="PENDING_CISO"));
  const notReady = init.status==="DRAFT" || init.status==="SENT_BACK";

  function endorse(){
    const next = myStep==="CSSMO"?"PENDING_CISO":"ENDORSED";
    const patch = { endorsements:[...init.endorsements,{step:myStep,decision:"ENDORSED",by:myStep==="CSSMO"?"L. Romano (COO · CSSMO)":"CISO Office",date:new Date().toISOString().slice(0,10),comment:""}], status:next };
    set(patch);
  }
  function sendBack(){ if(!comment.trim())return; set({ endorsements:[...init.endorsements,{step:myStep,decision:"SENT_BACK",by:myStep,date:new Date().toISOString().slice(0,10),comment}], status:"SENT_BACK" }); setMode(null); setComment(""); }
  function dismiss(){ if(!comment.trim())return; set({ endorsements:[...init.endorsements,{step:myStep,decision:"DISMISSED",by:myStep,date:new Date().toISOString().slice(0,10),comment}], status:"DISMISSED" }); if(init.originatingObservation) updateObs(init.originatingObservation,{}); setMode(null); setComment(""); }

  return (
    <div style={{ padding:"26px 32px", maxWidth:880 }}>
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:22 }}>
        <div style={{ background:C.deepest, color:"#fff", padding:"16px 20px" }}>
          <div style={{ fontSize:11.5, opacity:0.85 }}>{init.initiativeId}{init.originatingObservation && <> · from {init.originatingObservation}</>}</div>
          <div style={{ fontSize:17, fontWeight:700, marginTop:3 }}>{init.name}</div>
          <div style={{ display:"flex", gap:7, marginTop:10, flexWrap:"wrap" }}><Badge text={DOMAINS[init.domainId]} color="#fff" /><Badge text={INITIATIVE_TYPES[init.initiativeTypeId]} color="#fff" />{init.cisoStrategicPillarId && <Badge text={PILLARS[init.cisoStrategicPillarId]} color="#fff" />}</div>
        </div>
        <div style={{ padding:"18px 20px" }}>
          <ReadBlock label="Problem" text={init.problemStatement} />
          <ReadBlock label="Vision" text={init.visionStatement} />
          <ReadBlock label="Expected Outcome" text={init.expectedBusinessOutcome} />
          <ReadBlock label="In Scope" text={init.inScopeDescription} />
          {init.assumptions && <ReadBlock label="Assumptions" text={init.assumptions} />}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:6 }}>
            <ReadMeta label="Owner" value={init.initiativeOwnerId} />
            <ReadMeta label="Sponsor" value={init.sponsorId||"—"} />
            <ReadMeta label="Sub-domain" value={init.subDomainId||"—"} />
            <ReadMeta label="Frameworks" value={init.frameworkAlignment.join(", ")||"—"} />
          </div>
          <div style={{ marginTop:16 }}>
            <ReadLabel>KPIs ({init.kpis.length})</ReadLabel>
            {init.kpis.map((k)=><div key={k.uid} style={{ fontSize:13, padding:"5px 0", borderBottom:`1px solid ${C.border}` }}><strong>{k.name||"(unnamed)"}</strong> <span style={{ color:C.textMuted }}>— baseline {k.baseline||"?"} → target {k.target||"?"} {k.unit}</span></div>)}
            {init.kpis.length===0 && <div style={{ fontSize:12.5, color:C.textMuted }}>None yet.</div>}
          </div>
          {init.dependencies.length>0 && <div style={{ marginTop:16 }}><ReadLabel>Dependencies</ReadLabel>{init.dependencies.map((d,i)=><div key={i} style={{ fontSize:13, padding:"4px 0" }}>{d.dependsOnId} — {d.nature} <Badge text={d.severity} color={d.severity==="HIGH"?C.red:d.severity==="MEDIUM"?C.amber:C.green} /></div>)}</div>}
        </div>
      </div>

      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
        <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.7, color:C.deepest, marginBottom:14 }}>Endorsement</div>
        <EndorseChain init={init} />
        {init.endorsements.length>0 && <div style={{ marginTop:16 }}>{init.endorsements.map((e,i)=><div key={i} style={{ fontSize:12.5, color:C.textMuted, padding:"5px 0", borderTop:i?`1px solid ${C.border}`:"none" }}><strong style={{ color:e.decision==="ENDORSED"?C.green:e.decision==="DISMISSED"?C.grey:C.red }}>{e.step} {e.decision.toLowerCase().replace("_"," ")}</strong> · {e.date}{e.comment && <> — {e.comment}</>}</div>)}</div>}

        <div style={{ marginTop:18 }}>
          {readOnly && <p style={{ fontSize:13, color:C.textMuted }}>Read-only — you are neither the owner nor an endorser of this initiative.</p>}
          {!readOnly && notReady && <p style={{ fontSize:13, color:C.textMuted }}>{init.status==="SENT_BACK"?"Sent back to the owner — awaiting resubmission.":"Not yet submitted. The owner is still completing the definition."}</p>}
          {init.status==="ENDORSED" && <div style={{ fontSize:13.5, color:C.green, fontWeight:600 }}>✓ Fully endorsed. This initiative can now proceed to budgeting.</div>}
          {init.status==="DISMISSED" && <div style={{ fontSize:13.5, color:C.grey, fontWeight:600 }}>Dismissed at endorsement. Archived but revivable.</div>}
          {!readOnly && !canAct && !notReady && !["ENDORSED","DISMISSED"].includes(init.status) && <p style={{ fontSize:13, color:C.textMuted }}>Awaiting the other endorser. Switch identity to act, if it's your turn.</p>}
          {canAct && mode===null && <div style={{ display:"flex", gap:10 }}><Btn kind="success" onClick={endorse}>Endorse as {myStep} →</Btn><Btn kind="secondary" onClick={()=>setMode("sendback")}>Send Back</Btn><Btn kind="danger" onClick={()=>setMode("dismiss")}>Dismiss</Btn></div>}
          {canAct && mode==="sendback" && <CommentBox label="What needs reworking?" cta="Send Back" kind="secondary" comment={comment} setComment={setComment} onCancel={()=>setMode(null)} onConfirm={sendBack} />}
          {canAct && mode==="dismiss" && <CommentBox label="Reason for dismissal" cta="Confirm Dismiss" kind="danger" comment={comment} setComment={setComment} onCancel={()=>setMode(null)} onConfirm={dismiss} />}
        </div>
      </div>
    </div>
  );
}
function EndorseChain({ init }) {
  const order = ["DRAFT","PENDING_CSSMO","PENDING_CISO","ENDORSED"];
  const idx = order.indexOf(init.status);
  const steps = [{key:"CSSMO",label:"CSSMO endorsement"},{key:"CISO",label:"CISO endorsement"}];
  function state(key){ if(init.status==="DISMISSED")return "stopped"; if(key==="CSSMO")return idx>=2?"done":idx===1?"current":"todo"; if(key==="CISO")return init.status==="ENDORSED"?"done":idx===2?"current":"todo"; return "todo"; }
  return <div>{steps.map((s,i)=>{const st=state(s.key),color=st==="done"?C.green:st==="current"?C.amber:st==="stopped"?C.grey:C.border;return <div key={s.key} style={{ display:"flex", alignItems:"center", gap:11, padding:"6px 0" }}><div style={{ width:22, height:22, borderRadius:"50%", background:st==="done"?C.green:"#fff", border:`2px solid ${color}`, display:"grid", placeItems:"center", color:st==="done"?"#fff":color, fontSize:12, fontWeight:700 }}>{st==="done"?"✓":i+1}</div><div style={{ fontSize:13.5, fontWeight:st==="current"?700:500, color:st==="todo"?C.textMuted:C.textDark }}>{s.label}{st==="current" && <span style={{ marginLeft:8, fontSize:11, color:C.amber, fontWeight:700 }}>• awaiting</span>}</div></div>;})}</div>;
}
function CommentBox({ label, cta, kind, comment, setComment, onCancel, onConfirm }) {
  return <div><Field label={label} required><textarea style={{ ...inputStyle, minHeight:70, resize:"vertical" }} value={comment} onChange={(e)=>setComment(e.target.value)} /></Field><div style={{ display:"flex", gap:9 }}><Btn kind="secondary" onClick={onCancel}>Cancel</Btn><Btn kind={kind} onClick={onConfirm} disabled={!comment.trim()}>{cta}</Btn></div></div>;
}
function ReadBlock({ label, text }) {
  return <div style={{ marginBottom:13 }}><ReadLabel>{label}</ReadLabel><div style={{ fontSize:13.5, color:C.textDark, lineHeight:1.55, marginTop:3 }}>{text||<span style={{ color:C.textMuted }}>—</span>}</div></div>;
}
function ReadLabel({ children }) {
  return <div style={{ fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, color:C.textMuted }}>{children}</div>;
}
function ReadMeta({ label, value }) {
  return <div><ReadLabel>{label}</ReadLabel><div style={{ fontSize:13, color:C.textDark, marginTop:2 }}>{value}</div></div>;
}

function BSectionLabel({ children, right }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.border}`, paddingBottom:6, marginBottom:14 }}>
      <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:C.deepest }}>{children}</div>
      {right}
    </div>
  );
}
const moneyInput = { ...inputStyle, padding:"7px 9px", fontSize:13 };

function Budgeting({ identity, isOversight, initiatives, plans, updatePlan, createPlan, activePlanId, setActivePlanId, pendingInitiativeId, setPendingInitiativeId, onOpenInitiative, cycle, setCycle, campaign }) {
  if (pendingInitiativeId && !activePlanId) {
    const init = initiatives.find((i) => i.initiativeId === pendingInitiativeId);
    if (!init) { setPendingInitiativeId(null); return null; }
    return (
      <PlanSetup
        initiative={init}
        onCancel={() => { setPendingInitiativeId(null); }}
        onCreate={(p) => createPlan(p)}
      />
    );
  }

  if (activePlanId) {
    const plan = plans.find((p) => p.planId === activePlanId);
    if (!plan) { setActivePlanId(null); return null; }
    const init = initiatives.find((i) => i.initiativeId === plan.initiativeId);
    const inScope = isOversight || (init && (identity.domains.includes(init.domainId) || init.initiativeOwnerId === identity.name));
    if (!inScope) {
      return (
        <div style={{ padding:"40px 28px" }}>
          <Btn kind="secondary" onClick={() => setActivePlanId(null)}>← All Budget Plans</Btn>
          <div style={{ marginTop:20, background:C.cardBg, border:`1px dashed ${C.border}`, borderRadius:8, padding:"40px", textAlign:"center", color:C.textMuted, fontSize:14 }}>
            This plan is outside your domains.
          </div>
        </div>
      );
    }
    return <Workspace plan={plan} initiative={init} updatePlan={updatePlan} onBack={() => setActivePlanId(null)} onOpenInitiative={onOpenInitiative} identity={identity} isOversight={isOversight} cycle={cycle} />;
  }

  return <PlanList identity={identity} isOversight={isOversight} initiatives={initiatives} plans={plans} onOpenPlan={setActivePlanId} cycle={cycle} setCycle={setCycle} campaign={campaign} />;
}

function PlanList({ identity, isOversight, initiatives, plans, onOpenPlan, cycle, setCycle, campaign }) {
  const scoped = isOversight
    ? plans
    : plans.filter((p) => {
        const init = initiatives.find((i) => i.initiativeId === p.initiativeId);
        return init && (identity.domains.includes(init.domainId) || init.initiativeOwnerId === identity.name);
      });

  const awaitingMe = isOversight ? scoped.filter((p) =>
    (identity.role==="CSSMO" && p.currentStage==="LEADERSHIP_REVIEW") ||
    (identity.role==="CISO" && p.currentStage==="CISO_APPROVAL")
  ) : [];

  return (
    <div style={{ padding:"16px 28px 40px" }}>
      <CycleBanner cycle={cycle} setCycle={setCycle} plans={plans} initiatives={initiatives} isOversight={isOversight} campaign={campaign} />

      {awaitingMe.length>0 && (
        <div style={{ background:"#FBF7EF", border:`1px solid ${C.amber}55`, borderRadius:8, padding:"13px 16px", margin:"18px 0", fontSize:13 }}>
          <strong style={{ color:C.amber }}>{awaitingMe.length} budget plan{awaitingMe.length>1?"s":""} awaiting your review.</strong> Open one to agree amounts and {identity.role==="CISO"?"give final approval":"pass to the CISO"}.
        </div>
      )}

      {isOversight && <CycleReadinessTracker plans={plans} initiatives={initiatives} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"22px 0 16px" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.deepest }}>
          Budget Plans
          {!isOversight && <span style={{ fontSize:12.5, fontWeight:500, color:C.textMuted }}> · {identity.domains.join(", ")}</span>}
        </div>
        <div style={{ fontSize:12.5, color:C.textMuted }}>{scoped.length} {isOversight ? "total" : "in your domains"}</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {scoped.map((p) => {
          const init = initiatives.find((i) => i.initiativeId === p.initiativeId);
          const sm = PLAN_STAGE[p.currentStage] || { label:p.currentStage, color:C.grey };
          const total = planProposedTotal(p);
          const conf = p.research?.confidence || p.rfi?.confidence;
          const tracks = [p.tracks?.research && "Research", p.tracks?.rfi && "RFI"].filter(Boolean).join(" + ");
          return (
            <div key={p.planId} onClick={() => onOpenPlan(p.planId)}
              style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderLeft:`4px solid ${p.currentStage==="PLAN_APPROVED"?C.green:C.medium}`, borderRadius:10, padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:14.5, fontWeight:700, color:C.textDark }}>{init ? init.name : p.initiativeId}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
                  {p.planId} · {p.planType === "INITIAL" ? "Initial" : "Revision"} · spend {p.coveredYears[0]}–{p.coveredYears[p.coveredYears.length-1]} · {tracks || "no tracks"}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>Stage</span>
                  <Badge text={sm.label} color={sm.color} />
                  {conf && <Badge text={`${CONFIDENCE[conf].label} confidence`} color={CONFIDENCE[conf].color} />}
                </div>
              </div>
              <div style={{ flexShrink:0, textAlign:"right" }}>
                <div style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>{p.currentStage==="PLAN_APPROVED"?"Approved total":"Proposed total"}</div>
                <div style={{ fontSize:18, fontWeight:800, color:C.deepest, marginTop:2 }}>{USD(total)}</div>
                <div style={{ marginTop:8 }}><Btn kind="secondary" onClick={(e)=>{ e.stopPropagation(); onOpenPlan(p.planId); }}>Open Plan →</Btn></div>
              </div>
            </div>
          );
        })}
        {scoped.length === 0 && (
          <div style={{ background:C.cardBg, border:`1px dashed ${C.border}`, borderRadius:8, padding:"40px", textAlign:"center", color:C.textMuted, fontSize:14 }}>
            No budget plans yet. Open an endorsed initiative and choose "Proceed to Budgeting" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function CycleBanner({ cycle, setCycle, plans, initiatives, isOversight, campaign }) {
  const { cycleName, corporateSubmissionDate, windowStart, estimatedOpenDate, status, autoOpened, openedManually, milestones } = cycle;
  const today = DEMO_TODAY;

  const total = plans.length;
  const approved = plans.filter((p)=>p.currentStage==="PLAN_APPROVED").length;
  const approvedUSD = plans.filter((p)=>p.currentStage==="PLAN_APPROVED").reduce((a,p)=>a+planProposedTotal(p),0);
  const totalProposedUSD = plans.reduce((a,p)=>a+planProposedTotal(p),0);
  const planPct = total ? Math.round((approved/total)*100) : 0;
  const usdPct = totalProposedUSD ? Math.round((approvedUSD/totalProposedUSD)*100) : 0;

  const scanClosed = campaign?.status === "CLOSED";

  if (status === "PLANNED") {
    function openCycle(){ setCycle((c)=>({ ...c, status:"ACTIVE", openedManually:true, windowStart: today })); }
    return (
      <div style={{ background:"#F7FBFE", border:`1px solid ${C.border}`, borderLeft:`4px solid ${scanClosed?C.medium:C.grey}`, borderRadius:8, padding:"16px 18px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:C.grey, display:"inline-block" }} />
              <span style={{ fontSize:13.5, fontWeight:700, color:C.deepest }}>{cycleName} · Not open yet</span>
              <Badge text="Planned" color={C.grey} />
            </div>
            <div style={{ fontSize:12.5, color:C.textMuted, marginTop:6, lineHeight:1.5 }}>
              {scanClosed
                ? "The horizon scan has closed — the budget cycle is ready to open. Endorsed initiatives can now be budgeted."
                : "Budgeting opens after the horizon scan closes, so initiatives are scanned and endorsed before they're budgeted."}
            </div>
            <div style={{ display:"flex", gap:24, marginTop:14, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>Estimated open</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.textDark, marginTop:2 }}>{estimatedOpenDate || "—"}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>when the scan window closes</div>
              </div>
              <div>
                <div style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>Corporate submission</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.textDark, marginTop:2 }}>{corporateSubmissionDate}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>budget due upward</div>
              </div>
              <div>
                <div style={{ fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>Horizon scan</div>
                <div style={{ fontSize:14, fontWeight:700, color:scanClosed?C.green:C.amber, marginTop:2 }}>{scanClosed ? "Closed ✓" : "Still open"}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{scanClosed ? "prerequisite met" : "must close first"}</div>
              </div>
            </div>
          </div>
          {isOversight && (
            <div title={scanClosed ? "" : "The horizon scan must close before the budget cycle can open"}>
              <Btn kind={scanClosed?"primary":"ghost"} disabled={!scanClosed} onClick={openCycle}>
                {scanClosed ? "Open Budget Cycle →" : "Open Budget Cycle"}
              </Btn>
            </div>
          )}
        </div>
        <div style={{ marginTop:16 }}>
          <MilestoneTimeline milestones={milestones} today={today} muted />
        </div>
      </div>
    );
  }

  if (status === "CLOSED" || status === "LOCKED") {
    return (
      <div style={{ background:"#F4F7F9", border:`1px solid ${C.border}`, borderLeft:`4px solid ${C.grey}`, borderRadius:8, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:13.5, fontWeight:700 }}>{cycleName} · {status==="LOCKED"?"Locked":"Closed"}</div>
          <div style={{ fontSize:12.5, color:C.textMuted, marginTop:3 }}>Ran {windowStart || estimatedOpenDate} → {corporateSubmissionDate}. Approved budget records are now locked.</div>
        </div>
        <Badge text={`${approved}/${total} plans approved · ${USD(approvedUSD)}`} color={C.grey} />
      </div>
    );
  }

  const startRef = windowStart || estimatedOpenDate;
  const dRem = daysBetween(today, corporateSubmissionDate);
  const len = daysBetween(startRef, corporateSubmissionDate) || 1;
  const el = daysBetween(startRef, today);
  const timePct = Math.max(0, Math.min(100, Math.round((el/len)*100)));
  const urgent = dRem <= 14;

  function extend(){ setCycle((c)=>{ const e=new Date(c.corporateSubmissionDate+"T00:00:00"); e.setDate(e.getDate()+7); return { ...c, corporateSubmissionDate:e.toISOString().slice(0,10) }; }); }
  function close(){ setCycle((c)=>({ ...c, status:"CLOSED" })); }

  return (
    <div style={{ background:"linear-gradient(180deg,#fff,#F7FBFE)", border:`1px solid ${C.border}`, borderLeft:`4px solid ${urgent?C.amber:C.medium}`, borderRadius:8, padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:280 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:urgent?C.amber:C.green, display:"inline-block", boxShadow:`0 0 0 3px ${(urgent?C.amber:C.green)}22` }} />
            <span style={{ fontSize:13.5, fontWeight:700, color:C.deepest }}>{cycleName} · Open for budgeting</span>
            <Badge text={autoOpened?"Auto-opened":"Opened early"} color={C.dark} />
          </div>
          <div style={{ fontSize:12.5, color:C.textMuted, marginTop:5 }}>
            Get plans through CSSMO → CISO approval before corporate submission on <strong>{corporateSubmissionDate}</strong>.
          </div>
          <div style={{ marginTop:11, height:7, background:"#E4EFF7", borderRadius:5, overflow:"hidden", maxWidth:520 }}>
            <div style={{ width:`${timePct}%`, height:"100%", background:urgent?C.amber:C.medium }} />
          </div>
          <div style={{ fontSize:11.5, color:C.textMuted, marginTop:5 }}>
            <strong style={{ color:urgent?C.amber:C.dark }}>{dRem>0?`${dRem} days to submission`:"submission due today"}</strong>
          </div>
        </div>
        {isOversight && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <Btn kind="secondary" onClick={extend}>Extend +1wk</Btn>
            <Btn kind="danger" onClick={close}>Close Cycle</Btn>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14 }}>
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:7, padding:"11px 13px" }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>Plans approved</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.deepest }}>{approved}<span style={{ fontSize:13, color:C.textMuted, fontWeight:600 }}> / {total}</span></div>
          <div style={{ marginTop:6, height:5, background:"#E4EFF7", borderRadius:4, overflow:"hidden" }}><div style={{ width:`${planPct}%`, height:"100%", background:C.green }} /></div>
        </div>
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:7, padding:"11px 13px" }}>
          <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted }}>Budget locked</div>
          <div style={{ fontSize:20, fontWeight:800, color:C.deepest }}>{USD(approvedUSD)}<span style={{ fontSize:13, color:C.textMuted, fontWeight:600 }}> / {USD(totalProposedUSD)}</span></div>
          <div style={{ marginTop:6, height:5, background:"#E4EFF7", borderRadius:4, overflow:"hidden" }}><div style={{ width:`${usdPct}%`, height:"100%", background:C.green }} /></div>
        </div>
      </div>

      <div style={{ marginTop:14 }}>
        <MilestoneTimeline milestones={milestones} today={today} />
      </div>
    </div>
  );
}

function MilestoneTimeline({ milestones, today, muted }) {
  return (
    <div style={{ display:"flex", gap:0, alignItems:"flex-start", flexWrap:"wrap" }}>
      {milestones.map((m,i)=>{
        const past = !muted && daysBetween(today, m.date) < 0;
        const near = !muted && !past && daysBetween(today, m.date) <= 14;
        const color = past?C.green:near?C.amber:C.border;
        return (
          <div key={m.key} style={{ display:"flex", alignItems:"center", flex:i<milestones.length-1?1:"0 0 auto", minWidth:140 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:3 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ width:11, height:11, borderRadius:"50%", background:past?C.green:"#fff", border:`2px solid ${color}` }} />
                <span style={{ fontSize:12, fontWeight:700, color:past?C.textDark:near?C.amber:C.textMuted }}>{m.name}</span>
              </div>
              <span style={{ fontSize:11, color:C.textMuted, marginLeft:18 }}>{muted?"est. ":""}{m.date}{past?" ✓":""}</span>
            </div>
            {i<milestones.length-1 && <div style={{ flex:1, height:2, background:past?C.green:C.border, margin:"0 8px", minWidth:20 }} />}
          </div>
        );
      })}
    </div>
  );
}

function CycleReadinessTracker({ plans, initiatives }) {
  const rows = ALL_DOMAINS.map((d) => {
    const domainPlans = plans.filter((p) => { const init = initiatives.find((i)=>i.initiativeId===p.initiativeId); return init && init.domainId === d; });
    const approved = domainPlans.filter((p)=>p.currentStage==="PLAN_APPROVED");
    const inReview = domainPlans.filter((p)=>["LEADERSHIP_REVIEW","CISO_APPROVAL"].includes(p.currentStage));
    const estimating = domainPlans.filter((p)=>["RESEARCH","RFI"].includes(p.currentStage));
    const approvedUSD = approved.reduce((a,p)=>a+planProposedTotal(p),0);
    return { d, count:domainPlans.length, approved:approved.length, inReview:inReview.length, estimating:estimating.length, approvedUSD };
  }).filter((r)=>r.count>0);

  if (rows.length === 0) return null;
  const totalUSD = rows.reduce((a,r)=>a+r.approvedUSD,0);

  return (
    <div style={{ marginTop:18 }}>
      <BSectionLabel>Per-Domain Budget Readiness</BSectionLabel>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
            <thead><tr style={{ background:C.deepest }}>{["Domain","Plans","Estimating","In Review","Approved","Approved Budget"].map((h)=><th key={h} style={{ textAlign:h==="Domain"?"left":"right", color:"#fff", fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, padding:"10px 12px" }}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((r,i)=>(
              <tr key={r.d} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:"10px 12px" }}><div style={{ fontWeight:700, fontSize:13.5 }}>{r.d}</div><div style={{ fontSize:11.5, color:C.textMuted }}>{DOMAINS[r.d]}</div></td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontSize:13 }}>{r.count}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontSize:13, color:r.estimating?C.amber:C.textMuted, fontWeight:r.estimating?700:400 }}>{r.estimating}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontSize:13, color:r.inReview?C.dark:C.textMuted, fontWeight:r.inReview?700:400 }}>{r.inReview}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontSize:13, color:r.approved?C.green:C.textMuted, fontWeight:r.approved?700:400 }}>{r.approved}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, fontSize:13 }}>{USD(r.approvedUSD)}</td>
              </tr>
            ))}</tbody>
            <tfoot><tr style={{ background:"#EAF4FB", borderTop:`2px solid ${C.border}` }}><td colSpan={5} style={{ padding:"10px 12px", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, fontSize:12, color:C.deepest }}>Total approved budget</td><td style={{ padding:"10px 12px", textAlign:"right", fontWeight:800, fontSize:14, color:C.deepest }}>{USD(totalUSD)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlanSetup({ initiative, onCreate, onCancel }) {
  const typeTracks = TYPE_TRACKS[initiative.initiativeTypeId] || { research:true, rfi:true };
  const [firstYear, setFirstYear] = useState(2027);
  const [numYears, setNumYears] = useState(3);
  const [planType, setPlanType] = useState("INITIAL");
  const [useResearch, setUseResearch] = useState(typeTracks.research);
  const [useRfi, setUseRfi] = useState(typeTracks.rfi);
  const coveredYears = Array.from({ length:numYears }, (_, i) => firstYear + i);
  const canCreate = coveredYears.length > 0 && (useResearch || useRfi);

  return (
    <div style={{ padding:"22px 28px 40px", maxWidth:780 }}>
      <Btn kind="secondary" onClick={onCancel}>← Cancel</Btn>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px", margin:"16px 0 22px" }}>
        <BSectionLabel>Initiative</BSectionLabel>
        <div style={{ fontSize:16, fontWeight:700, color:C.deepest }}>{initiative.name}</div>
        <div style={{ display:"flex", gap:18, flexWrap:"wrap", marginTop:12 }}>
          <Meta label="ID" value={initiative.initiativeId} />
          <Meta label="Domain" value={DOMAINS[initiative.domainId]} />
          <Meta label="Type" value={INITIATIVE_TYPES[initiative.initiativeTypeId]} />
          <Meta label="Owner" value={initiative.initiativeOwnerId} />
          <Meta label="Sponsor" value={initiative.sponsorId || "—"} />
        </div>
      </div>

      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"22px 24px" }}>
        <BSectionLabel>Create Budget Plan</BSectionLabel>
        <p style={{ fontSize:13, color:C.textMuted, marginTop:-6, marginBottom:18, lineHeight:1.5 }}>
          One plan covers all spend years for this initiative. You capture estimates once, producing a budget figure per year.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
          <Field label="Plan Type" required>
            <select style={inputStyle} value={planType} onChange={(e)=>setPlanType(e.target.value)}>
              <option value="INITIAL">Initial plan</option>
              <option value="REVISION">Revision of an existing plan</option>
            </select>
          </Field>
          <div />
          <Field label="First Spend Year" required>
            <select style={inputStyle} value={firstYear} onChange={(e)=>setFirstYear(Number(e.target.value))}>
              {[2027,2028,2029,2030].map((y)=><option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Number of Spend Years" required hint="Multi-year plans are defined upfront.">
            <select style={inputStyle} value={numYears} onChange={(e)=>setNumYears(Number(e.target.value))}>
              {[1,2,3,4,5].map((n)=><option key={n} value={n}>{n} year{n>1?"s":""}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", margin:"6px 0 18px" }}>
          <div style={{ fontSize:11.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, color:C.textMuted, marginBottom:6 }}>Covered spend years</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{coveredYears.map((y)=><Badge key={y} text={String(y)} color={C.dark} />)}</div>
        </div>
        <Field label="Estimate Tracks" hint="Research and RFI are parallel — use either or both. Defaults follow the initiative type.">
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <TrackToggle on={useResearch} onClick={()=>setUseResearch((v)=>!v)} title="Research" sub="Internal estimate — your own scoping, assumptions, and costing." defaultedOff={!typeTracks.research} />
            <TrackToggle on={useRfi} onClick={()=>setUseRfi((v)=>!v)} title="RFI (Request for Information)" sub="Vendor-sourced estimate — contact vendors and capture quotes." defaultedOff={!typeTracks.rfi} />
          </div>
        </Field>
        {!useResearch && !useRfi && <div style={{ fontSize:12.5, color:C.red, marginBottom:12 }}>Select at least one track.</div>}
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:18, marginTop:6 }}>
          <Btn disabled={!canCreate} onClick={() => onCreate({
            planId: planId(),
            initiativeId: initiative.initiativeId,
            planType,
            currentStage: "RESEARCH",
            coveredYears,
            firstYear,
            tracks: { research:useResearch, rfi:useRfi },
            createdBy: initiative.initiativeOwnerId,
            createdDate: new Date().toISOString().slice(0,10),
            research: useResearch ? { scope:"", assumptions:"", risks:"", confidence:"", rows:emptyRows(coveredYears), completed:false } : null,
            rfi: useRfi ? { scope:"", confidence:"", notes:"", vendors:[], rows:emptyRows(coveredYears), completed:false } : null,
            sourceByYear: coveredYears.reduce((a,y)=>{ a[y]=useResearch?"RESEARCH":"RFI"; return a; },{}),
          })}>Create Plan & Start Estimating →</Btn>
        </div>
      </div>
    </div>
  );
}
function TrackToggle({ on, onClick, title, sub, defaultedOff }) {
  return (
    <button onClick={onClick} style={{ textAlign:"left", font:FONT, background:on?"#EAF4FB":"#fff", border:`1px solid ${on?C.dark:C.border}`, borderRadius:8, padding:"12px 14px", cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start" }}>
      <span style={{ width:20, height:20, borderRadius:5, border:`2px solid ${on?C.dark:C.border}`, background:on?C.dark:"#fff", display:"grid", placeItems:"center", color:"#fff", fontSize:13, fontWeight:800, flexShrink:0, marginTop:1 }}>{on?"✓":""}</span>
      <span>
        <span style={{ fontSize:14, fontWeight:700, color:C.textDark, display:"flex", gap:8, alignItems:"center" }}>{title}{defaultedOff && <Badge text="not required by type" color={C.grey} />}</span>
        <span style={{ fontSize:12.5, color:C.textMuted, display:"block", marginTop:2 }}>{sub}</span>
      </span>
    </button>
  );
}

function Workspace({ plan, initiative, updatePlan, onBack, onOpenInitiative, identity, isOversight }) {
  const years = plan.coveredYears;
  const inReview = ["LEADERSHIP_REVIEW","CISO_APPROVAL","PLAN_APPROVED"].includes(plan.currentStage);
  const [tab, setTab] = useState(inReview ? "consolidated" : (plan.research ? "research" : plan.rfi ? "rfi" : "consolidated"));

  function setResearch(updater){ updatePlan(plan.planId, { research: typeof updater==="function" ? updater(plan.research) : updater }); }
  function setRfi(updater){ updatePlan(plan.planId, { rfi: typeof updater==="function" ? updater(plan.rfi) : updater }); }
  function setSourceByYear(updater){ updatePlan(plan.planId, { sourceByYear: typeof updater==="function" ? updater(plan.sourceByYear) : updater }); }

  return (
    <div style={{ padding:"22px 28px 50px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:8 }}>
        <Btn kind="secondary" onClick={onBack}>← All Budget Plans</Btn>
        {initiative && <Btn kind="ghost" onClick={()=>onOpenInitiative(initiative.initiativeId)}>View Initiative ↗</Btn>}
      </div>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:17, fontWeight:700, color:C.deepest }}>{initiative ? initiative.name : plan.initiativeId}</div>
        <div style={{ fontSize:12.5, color:C.textMuted, marginTop:3 }}>
          {plan.planId} · {plan.planType==="INITIAL"?"Initial plan":"Revision"} · spend years {years[0]}–{years[years.length-1]} · {planStageLabel(plan)}
        </div>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:18, borderBottom:`1px solid ${C.border}` }}>
        {plan.research && <TabBtn on={tab==="research"} onClick={()=>setTab("research")} label="Research" done={plan.research.completed} />}
        {plan.rfi && <TabBtn on={tab==="rfi"} onClick={()=>setTab("rfi")} label="RFI" done={plan.rfi.completed} />}
        <TabBtn on={tab==="consolidated"} onClick={()=>setTab("consolidated")} label={inReview ? "Consolidated & Review" : "Consolidated Estimate"} done={plan.currentStage==="PLAN_APPROVED"} />
      </div>

      {tab==="research" && plan.research && <ResearchTrack years={years} research={plan.research} setResearch={setResearch} />}
      {tab==="rfi" && plan.rfi && <RFITrack years={years} rfi={plan.rfi} setRfi={setRfi} />}
      {tab==="consolidated" && <Consolidated years={years} plan={plan} setSourceByYear={setSourceByYear} updatePlan={updatePlan} identity={identity} isOversight={isOversight} initiative={initiative} />}
    </div>
  );
}
function TabBtn({ on, onClick, label, done }) {
  return (
    <button onClick={onClick} style={{ font:FONT, fontSize:13.5, fontWeight:on?700:500, color:on?C.deepest:C.textMuted, background:"transparent", border:"none", borderBottom:`3px solid ${on?C.dark:"transparent"}`, padding:"10px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
      {label}{done && <span style={{ color:C.green, fontSize:13 }}>✓</span>}
    </button>
  );
}

function ConfidencePicker({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:7 }}>
      {Object.entries(CONFIDENCE).map(([k,v]) => {
        const on = value===k;
        return <button key={k} onClick={()=>onChange(k)} style={{ font:FONT, fontSize:12.5, fontWeight:600, color:on?"#fff":v.color, background:on?v.color:"#fff", border:`1px solid ${v.color}`, borderRadius:20, padding:"5px 13px", cursor:"pointer" }}>{v.label}</button>;
      })}
    </div>
  );
}

function MoneyGrid({ years, rows, onChange, label }) {
  function set(year, key, val) {
    const cleaned = val.replace(/[^0-9.]/g, "");
    onChange({ ...rows, [year]: { ...rows[year], [key]: cleaned } });
  }
  function rt(r={}) { const split=num(r.service)+num(r.license), co=num(r.capex)+num(r.opex); return { split, co, match:split===co }; }
  const grand = years.reduce((a,y)=>a+rt(rows[y]).split,0);
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
        <thead><tr style={{ background:C.deepest }}>{["Year","Service Fees","License Fees","CapEx","OpEx","Year Total","Check"].map((h)=><th key={h} style={{ textAlign:h==="Year"?"left":"right", color:"#fff", fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, padding:"9px 11px", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>
          {years.map((y,i)=>{ const r=rows[y]||{}; const t=rt(r); return (
            <tr key={y} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
              <td style={{ padding:"8px 11px", fontWeight:700, fontSize:13.5 }}>{y}</td>
              <td style={{ padding:"6px 8px" }}><input style={{ ...moneyInput, textAlign:"right" }} value={r.service||""} onChange={(e)=>set(y,"service",e.target.value)} placeholder="0" /></td>
              <td style={{ padding:"6px 8px" }}><input style={{ ...moneyInput, textAlign:"right" }} value={r.license||""} onChange={(e)=>set(y,"license",e.target.value)} placeholder="0" /></td>
              <td style={{ padding:"6px 8px" }}><input style={{ ...moneyInput, textAlign:"right" }} value={r.capex||""} onChange={(e)=>set(y,"capex",e.target.value)} placeholder="0" /></td>
              <td style={{ padding:"6px 8px" }}><input style={{ ...moneyInput, textAlign:"right" }} value={r.opex||""} onChange={(e)=>set(y,"opex",e.target.value)} placeholder="0" /></td>
              <td style={{ padding:"8px 11px", textAlign:"right", fontWeight:600, fontSize:13 }}>{USD(t.split)}</td>
              <td style={{ padding:"8px 11px", textAlign:"right" }}>
                {t.split===0 && t.co===0 ? <span style={{ color:C.textMuted, fontSize:11.5 }}>—</span>
                  : t.match ? <span style={{ color:C.green, fontWeight:700, fontSize:13 }} title="Fees split equals CapEx/OpEx split">✓</span>
                  : <span style={{ color:C.red, fontWeight:600, fontSize:11 }} title={`Fees ${USD(t.split)} vs CapEx+OpEx ${USD(t.co)}`}>✕ {USD(t.co)}</span>}
              </td>
            </tr>
          );})}
        </tbody>
        <tfoot><tr style={{ background:"#EAF4FB", borderTop:`2px solid ${C.border}` }}>
          <td style={{ padding:"9px 11px", fontWeight:700, fontSize:12.5, textTransform:"uppercase", letterSpacing:0.5, color:C.deepest }}>{label||"Total"}</td>
          <td colSpan={4} /><td style={{ padding:"9px 11px", textAlign:"right", fontWeight:800, fontSize:14, color:C.deepest }}>{USD(grand)}</td><td />
        </tr></tfoot>
      </table>
      <div style={{ fontSize:11.5, color:C.textMuted, marginTop:7 }}>Each year must satisfy <strong>Service + License = CapEx + OpEx</strong>. The check column flags mismatches.</div>
    </div>
  );
}

function ResearchTrack({ years, research, setResearch }) {
  function set(patch){ setResearch((s)=>({ ...s, ...patch })); }
  const hasData = gridHasData(years, research.rows);
  const valid = gridValid(years, research.rows);
  const canComplete = research.scope.trim() && research.confidence && hasData && valid;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, maxWidth:1000 }}>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel right={<Badge text={research.completed?"Completed":"In progress"} color={research.completed?C.green:C.amber} />}>Research — Internal Estimate</BSectionLabel>
        <Field label="Research Scope" required hint="What was investigated to produce this estimate?"><textarea style={{ ...inputStyle, minHeight:70, resize:"vertical" }} value={research.scope} onChange={(e)=>set({scope:e.target.value})} /></Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Field label="Assumptions"><textarea style={{ ...inputStyle, minHeight:60, resize:"vertical" }} value={research.assumptions} onChange={(e)=>set({assumptions:e.target.value})} /></Field>
          <Field label="Risks / Caveats"><textarea style={{ ...inputStyle, minHeight:60, resize:"vertical" }} value={research.risks} onChange={(e)=>set({risks:e.target.value})} /></Field>
        </div>
        <Field label="Confidence Level" required hint="How reliable is this internal estimate?"><ConfidencePicker value={research.confidence} onChange={(v)=>set({confidence:v})} /></Field>
      </div>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel>Per-Year Estimate</BSectionLabel>
        <MoneyGrid years={years} rows={research.rows} onChange={(rows)=>set({rows})} label="Research total" />
      </div>
      <CompleteBar label="Research" canComplete={canComplete} completed={research.completed}
        invalidReason={!research.scope.trim()?"Add a research scope":!research.confidence?"Set a confidence level":!hasData?"Enter at least one year's figures":!valid?"Fix the year(s) where fees ≠ CapEx/OpEx":""}
        onToggle={()=>set({completed:!research.completed})} />
    </div>
  );
}

function RFITrack({ years, rfi, setRfi }) {
  function set(patch){ setRfi((s)=>({ ...s, ...patch })); }
  const hasData = gridHasData(years, rfi.rows);
  const valid = gridValid(years, rfi.rows);
  const canComplete = rfi.scope.trim() && rfi.confidence && hasData && valid;
  function addVendor(){ set({ vendors:[...rfi.vendors, { id:Math.random().toString(36).slice(2,8), vendorName:"", contactName:"", contactEmail:"", dateContacted:"", responseDate:"", status:"CONTACTED", notes:"", quote: years.reduce((a,y)=>{ a[y]={service:"",license:""}; return a; },{}) }] }); }
  function updVendor(id, patch){ set({ vendors: rfi.vendors.map((v)=>v.id===id?{...v,...patch}:v) }); }
  function remVendor(id){ set({ vendors: rfi.vendors.filter((v)=>v.id!==id) }); }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, maxWidth:1000 }}>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel right={<Badge text={rfi.completed?"Completed":"In progress"} color={rfi.completed?C.green:C.amber} />}>RFI — Vendor-Sourced Estimate</BSectionLabel>
        <Field label="RFI Scope" required hint="What information was requested from vendors?"><textarea style={{ ...inputStyle, minHeight:64, resize:"vertical" }} value={rfi.scope} onChange={(e)=>set({scope:e.target.value})} /></Field>
        <Field label="Confidence Level" required hint="How reliable is the consolidated vendor estimate?"><ConfidencePicker value={rfi.confidence} onChange={(v)=>set({confidence:v})} /></Field>
      </div>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel right={<Btn small kind="secondary" onClick={addVendor}>+ Add Vendor</Btn>}>Vendor Responses ({rfi.vendors.length})</BSectionLabel>
        {rfi.vendors.length===0 ? <div style={{ fontSize:13, color:C.textMuted, padding:"10px 0" }}>No vendors yet. Add the vendors you contacted and record their quotes.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:14 }}>{rfi.vendors.map((v)=><VendorCard key={v.id} v={v} years={years} onUpd={(p)=>updVendor(v.id,p)} onRem={()=>remVendor(v.id)} />)}</div>}
      </div>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel right={rfi.vendors.length>0 ? <PullFromVendors rfi={rfi} years={years} onPull={(rows)=>set({rows})} /> : null}>Consolidated RFI Estimate (per year)</BSectionLabel>
        <p style={{ fontSize:12.5, color:C.textMuted, marginTop:-6, marginBottom:14 }}>Your selected per-year figures based on the vendor responses above.{rfi.vendors.length>0 && " Use “Pull lowest quotes” to seed from vendors, then adjust."}</p>
        <MoneyGrid years={years} rows={rfi.rows} onChange={(rows)=>set({rows})} label="RFI total" />
      </div>
      <CompleteBar label="RFI" canComplete={canComplete} completed={rfi.completed}
        invalidReason={!rfi.scope.trim()?"Add an RFI scope":!rfi.confidence?"Set a confidence level":!hasData?"Enter the consolidated per-year figures":!valid?"Fix the year(s) where fees ≠ CapEx/OpEx":""}
        onToggle={()=>set({completed:!rfi.completed})} />
    </div>
  );
}
function VendorCard({ v, years, onUpd, onRem }) {
  function setQuote(year, key, val){ const cleaned=val.replace(/[^0-9.]/g,""); onUpd({ quote:{ ...v.quote, [year]:{ ...v.quote[year], [key]:cleaned } } }); }
  const vendorTotal = years.reduce((a,y)=>a+num(v.quote[y]?.service)+num(v.quote[y]?.license),0);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:9, padding:"14px 16px", background:"#F7FBFE" }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr", gap:10 }}>
          <input style={inputStyle} placeholder="Vendor name *" value={v.vendorName} onChange={(e)=>onUpd({vendorName:e.target.value})} />
          <input style={inputStyle} placeholder="Contact name" value={v.contactName} onChange={(e)=>onUpd({contactName:e.target.value})} />
          <input style={inputStyle} placeholder="Contact email" value={v.contactEmail} onChange={(e)=>onUpd({contactEmail:e.target.value})} />
        </div>
        <button onClick={onRem} style={{ background:"transparent", border:"none", color:C.red, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:12 }}>
        <MiniField label="Status"><select style={moneyInput} value={v.status} onChange={(e)=>onUpd({status:e.target.value})}>{Object.entries(VENDOR_STATUS).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}</select></MiniField>
        <MiniField label="Date contacted"><input type="date" style={moneyInput} value={v.dateContacted} onChange={(e)=>onUpd({dateContacted:e.target.value})} /></MiniField>
        <MiniField label="Response date"><input type="date" style={moneyInput} value={v.responseDate} onChange={(e)=>onUpd({responseDate:e.target.value})} /></MiniField>
        <MiniField label="Quote total"><div style={{ padding:"7px 0", fontWeight:700, fontSize:14 }}>{USD(vendorTotal)}</div></MiniField>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
          <thead><tr>{["Year","Quoted Service","Quoted License","Year Total"].map((h)=><th key={h} style={{ textAlign:h==="Year"?"left":"right", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, color:C.textMuted, padding:"5px 8px" }}>{h}</th>)}</tr></thead>
          <tbody>{years.map((y)=>{ const q=v.quote[y]||{}; const t=num(q.service)+num(q.license); return (
            <tr key={y} style={{ borderTop:`1px solid ${C.border}` }}>
              <td style={{ padding:"5px 8px", fontWeight:700, fontSize:12.5 }}>{y}</td>
              <td style={{ padding:"4px 6px" }}><input style={{ ...moneyInput, textAlign:"right" }} value={q.service||""} onChange={(e)=>setQuote(y,"service",e.target.value)} placeholder="0" /></td>
              <td style={{ padding:"4px 6px" }}><input style={{ ...moneyInput, textAlign:"right" }} value={q.license||""} onChange={(e)=>setQuote(y,"license",e.target.value)} placeholder="0" /></td>
              <td style={{ padding:"5px 8px", textAlign:"right", fontWeight:600, fontSize:12.5 }}>{USD(t)}</td>
            </tr>
          );})}</tbody>
        </table>
      </div>
      <input style={{ ...inputStyle, marginTop:10 }} placeholder="Notes (optional)" value={v.notes} onChange={(e)=>onUpd({notes:e.target.value})} />
    </div>
  );
}
function PullFromVendors({ rfi, years, onPull }) {
  function pull(){
    const rows = {};
    years.forEach((y)=>{ let best=null; rfi.vendors.forEach((v)=>{ const s=num(v.quote[y]?.service), l=num(v.quote[y]?.license), t=s+l; if (t>0 && (best===null||t<best.t)) best={s,l,t}; }); rows[y]= best?{ service:String(best.s), license:String(best.l), capex:"", opex:"" }:{ service:"",license:"",capex:"",opex:"" }; });
    onPull(rows);
  }
  return <Btn small kind="secondary" onClick={pull}>Pull lowest quotes ↓</Btn>;
}
function CompleteBar({ label, canComplete, completed, invalidReason, onToggle }) {
  return (
    <div style={{ background:completed?"#F1F8F3":"#fff", border:`1px solid ${completed?C.green+"66":C.border}`, borderLeft:`4px solid ${completed?C.green:C.light}`, borderRadius:10, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
      <div>
        <div style={{ fontSize:13.5, fontWeight:700, color:completed?C.green:C.textDark }}>{completed?`${label} estimate marked complete`:`Complete the ${label} estimate`}</div>
        {!completed && !canComplete && <div style={{ fontSize:12.5, color:C.amber, marginTop:3 }}>{invalidReason}</div>}
        {!completed && canComplete && <div style={{ fontSize:12.5, color:C.textMuted, marginTop:3 }}>All required fields and per-year checks pass.</div>}
      </div>
      {completed ? <Btn kind="secondary" onClick={onToggle}>Reopen for edits</Btn> : <Btn kind="success" disabled={!canComplete} onClick={onToggle}>Mark {label} Complete</Btn>}
    </div>
  );
}

function Consolidated({ years, plan, setSourceByYear, updatePlan, identity, isOversight, initiative }) {
  const research = plan.research, rfi = plan.rfi;
  const sourceByYear = plan.sourceByYear || {};
  const researchTotals = research ? rowsTotalsByYear(years, research.rows) : null;
  const rfiTotals = rfi ? rowsTotalsByYear(years, rfi.rows) : null;
  function pick(year){
    const src = sourceByYear[year] || (research?"RESEARCH":"RFI");
    if (src==="RESEARCH" && researchTotals) return researchTotals.find((r)=>r.year===year);
    if (src==="RFI" && rfiTotals) return rfiTotals.find((r)=>r.year===year);
    return { year, total:0, service:0, license:0, capex:0, opex:0 };
  }
  const proposed = years.map(pick);
  const grand = proposed.reduce((a,p)=>a+p.total,0);
  const allValid = years.every((y)=>{ const p=pick(y); return (p.service+p.license)===(p.capex+p.opex); });

  const stage = plan.currentStage;
  const inReview = ["LEADERSHIP_REVIEW","CISO_APPROVAL","PLAN_APPROVED"].includes(stage);

  function submitToReview() {
    const agreed = {};
    years.forEach((y)=>{ const p=pick(y); agreed[y] = { service:String(p.service), license:String(p.license), capex:String(p.capex), opex:String(p.opex) }; });
    updatePlan(plan.planId, {
      currentStage: "LEADERSHIP_REVIEW",
      agreedRows: agreed,
      proposedSnapshot: years.map((y)=>{ const p=pick(y); return { year:y, ...p }; }),
      review: { sponsorConfirmed:false, sponsorChangeRequested:false, newSponsorId:null, log:[], cssmoAgreed:false },
    });
  }

  return (
    <div style={{ maxWidth:1000, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <SourceSummary title="Research" rec={research} totals={researchTotals} />
        <SourceSummary title="RFI" rec={rfi} totals={rfiTotals} />
      </div>

      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel>{inReview ? "Proposed Budget (locked at submission)" : "Proposed Budget — choose a source per year"}</BSectionLabel>
        <p style={{ fontSize:12.5, color:C.textMuted, marginTop:-6, marginBottom:14 }}>
          {inReview ? "These are the figures the owner submitted. Leadership agrees the final amounts below." : "For each spend year, select which estimate feeds the proposed budget. This becomes the figure Leadership Review acts on."}
        </p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
            <thead><tr style={{ background:C.deepest }}>{["Year","Source","Service","License","CapEx","OpEx","Proposed Total"].map((h)=><th key={h} style={{ textAlign:h==="Year"||h==="Source"?"left":"right", color:"#fff", fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, padding:"9px 11px" }}>{h}</th>)}</tr></thead>
            <tbody>{years.map((y,i)=>{ const p=pick(y); return (
              <tr key={y} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:"8px 11px", fontWeight:700 }}>{y}</td>
                <td style={{ padding:"6px 11px" }}>
                  {inReview ? <span style={{ fontSize:12.5, color:C.textMuted }}>{(sourceByYear[y]||(research?"RESEARCH":"RFI"))==="RESEARCH"?"Research":"RFI"}</span>
                    : <select style={{ ...moneyInput, width:"auto" }} value={sourceByYear[y]||(research?"RESEARCH":"RFI")} onChange={(e)=>setSourceByYear((s)=>({...s,[y]:e.target.value}))}>{research && <option value="RESEARCH">Research</option>}{rfi && <option value="RFI">RFI</option>}</select>}
                </td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(p.service)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(p.license)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(p.capex)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(p.opex)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right", fontWeight:700 }}>{USD(p.total)}</td>
              </tr>
            );})}</tbody>
            <tfoot><tr style={{ background:"#EAF4FB", borderTop:`2px solid ${C.border}` }}><td colSpan={6} style={{ padding:"10px 11px", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, fontSize:12.5, color:C.deepest }}>Total proposed (all years)</td><td style={{ padding:"10px 11px", textAlign:"right", fontWeight:800, fontSize:15, color:C.deepest }}>{USD(grand)}</td></tr></tfoot>
          </table>
        </div>
      </div>

      {!inReview ? (
        <SubmitToReview research={research} rfi={rfi} allValid={allValid} grand={grand} onSubmit={submitToReview} />
      ) : (
        <LeadershipReview plan={plan} years={years} updatePlan={updatePlan} identity={identity} isOversight={isOversight} initiative={initiative} />
      )}
    </div>
  );
}

function SubmitToReview({ research, rfi, allValid, grand, onSubmit }) {
  const tracks = [research, rfi].filter(Boolean);
  const anyComplete = tracks.some((t)=>t.completed);
  const ready = anyComplete && allValid && grand>0;
  return (
    <div style={{ background:ready?"linear-gradient(180deg,#fff,#F1F8F3)":"#F7FBFE", border:`1px solid ${ready?C.green+"66":C.border}`, borderLeft:`4px solid ${ready?C.green:C.light}`, borderRadius:10, padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:18 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:ready?C.green:C.textMuted }}>{ready?"Estimate ready for Leadership Review":"Estimate not yet ready"}</div>
        <div style={{ fontSize:12.5, color:C.textMuted, marginTop:4, maxWidth:620, lineHeight:1.5 }}>{ready?"Submitting locks the estimate and sends it to CSSMO, then CISO, to agree the final amounts and approve.":"Need at least one completed track, all years balancing (fees = CapEx/OpEx), and a non-zero proposed total."}</div>
      </div>
      <Btn kind={ready?"primary":"ghost"} disabled={!ready} onClick={onSubmit}>{ready?"Submit to Leadership Review →":"Submit to Leadership Review"}</Btn>
    </div>
  );
}

function LeadershipReview({ plan, years, updatePlan, identity, isOversight, initiative }) {
  const stage = plan.currentStage;
  const review = plan.review || { sponsorConfirmed:false, sponsorChangeRequested:false, newSponsorId:null, log:[], cssmoAgreed:false };
  const agreedRows = plan.agreedRows || {};
  const role = identity.role;
  const isCSSMO = role === "CSSMO";
  const isCISO = role === "CISO";

  const canEditAmounts = (isCSSMO || isCISO) && stage !== "PLAN_APPROVED";
  const cssmoCanAct = isCSSMO && stage === "LEADERSHIP_REVIEW";
  const cisoCanAct = isCISO && stage === "CISO_APPROVAL";

  function setAgreed(year, key, val){
    const cleaned = val.replace(/[^0-9.]/g,"");
    updatePlan(plan.planId, { agreedRows: { ...agreedRows, [year]: { ...agreedRows[year], [key]: cleaned } } });
  }
  function setReview(patch){ updatePlan(plan.planId, { review: { ...review, ...patch } }); }

  const allValid = years.every((y)=>{ const r=agreedRows[y]||{}; return (num(r.service)+num(r.license))===(num(r.capex)+num(r.opex)); });
  const agreedGrand = years.reduce((a,y)=>{ const r=agreedRows[y]||{}; return a+num(r.service)+num(r.license); },0);

  function cssmoPass(){
    if (!allValid || !review.sponsorConfirmed) return;
    updatePlan(plan.planId, {
      currentStage: "CISO_APPROVAL",
      review: { ...review, cssmoAgreed:true, log:[...review.log, { step:"CSSMO", action:"AGREED", by:identity.name, date:new Date().toISOString().slice(0,10) }] },
    });
  }
  function cisoApprove(){
    if (!allValid) return;
    const records = years.map((y)=>{ const r=agreedRows[y]||{}; return {
      budgetRecordId:`BUD-2026-${Math.floor(Math.random()*900)+100}`,
      planId:plan.planId, initiativeId:plan.initiativeId, year:y,
      serviceFeesUSD:num(r.service), licenseFeesUSD:num(r.license), capexUSD:num(r.capex), opexUSD:num(r.opex),
      totalUSD:num(r.service)+num(r.license), status:"APPROVED",
    };});
    updatePlan(plan.planId, {
      currentStage:"PLAN_APPROVED",
      budgetRecords: records,
      review:{ ...review, log:[...review.log, { step:"CISO", action:"APPROVED", by:identity.name, date:new Date().toISOString().slice(0,10) }] },
    });
  }
  function sendBack(by){
    updatePlan(plan.planId, {
      currentStage:"RESEARCH",
      review:{ ...review, log:[...review.log, { step:by, action:"SENT_BACK", by:identity.name, date:new Date().toISOString().slice(0,10) }] },
    });
  }

  if (stage === "PLAN_APPROVED") {
    return <ApprovedView plan={plan} years={years} />;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
        <BSectionLabel right={<Badge text={stage==="LEADERSHIP_REVIEW"?"With CSSMO":"With CISO"} color={C.amber} />}>Leadership Review</BSectionLabel>
        <ReviewChain stage={stage} />
        {review.log.length>0 && (
          <div style={{ marginTop:14 }}>
            {review.log.map((e,i)=>(
              <div key={i} style={{ fontSize:12.5, color:C.textMuted, padding:"4px 0", borderTop:i?`1px solid ${C.border}`:"none" }}>
                <strong style={{ color:e.action==="APPROVED"||e.action==="AGREED"?C.green:C.red }}>{e.step} {e.action.toLowerCase().replace("_"," ")}</strong> · {e.by} · {e.date}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
        <BSectionLabel>Sponsor</BSectionLabel>
        <div style={{ fontSize:13.5, marginBottom:12 }}>Current sponsor: <strong>{initiative?.sponsorId || "—"}</strong></div>
        {(cssmoCanAct || cisoCanAct) ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <label style={{ display:"flex", gap:9, alignItems:"center", fontSize:13.5, cursor:"pointer" }}>
              <input type="checkbox" checked={review.sponsorConfirmed} onChange={(e)=>setReview({ sponsorConfirmed:e.target.checked, sponsorChangeRequested: e.target.checked ? false : review.sponsorChangeRequested })} />
              Confirm the named sponsor still backs this plan
            </label>
            <label style={{ display:"flex", gap:9, alignItems:"center", fontSize:13.5, cursor:"pointer", color:C.textMuted }}>
              <input type="checkbox" checked={review.sponsorChangeRequested} onChange={(e)=>setReview({ sponsorChangeRequested:e.target.checked, sponsorConfirmed: e.target.checked ? false : review.sponsorConfirmed })} />
              Flag a sponsor change is needed
            </label>
            {review.sponsorChangeRequested && (
              <select style={{ ...inputStyle, maxWidth:340 }} value={review.newSponsorId||""} onChange={(e)=>setReview({ newSponsorId:e.target.value||null })}>
                <option value="">— proposed new sponsor —</option>
                {SPONSORS.map((s)=><option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        ) : (
          <Badge text={review.sponsorConfirmed?"Sponsor confirmed":review.sponsorChangeRequested?"Sponsor change flagged":"Awaiting sponsor confirmation"} color={review.sponsorConfirmed?C.green:C.amber} />
        )}
      </div>

      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel right={<Badge text={`Agreed total ${USD(agreedGrand)}`} color={C.deepest} />}>
          Agreed Amounts {canEditAmounts ? "(editable)" : "(read-only)"}
        </BSectionLabel>
        <p style={{ fontSize:12.5, color:C.textMuted, marginTop:-6, marginBottom:14 }}>
          Defaults to the proposed figures. {canEditAmounts ? "Adjust any year as needed — each year must still balance (Service + License = CapEx + OpEx)." : "Only CSSMO and CISO can adjust these."}
        </p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760 }}>
            <thead><tr style={{ background:C.deepest }}>{["Year","Proposed","Agreed Service","Agreed License","Agreed CapEx","Agreed OpEx","Agreed Total","Check"].map((h)=><th key={h} style={{ textAlign:h==="Year"?"left":"right", color:"#fff", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.3, padding:"9px 9px", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>{years.map((y,i)=>{
              const r=agreedRows[y]||{}; const split=num(r.service)+num(r.license), co=num(r.capex)+num(r.opex), match=split===co;
              const snap = (plan.proposedSnapshot||[]).find((p)=>p.year===y);
              return (
                <tr key={y} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
                  <td style={{ padding:"8px 9px", fontWeight:700 }}>{y}</td>
                  <td style={{ padding:"8px 9px", textAlign:"right", color:C.textMuted, fontSize:12.5 }}>{USD(snap?snap.total:0)}</td>
                  {["service","license","capex","opex"].map((k)=>(
                    <td key={k} style={{ padding:"5px 6px" }}>
                      {canEditAmounts ? <input style={{ ...moneyInput, textAlign:"right" }} value={r[k]||""} onChange={(e)=>setAgreed(y,k,e.target.value)} placeholder="0" />
                        : <div style={{ textAlign:"right", fontSize:13 }}>{USD(num(r[k]))}</div>}
                    </td>
                  ))}
                  <td style={{ padding:"8px 9px", textAlign:"right", fontWeight:700, fontSize:13 }}>{USD(split)}</td>
                  <td style={{ padding:"8px 9px", textAlign:"right" }}>
                    {split===0&&co===0 ? <span style={{ color:C.textMuted }}>—</span> : match ? <span style={{ color:C.green, fontWeight:700 }}>✓</span> : <span style={{ color:C.red, fontWeight:600, fontSize:11 }}>✕ {USD(co)}</span>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div style={{ background:"#F7FBFE", border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
        {cssmoCanAct && (
          <div>
            <div style={{ fontSize:13.5, fontWeight:700, marginBottom:4 }}>CSSMO decision</div>
            <div style={{ fontSize:12.5, color:C.textMuted, marginBottom:12 }}>Agree the amounts and confirm the sponsor, then pass to the CISO for final approval.</div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn kind="success" disabled={!allValid || !review.sponsorConfirmed} onClick={cssmoPass}>Agree & Send to CISO →</Btn>
              <Btn kind="danger" onClick={()=>sendBack("CSSMO")}>Send Back to Owner</Btn>
            </div>
            {(!allValid || !review.sponsorConfirmed) && <div style={{ fontSize:12, color:C.amber, marginTop:8 }}>{!review.sponsorConfirmed?"Confirm the sponsor first. ":""}{!allValid?"Every agreed year must balance.":""}</div>}
          </div>
        )}
        {cisoCanAct && (
          <div>
            <div style={{ fontSize:13.5, fontWeight:700, marginBottom:4 }}>CISO final approval</div>
            <div style={{ fontSize:12.5, color:C.textMuted, marginBottom:12 }}>Give final budget approval (generates the locked budget records per year) or send back.</div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn kind="success" disabled={!allValid} onClick={cisoApprove}>Approve Budget →</Btn>
              <Btn kind="danger" onClick={()=>sendBack("CISO")}>Send Back to Owner</Btn>
            </div>
            {!allValid && <div style={{ fontSize:12, color:C.amber, marginTop:8 }}>Every agreed year must balance before approval.</div>}
          </div>
        )}
        {!cssmoCanAct && !cisoCanAct && (
          <div style={{ fontSize:13, color:C.textMuted }}>
            {isOversight ? "Awaiting the other reviewer." : "This plan is in leadership review. Only CSSMO and CISO can act here."}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewChain({ stage }) {
  const steps = [{ key:"CSSMO", label:"CSSMO agrees amounts" }, { key:"CISO", label:"CISO final approval" }];
  function st(key){
    if (stage==="PLAN_APPROVED") return "done";
    if (key==="CSSMO") return stage==="CISO_APPROVAL" ? "done" : stage==="LEADERSHIP_REVIEW" ? "current" : "todo";
    if (key==="CISO") return stage==="CISO_APPROVAL" ? "current" : "todo";
    return "todo";
  }
  return (
    <div>{steps.map((s,i)=>{ const state=st(s.key); const color=state==="done"?C.green:state==="current"?C.amber:C.border; return (
      <div key={s.key} style={{ display:"flex", alignItems:"center", gap:11, padding:"6px 0" }}>
        <div style={{ width:22, height:22, borderRadius:"50%", background:state==="done"?C.green:"#fff", border:`2px solid ${color}`, display:"grid", placeItems:"center", color:state==="done"?"#fff":color, fontSize:12, fontWeight:700 }}>{state==="done"?"✓":i+1}</div>
        <div style={{ fontSize:13.5, fontWeight:state==="current"?700:500, color:state==="todo"?C.textMuted:C.textDark }}>{s.label}{state==="current" && <span style={{ marginLeft:8, fontSize:11, color:C.amber, fontWeight:700 }}>• awaiting</span>}</div>
      </div>
    );})}</div>
  );
}

function ApprovedView({ plan, years }) {
  const records = plan.budgetRecords || [];
  const grand = records.reduce((a,r)=>a+r.totalUSD,0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ background:"linear-gradient(180deg,#fff,#F1F8F3)", border:`1px solid ${C.green}66`, borderLeft:`4px solid ${C.green}`, borderRadius:10, padding:"18px 20px" }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.green }}>✓ Budget Approved</div>
        <div style={{ fontSize:12.5, color:C.textMuted, marginTop:4, lineHeight:1.5 }}>
          The CISO approved this plan. {records.length} budget record{records.length>1?"s":""} were generated — one per spend year — and will consolidate into the corporate cycle, locking when each cycle closes.
        </div>
        {(plan.review?.log||[]).length>0 && (
          <div style={{ marginTop:12 }}>
            {plan.review.log.map((e,i)=>(
              <div key={i} style={{ fontSize:12, color:C.textMuted }}>
                <strong style={{ color:e.action==="APPROVED"||e.action==="AGREED"?C.green:C.red }}>{e.step} {e.action.toLowerCase().replace("_"," ")}</strong> · {e.by} · {e.date}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"20px 22px" }}>
        <BSectionLabel right={<Badge text={`Approved total ${USD(grand)}`} color={C.green} />}>Budget Records (locked figures)</BSectionLabel>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:680 }}>
            <thead><tr style={{ background:C.deepest }}>{["Record","Year","Service","License","CapEx","OpEx","Total","Status"].map((h)=><th key={h} style={{ textAlign:h==="Record"||h==="Year"?"left":"right", color:"#fff", fontSize:10.5, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, padding:"9px 11px" }}>{h}</th>)}</tr></thead>
            <tbody>{records.map((r,i)=>(
              <tr key={r.budgetRecordId} style={{ background:i%2?"#F7FBFE":"#fff", borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:"8px 11px", fontSize:12, color:C.textMuted }}>{r.budgetRecordId}</td>
                <td style={{ padding:"8px 11px", fontWeight:700 }}>{r.year}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(r.serviceFeesUSD)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(r.licenseFeesUSD)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(r.capexUSD)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}>{USD(r.opexUSD)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right", fontWeight:700 }}>{USD(r.totalUSD)}</td>
                <td style={{ padding:"8px 11px", textAlign:"right" }}><Badge text="Approved" color={C.green} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function SourceSummary({ title, rec, totals }) {
  if (!rec) return <div style={{ background:"#F4F7F9", border:`1px dashed ${C.border}`, borderRadius:10, padding:"16px 18px", color:C.textMuted, fontSize:13 }}>{title} track not used for this plan.</div>;
  const grand = totals.reduce((a,t)=>a+t.total,0);
  return (
    <div style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:C.deepest }}>{title}</div>
        <div style={{ display:"flex", gap:7, alignItems:"center" }}>{rec.confidence && <Badge text={`${CONFIDENCE[rec.confidence].label} confidence`} color={CONFIDENCE[rec.confidence].color} />}<Badge text={rec.completed?"Complete":"Draft"} color={rec.completed?C.green:C.amber} /></div>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:C.textDark }}>{USD(grand)}</div>
      <div style={{ fontSize:11.5, color:C.textMuted, marginTop:2 }}>across {totals.length} year{totals.length>1?"s":""}</div>
    </div>
  );
}

const SHARED_SEED_INITIATIVES = seedInitiatives;

// ══════════════════════════════════════════════════════════════════════════════
//                       CYBER PORTFOLIO SUITE — ORCHESTRATOR
// ══════════════════════════════════════════════════════════════════════════════

export default function CyberPortfolioSuite() {
  const [app, setApp] = useState(null);
  const [sharedInitiatives, setSharedInitiatives] = useState(SHARED_SEED_INITIATIVES);

  const upsertInitiative = (rec) => {
    setSharedInitiatives((prev) => {
      const id = rec.initiativeId || rec.id;
      const idx = prev.findIndex((r) => (r.initiativeId || r.id) === id);
      if (idx === -1) return [rec, ...prev];
      const next = [...prev];
      next[idx] = { ...next[idx], ...rec };
      return next;
    });
  };

  const patchInitiative = (id, patch) => {
    setSharedInitiatives((prev) =>
      prev.map((r) => ((r.initiativeId || r.id) === id ? { ...r, ...patch } : r))
    );
  };

  const exitToLauncher = () => setApp(null);

  if (app === "budgeting") {
    return (
      <BudgetingApp
        onExit={exitToLauncher}
        sharedInitiatives={sharedInitiatives}
        upsertInitiative={upsertInitiative}
        patchInitiative={patchInitiative}
      />
    );
  }

  if (app === "cpm") {
    return (
      <CPMApp
        onExit={exitToLauncher}
        sharedInitiatives={sharedInitiatives}
        upsertInitiative={upsertInitiative}
        patchInitiative={patchInitiative}
      />
    );
  }

  return <SuiteLauncher onPick={setApp} sharedInitiatives={sharedInitiatives} />;
}

function SuiteLauncher({ onPick, sharedInitiatives }) {
  const FONT = "'Segoe UI','Trebuchet MS',system-ui,sans-serif";
  const DEEP = "#005587";
  const DARK = "#0076A8";
  const MID = "#00A3E0";
  const LIGHT = "#62B5E5";
  const TEXT_DARK = "#0D2E45";
  const TEXT_MID = "#2A5070";
  const TEXT_MUTED = "#6A90A8";
  const BORDER = "#C8DFF0";
  const PAGE_BG = "#F2F6FA";
  const CARD_BG = "#FFFFFF";

  const initiativeCount = (sharedInitiatives || []).length;
  const endorsedCount = (sharedInitiatives || []).filter((r) => r.status === "ENDORSED").length;

  const cards = [
    {
      id: "budgeting",
      title: "Cyber Budgeting",
      subtitle: "Initiative definition · prioritization · leadership review · budget cycle",
      desc:
        "Define new initiatives, run horizon scans, score against six weighted criteria, and shepherd proposals through CSSMO and CISO endorsement. Then manage the corporate budgeting cycle and produce locked budget records.",
      tag: "MODULES 1–5",
      tagColor: DARK,
      accent: DARK,
    },
    {
      id: "cpm",
      title: "Cyber Portfolio Management",
      subtitle: "Strategy · RFP · contracting · execution · weekly updates",
      desc:
        "Once endorsed, initiatives flow into the CPM pipeline. Author RFPs, capture vendor contracts on award, run the active project register, submit weekly updates, and view the CISO portfolio dashboard.",
      tag: "STRATEGY → ACTIVE",
      tagColor: MID,
      accent: MID,
    },
  ];

  return (
    <div style={{ font: FONT, background: PAGE_BG, minHeight: "100vh", color: TEXT_DARK }}>
      <div
        style={{
          background: DEEP,
          color: "#fff",
          padding: "18px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: MID,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            ⊞
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 0.4 }}>Cyber Portfolio Suite</div>
            <div style={{ fontSize: 11.5, color: "#C8E8F8", marginTop: 2 }}>
              End-to-end cyber team budgeting & portfolio management
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#C8E8F8" }}>
          <span>
            {endorsedCount} endorsed · {initiativeCount} total initiatives in shared store
          </span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: MID,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            CX
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 36px 64px" }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: TEXT_MUTED,
              letterSpacing: 0.12,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Launcher
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_DARK, marginBottom: 6 }}>
            Choose an application to enter
          </div>
          <div style={{ fontSize: 13.5, color: TEXT_MID, maxWidth: 720, lineHeight: 1.6 }}>
            Both apps read from and write to the same initiative store. Endorsing an initiative in Budgeting makes it
            instantly visible in CPM's Strategy pipeline, and edits in CPM flow back the other way.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          {cards.map((c) => (
            <div
              key={c.id}
              onClick={() => onPick(c.id)}
              style={{
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderTop: `4px solid ${c.accent}`,
                borderRadius: 8,
                padding: "26px 28px",
                cursor: "pointer",
                transition: "box-shadow 0.18s, transform 0.18s",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,85,135,0.18)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  alignSelf: "flex-start",
                  background: c.tagColor + "18",
                  color: c.tagColor,
                  border: `1px solid ${c.tagColor}40`,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 0.08,
                  padding: "3px 9px",
                  borderRadius: 3,
                  marginBottom: 14,
                }}
              >
                {c.tag}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_DARK, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: c.accent, marginBottom: 14 }}>{c.subtitle}</div>
              <div style={{ fontSize: 13, color: TEXT_MID, lineHeight: 1.7, flex: 1 }}>{c.desc}</div>
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: `1px solid ${BORDER}`,
                  paddingTop: 14,
                }}
              >
                <span style={{ fontSize: 11, color: TEXT_MUTED }}>Click to open</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>Enter →</span>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 36,
            background: "#E8F4FC",
            border: `1px solid ${LIGHT}`,
            borderLeft: `4px solid ${DARK}`,
            borderRadius: 6,
            padding: "14px 18px",
            fontSize: 12.5,
            color: TEXT_MID,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: DEEP }}>How they connect.</strong> Initiatives flow Budgeting → CPM once endorsed. The
          two apps maintain a single canonical record per initiative; the Budgeting app's six short domain keys map onto
          CPM's ten canonical domain labels automatically.
        </div>
      </div>
    </div>
  );
}
