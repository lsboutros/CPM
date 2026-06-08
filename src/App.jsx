import { useState, useMemo } from "react";

// Brand tokens
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
  lineColor:   "#C8DFF0",
  critical:      "#7A1530",
  criticalLight: "#F6E4E9",
};

// Reference data
const DOMAINS     = ["Identity & Access Management","Network Security","GRC & Compliance","Security Operations (SOC)","Application Security","Cloud Security","Data Protection","Threat Intelligence","Third-Party Risk","Cyber Transformation"];
const PILLARS     = ["Cyber Resilience","Risk Reduction","Regulatory Compliance","Digital Transformation Enablement","Talent & Culture","Operational Excellence"];
const FRAMEWORKS  = ["NIST CSF","ISO 27001","NIST 800-53","CIS Controls","DORA","NCA ECC","PCI DSS","GDPR","SOC 2"];
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
      {q:"How many existing identified cyber risks does this initiative address?",opts:["5 or more risks from the risk register","3-4 risks","1-2 risks","No direct link to risk register"]},
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
      {q:"What is the expected timeline to realize value?",opts:["Immediate — value realized upon go-live","Short-term — within 3 months post go-live","Medium-term — 3-12 months post go-live","Long-term — beyond 12 months"]},
      {q:"Does this initiative generate cost savings, revenue protection, or efficiency gains?",opts:["Yes — quantifiable financial value","Yes — operational efficiency gains","Indirect value only (improved posture)","Value is primarily reputational or compliance-driven"]},
      {q:"Has the expected value been validated with a business stakeholder?",opts:["Yes — formally documented and signed off","Yes — verbally agreed with senior stakeholder","Under discussion, not confirmed","No stakeholder validation yet"]},
    ]},
];

const STRATEGY_SECTIONS = [
  {id:"identity",label:"Project Identity"},{id:"vision",label:"Strategic Vision"},
  {id:"scope",label:"Scope & Milestones"},{id:"prioritization",label:"Prioritization"},
  {id:"budget",label:"Budget & Timeline"},{id:"risks",label:"Dependencies"},{id:"submit",label:"Submit"},
];
const RFP_SECTIONS = [
  {id:"reference",label:"Strategy Reference"},{id:"vision",label:"Vision & KPIs"},
  {id:"scope",label:"Scope Revision"},{id:"milestones",label:"Milestones & Deliverables"},
  {id:"requirements",label:"Requirements"},{id:"rfpstatus",label:"RFP Status"},{id:"submit",label:"Submit"},
];

const INIT_PIPELINE = [
  { id:"CPM-2025-001", name:"IAM Modernisation Programme", domain:"Identity & Access Management", phase:"Strategy", score:88, owner:"Sarah Al-Mansouri", budget:"$1.2M", submitted:"12 Apr 2025", pillar:"Risk Reduction", status:"Pending CISO Review", frameworks:["NIST CSF","ISO 27001"], problemStatement:"Lack of centralised identity controls across business units.", visionStatement:"A unified IAM platform covering all users and privileged accounts.", businessOutcome:"Reduce identity-related incidents by 80%.", inScope:"All user identities across HQ and subsidiaries.", assumptions:"Executive sponsorship confirmed.", milestones:[{name:"Discovery",date:"2025-06-01",deliverable:"As-Is Report"}], kpis:[{name:"MFA Coverage",baseline:"40%",target:"95%",method:"Monthly audit"}], depRisks:[{initiative:"Network Segmentation",dependency:"Shared directory",risk:"Delays IAM rollout",severity:"High"}] },
  { id:"CPM-2025-004", name:"Cloud Security Baseline Framework", domain:"Cloud Security", phase:"Strategy", score:74, owner:"Khalid Ibrahim", budget:"$680K", submitted:"18 Apr 2025", pillar:"Cyber Resilience", status:"Pending CISO Review", frameworks:["CIS Controls","NIST CSF"], problemStatement:"No consistent security baseline across cloud environments.", visionStatement:"Standardised controls across all cloud workloads.", businessOutcome:"Eliminate misconfiguration incidents.", inScope:"AWS and Azure production environments.", assumptions:"Cloud team available.", milestones:[{name:"Baseline Assessment",date:"2025-07-01",deliverable:"Gap Report"}], kpis:[{name:"Misconfiguration rate",baseline:"12%",target:"<2%",method:"Weekly CSPM scan"}], depRisks:[] },
  { id:"CPM-2025-002", name:"SOC Uplift & SIEM Migration", domain:"Security Operations (SOC)", phase:"RFP", score:91, owner:"Ahmed Rashid", budget:"$3.4M", submitted:"02 Mar 2025", pillar:"Cyber Resilience", status:"RFP Issued", frameworks:["NIST CSF","CIS Controls"], problemStatement:"Current SIEM lacks coverage and correlation capability.", visionStatement:"Modern SOC with 24/7 detection and response.", businessOutcome:"MTTD reduced from 72hrs to under 4hrs.", inScope:"All IT and OT environments.", assumptions:"Vendor shortlist approved.", milestones:[{name:"RFP Close",date:"2025-05-30",deliverable:"Vendor Proposals"},{name:"Evaluation",date:"2025-06-30",deliverable:"Evaluation Report"}], kpis:[{name:"MTTD",baseline:"72hrs",target:"<4hrs",method:"SOC metrics dashboard"}], depRisks:[] },
  { id:"CPM-2025-005", name:"Data Loss Prevention Implementation", domain:"Data Protection", phase:"RFP", score:79, owner:"Fatima Al-Zahra", budget:"$900K", submitted:"14 Mar 2025", pillar:"Risk Reduction", status:"RFP Draft", frameworks:["GDPR","ISO 27001"], problemStatement:"No automated controls preventing sensitive data exfiltration.", visionStatement:"Organisation-wide DLP covering endpoints, email and cloud.", businessOutcome:"Zero data loss incidents post-implementation.", inScope:"All endpoints and email systems.", assumptions:"Data classification completed first.", milestones:[{name:"Requirements",date:"2025-06-01",deliverable:"Requirements Doc"}], kpis:[{name:"Data incidents",baseline:"8/yr",target:"0",method:"Incident register"}], depRisks:[] },
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
      {id:"D-001",name:"As-Is Architecture Report",description:"Current state assessment of identity infrastructure",type:"Document",milestone:"Discovery & Assessment",dueDate:"2024-10-15",responsibleParty:"Vendor",qaReviewer:"Ahmed Rashid",approver:"CISO",status:"Approved"},
      {id:"D-002",name:"Gap Analysis Document",description:"Gap analysis vs PAM industry best practice",type:"Document",milestone:"Discovery & Assessment",dueDate:"2024-10-30",responsibleParty:"Vendor",qaReviewer:"Ahmed Rashid",approver:"CISO",status:"Approved"},
      {id:"D-003",name:"PAM Target Architecture",description:"Target state PAM architecture aligned to vision",type:"Document",milestone:"Design Phase",dueDate:"2024-12-15",responsibleParty:"Vendor",qaReviewer:"Sarah Al-Mansouri",approver:"Domain Lead",status:"Approved"},
      {id:"D-004",name:"Implementation Plan",description:"Detailed implementation and rollout plan",type:"Document",milestone:"Design Phase",dueDate:"2024-12-30",responsibleParty:"Vendor",qaReviewer:"Sarah Al-Mansouri",approver:"Domain Lead",status:"Approved"},
      {id:"D-005",name:"PAM Solution Deployed (Pilot)",description:"Pilot environment with selected user groups",type:"System",milestone:"Pilot Deployment",dueDate:"2025-03-15",responsibleParty:"Vendor",qaReviewer:"Omar Al-Hashimi",approver:"CISO",status:"Submitted for QA"},
      {id:"D-006",name:"UAT Results & Sign-off",description:"User acceptance test results and formal sign-off",type:"Report",milestone:"Pilot Deployment",dueDate:"2025-04-30",responsibleParty:"Internal",qaReviewer:"Omar Al-Hashimi",approver:"CISO",status:"In Progress"},
      {id:"D-007",name:"Full Production Rollout",description:"Production deployment to all in-scope user groups",type:"System",milestone:"Production Rollout",dueDate:"2025-05-30",responsibleParty:"Vendor",qaReviewer:"Omar Al-Hashimi",approver:"CISO",status:"Not Started"},
      {id:"D-008",name:"Handover & Training Materials",description:"Documentation, runbooks, and training for ops team",type:"Training",milestone:"Production Rollout",dueDate:"2025-06-15",responsibleParty:"Vendor",qaReviewer:"Sarah Al-Mansouri",approver:"Domain Lead",status:"Not Started"},
    ],
    milestonesList:[
      {name:"Discovery & Assessment",startDate:"2024-09-01",endDate:"2024-10-30",weight:15,status:"Completed"},
      {name:"Design Phase",startDate:"2024-11-01",endDate:"2024-12-30",weight:20,status:"Completed"},
      {name:"Pilot Deployment",startDate:"2025-01-15",endDate:"2025-04-30",weight:30,status:"In Progress"},
      {name:"Production Rollout",startDate:"2025-05-01",endDate:"2025-06-30",weight:35,status:"Not Started"},
    ],
    risksList:[
      {id:"R-001",category:"Vendor",description:"Vendor resource availability during Q3 holiday season may delay deployment",likelihood:"Medium",impact:"High",mitigation:"Resource plan agreed in advance; backup engineers identified",owner:"Rania Yousef",status:"Open",overrideRating:"",overrideComment:""},
      {id:"R-002",category:"Technical",description:"Legacy AD integration may require custom connectors not in scope",likelihood:"Medium",impact:"Medium",mitigation:"Technical workshop scheduled with vendor for week 4",owner:"Ahmed Rashid",status:"Mitigated",overrideRating:"",overrideComment:""},
      {id:"R-003",category:"Operational",description:"Production cutover may require extended maintenance window",likelihood:"Low",impact:"High",mitigation:"Cutover plan to be reviewed with operations team by week 20",owner:"Omar Al-Hashimi",status:"Closed",overrideRating:"",overrideComment:""},
    ],
    dependenciesList:[
      {initiative:"Network Segmentation Project",nature:"Shared directory services",riskIfDelayed:"PAM rollout cannot complete without network controls",severity:"High",owner:"Yusuf Al-Farsi",linkedStatus:"In Progress"},
    ],
    contractData:{
      vendorName:"Accenture Security",contractRef:"CTR-2024-0421",procurementRef:"PO-2024-1187",
      contractStart:"2024-09-01",contractEnd:"2025-06-30",
      contractValue:"850000",capex:"550000",opex:"300000",
      visionStatement:"A unified Privileged Access Management platform covering all administrative accounts across HQ and subsidiaries, with full session monitoring and just-in-time access workflows.",
      problemStatement:"Current privileged access is managed manually with shared credentials, no session recording, and no just-in-time access controls.",
      businessOutcome:"Eliminate shared privileged credentials, enable session recording on 100% of privileged sessions, and reduce time-to-revoke for departed administrators from days to minutes.",
      valueRealization:[
        {valueCommitted:"100% of privileged accounts vaulted in PAM",measurementMethod:"Monthly PAM audit report",targetDate:"2025-07-15"},
        {valueCommitted:"Session recording on all privileged sessions",measurementMethod:"PAM session logs review",targetDate:"2025-06-30"},
        {valueCommitted:"Time-to-revoke reduced to under 5 minutes",measurementMethod:"Quarterly access lifecycle audit",targetDate:"2025-09-30"},
      ],
      inScope:"All privileged accounts across HQ, regional offices, and subsidiaries, including domain admins, server admins, database admins, application admins, and network device administrators.",
      assumptions:"Active Directory integration is feasible without major modifications. Operations team available for cutover planning.",
      pm:"Rania Yousef",pmEmail:"rania.yousef@org.com",escalationContact:"Sarah Al-Mansouri",
      team:[
        {name:"Rania Yousef",role:"Project Manager",organisation:"Internal",allocation:"100%"},
        {name:"Ahmed Rashid",role:"Technical Lead",organisation:"Internal",allocation:"60%"},
        {name:"Omar Al-Hashimi",role:"Security Architect",organisation:"Internal",allocation:"40%"},
        {name:"Accenture Team",role:"Implementation Vendor",organisation:"Accenture",allocation:"100%"},
      ],
    }
  },
  { id:"CPM-2024-008", name:"GRC Platform Implementation", domain:"GRC & Compliance", progress:45, status:"At Risk", risks:3, issues:2, pm:"Tariq Al-Dosari", budget:"$1.5M", spent:"$780K", dueDate:"15 Aug 2025", milestone:"Requirements Sign-off", milestoneStatus:"Delayed" },
  { id:"CPM-2024-015", name:"Application Security Programme", domain:"Application Security", progress:62, status:"On Track", risks:0, issues:1, pm:"Nadia Karimi", budget:"$620K", spent:"$390K", dueDate:"31 Jul 2025", milestone:"Pen Test Phase 2", milestoneStatus:"On Track" },
  { id:"CPM-2024-019", name:"Threat Intelligence Platform", domain:"Threat Intelligence", progress:31, status:"Delayed", risks:4, issues:2, pm:"Hassan Al-Amri", budget:"$1.1M", spent:"$420K", dueDate:"01 Sep 2025", milestone:"Vendor Integration", milestoneStatus:"Delayed" },
  { id:"CPM-2024-022", name:"Employee Cyber Awareness Programme", domain:"GRC & Compliance", progress:89, status:"On Track", risks:0, issues:0, pm:"Sara Mahmoud", budget:"$280K", spent:"$248K", dueDate:"30 May 2025", milestone:"Final Assessment", milestoneStatus:"On Track" },
  { id:"CPM-2024-017", name:"Network Segmentation Project", domain:"Network Security", progress:54, status:"At Risk", risks:2, issues:1, pm:"Yusuf Al-Farsi", budget:"$740K", spent:"$435K", dueDate:"15 Sep 2025", milestone:"Firewall Rule Deployment", milestoneStatus:"At Risk" },
  { id:"CPM-2024-003", name:"Zero Trust Network Architecture", domain:"Network Security", progress:12, status:"On Track", risks:0, issues:0, pm:"Omar Al-Hashimi", budget:"$2.1M", spent:"$180K", dueDate:"31 Dec 2025", milestone:"Contracting & Onboarding", milestoneStatus:"In Progress" },
  { id:"CPM-2023-007", name:"Email Security Gateway Upgrade", domain:"Application Security", progress:100, status:"Closed", risks:0, issues:0, pm:"Sara Mahmoud", budget:"$420K", spent:"$415K", dueDate:"15 Dec 2024", milestone:"Closure & Handover", milestoneStatus:"Completed", closureDate:"22 Dec 2024" },
  { id:"CPM-2023-012", name:"Cloud Posture Management Tool", domain:"Cloud Security", progress:100, status:"Closed", risks:0, issues:0, pm:"Khalid Ibrahim", budget:"$590K", spent:"$572K", dueDate:"30 Nov 2024", milestone:"Closure & Handover", milestoneStatus:"Completed", closureDate:"03 Dec 2024" },
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
  visionStatement: strategy.visionStatement || "",
  problemStatement: strategy.problemStatement || "",
  businessOutcome: strategy.businessOutcome || "",
  frameworks: strategy.frameworks || [],
  kpis: (strategy.kpis || []).map(k=>({...k})),
  scopeRevisionNotes:"",
  inScope: strategy.inScope || "",
  outOfScope: (strategy.outOfScope || [{item:"",reason:""}]).map(r=>({...r})),
  assumptions: strategy.assumptions || "",
  milestones: (strategy.milestones || []).map(m=>({...m, deliverableDesc:"", deliverableType:"", responsibleParty:""})),
  functionalReqs:[{id:"FR-001",description:"",priority:"Mandatory",acceptance:""}],
  nonFunctionalReqs:[{id:"NFR-001",description:"",priority:"Mandatory",acceptance:""}],
  rfpStatus:"Draft", rfpNotes:"",
});

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
const statusColor = s => ({"On Track":B.green,"At Risk":B.amber,"Delayed":B.red,"Closed":B.textMuted,"Completed":B.green,"In Progress":B.midBlue,"Not Started":B.textMuted}[s]||B.textMuted);
const statusBg    = s => ({"On Track":B.greenLight,"At Risk":B.amberLight,"Delayed":B.redLight,"Closed":B.pageBg,"Completed":B.greenLight,"In Progress":B.activeBg,"Not Started":B.pageBg}[s]||B.pageBg);
const nextPhase   = {Strategy:"RFP",RFP:"Active"};
const nextLabel   = {Strategy:"Move to RFP →",RFP:"Activate Project →"};
const today = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

const Lbl = ({children,req}) => (
  <div style={{fontSize:11,fontWeight:600,color:B.textMuted,letterSpacing:"0.06em",marginBottom:5,textTransform:"uppercase"}}>
    {children}{req&&<span style={{color:B.red,marginLeft:3}}>*</span>}
  </div>
);
const Inp = ({placeholder,value,onChange,type="text",disabled,readOnly}) => (
  <input type={type} placeholder={readOnly?"—":placeholder} value={value||""} onChange={e=>onChange?.(e.target.value)}
    disabled={disabled} readOnly={readOnly}
    style={{width:"100%",boxSizing:"border-box",border:readOnly?"none":`1px solid ${B.border}`,borderBottom:readOnly?`1px solid ${B.borderLight}`:"",borderRadius:readOnly?0:4,padding:"8px 10px",fontSize:13,color:B.textDark,background:readOnly?"transparent":disabled?B.pageBg:B.inputBg,fontFamily:"inherit",outline:"none",fontWeight:readOnly?600:400}}
    onFocus={e=>!disabled&&!readOnly&&(e.target.style.borderColor=B.midBlue)} onBlur={e=>!readOnly&&(e.target.style.borderColor=B.border)} />
);
const Sel = ({options,value,onChange,placeholder,readOnly,small}) => readOnly
  ? <div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"8px 0",borderBottom:`1px solid ${B.borderLight}`}}>{value||"—"}</div>
  : <select value={value||""} onChange={e=>onChange?.(e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1px solid ${B.border}`,borderRadius:4,padding:small?"6px 8px":"8px 10px",fontSize:small?12:13,color:value?B.textDark:B.textMuted,background:B.inputBg,fontFamily:"inherit",outline:"none",appearance:"none",cursor:"pointer"}}>
      <option value="" disabled>{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}
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
const TD = ({children,nowrap}) => <td style={{padding:"8px 10px",fontSize:12,color:B.textDark,borderBottom:`1px solid ${B.borderLight}`,verticalAlign:"middle",whiteSpace:nowrap?"nowrap":"normal"}}>{children}</td>;
const Badge = ({children,color,bg}) => <span style={{fontSize:10,fontWeight:700,color:color||B.darkBlue,background:bg||B.activeBg,border:`1px solid ${(color||B.darkBlue)+"30"}`,borderRadius:3,padding:"2px 8px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{children}</span>;
const ProgressBar = ({pct,color}) => <div style={{height:6,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color||B.darkBlue,borderRadius:3,transition:"width 0.4s"}}/></div>;

const Header = ({subtitle,right}) => (
  <div style={{background:B.deepBlue,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",gap:24}}>
      <div style={{color:"#FFFFFF",fontWeight:800,fontSize:15,letterSpacing:"0.14em"}}>CPM</div>
      <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
      <div style={{color:B.headerText,fontSize:12}}>Cyber Portfolio Management</div>
      <div style={{width:1,height:20,background:"#FFFFFF30"}}/>
      <div style={{color:"#FFFFFF90",fontSize:12}}>{subtitle}</div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:16}}>{right}<div style={{width:30,height:30,borderRadius:"50%",background:B.midBlue,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:12,fontWeight:700}}>CX</div></div>
  </div>
);

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

const RISK_MATRIX = {
  "High-High":"Critical","High-Medium":"High","High-Low":"Medium",
  "Medium-High":"High","Medium-Medium":"Medium","Medium-Low":"Low",
  "Low-High":"Medium","Low-Medium":"Low","Low-Low":"Low",
};
const ratingColor = r => ({Critical:B.critical,High:B.red,Medium:B.amber,Low:B.green}[r]||B.textMuted);
const ratingBg    = r => ({Critical:B.criticalLight,High:B.redLight,Medium:B.amberLight,Low:B.greenLight}[r]||B.pageBg);

const CONTRACT_SECTIONS = [
  {id:"reference",label:"Contract Reference"},{id:"vendor",label:"Vendor & Contract"},
  {id:"vision",label:"Vision & Value"},{id:"scope",label:"Scope & Deliverables"},
  {id:"timeline",label:"Timeline & Milestones"},{id:"team",label:"Project Team"},
  {id:"risks",label:"Risk Register"},{id:"dependencies",label:"Dependencies"},{id:"submit",label:"Submit & Activate"},
];

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
              <div><Lbl>Date Created</Lbl><AutoVal value={form.submitted||today}/></div>
            </G>
            <div style={{height:14}}/>
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Domain / Pillar</Lbl><Sel readOnly={readOnly} options={DOMAINS} value={form.domain} onChange={v=>set("domain",v)} placeholder="Select domain..."/></div>
              <div><Lbl>Sub-domain / Capability Area</Lbl><Inp readOnly={readOnly} placeholder="e.g. Privileged Access Management" value={form.subDomain} onChange={v=>set("subDomain",v)}/></div>
              <div/>
            </G>
            <div style={{height:14}}/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Initiative Owner</Lbl><Inp readOnly={readOnly} placeholder="Search user or enter name..." value={form.owner} onChange={v=>set("owner",v)}/></div>
              <div><Lbl req={!readOnly}>Domain Lead</Lbl><Inp readOnly={readOnly} placeholder="Search user or enter name..." value={form.domainLead} onChange={v=>set("domainLead",v)}/></div>
            </G>
          </div>
        )}
        {section===1&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Strategic Alignment & Vision"/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Problem Statement</Lbl><Txt readOnly={readOnly} rows={4} value={form.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
              <div><Lbl req={!readOnly}>Vision Statement</Lbl><Txt readOnly={readOnly} rows={4} value={form.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
            </G>
            <div style={{height:14}}/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Link to CISO Strategic Objective / Pillar</Lbl><Sel readOnly={readOnly} options={PILLARS} value={form.cisoPillar} onChange={v=>set("cisoPillar",v)} placeholder="Select pillar..."/></div>
              <div><Lbl req={!readOnly}>Expected Business Outcome</Lbl><Inp readOnly={readOnly} value={form.businessOutcome} onChange={v=>set("businessOutcome",v)}/></div>
            </G>
            <div style={{height:14}}/>
            <Lbl>Framework Alignment</Lbl>
            {readOnly
              ?<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{(form.frameworks||[]).map(fw=><Badge key={fw}>{fw}</Badge>)}</div>
              :<div style={{display:"flex",flexWrap:"wrap",gap:8}}>{FRAMEWORKS.map(fw=><button key={fw} onClick={()=>togFw(fw)} style={{padding:"5px 12px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:form.frameworks.includes(fw)?B.darkBlue:B.cardBg,color:form.frameworks.includes(fw)?"#FFFFFF":B.textMid,border:`1px solid ${form.frameworks.includes(fw)?B.darkBlue:B.border}`,fontWeight:form.frameworks.includes(fw)?700:400}}>{fw}</button>)}</div>}
            <SLine title="KPIs & Success Metrics"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="30%">KPI Name</TH><TH w="15%">Baseline</TH><TH w="15%">Target</TH><TH>Measurement Method</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.kpis.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} value={r.name} onChange={v=>setA("kpis",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.baseline} onChange={v=>setA("kpis",i,"baseline",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.target} onChange={v=>setA("kpis",i,"target",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.method} onChange={v=>setA("kpis",i,"method",v)}/></TD>
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
            <div><Lbl req={!readOnly}>In Scope Description</Lbl><Txt readOnly={readOnly} rows={4} value={form.inScope} onChange={v=>set("inScope",v)}/></div>
            <div style={{height:14}}/>
            <Lbl>Out of Scope / Exclusions</Lbl>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="45%">Exclusion Item</TH><TH>Reason / Rationale</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.outOfScope.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} value={r.item} onChange={v=>setA("outOfScope",i,"item",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.reason} onChange={v=>setA("outOfScope",i,"reason",v)}/></TD>
                  {!readOnly&&<TD>{form.outOfScope.length>1&&<DelBtn onClick={()=>rem("outOfScope",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("outOfScope",{item:"",reason:""})} label="Add Exclusion"/>}
            <div style={{height:14}}/>
            <div><Lbl>Assumptions</Lbl><Txt readOnly={readOnly} rows={2} value={form.assumptions} onChange={v=>set("assumptions",v)}/></div>
            <SLine title="Key Milestones & Deliverables"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="35%">Milestone Name</TH><TH w="18%">Target Date</TH><TH>Linked Deliverable(s)</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.milestones.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} value={r.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} type="date" value={r.date} onChange={v=>setA("milestones",i,"date",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.deliverable} onChange={v=>setA("milestones",i,"deliverable",v)}/></TD>
                  {!readOnly&&<TD>{form.milestones.length>1&&<DelBtn onClick={()=>rem("milestones",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("milestones",{name:"",date:"",deliverable:""})} label="Add Milestone"/>}
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
              </div>
              {CRITERIA.map(c=>{const n=c.questions.filter((_,qi)=>form.answers[c.key]?.[qi]!==undefined).length;return(
                <div key={c.key} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"12px 14px"}}>
                  <div style={{fontSize:9,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{c.label}</div>
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
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Estimated Budget</Lbl><Inp readOnly={readOnly} value={form.budget} onChange={v=>set("budget",v)}/></div>
              <div><Lbl>CAPEX</Lbl><Inp readOnly={readOnly} value={form.capex} onChange={v=>set("capex",v)}/></div>
              <div><Lbl>OPEX</Lbl><Inp readOnly={readOnly} value={form.opex} onChange={v=>set("opex",v)}/></div>
            </G>
            <div style={{height:16}}/>
            <G cols={3} gap={16}>
              <div><Lbl req={!readOnly}>Estimated Start Date</Lbl><Inp readOnly={readOnly} type="date" value={form.startDate} onChange={v=>set("startDate",v)}/></div>
              <div><Lbl req={!readOnly}>Estimated End Date</Lbl><Inp readOnly={readOnly} type="date" value={form.endDate} onChange={v=>set("endDate",v)}/></div>
              <div><Lbl>Budget Approval Status</Lbl><Sel readOnly={readOnly} options={["Pending","Approved","Rejected"]} value={form.budgetStatus} onChange={v=>set("budgetStatus",v)} placeholder="..."/></div>
            </G>
          </div>
        )}
        {section===5&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Risk & Dependency Flags"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="22%">Related Initiative</TH><TH w="25%">Nature</TH><TH>Risk if Delayed</TH><TH w="12%">Severity</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{form.depRisks.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} value={r.initiative} onChange={v=>setA("depRisks",i,"initiative",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.dependency} onChange={v=>setA("depRisks",i,"dependency",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.risk} onChange={v=>setA("depRisks",i,"risk",v)}/></TD>
                  <TD>{readOnly?<Badge color={r.severity==="High"?B.red:r.severity==="Medium"?B.amber:B.green} bg={r.severity==="High"?B.redLight:r.severity==="Medium"?B.amberLight:B.greenLight}>{r.severity||"—"}</Badge>:<Sel options={["High","Medium","Low"]} value={r.severity} onChange={v=>setA("depRisks",i,"severity",v)} placeholder="..."/>}</TD>
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
                {label:"Initiative",value:form.name||"—"},{label:"Domain",value:form.domain||"—"},
                {label:"Owner",value:form.owner||"—"},{label:"CISO Pillar",value:form.cisoPillar||"—"},
                {label:"Est. Budget",value:form.budget?`$${Number(form.budget).toLocaleString()}`:"—",color:B.darkBlue},
                {label:"Priority Score",value:filled>0?`${score} / 100`:"Not scored",color:filled>0?scoreColor(score):B.textMuted},
              ].map((item,i)=>(
                <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:item.color||B.textDark}}>{item.value}</div>
                </div>
              ))}
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
          <div style={{background:B.deepBlue,borderRadius:6,padding:"20px 24px"}}>
            <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Carried Forward from Strategy Phase — Read Only</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[{label:"Initiative Name",value:strategy.name},{label:"Initiative ID",value:strategy.id},{label:"Domain",value:strategy.domain},{label:"Owner",value:strategy.owner},{label:"Priority Score",value:strategy.score,color:scoreColor(strategy.score||0)},{label:"Est. Budget",value:strategy.budget},{label:"Submitted",value:strategy.submitted}].map((f,i)=>(
                <div key={i} style={{background:"#FFFFFF15",borderRadius:5,padding:"10px 14px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.headerText,textTransform:"uppercase",marginBottom:4}}>{f.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:f.color||"#FFFFFF"}}>{f.value||"—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {section===1&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Vision & Strategic Alignment"/>
            <G cols={2} gap={16}>
              <div><Lbl req={!readOnly}>Problem Statement</Lbl><Txt readOnly={readOnly} rows={4} value={rfp.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
              <div><Lbl req={!readOnly}>Vision Statement</Lbl><Txt readOnly={readOnly} rows={4} value={rfp.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
            </G>
            <div style={{height:14}}/>
            <Lbl req={!readOnly}>Expected Business Outcome</Lbl>
            <Inp readOnly={readOnly} value={rfp.businessOutcome} onChange={v=>set("businessOutcome",v)}/>
            <SLine title="KPIs"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="30%">KPI</TH><TH w="15%">Baseline</TH><TH w="15%">Target</TH><TH>Method</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{rfp.kpis.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} value={r.name} onChange={v=>setA("kpis",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.baseline} onChange={v=>setA("kpis",i,"baseline",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.target} onChange={v=>setA("kpis",i,"target",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.method} onChange={v=>setA("kpis",i,"method",v)}/></TD>
                  {!readOnly&&<TD>{rfp.kpis.length>1&&<DelBtn onClick={()=>rem("kpis",i)}/>}</TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("kpis",{name:"",baseline:"",target:"",method:""})} label="Add KPI"/>}
          </div>
        )}
        {section===2&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Scope Revision"/>
            <Lbl req={!readOnly}>Scope Revision Notes</Lbl>
            <Txt readOnly={readOnly} rows={3} value={rfp.scopeRevisionNotes} onChange={v=>set("scopeRevisionNotes",v)}/>
            <div style={{height:14}}/>
            <Lbl req={!readOnly}>Updated In-Scope</Lbl>
            <Txt readOnly={readOnly} rows={4} value={rfp.inScope} onChange={v=>set("inScope",v)}/>
          </div>
        )}
        {section===3&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Milestones & Deliverables"/>
            <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
              <thead><tr><TH w="20%">Milestone</TH><TH w="28%">Description</TH><TH w="14%">Type</TH><TH w="14%">Due</TH><TH>Responsible</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
              <tbody>{rfp.milestones.map((r,i)=>(
                <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                  <TD><Inp readOnly={readOnly} value={r.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.deliverableDesc||r.deliverable||""} onChange={v=>setA("milestones",i,"deliverableDesc",v)}/></TD>
                  <TD><Sel readOnly={readOnly} small options={DELIV_TYPES} value={r.deliverableType} onChange={v=>setA("milestones",i,"deliverableType",v)} placeholder="..."/></TD>
                  <TD><Inp readOnly={readOnly} type="date" value={r.date} onChange={v=>setA("milestones",i,"date",v)}/></TD>
                  <TD><Inp readOnly={readOnly} value={r.responsibleParty} onChange={v=>setA("milestones",i,"responsibleParty",v)}/></TD>
                  {!readOnly&&<TD><DelBtn onClick={()=>rfp.milestones.length>1&&rem("milestones",i)}/></TD>}
                </tr>
              ))}</tbody>
            </table>
            {!readOnly&&<AddBtn onClick={()=>add("milestones",{name:"",deliverable:"",deliverableDesc:"",deliverableType:"",date:"",responsibleParty:""})} label="Add Milestone"/>}
          </div>
        )}
        {section===4&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="Requirements"/>
            <div style={{display:"flex",gap:0,marginBottom:16,border:`1px solid ${B.border}`,borderRadius:5,overflow:"hidden",width:"fit-content"}}>
              {["functional","nonFunctional"].map(tab=>(
                <button key={tab} onClick={()=>setReqTab(tab)} style={{padding:"8px 20px",background:reqTab===tab?B.darkBlue:"#FFFFFF",color:reqTab===tab?"#FFFFFF":B.textMid,border:"none",fontSize:12,fontWeight:reqTab===tab?700:500,cursor:"pointer",fontFamily:"inherit"}}>{tab==="functional"?"Functional":"Non-Functional"}</button>
              ))}
            </div>
            {reqTab==="functional"&&(
              <>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                  <thead><tr><TH w="10%">ID</TH><TH w="40%">Description</TH><TH w="14%">Priority</TH><TH>Acceptance</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
                  <tbody>{rfp.functionalReqs.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{r.id}</div></TD>
                      <TD><Inp readOnly={readOnly} value={r.description} onChange={v=>setA("functionalReqs",i,"description",v)}/></TD>
                      <TD><Sel readOnly={readOnly} small options={["Mandatory","Optional"]} value={r.priority} onChange={v=>setA("functionalReqs",i,"priority",v)}/></TD>
                      <TD><Inp readOnly={readOnly} value={r.acceptance} onChange={v=>setA("functionalReqs",i,"acceptance",v)}/></TD>
                      {!readOnly&&<TD>{rfp.functionalReqs.length>1&&<DelBtn onClick={()=>rem("functionalReqs",i)}/>}</TD>}
                    </tr>
                  ))}</tbody>
                </table>
                {!readOnly&&<AddBtn onClick={()=>add("functionalReqs",{id:`FR-${String(rfp.functionalReqs.length+1).padStart(3,"0")}`,description:"",priority:"Mandatory",acceptance:""})} label="Add Functional Requirement"/>}
              </>
            )}
            {reqTab==="nonFunctional"&&(
              <>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                  <thead><tr><TH w="10%">ID</TH><TH w="40%">Description</TH><TH w="14%">Priority</TH><TH>Acceptance</TH>{!readOnly&&<TH w="30px"/>}</tr></thead>
                  <tbody>{rfp.nonFunctionalReqs.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.midBlue,fontWeight:700}}>{r.id}</div></TD>
                      <TD><Inp readOnly={readOnly} value={r.description} onChange={v=>setA("nonFunctionalReqs",i,"description",v)}/></TD>
                      <TD><Sel readOnly={readOnly} small options={["Mandatory","Optional"]} value={r.priority} onChange={v=>setA("nonFunctionalReqs",i,"priority",v)}/></TD>
                      <TD><Inp readOnly={readOnly} value={r.acceptance} onChange={v=>setA("nonFunctionalReqs",i,"acceptance",v)}/></TD>
                      {!readOnly&&<TD>{rfp.nonFunctionalReqs.length>1&&<DelBtn onClick={()=>rem("nonFunctionalReqs",i)}/>}</TD>}
                    </tr>
                  ))}</tbody>
                </table>
                {!readOnly&&<AddBtn onClick={()=>add("nonFunctionalReqs",{id:`NFR-${String(rfp.nonFunctionalReqs.length+1).padStart(3,"0")}`,description:"",priority:"Mandatory",acceptance:""})} label="Add Non-Functional Requirement"/>}
              </>
            )}
          </div>
        )}
        {section===5&&(
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
            <SLine title="RFP Status"/>
            <G cols={2} gap={20}>
              <div><Lbl req={!readOnly}>RFP Status</Lbl><Sel readOnly={readOnly} options={RFP_STATUS_STEPS} value={rfp.rfpStatus} onChange={v=>set("rfpStatus",v)} placeholder="..."/></div>
            </G>
            <div style={{height:20}}/>
            <Lbl>RFP Notes</Lbl><Txt readOnly={readOnly} rows={4} value={rfp.rfpNotes} onChange={v=>set("rfpNotes",v)}/>
          </div>
        )}
        {section===6&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
              {[{label:"Initiative",value:strategy.name},{label:"Domain",value:strategy.domain},{label:"Owner",value:strategy.owner},{label:"RFP Status",value:rfp.rfpStatus,color:B.darkBlue},{label:"Priority Score",value:strategy.score,color:scoreColor(strategy.score||0)}].map((item,i)=>(
                <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:item.color||B.textDark}}>{item.value||"—"}</div>
                </div>
              ))}
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

function PageNewInitiative({onDiscard,onSubmit}) {
  const [section,setSection]=useState(0);
  const [form,setForm]=useState({...EMPTY_STRATEGY});
  const {score,filled}=calcScore(form.answers);
  const initId="CPM-"+new Date().getFullYear()+"-"+String(Math.floor(Math.random()*900)+100);
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle="New Initiative — Strategy & Initiation" right={<><div style={{color:B.headerText,fontSize:11}}>ID: <span style={{fontFamily:"monospace",color:"#FFFFFF"}}>{initId}</span></div><Badge color={B.midBlue} bg={B.midBlue+"40"}>DRAFT</Badge></>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onDiscard} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:B.textMuted}}>Priority Score:</div>
          <div style={{fontSize:15,fontWeight:800,color:filled>0?scoreColor(score):B.textMuted}}>{filled>0?score:"—"}</div>
          {filled>0&&<Badge color={scoreColor(score)} bg={scoreColor(score)+"18"}>{scoreLabel(score)}</Badge>}
          <div style={{width:1,height:20,background:B.border}}/>
          <button onClick={onDiscard} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Discard Changes</button>
          <button onClick={()=>onSubmit({...form,id:initId,phase:"Strategy",score,submitted:today,status:"Pending CISO Review"})} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit Initiative →</button>
        </div>
      </div>
      <SectionTimeline sections={STRATEGY_SECTIONS} section={section} setSection={setSection}/>
      <StrategyFormSections section={section} setSection={setSection} form={form} setForm={setForm} readOnly={false}/>
    </div>
  );
}

function PageRFP({strategy,onBack,onSubmit}) {
  const [section,setSection]=useState(0);
  const [rfp,setRfp]=useState(EMPTY_RFP(strategy));
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`RFP — ${strategy.name||"New"}`} right={<><Badge color={B.midBlue} bg={B.midBlue+"30"}>RFP PHASE</Badge><Badge color={B.amber} bg={B.amberLight}>{rfp.rfpStatus.toUpperCase()}</Badge></>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <button onClick={()=>onSubmit({...strategy,phase:"RFP",rfpData:rfp,status:"RFP Draft"})} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save RFP Record →</button>
      </div>
      <SectionTimeline sections={RFP_SECTIONS} section={section} setSection={setSection}/>
      <RFPFormSections section={section} setSection={setSection} rfp={rfp} setRfp={setRfp} strategy={strategy} readOnly={false}/>
    </div>
  );
}

function PageViewInitiative({item,onBack,onMoveToRFP,onOpenWeekly,onViewWeeklyReports}) {
  const [section,setSection]=useState(0);
  const isProject = item && (item.progress !== undefined || item.status === "On Track" || item.status === "At Risk" || item.status === "Delayed" || item.status === "Closed");
  const isClosed  = isProject && item.status === "Closed";
  const isRFP     = !isProject && item.phase === "RFP";

  if (isProject) {
    const c = item.contractData || {};
    return(
      <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <Header subtitle={`Viewing: ${item.name}`} right={<><Badge color={isClosed?B.textMuted:B.green} bg={(isClosed?B.textMuted:B.green)+"30"}>{isClosed?"CLOSED PROJECT":"ACTIVE PROJECT"}</Badge><Badge color={statusColor(item.status)} bg={statusBg(item.status)}>{item.status}</Badge></>}/>
        <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:11,color:B.textMuted}}>Progress: <span style={{fontWeight:800,color:statusColor(item.status)}}>{item.progress}%</span></div>
            {!isClosed&&onOpenWeekly&&<button onClick={()=>onOpenWeekly(item)} style={{background:B.midBlue,border:"none",color:"#FFFFFF",padding:"6px 18px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit Weekly Update →</button>}
            {onViewWeeklyReports&&<button onClick={()=>onViewWeeklyReports(item)} style={{background:"#FFFFFF",border:`1px solid ${B.darkBlue}`,color:B.darkBlue,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>View Weekly Reports →</button>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
              {[{label:"Status",value:item.status,color:statusColor(item.status)},{label:"Progress",value:`${item.progress}%`,color:statusColor(item.status)},{label:"Budget",value:item.budget,color:B.darkBlue},{label:"Spent",value:item.spent},{label:"Open Risks",value:item.risks,color:item.risks>0?B.red:B.green},{label:"Open Issues",value:item.issues,color:item.issues>0?B.amber:B.green}].map((k,i)=>(
                <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${k.color||B.border}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{k.label}</div>
                  <div style={{fontSize:18,fontWeight:700,color:k.color||B.textDark}}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
              <SLine title="Project Identity"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
                {[{label:"Project ID",value:item.id},{label:"Project Name",value:item.name},{label:"Domain",value:item.domain},{label:"PM",value:item.pm},{label:"PM Email",value:item.pmEmail||c.pmEmail},{label:"Escalation Contact",value:c.escalationContact}].map((f,i)=>(
                  <div key={i}><div style={{fontSize:11,fontWeight:600,color:B.textMuted,textTransform:"uppercase",marginBottom:5}}>{f.label}</div><div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>{f.value||"—"}</div></div>
                ))}
              </div>
            </div>
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
              <SLine title="Vendor & Contract"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
                {[{label:"Awarded Vendor",value:c.vendorName},{label:"Contract Reference",value:c.contractRef},{label:"Procurement Reference",value:c.procurementRef},{label:"Contract Value (USD)",value:c.contractValue?`$${Number(c.contractValue).toLocaleString()}`:item.budget},{label:"CAPEX Portion",value:c.capex?`$${Number(c.capex).toLocaleString()}`:""},{label:"OPEX Portion",value:c.opex?`$${Number(c.opex).toLocaleString()}`:""},{label:"Contract Start",value:c.contractStart||item.contractStart},{label:"Contract End",value:c.contractEnd||item.contractEnd||item.dueDate},{label:isClosed?"Closure Date":"Due Date",value:isClosed?(item.closureDate||"—"):item.dueDate}].map((f,i)=>(
                  <div key={i}><div style={{fontSize:11,fontWeight:600,color:B.textMuted,textTransform:"uppercase",marginBottom:5}}>{f.label}</div><div style={{fontSize:13,fontWeight:600,color:B.textDark,padding:"6px 0",borderBottom:`1px solid ${B.borderLight}`}}>{f.value||"—"}</div></div>
                ))}
              </div>
            </div>
            {item.deliverables&&item.deliverables.length>0&&item.deliverables[0].name&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title={`Deliverables Register (${item.deliverables.length})`}/>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                    <thead><tr>{["ID","Name","Type","Milestone","Due","QA Reviewer","Approver","Status"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                    <tbody>{item.deliverables.map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD nowrap><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{d.id}</div></TD>
                        <TD><div style={{fontWeight:600}}>{d.name}</div></TD>
                        <TD>{d.type||"—"}</TD>
                        <TD>{d.milestone||"—"}</TD>
                        <TD nowrap>{d.dueDate||"—"}</TD>
                        <TD>{d.qaReviewer||"—"}</TD>
                        <TD>{d.approver||"—"}</TD>
                        <TD><Badge color={statusColor(d.status||"Not Started")} bg={statusBg(d.status||"Not Started")}>{(d.status||"Not Started").toUpperCase()}</Badge></TD>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
            {item.milestonesList&&item.milestonesList.length>0&&item.milestonesList[0].name&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title={`Milestones (${item.milestonesList.length})`}/>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Milestone","Start","End","Weight","Status"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                  <tbody>{item.milestonesList.map((m,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontWeight:600}}>{m.name}</div></TD>
                      <TD>{m.startDate||"—"}</TD>
                      <TD>{m.endDate||m.date||"—"}</TD>
                      <TD><div style={{fontWeight:700,color:B.darkBlue}}>{m.weight?`${m.weight}%`:"—"}</div></TD>
                      <TD><Badge color={statusColor(m.status||"Not Started")} bg={statusBg(m.status||"Not Started")}>{(m.status||"Not Started").toUpperCase()}</Badge></TD>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {item.risksList&&item.risksList.length>0&&item.risksList[0].description&&(
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title={`Risk Register (${item.risksList.length})`}/>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["ID","Category","Description","Likelihood","Impact","Rating","Owner","Status"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                  <tbody>{item.risksList.map((r,i)=>{
                    const rating = r.overrideRating || (r.likelihood&&r.impact ? RISK_MATRIX[`${r.likelihood}-${r.impact}`] : "—");
                    return(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{r.id}</div></TD>
                        <TD>{r.category||"—"}</TD>
                        <TD>{r.description}</TD>
                        <TD>{r.likelihood||"—"}</TD>
                        <TD>{r.impact||"—"}</TD>
                        <TD><Badge color={ratingColor(rating)} bg={ratingBg(rating)}>{rating.toUpperCase()}</Badge></TD>
                        <TD>{r.owner||"—"}</TD>
                        <TD><Badge color={statusColor(r.status)} bg={statusBg(r.status)}>{r.status?.toUpperCase()}</Badge></TD>
                      </tr>
                    );
                  })}</tbody>
                </table>
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
        <Header subtitle={`Viewing: ${item.name}`} right={<><Badge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</Badge><Badge color={B.amber} bg={B.amberLight}>{item.status}</Badge></>}/>
        <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        </div>
        <SectionTimeline sections={RFP_SECTIONS} section={section} setSection={setSection}/>
        <RFPFormSections section={section} setSection={setSection} rfp={item.rfpData} setRfp={()=>{}} strategy={item} readOnly={true}/>
      </div>
    );
  }

  const form={...EMPTY_STRATEGY,...item,frameworks:item.frameworks||[],kpis:item.kpis||[{name:"",baseline:"",target:"",method:""}],outOfScope:item.outOfScope||[{item:"",reason:""}],stakeholders:item.stakeholders||[{name:"",role:""}],integrations:item.integrations||[{initiative:"",nature:"",risk:""}],depRisks:item.depRisks||[],milestones:item.milestones||[],answers:item.answers||{}};
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`Viewing: ${item.name}`} right={<><Badge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</Badge><Badge color={B.amber} bg={B.amberLight}>{item.status}</Badge></>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:11,color:B.textMuted}}>Priority Score: <span style={{fontWeight:800,color:scoreColor(item.score)}}>{item.score}</span></div>
          {item.phase==="Strategy"&&<button onClick={()=>onMoveToRFP(item)} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 18px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Move to RFP →</button>}
        </div>
      </div>
      <SectionTimeline sections={STRATEGY_SECTIONS} section={section} setSection={setSection}/>
      <StrategyFormSections section={section} setSection={setSection} form={form} setForm={()=>{}} readOnly={true}/>
    </div>
  );
}

const EMPTY_CONTRACT = (rfp, strategy) => ({
  vendorName:"", contractRef:"", contractStart:"", contractEnd:"",
  contractValue:"", capex:"", opex:"", procurementRef:"",
  visionStatement: rfp?.visionStatement || strategy?.visionStatement || "",
  problemStatement: rfp?.problemStatement || strategy?.problemStatement || "",
  businessOutcome: rfp?.businessOutcome || strategy?.businessOutcome || "",
  valueRealization:[{valueCommitted:"",measurementMethod:"",targetDate:""}],
  inScope: rfp?.inScope || strategy?.inScope || "",
  outOfScope: rfp?.outOfScope || [{item:"",reason:""}],
  assumptions: rfp?.assumptions || strategy?.assumptions || "",
  deliverables:[{id:"D-001",name:"",description:"",type:"",milestone:"",dueDate:"",responsibleParty:"",qaReviewer:"",approver:"",status:"Not Started"}],
  milestones:(rfp?.milestones||strategy?.milestones||[]).map((m)=>({...m,startDate:m.date||"",endDate:"",weight:"",linkedDeliverables:"",status:"Not Started"})),
  pm:"", pmEmail:"", escalationContact:"",
  team:[{name:"",role:"",organisation:"",allocation:""}],
  risks:[{id:"R-001",category:"",description:"",likelihood:"",impact:"",overrideRating:"",overrideComment:"",mitigation:"",owner:"",status:"Open"}],
  dependencies:(strategy?.depRisks||[]).map(d=>({initiative:d.initiative||"",nature:d.dependency||"",riskIfDelayed:d.risk||"",severity:d.severity||"",owner:"",linkedStatus:""})),
  reportCadence:"Weekly", reportDay:"Monday", reportRecipients:[{name:"",email:"",role:""}],
  reportFormat:"Executive summary", firstReportDate:"", note:"",
});

function GanttChart({milestones}) {
  const parsed = useMemo(()=>milestones.filter(m=>m.startDate&&m.endDate).map(m=>({...m,start:new Date(m.startDate),end:new Date(m.endDate)})).filter(m=>!isNaN(m.start)&&!isNaN(m.end)&&m.end>=m.start),[milestones]);
  if(parsed.length===0) return(<div style={{background:B.pageBg,border:`1px dashed ${B.border}`,borderRadius:6,padding:"28px",textAlign:"center",fontSize:12,color:B.textMuted}}>Enter start and end dates for milestones above to generate the Gantt chart.</div>);
  const minDate = new Date(Math.min(...parsed.map(m=>m.start)));
  const maxDate = new Date(Math.max(...parsed.map(m=>m.end)));
  const totalDays = Math.max((maxDate-minDate)/(1000*60*60*24),1);
  const msColors = [B.darkBlue,B.midBlue,B.lightBlue,"#0091C7","#0058A0","#004578"];
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:600,position:"relative",paddingTop:18}}>
        {parsed.map((m,i)=>{
          const leftPct = ((m.start-minDate)/(totalDays*86400000))*100;
          const widthPct = Math.max(((m.end-m.start)/(totalDays*86400000))*100,1);
          const color = msColors[i%msColors.length];
          const sc = statusColor(m.status||"Not Started");
          return(
            <div key={i} style={{display:"flex",alignItems:"center",marginBottom:8,height:32}}>
              <div style={{width:180,flexShrink:0,paddingRight:12,overflow:"hidden"}}>
                <div style={{fontSize:11,fontWeight:600,color:B.textDark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name||`Milestone ${i+1}`}</div>
                <Badge color={sc} bg={statusBg(m.status||"Not Started")}>{m.status||"Not Started"}</Badge>
              </div>
              <div style={{flex:1,height:32,background:B.pageBg,border:`1px solid ${B.borderLight}`,borderRadius:4,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",left:`${leftPct}%`,width:`${widthPct}%`,top:4,bottom:4,background:color,borderRadius:3,display:"flex",alignItems:"center",paddingLeft:8,minWidth:8}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#FFFFFF",whiteSpace:"nowrap"}}>{widthPct>8?`${m.startDate} → ${m.endDate}`:""}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{fontSize:10,color:B.textMuted,marginTop:8,textAlign:"right"}}>Project span: {minDate.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})} → {maxDate.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</div>
      </div>
    </div>
  );
}

function PageContracting({strategy,rfp,onBack,onActivate,mode}) {
  const [section,setSection]=useState(0);
  const [form,setForm]=useState(EMPTY_CONTRACT(rfp,strategy));
  const [activated,setActivated]=useState(false);
  const set  = (k,v)        => setForm(f=>({...f,[k]:v}));
  const setA = (k,i,f2,v)  => setForm(f=>{const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)        => setForm(f=>({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)        => setForm(f=>({...f,[k]:f[k].filter((_,j)=>j!==i)}));
  const autoId = (prefix,arr,i) => arr[i]?.id || `${prefix}-${String(i+1).padStart(3,"0")}`;
  const kpiSummary = [
    {label:"Awarded Vendor",value:form.vendorName||"—"},
    {label:"Project Manager",value:form.pm||"—"},
    {label:"Contract Value",value:form.contractValue?`$${Number(form.contractValue).toLocaleString()}`:"—",color:B.darkBlue},
    {label:"Start → End",value:form.contractStart&&form.contractEnd?`${form.contractStart} → ${form.contractEnd}`:"—"},
    {label:"Deliverables",value:form.deliverables.length,color:B.midBlue},
    {label:"Open Risks",value:form.risks.filter(r=>r.status==="Open").length,color:B.red},
  ];
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`Contracting & Award — ${strategy?.name||""}`} right={<Badge color={B.midBlue} bg={B.midBlue+"30"}>CONTRACTING PHASE</Badge>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <button onClick={()=>{setActivated(true);onActivate&&onActivate({...strategy,...form,phase:"Active Project",status:"Active"});}} style={{background:B.green,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{mode==="new-closed"?"Create Closed Project →":"Activate Project →"}</button>
      </div>
      <SectionTimeline sections={CONTRACT_SECTIONS} section={section} setSection={setSection}/>
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>
          {section===0&&(
            <div style={{background:B.deepBlue,borderRadius:6,padding:"20px 24px"}}>
              <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Carried Forward — Read Only</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[{label:"Initiative",value:strategy?.name},{label:"ID",value:strategy?.id},{label:"Domain",value:strategy?.domain},{label:"Owner",value:strategy?.owner},{label:"Priority Score",value:strategy?.score,color:scoreColor(strategy?.score||0)},{label:"Est. Budget",value:strategy?.budget}].map((f,i)=>(
                  <div key={i} style={{background:"#FFFFFF18",borderRadius:5,padding:"10px 14px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.headerText,textTransform:"uppercase",marginBottom:4}}>{f.label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:f.color||"#FFFFFF"}}>{f.value||"—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {section===1&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Contract & Vendor Details"/>
              <G cols={3} gap={16}>
                <div><Lbl req>Awarded Vendor Name</Lbl><Inp value={form.vendorName} onChange={v=>set("vendorName",v)}/></div>
                <div><Lbl req>Contract Reference</Lbl><Inp value={form.contractRef} onChange={v=>set("contractRef",v)}/></div>
                <div><Lbl>Procurement Reference</Lbl><Inp value={form.procurementRef} onChange={v=>set("procurementRef",v)}/></div>
              </G>
              <div style={{height:16}}/>
              <G cols={2} gap={16}>
                <div><Lbl req>Contract Start</Lbl><Inp type="date" value={form.contractStart} onChange={v=>set("contractStart",v)}/></div>
                <div><Lbl req>Contract End</Lbl><Inp type="date" value={form.contractEnd} onChange={v=>set("contractEnd",v)}/></div>
              </G>
              <SLine title="Confirmed Budget"/>
              <G cols={3} gap={16}>
                <div><Lbl req>Contract Value</Lbl><Inp value={form.contractValue} onChange={v=>set("contractValue",v)}/></div>
                <div><Lbl>CAPEX</Lbl><Inp value={form.capex} onChange={v=>set("capex",v)}/></div>
                <div><Lbl>OPEX</Lbl><Inp value={form.opex} onChange={v=>set("opex",v)}/></div>
              </G>
            </div>
          )}
          {section===2&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Final Vision & Strategic Alignment"/>
              <G cols={2} gap={16}>
                <div><Lbl req>Problem Statement</Lbl><Txt rows={4} value={form.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
                <div><Lbl req>Vision Statement</Lbl><Txt rows={4} value={form.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
              </G>
              <div style={{height:14}}/>
              <Lbl req>Expected Business Outcome</Lbl><Inp value={form.businessOutcome} onChange={v=>set("businessOutcome",v)}/>
              <SLine title="Value Realization Commitments"/>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr><TH w="35%">Value Committed</TH><TH w="35%">Measurement</TH><TH>Target Date</TH><TH w="30px"/></tr></thead>
                <tbody>{form.valueRealization.map((r,i)=>(
                  <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                    <TD><Inp value={r.valueCommitted} onChange={v=>setA("valueRealization",i,"valueCommitted",v)}/></TD>
                    <TD><Inp value={r.measurementMethod} onChange={v=>setA("valueRealization",i,"measurementMethod",v)}/></TD>
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
              <SLine title="Deliverables Register"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:900}}>
                  <thead><tr><TH w="6%">ID</TH><TH w="16%">Name</TH><TH w="18%">Description</TH><TH w="10%">Type</TH><TH w="12%">Milestone</TH><TH w="10%">Due Date</TH><TH w="10%">Responsible</TH><TH>QA Reviewer</TH><TH w="30px"/></tr></thead>
                  <tbody>{form.deliverables.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{autoId("D",form.deliverables,i)}</div></TD>
                      <TD><Inp value={d.name} onChange={v=>setA("deliverables",i,"name",v)}/></TD>
                      <TD><Inp value={d.description} onChange={v=>setA("deliverables",i,"description",v)}/></TD>
                      <TD><Sel small options={DELIV_TYPES} value={d.type} onChange={v=>setA("deliverables",i,"type",v)} placeholder="..."/></TD>
                      <TD><Inp value={d.milestone} onChange={v=>setA("deliverables",i,"milestone",v)}/></TD>
                      <TD><Inp type="date" value={d.dueDate} onChange={v=>setA("deliverables",i,"dueDate",v)}/></TD>
                      <TD><Inp value={d.responsibleParty} onChange={v=>setA("deliverables",i,"responsibleParty",v)}/></TD>
                      <TD><Inp value={d.qaReviewer} onChange={v=>setA("deliverables",i,"qaReviewer",v)}/></TD>
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
              <div style={{overflowX:"auto",marginBottom:8}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:800}}>
                  <thead><tr><TH w="22%">Name</TH><TH w="13%">Start</TH><TH w="13%">End</TH><TH w="8%">Weight</TH><TH w="22%">Linked Deliverables</TH><TH>Status</TH><TH w="30px"/></tr></thead>
                  <tbody>{form.milestones.map((m,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp value={m.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                      <TD><Inp type="date" value={m.startDate} onChange={v=>setA("milestones",i,"startDate",v)}/></TD>
                      <TD><Inp type="date" value={m.endDate} onChange={v=>setA("milestones",i,"endDate",v)}/></TD>
                      <TD><Inp value={m.weight} onChange={v=>setA("milestones",i,"weight",v)}/></TD>
                      <TD><Inp value={m.linkedDeliverables} onChange={v=>setA("milestones",i,"linkedDeliverables",v)}/></TD>
                      <TD><Sel small options={MS_STATUSES} value={m.status} onChange={v=>setA("milestones",i,"status",v)} placeholder="..."/></TD>
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
                <div><Lbl req>Project Manager</Lbl><Inp value={form.pm} onChange={v=>set("pm",v)}/></div>
                <div><Lbl req>PM Email</Lbl><Inp value={form.pmEmail} onChange={v=>set("pmEmail",v)}/></div>
                <div><Lbl>Escalation Contact</Lbl><Inp value={form.escalationContact} onChange={v=>set("escalationContact",v)}/></div>
              </G>
              <SLine title="Core Project Team"/>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr><TH w="25%">Name</TH><TH w="25%">Role</TH><TH w="25%">Organisation</TH><TH>Allocation</TH><TH w="30px"/></tr></thead>
                <tbody>{form.team.map((r,i)=>(
                  <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                    <TD><Inp value={r.name} onChange={v=>setA("team",i,"name",v)}/></TD>
                    <TD><Inp value={r.role} onChange={v=>setA("team",i,"role",v)}/></TD>
                    <TD><Inp value={r.organisation} onChange={v=>setA("team",i,"organisation",v)}/></TD>
                    <TD><Inp value={r.allocation} onChange={v=>setA("team",i,"allocation",v)}/></TD>
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
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {["Critical","High","Medium","Low"].map(lvl=><Badge key={lvl} color={ratingColor(lvl)} bg={ratingBg(lvl)}>{lvl}</Badge>)}
                <span style={{fontSize:11,color:B.textMuted,alignSelf:"center",marginLeft:4}}>H×H=Critical · H×M or M×H=High · M×M=Medium · any Low=Low</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {form.risks.map((r,i)=>{
                  const autoRating = r.likelihood&&r.impact ? RISK_MATRIX[`${r.likelihood}-${r.impact}`] : null;
                  const finalRating = r.overrideRating || autoRating || "—";
                  return(
                    <div key={i} style={{border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden",borderLeft:`4px solid ${autoRating?ratingColor(finalRating):B.border}`}}>
                      <div style={{background:B.pageBg,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${B.borderLight}`}}>
                        <div style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:B.darkBlue}}>{autoId("R",form.risks,i)}</div>
                        <div style={{flex:1}}/>
                        {finalRating!=="—"&&<Badge color={ratingColor(finalRating)} bg={ratingBg(finalRating)}>{r.overrideRating?"OVERRIDE: ":""}{finalRating.toUpperCase()}</Badge>}
                        <Badge color={statusColor(r.status||"Open")} bg={statusBg(r.status||"Open")}>{(r.status||"Open").toUpperCase()}</Badge>
                        {form.risks.length>1&&<DelBtn onClick={()=>rem("risks",i)}/>}
                      </div>
                      <div style={{padding:"14px 16px"}}>
                        <G cols={3} gap={12}>
                          <div><Lbl req>Category</Lbl><Sel options={RISK_CATS} value={r.category} onChange={v=>setA("risks",i,"category",v)} placeholder="..."/></div>
                          <div><Lbl req>Likelihood</Lbl><Sel options={RISK_LEVELS} value={r.likelihood} onChange={v=>setA("risks",i,"likelihood",v)} placeholder="..."/></div>
                          <div><Lbl req>Impact</Lbl><Sel options={RISK_LEVELS} value={r.impact} onChange={v=>setA("risks",i,"impact",v)} placeholder="..."/></div>
                        </G>
                        <div style={{height:10}}/>
                        <Lbl req>Risk Description</Lbl><Txt rows={2} value={r.description} onChange={v=>setA("risks",i,"description",v)}/>
                        <div style={{height:10}}/>
                        <G cols={2} gap={12}>
                          <div><Lbl>Mitigation Plan</Lbl><Txt rows={2} value={r.mitigation} onChange={v=>setA("risks",i,"mitigation",v)}/></div>
                          <div><G cols={2} gap={10}><div><Lbl>Owner</Lbl><Inp value={r.owner} onChange={v=>setA("risks",i,"owner",v)}/></div><div><Lbl>Status</Lbl><Sel options={RISK_STATUSES} value={r.status} onChange={v=>setA("risks",i,"status",v)} placeholder="..."/></div></G></div>
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
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:800}}>
                  <thead><tr><TH w="18%">Initiative</TH><TH w="20%">Nature</TH><TH w="20%">Risk if Delayed</TH><TH w="10%">Severity</TH><TH w="14%">Owner</TH><TH>Linked Status</TH><TH w="30px"/></tr></thead>
                  <tbody>{form.dependencies.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp value={d.initiative} onChange={v=>setA("dependencies",i,"initiative",v)}/></TD>
                      <TD><Inp value={d.nature} onChange={v=>setA("dependencies",i,"nature",v)}/></TD>
                      <TD><Inp value={d.riskIfDelayed} onChange={v=>setA("dependencies",i,"riskIfDelayed",v)}/></TD>
                      <TD><Sel small options={RISK_LEVELS} value={d.severity} onChange={v=>setA("dependencies",i,"severity",v)} placeholder="..."/></TD>
                      <TD><Inp value={d.owner} onChange={v=>setA("dependencies",i,"owner",v)}/></TD>
                      <TD><Inp value={d.linkedStatus} onChange={v=>setA("dependencies",i,"linkedStatus",v)}/></TD>
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
                  <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${item.color||B.border}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                    <div style={{fontSize:typeof item.value==="number"?28:13,fontWeight:700,color:item.color||B.textDark}}>{item.value}</div>
                  </div>
                ))}
              </div>
              {activated?(
                <div style={{background:B.greenLight,border:`2px solid ${B.green}`,borderRadius:6,padding:"20px 24px",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:8}}>✓</div>
                  <div style={{fontSize:16,fontWeight:700,color:B.green}}>Project Activated</div>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
                  <button onClick={()=>{setActivated(true);onActivate&&onActivate({...strategy,...form,phase:"Active Project",status:"Active"});}} style={{background:B.green,border:"none",color:"#FFFFFF",fontWeight:700,fontSize:14,padding:"12px 36px",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}}>{mode==="new-closed"?"Submit & Create Closed Project →":"Submit & Activate Project →"}</button>
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
            {section>0?<button onClick={()=>setSection(s=>s-1)} style={{background:B.cardBg,border:`1px solid ${B.border}`,color:B.textMid,padding:"9px 22px",borderRadius:4,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>← Previous</button>:<div/>}
            {section<CONTRACT_SECTIONS.length-1&&<button onClick={()=>setSection(s=>s+1)} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"9px 24px",borderRadius:4,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Next: {CONTRACT_SECTIONS[section+1].label} →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function getWeekInfo(date = new Date()) {
  const d = new Date(date);
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const tmp = new Date(d.getFullYear(),0,1);
  const week = Math.ceil((((d - tmp) / 86400000) + tmp.getDay() + 1) / 7);
  const fmt = (x) => x.toLocaleDateString("en-GB",{day:"2-digit",month:"short"});
  return { weekNumber:week, year:d.getFullYear(), label:`Week ${week} · ${fmt(monday)} – ${fmt(sunday)} ${sunday.getFullYear()}`, shortLabel:`W${week}`, monday, sunday };
}
function autoStatus(projectPct, expectedPct, risks) {
  const openCritical = risks.filter(r => r.status === "Open" && (r.overrideRating || RISK_MATRIX[`${r.likelihood}-${r.impact}`]) === "Critical").length;
  const openHigh = risks.filter(r => r.status === "Open" && (r.overrideRating || RISK_MATRIX[`${r.likelihood}-${r.impact}`]) === "High").length;
  const escalated = risks.filter(r => r.status === "Escalated to Issue").length;
  const gap = expectedPct - projectPct;
  if (openCritical > 0 || escalated > 0 || gap > 10) return "Delayed";
  if (openHigh > 0 || gap > 0) return "At Risk";
  return "On Track";
}
function expectedProgress(startDate, endDate, asOf = new Date()) {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate), e = new Date(endDate);
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  const total = e - s; const elapsed = Math.max(0, Math.min(asOf - s, total));
  return Math.round((elapsed / total) * 100);
}
const WU_SECTIONS = [
  {id:"header",label:"Week Header"},{id:"progress",label:"Progress Update"},
  {id:"narrative",label:"Weekly Narrative"},{id:"risks",label:"Risks & Issues"},
  {id:"actions",label:"Dependencies & Actions"},{id:"submit",label:"Submit"},
];
const MOCK_PROJECT = {
  id:"CPM-2024-011", name:"PAM Solution Deployment", domain:"Identity & Access Management",
  pm:"Rania Yousef", pmEmail:"rania.yousef@org.com", contractStart:"2025-01-15", contractEnd:"2025-12-30", contractValue:"850000",
  deliverables:[
    {id:"D-001",name:"As-Is Architecture Report",milestone:"Discovery & Assessment",dueDate:"2025-03-15",qaReviewer:"Ahmed Rashid",approver:"CISO"},
    {id:"D-002",name:"Gap Analysis Document",milestone:"Discovery & Assessment",dueDate:"2025-03-30",qaReviewer:"Ahmed Rashid",approver:"CISO"},
    {id:"D-003",name:"PAM Target Architecture",milestone:"Design Phase",dueDate:"2025-05-15",qaReviewer:"Sarah Al-Mansouri",approver:"Domain Lead"},
    {id:"D-004",name:"Implementation Plan",milestone:"Design Phase",dueDate:"2025-06-01",qaReviewer:"Sarah Al-Mansouri",approver:"Domain Lead"},
    {id:"D-005",name:"PAM Solution Deployed (Pilot)",milestone:"Pilot Deployment",dueDate:"2025-08-15",qaReviewer:"Omar Al-Hashimi",approver:"CISO"},
    {id:"D-006",name:"UAT Results & Sign-off",milestone:"Pilot Deployment",dueDate:"2025-09-30",qaReviewer:"Omar Al-Hashimi",approver:"CISO"},
    {id:"D-007",name:"Full Production Rollout",milestone:"Production Rollout",dueDate:"2025-11-30",qaReviewer:"Omar Al-Hashimi",approver:"CISO"},
    {id:"D-008",name:"Handover & Training Materials",milestone:"Production Rollout",dueDate:"2025-12-15",qaReviewer:"Sarah Al-Mansouri",approver:"Domain Lead"},
  ],
  milestones:[
    {name:"Discovery & Assessment",weight:15,startDate:"2025-01-15",endDate:"2025-03-30"},
    {name:"Design Phase",weight:20,startDate:"2025-04-01",endDate:"2025-06-01"},
    {name:"Pilot Deployment",weight:30,startDate:"2025-06-15",endDate:"2025-09-30"},
    {name:"Production Rollout",weight:35,startDate:"2025-10-01",endDate:"2025-12-15"},
  ],
  initialRisks:[
    {id:"R-001",category:"Vendor",description:"Vendor resource availability during Q3 may delay deployment",likelihood:"Medium",impact:"High",mitigation:"Resource plan agreed; backup engineers identified",owner:"Rania Yousef",status:"Open",overrideRating:"",overrideComment:""},
    {id:"R-002",category:"Technical",description:"Legacy AD integration may require custom connectors",likelihood:"Medium",impact:"Medium",mitigation:"Technical workshop scheduled",owner:"Ahmed Rashid",status:"Mitigated",overrideRating:"",overrideComment:""},
    {id:"R-003",category:"Operational",description:"Production cutover may require extended maintenance window",likelihood:"Low",impact:"High",mitigation:"Cutover plan to be reviewed",owner:"Omar Al-Hashimi",status:"Open",overrideRating:"",overrideComment:""},
  ],
  initialDependencies:[
    {initiative:"Network Segmentation Project",nature:"Shared directory services",riskIfDelayed:"PAM rollout cannot complete without network controls",severity:"High",owner:"Yusuf Al-Farsi",linkedStatus:"In Progress"},
  ],
};
const MOCK_HISTORY = [
  { weekNumber:1, year:2025, label:"Week 1 · 13 Jan – 19 Jan", status:"On Track", projectPct:5, narrative:"Project kicked off. Vendor onboarding completed and team mobilised." },
  { weekNumber:2, year:2025, label:"Week 2 · 20 Jan – 26 Jan", status:"On Track", projectPct:12, narrative:"Discovery workshops underway. Stakeholder interviews 60% complete." },
  { weekNumber:3, year:2025, label:"Week 3 · 27 Jan – 02 Feb", status:"On Track", projectPct:22, narrative:"As-Is architecture report submitted for QA review." },
  { weekNumber:4, year:2025, label:"Week 4 · 03 Feb – 09 Feb", status:"At Risk", projectPct:28, narrative:"Vendor flagged a potential resource constraint for Phase 2." },
  { weekNumber:5, year:2025, label:"Week 5 · 10 Feb – 16 Feb", status:"On Track", projectPct:38, narrative:"Vendor resource issue resolved. Gap analysis submitted and approved." },
  { weekNumber:6, year:2025, label:"Week 6 · 17 Feb – 23 Feb", status:"On Track", projectPct:45, narrative:"Target architecture design 50% complete. CISO review scheduled." },
];

const ProjectGauge = ({pct,expected,status}) => {
  const sc = statusColor(status); const gap = expected - pct;
  return(
    <div style={{background:B.deepBlue,borderRadius:8,padding:"24px 28px",color:"#FFFFFF"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Project Completion</div>
        <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:14}}>
          <div style={{fontSize:64,fontWeight:800,color:sc,lineHeight:1}}>{pct}<span style={{fontSize:32,marginLeft:4}}>%</span></div>
          <div>
            <Badge color={sc} bg={sc+"30"}>{status.toUpperCase()}</Badge>
            <div style={{fontSize:11,color:B.headerText+"AA",marginTop:6}}>Expected: <strong style={{color:"#FFFFFF"}}>{expected}%</strong>{gap!==0&&<span style={{color:gap>0?B.red:B.green,marginLeft:8}}>{gap>0?`▼ ${gap}% behind`:`▲ ${-gap}% ahead`}</span>}</div>
          </div>
        </div>
        <div style={{position:"relative",height:14,background:"#FFFFFF15",borderRadius:7,overflow:"hidden"}}>
          <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:sc,borderRadius:7}}/>
          {expected>0&&expected<=100&&<div style={{position:"absolute",left:`${expected}%`,top:-3,bottom:-3,width:2,background:"#FFFFFF"}}/>}
        </div>
      </div>
    </div>
  );
};

function PageWeeklyUpdate({project=MOCK_PROJECT,onBack,onSubmit}) {
  const [view,setView]=useState("current");
  const [historyWeek,setHistoryWeek]=useState(null);
  const [section,setSection]=useState(0);
  const [submitted,setSubmitted]=useState(false);
  const week = useMemo(()=>getWeekInfo(),[]);
  const expectedPct = useMemo(()=>expectedProgress(project.contractStart,project.contractEnd),[project]);
  const [form,setForm]=useState(()=>({
    deliverables: project.deliverables.map(d => ({...d,previousPct:0,thisWeekPct:0,status:"Not Started",notes:""})),
    completedNarrative:"", plannedNarrative:"", decisionsNeeded:"",
    risks: project.initialRisks.map(r => ({...r,issueDescription:"",issueOwner:"",issueTargetDate:""})),
    dependencies: project.initialDependencies.map(d => ({...d,weekUpdate:""})),
    actions:[], statusOverride:"", statusOverrideComment:"",
  }));
  const set  = (k,v)        => setForm(f => ({...f,[k]:v}));
  const setA = (k,i,f2,v)   => setForm(f => {const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)        => setForm(f => ({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)        => setForm(f => ({...f,[k]:f[k].filter((_,j)=>j!==i)}));
  const milestoneSummary = useMemo(()=>project.milestones.map(ms => {
    const linked = form.deliverables.filter(d => d.milestone === ms.name);
    const totalProgress = linked.reduce((sum,d) => sum + Number(d.thisWeekPct||0), 0);
    const pct = linked.length>0 ? Math.round(totalProgress/linked.length) : 0;
    const allCompleted = linked.length>0 && linked.every(d => Number(d.thisWeekPct)>=100);
    const anyStarted = linked.some(d => Number(d.thisWeekPct)>0);
    const status = allCompleted ? "Completed" : anyStarted ? "In Progress" : "Not Started";
    return {...ms, deliverableCount:linked.length, pct, status, expected:expectedProgress(ms.startDate, ms.endDate)};
  }),[form.deliverables,project.milestones]);
  const projectPct = useMemo(()=>{
    const totalWeight = milestoneSummary.reduce((s,m)=>s+Number(m.weight||0),0);
    if(totalWeight===0) return 0;
    return Math.round(milestoneSummary.reduce((s,m)=>s+(Number(m.weight||0)*m.pct),0)/totalWeight);
  },[milestoneSummary]);
  const derivedStatus = useMemo(()=>autoStatus(projectPct,expectedPct,form.risks),[projectPct,expectedPct,form.risks]);
  const finalStatus = form.statusOverride || derivedStatus;
  const openRisks = form.risks.filter(r=>r.status==="Open").length;
  const escalatedIssues = form.risks.filter(r=>r.status==="Escalated to Issue").length;
  const openActions = form.actions.filter(a=>a.status==="Open"||a.status==="In Progress"||a.status==="Blocked").length;
  const deliverablesCompletedThisWeek = form.deliverables.filter(d => Number(d.thisWeekPct)>=100 && Number(d.previousPct)<100).length;

  if(view==="history" && historyWeek){
    return(
      <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
        <Header subtitle={`Weekly Update — ${historyWeek.label}`} right={<Badge color={statusColor(historyWeek.status)} bg={statusColor(historyWeek.status)+"40"}>{historyWeek.status.toUpperCase()} · READ ONLY</Badge>}/>
        <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"10px 28px"}}>
          <button onClick={()=>{setHistoryWeek(null);setView("current");}} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Current Week</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
          <div style={{maxWidth:1100,margin:"0 auto"}}>
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title={`${historyWeek.label} — Snapshot`}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                <div style={{background:B.pageBg,borderRadius:5,padding:"14px 16px"}}><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>Status</div><Badge color={statusColor(historyWeek.status)} bg={statusBg(historyWeek.status)}>{historyWeek.status.toUpperCase()}</Badge></div>
                <div style={{background:B.pageBg,borderRadius:5,padding:"14px 16px"}}><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>Project %</div><div style={{fontSize:22,fontWeight:800,color:statusColor(historyWeek.status)}}>{historyWeek.projectPct}%</div></div>
              </div>
              <SLine title="Weekly Narrative"/>
              <div style={{fontSize:13,color:B.textDark,lineHeight:1.7,padding:"10px 14px",background:B.pageBg,borderRadius:5,border:`1px solid ${B.border}`}}>{historyWeek.narrative}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`Weekly Update — ${project.name}`} right={<><Badge color={statusColor(finalStatus)} bg={statusColor(finalStatus)+"30"}>{finalStatus.toUpperCase()}</Badge><Badge color={B.midBlue} bg={B.midBlue+"30"}>{week.shortLabel} · {week.year}</Badge></>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginRight:4}}>History:</div>
          {MOCK_HISTORY.map(h=>(<button key={h.weekNumber} onClick={()=>{setHistoryWeek(h);setView("history");}} style={{padding:"5px 12px",borderRadius:14,border:`1px solid ${statusColor(h.status)}40`,background:statusBg(h.status),color:statusColor(h.status),fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>W{h.weekNumber}</button>))}
          <Badge color={B.green} bg={B.greenLight}>CURRENT: {week.shortLabel}</Badge>
        </div>
      </div>
      <SectionTimeline sections={WU_SECTIONS} section={section} setSection={setSection}/>
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>
          {section===0&&(
            <div>
              <div style={{marginBottom:20}}><ProjectGauge pct={projectPct} expected={expectedPct} status={finalStatus}/></div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
                <SLine title="Week Identification"/>
                <G cols={3} gap={16}>
                  <div><Lbl>Week</Lbl><div style={{fontSize:14,fontWeight:700,color:B.textDark,padding:"8px 0"}}>{week.label}</div></div>
                  <div><Lbl>Project</Lbl><div style={{fontSize:14,fontWeight:700,color:B.textDark,padding:"8px 0"}}>{project.name}</div></div>
                  <div><Lbl>PM</Lbl><div style={{fontSize:14,fontWeight:700,color:B.textDark,padding:"8px 0"}}>{project.pm}</div></div>
                </G>
                <SLine title="Overall Project Status"/>
                <div style={{background:B.pageBg,border:`1px solid ${B.border}`,borderRadius:5,padding:"16px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>Auto-derived</div><Badge color={statusColor(derivedStatus)} bg={statusBg(derivedStatus)}>{derivedStatus.toUpperCase()}</Badge></div>
                    <div style={{flex:1}}><Lbl>PM Override</Lbl><Sel options={OVERRIDE_STATUS} value={form.statusOverride} onChange={v=>set("statusOverride",v)} placeholder="Use auto-derived..."/></div>
                  </div>
                  {form.statusOverride&&(<div style={{marginTop:14,padding:"12px 14px",background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:5}}><Lbl req>Justification</Lbl><Txt rows={2} value={form.statusOverrideComment} onChange={v=>set("statusOverrideComment",v)}/></div>)}
                </div>
              </div>
            </div>
          )}
          {section===1&&(
            <div>
              <div style={{marginBottom:16}}><ProjectGauge pct={projectPct} expected={expectedPct} status={finalStatus}/></div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title="Milestones — Auto-Calculated"/>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><TH w="28%">Milestone</TH><TH w="10%">Weight</TH><TH w="10%">Deliverables</TH><TH w="22%">Completion</TH><TH w="14%">Status</TH><TH>Expected vs Actual</TH></tr></thead>
                  <tbody>{milestoneSummary.map((m,i)=>{const onTrack=m.pct>=m.expected;return(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><div style={{fontWeight:600}}>{m.name}</div></TD>
                      <TD><div style={{fontWeight:700,color:B.darkBlue}}>{m.weight}%</div></TD>
                      <TD>{m.deliverableCount}</TD>
                      <TD><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:14,fontWeight:800,color:onTrack?B.green:B.amber,minWidth:40}}>{m.pct}%</div><div style={{flex:1}}><ProgressBar pct={m.pct} color={onTrack?B.green:B.amber}/></div></div></TD>
                      <TD><Badge color={statusColor(m.status)} bg={statusBg(m.status)}>{m.status.toUpperCase()}</Badge></TD>
                      <TD><span style={{fontSize:11,color:B.textMuted}}>Expected {m.expected}% · {m.pct>=m.expected?<span style={{color:B.green,fontWeight:700}}>+{m.pct-m.expected}%</span>:<span style={{color:B.red,fontWeight:700}}>{m.pct-m.expected}%</span>}</span></TD>
                    </tr>
                  );})}</tbody>
                </table>
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
                <SLine title="Deliverables — Update Progress"/>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
                    <thead><tr><TH w="7%">ID</TH><TH w="20%">Deliverable</TH><TH w="14%">Milestone</TH><TH w="10%">Due</TH><TH w="8%">Prev %</TH><TH w="16%">This Week %</TH><TH w="13%">Status</TH><TH>Notes</TH></tr></thead>
                    <tbody>{form.deliverables.map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD nowrap><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{d.id}</div></TD>
                        <TD><div style={{fontWeight:600}}>{d.name}</div></TD>
                        <TD><div style={{fontSize:11,color:B.textMid}}>{d.milestone}</div></TD>
                        <TD nowrap><div style={{fontSize:11,color:B.textMuted}}>{d.dueDate}</div></TD>
                        <TD nowrap>{d.previousPct}%</TD>
                        <TD><div style={{display:"flex",alignItems:"center",gap:8}}><input type="range" min="0" max="100" step="5" value={d.thisWeekPct||0} onChange={e=>setA("deliverables",i,"thisWeekPct",Number(e.target.value))} style={{flex:1,accentColor:B.darkBlue}}/><div style={{minWidth:36,fontSize:12,fontWeight:700,color:B.darkBlue,textAlign:"right"}}>{d.thisWeekPct||0}%</div></div></TD>
                        <TD><Sel small options={DELIV_STATUSES} value={d.status} onChange={v=>setA("deliverables",i,"status",v)} placeholder="..."/></TD>
                        <TD><Inp value={d.notes} onChange={v=>setA("deliverables",i,"notes",v)}/></TD>
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
              <div style={{marginBottom:18}}><Lbl req>Completed This Week</Lbl><Txt rows={6} value={form.completedNarrative} onChange={v=>set("completedNarrative",v)}/></div>
              <div style={{marginBottom:18}}><Lbl req>Planned for Next Week</Lbl><Txt rows={6} value={form.plannedNarrative} onChange={v=>set("plannedNarrative",v)}/></div>
              <Lbl>Decisions / Escalations Needed</Lbl><Txt rows={4} value={form.decisionsNeeded} onChange={v=>set("decisionsNeeded",v)}/>
            </div>
          )}
          {section===3&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Risk & Issue Register"/>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {form.risks.map((r,i)=>{
                  const autoRating = r.likelihood&&r.impact ? RISK_MATRIX[`${r.likelihood}-${r.impact}`] : null;
                  const finalRating = r.overrideRating || autoRating || "—";
                  const isIssue = r.status === "Escalated to Issue";
                  return(
                    <div key={i} style={{border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden",borderLeft:`4px solid ${isIssue?B.critical:autoRating?ratingColor(finalRating):B.border}`}}>
                      <div style={{background:isIssue?B.criticalLight:B.pageBg,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${B.borderLight}`}}>
                        <div style={{fontSize:11,fontFamily:"monospace",fontWeight:700,color:isIssue?B.critical:B.darkBlue}}>{r.id}{isIssue&&" → ISSUE"}</div>
                        <div style={{flex:1}}/>
                        {finalRating!=="—"&&!isIssue&&<Badge color={ratingColor(finalRating)} bg={ratingBg(finalRating)}>{finalRating.toUpperCase()}</Badge>}
                        {isIssue&&<Badge color={B.critical} bg={B.criticalLight}>ISSUE (ESCALATED)</Badge>}
                        <Badge color={statusColor(r.status)} bg={statusBg(r.status)}>{r.status.toUpperCase()}</Badge>
                        {form.risks.length>1&&<DelBtn onClick={()=>rem("risks",i)}/>}
                      </div>
                      <div style={{padding:"14px 16px"}}>
                        <G cols={3} gap={12}>
                          <div><Lbl req>Category</Lbl><Sel options={RISK_CATS} value={r.category} onChange={v=>setA("risks",i,"category",v)} placeholder="..."/></div>
                          <div><Lbl req>Likelihood</Lbl><Sel options={RISK_LEVELS} value={r.likelihood} onChange={v=>setA("risks",i,"likelihood",v)} placeholder="..."/></div>
                          <div><Lbl req>Impact</Lbl><Sel options={RISK_LEVELS} value={r.impact} onChange={v=>setA("risks",i,"impact",v)} placeholder="..."/></div>
                        </G>
                        <div style={{height:10}}/>
                        <Lbl req>Risk Description</Lbl><Txt rows={2} value={r.description} onChange={v=>setA("risks",i,"description",v)}/>
                        <div style={{height:10}}/>
                        <G cols={2} gap={12}>
                          <div><Lbl>Mitigation Plan</Lbl><Txt rows={2} value={r.mitigation} onChange={v=>setA("risks",i,"mitigation",v)}/></div>
                          <div><G cols={2} gap={10}><div><Lbl>Owner</Lbl><Inp value={r.owner} onChange={v=>setA("risks",i,"owner",v)}/></div><div><Lbl>Status</Lbl><Sel options={RISK_STATUSES} value={r.status} onChange={v=>setA("risks",i,"status",v)} placeholder="..."/></div></G></div>
                        </G>
                        {isIssue&&(
                          <div style={{marginTop:14,padding:"14px 16px",background:B.criticalLight,border:`1px solid ${B.critical}40`,borderRadius:5}}>
                            <div style={{fontSize:11,fontWeight:700,color:B.critical,textTransform:"uppercase",marginBottom:10}}>⚠ Issue Details — Required</div>
                            <Lbl req>Issue Description</Lbl><Txt rows={2} value={r.issueDescription} onChange={v=>setA("risks",i,"issueDescription",v)}/>
                            <div style={{height:10}}/>
                            <G cols={2} gap={12}>
                              <div><Lbl req>Issue Owner</Lbl><Inp value={r.issueOwner} onChange={v=>setA("risks",i,"issueOwner",v)}/></div>
                              <div><Lbl req>Target Resolution</Lbl><Inp type="date" value={r.issueTargetDate} onChange={v=>setA("risks",i,"issueTargetDate",v)}/></div>
                            </G>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <AddBtn onClick={()=>add("risks",{id:`R-${String(form.risks.length+1).padStart(3,"0")}`,category:"",description:"",likelihood:"",impact:"",overrideRating:"",overrideComment:"",mitigation:"",owner:"",status:"Open",issueDescription:"",issueOwner:"",issueTargetDate:""})} label="Add Risk"/>
            </div>
          )}
          {section===4&&(
            <div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px",marginBottom:16}}>
                <SLine title="Cross-Project Dependencies"/>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                    <thead><tr><TH w="16%">Initiative</TH><TH w="18%">Nature</TH><TH w="18%">Risk if Delayed</TH><TH w="9%">Severity</TH><TH w="12%">Owner</TH><TH w="11%">Linked Status</TH><TH>This Week's Update</TH><TH w="30px"/></tr></thead>
                    <tbody>{form.dependencies.map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                        <TD><Inp value={d.initiative} onChange={v=>setA("dependencies",i,"initiative",v)}/></TD>
                        <TD><Inp value={d.nature} onChange={v=>setA("dependencies",i,"nature",v)}/></TD>
                        <TD><Inp value={d.riskIfDelayed} onChange={v=>setA("dependencies",i,"riskIfDelayed",v)}/></TD>
                        <TD><Sel small options={RISK_LEVELS} value={d.severity} onChange={v=>setA("dependencies",i,"severity",v)} placeholder="..."/></TD>
                        <TD><Inp value={d.owner} onChange={v=>setA("dependencies",i,"owner",v)}/></TD>
                        <TD><Inp value={d.linkedStatus} onChange={v=>setA("dependencies",i,"linkedStatus",v)}/></TD>
                        <TD><Inp value={d.weekUpdate} onChange={v=>setA("dependencies",i,"weekUpdate",v)}/></TD>
                        <TD>{form.dependencies.length>0&&<DelBtn onClick={()=>rem("dependencies",i)}/>}</TD>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <AddBtn onClick={()=>add("dependencies",{initiative:"",nature:"",riskIfDelayed:"",severity:"",owner:"",linkedStatus:"",weekUpdate:""})} label="Add Dependency"/>
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
                <SLine title="Action Items"/>
                {form.actions.length===0?(
                  <div style={{padding:"40px 20px",textAlign:"center",background:B.pageBg,borderRadius:6,border:`1px dashed ${B.border}`}}><div style={{fontSize:13,color:B.textMuted}}>No action items recorded for this week.</div></div>
                ):(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",minWidth:900}}>
                      <thead><tr><TH w="7%">ID</TH><TH w="25%">Description</TH><TH w="15%">Owner</TH><TH w="14%">Team</TH><TH w="11%">Due</TH><TH w="9%">Priority</TH><TH>Status</TH><TH w="30px"/></tr></thead>
                      <tbody>{form.actions.map((a,i)=>(
                        <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                          <TD><div style={{fontSize:11,fontFamily:"monospace",color:B.darkBlue,fontWeight:700}}>{a.id}</div></TD>
                          <TD><Inp value={a.description} onChange={v=>setA("actions",i,"description",v)}/></TD>
                          <TD><Inp value={a.owner} onChange={v=>setA("actions",i,"owner",v)}/></TD>
                          <TD><Inp value={a.team} onChange={v=>setA("actions",i,"team",v)}/></TD>
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
              <div style={{marginBottom:16}}><ProjectGauge pct={projectPct} expected={expectedPct} status={finalStatus}/></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
                {[{label:"Project Completion",value:`${projectPct}%`,color:statusColor(finalStatus)},{label:"Status",value:finalStatus,color:statusColor(finalStatus)},{label:"Deliverables Done",value:`${deliverablesCompletedThisWeek}`,color:B.darkBlue},{label:"Open Risks/Issues",value:`${openRisks} / ${escalatedIssues}`,color:openRisks+escalatedIssues>0?B.red:B.green},{label:"Open Actions",value:openActions,color:openActions>0?B.amber:B.green}].map((item,i)=>(
                  <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${item.color}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                    <div style={{fontSize:18,fontWeight:700,color:item.color}}>{item.value}</div>
                  </div>
                ))}
              </div>
              {submitted?(
                <div style={{background:B.greenLight,border:`2px solid ${B.green}`,borderRadius:6,padding:"24px 28px",textAlign:"center"}}>
                  <div style={{fontSize:26,marginBottom:8}}>✓</div>
                  <div style={{fontSize:16,fontWeight:700,color:B.green}}>Weekly Update Submitted</div>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
                  <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"10px 24px",borderRadius:5,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Save Draft & Exit</button>
                  <button onClick={()=>{setSubmitted(true);onSubmit&&onSubmit(form);}} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",fontWeight:700,fontSize:14,padding:"12px 36px",borderRadius:5,cursor:"pointer",fontFamily:"inherit"}}>Submit Weekly Update →</button>
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

function PageWeeklyReportsHistory({project,history,onBack,onSubmitNew,onViewWeek}) {
  const isClosed = project?.status === "Closed";
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`Weekly Reports History — ${project?.name}`} right={<Badge color={isClosed?B.textMuted:B.green} bg={(isClosed?B.textMuted:B.green)+"30"}>{isClosed?"CLOSED":"ACTIVE"}</Badge>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        {!isClosed&&<button onClick={onSubmitNew} style={{background:B.midBlue,border:"none",color:"#FFFFFF",padding:"7px 18px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Submit New Weekly Update →</button>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
            <SLine title="Project Summary"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
              {[{label:"Project ID",value:project?.id},{label:"PM",value:project?.pm},{label:"Progress",value:`${project?.progress||0}%`,color:statusColor(project?.status)},{label:"Status",value:project?.status,color:statusColor(project?.status)},{label:isClosed?"Closure Date":"Due Date",value:isClosed?(project?.closureDate||"—"):project?.dueDate}].map((f,i)=>(
                <div key={i} style={{background:B.pageBg,border:`1px solid ${B.border}`,borderRadius:5,padding:"12px 14px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:6}}>{f.label}</div>
                  <div style={{fontSize:13,fontWeight:700,color:f.color||B.textDark}}>{f.value||"—"}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px"}}>
            <SLine title={`All Weekly Reports (${history.length})`}/>
            {history.length===0?(
              <div style={{padding:"40px 20px",textAlign:"center",background:B.pageBg,borderRadius:6,border:`1px dashed ${B.border}`}}><div style={{fontSize:13,color:B.textMuted}}>No weekly reports yet.</div></div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {history.map((h,i)=>(
                  <div key={i} onClick={()=>onViewWeek&&onViewWeek(h)} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderLeft:`4px solid ${statusColor(h.status)}`,borderRadius:6,padding:"16px 20px",cursor:"pointer",display:"grid",gridTemplateColumns:"auto 2fr 1fr 1fr auto",gap:16,alignItems:"center"}}>
                    <div style={{fontSize:18,fontWeight:800,color:B.darkBlue,fontFamily:"monospace",minWidth:60}}>W{h.weekNumber}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:B.textDark,marginBottom:3}}>{h.label}</div>
                      <div style={{fontSize:11,color:B.textMuted,lineHeight:1.5}}>{h.narrative}</div>
                    </div>
                    <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>Project %</div><div style={{fontSize:18,fontWeight:800,color:statusColor(h.status)}}>{h.projectPct}%</div></div>
                    <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>Status</div><Badge color={statusColor(h.status)} bg={statusBg(h.status)}>{h.status.toUpperCase()}</Badge></div>
                    <button style={{background:"none",border:`1px solid ${B.border}`,color:B.darkBlue,borderRadius:3,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View →</button>
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

function PageLanding({pipeline,projects,onNewInitiative,onNewRFP,onNewActiveProject,onNewClosedProject,onViewInitiative,onOpenRFP,onOpenContracting,onOpenWeekly,onViewWeeklyReports,onMovePhase}) {
  const [activeTab,setActiveTab]=useState("overview");
  const [pipelineFilter,setPipelineFilter]=useState("All");
  const [projectFilter,setProjectFilter]=useState("All");
  const [selectedItem,setSelectedItem]=useState(null);
  const filteredPipeline=pipelineFilter==="All"?pipeline:pipeline.filter(p=>p.phase===pipelineFilter);
  const filteredProjects=projectFilter==="All"?projects.filter(p=>p.status!=="Closed"):projects.filter(p=>p.status===projectFilter);
  const kpis=[
    {label:"Strategy Initiatives",value:pipeline.filter(p=>p.phase==="Strategy").length,sub:"Pending CISO review",color:B.darkBlue},
    {label:"RFP Initiatives",value:pipeline.filter(p=>p.phase==="RFP").length,sub:"Under procurement",color:B.midBlue},
    {label:"Active Projects",value:projects.filter(p=>p.status!=="Closed").length,sub:"In execution",color:B.green},
    {label:"Closed Projects",value:projects.filter(p=>p.status==="Closed").length,sub:"Completed & approved",color:B.textMuted},
    {label:"At Risk / Delayed",value:projects.filter(p=>p.status==="At Risk"||p.status==="Delayed").length,sub:"Require attention",color:B.red},
  ];
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle="CISO Portfolio Overview" right={<div style={{color:B.headerText,fontSize:11}}>Data as of {today}</div>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
        {[{id:"overview",label:"Portfolio Overview"},{id:"pipeline",label:"Initiatives"},{id:"projects",label:"Active Projects"},{id:"risks",label:"Risks & Issues"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"12px 20px",background:activeTab===t.id?B.darkBlue:"transparent",color:activeTab===t.id?"#FFFFFF":B.textMuted,border:"none",fontSize:12,fontWeight:activeTab===t.id?700:500,cursor:"pointer",fontFamily:"inherit",borderRadius:activeTab===t.id?"4px 4px 0 0":0}}>{t.label}</button>
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
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
                    <div style={{fontSize:36,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                    <div style={{fontSize:11,color:B.textMuted,marginTop:6}}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px"}}>
                <SLine title="Portfolio Pipeline — Stage Distribution"/>
                <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
                  {[
                    {key:"Strategy",label:"Strategy Initiatives",items:pipeline.filter(p=>p.phase==="Strategy"),source:"pipeline",newLabel:"+ New Strategy",newAction:onNewInitiative},
                    {key:"RFP",label:"RFP Initiatives",items:pipeline.filter(p=>p.phase==="RFP"),source:"pipeline",newLabel:"+ New RFP",newAction:onNewRFP},
                    {key:"Active",label:"Active Projects",items:projects.filter(p=>p.status!=="Closed"),source:"project",newLabel:"+ New Active Project",newAction:onNewActiveProject},
                    {key:"Closed",label:"Closed Projects",items:projects.filter(p=>p.status==="Closed"),source:"project",newLabel:"+ New Closed Project",newAction:onNewClosedProject},
                  ].map((col)=>(
                    <div key={col.key} style={{flex:1}}>
                      <div style={{background:phaseBg(col.key),border:`1px solid ${phaseColor(col.key)}40`,borderRadius:6,padding:"14px 16px",height:"100%",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                          <Badge color={phaseColor(col.key)} bg={phaseBg(col.key)}>{col.label.toUpperCase()}</Badge>
                          <div style={{fontSize:22,fontWeight:800,color:phaseColor(col.key)}}>{col.items.length}</div>
                        </div>
                        <div style={{flex:1}}>
                          {col.items.map(item=>(
                            col.source==="pipeline"?(
                              <div key={item.id} onClick={()=>setSelectedItem({...item,_cardType:"pipeline"})} style={{background:"#FFFFFF",border:`1px solid ${B.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8,cursor:"pointer"}}>
                                <div style={{fontSize:12,fontWeight:700,color:B.textDark,marginBottom:3}}>{item.name}</div>
                                <div style={{fontSize:11,color:B.textMuted,marginBottom:6}}>{item.domain}</div>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  <span style={{fontSize:11,color:B.textMuted}}>{(item.owner||"").split(" ")[0]}</span>
                                  <div style={{fontSize:11,fontWeight:700,color:scoreColor(item.score)}}>Score: {item.score}</div>
                                </div>
                              </div>
                            ):(
                              <div key={item.id} onClick={()=>setSelectedItem({...item,_cardType:"project"})} style={{background:"#FFFFFF",border:`1px solid ${B.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8,cursor:"pointer"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                                  <div style={{fontSize:12,fontWeight:700,color:B.textDark,flex:1,marginRight:8}}>{item.name}</div>
                                  <Badge color={statusColor(item.status)} bg={statusBg(item.status)}>{item.status.toUpperCase()}</Badge>
                                </div>
                                <ProgressBar pct={item.progress} color={statusColor(item.status)}/>
                                <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>{item.progress}% complete</div>
                              </div>
                            )
                          ))}
                          {col.items.length===0&&<div style={{fontSize:12,color:B.textMuted,fontStyle:"italic",textAlign:"center",padding:"12px 0"}}>None</div>}
                        </div>
                        <button onClick={col.newAction} style={{marginTop:10,background:"#FFFFFF",border:`1px dashed ${phaseColor(col.key)}`,color:phaseColor(col.key),borderRadius:4,padding:"7px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>{col.newLabel}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab==="pipeline"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {["All","Strategy","RFP"].map(f=>(
                  <button key={f} onClick={()=>setPipelineFilter(f)} style={{padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:pipelineFilter===f?B.darkBlue:B.cardBg,color:pipelineFilter===f?"#FFFFFF":B.textMid,border:`1px solid ${pipelineFilter===f?B.darkBlue:B.border}`,fontWeight:pipelineFilter===f?700:400}}>{f}{f!=="All"&&` (${pipeline.filter(p=>p.phase===f).length})`}</button>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.deepBlue}}>{["Initiative","Domain","Phase","Score","Owner","Budget","Submitted","Actions"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#FFFFFF",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
                  <tbody>{filteredPipeline.map((item,i)=>(
                    <tr key={item.id} style={{background:i%2===0?B.cardBg:B.pageBg,borderBottom:`1px solid ${B.borderLight}`}}>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{item.name}</div><div style={{fontSize:11,color:B.textMuted,fontFamily:"monospace"}}>{item.id}</div></td>
                      <td style={{padding:"12px 14px",fontSize:12,color:B.textMid}}>{item.domain}</td>
                      <td style={{padding:"12px 14px"}}><Badge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</Badge></td>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:16,fontWeight:800,color:scoreColor(item.score)}}>{item.score}</div></td>
                      <td style={{padding:"12px 14px",fontSize:12,color:B.textMid}}>{item.owner}</td>
                      <td style={{padding:"12px 14px",fontSize:12,fontWeight:600,color:B.darkBlue}}>{item.budget}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:B.textMuted}}>{item.submitted}</td>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>onViewInitiative(item)} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,borderRadius:3,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>View</button>
                          {item.phase==="Strategy"&&<button onClick={()=>onOpenRFP(item)} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open RFP →</button>}
                          {item.phase==="RFP"&&<button onClick={()=>onOpenContracting(item)} style={{background:B.green,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Activate Project →</button>}
                          {item.phase!=="Strategy"&&<button onClick={()=>onMovePhase(item)} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{nextLabel[item.phase]}</button>}
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab==="projects"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {["All","On Track","At Risk","Delayed","Closed"].map(f=>(
                  <button key={f} onClick={()=>setProjectFilter(f)} style={{padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:projectFilter===f?B.darkBlue:B.cardBg,color:projectFilter===f?"#FFFFFF":B.textMid,border:`1px solid ${projectFilter===f?B.darkBlue:B.border}`,fontWeight:projectFilter===f?700:400}}>{f==="All"?`All (${projects.filter(p=>p.status!=="Closed").length})`:`${f} (${projects.filter(p=>p.status===f).length})`}</button>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {filteredProjects.map(p=>(
                  <div key={p.id} onClick={()=>setSelectedItem({...p,_cardType:"project"})} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderLeft:`4px solid ${statusColor(p.status)}`,borderRadius:6,padding:"18px 22px",cursor:"pointer"}}>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr auto",gap:16,alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><div style={{fontSize:13,fontWeight:700,color:B.textDark}}>{p.name}</div><Badge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</Badge></div>
                        <div style={{fontSize:11,color:B.textMuted,marginBottom:8}}>{p.domain} · PM: {p.pm}</div>
                        <ProgressBar pct={p.progress} color={statusColor(p.status)}/>
                        <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>{p.progress}% complete</div>
                      </div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>Milestone</div><div style={{fontSize:12,fontWeight:600,color:B.textDark}}>{p.milestone}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>{p.status==="Closed"?"Closed":"Due"}</div><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{p.status==="Closed"?(p.closureDate||"—"):p.dueDate}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>Budget</div><div style={{fontSize:13,fontWeight:700,color:B.darkBlue}}>{p.budget}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>Risks</div><div style={{fontSize:20,fontWeight:800,color:p.risks>0?B.red:B.green}}>{p.risks}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:4}}>Issues</div><div style={{fontSize:20,fontWeight:800,color:p.issues>0?B.amber:B.green}}>{p.issues}</div></div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {p.status!=="Closed"&&<button onClick={(e)=>{e.stopPropagation();onOpenWeekly(p);}} style={{background:B.midBlue,border:"none",color:"#FFFFFF",borderRadius:3,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Weekly Update →</button>}
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
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
                    <div style={{fontSize:40,fontWeight:800,color:k.color}}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedItem&&(()=>{
        const isProject = selectedItem._cardType==="project";
        const isClosed  = isProject && selectedItem.status==="Closed";
        const rows = isProject?[
          {label:"Domain",value:selectedItem.domain},{label:"PM",value:selectedItem.pm},
          {label:"Status",value:selectedItem.status,color:statusColor(selectedItem.status)},
          {label:"Progress",value:`${selectedItem.progress}%`,color:statusColor(selectedItem.status)},
          {label:"Budget",value:selectedItem.budget},{label:"Spent",value:selectedItem.spent},
          {label:isClosed?"Closure Date":"Due Date",value:isClosed?(selectedItem.closureDate||"—"):selectedItem.dueDate},
          {label:"Current Milestone",value:selectedItem.milestone},
          {label:"Open Risks",value:selectedItem.risks,color:selectedItem.risks>0?B.red:B.green},
          {label:"Open Issues",value:selectedItem.issues,color:selectedItem.issues>0?B.amber:B.green},
        ]:[
          {label:"Domain",value:selectedItem.domain},{label:"Owner",value:selectedItem.owner},
          {label:"Phase",value:selectedItem.phase},{label:"Priority Score",value:selectedItem.score,color:scoreColor(selectedItem.score||0)},
          {label:"Status",value:selectedItem.status},{label:"Est. Budget",value:selectedItem.budget},
          {label:"CISO Pillar",value:selectedItem.pillar||selectedItem.cisoPillar},{label:"Submitted",value:selectedItem.submitted},
        ];
        return(
        <div style={{position:"fixed",top:0,right:0,bottom:0,width:400,background:B.cardBg,boxShadow:"-4px 0 24px rgba(0,85,135,0.15)",zIndex:100,display:"flex",flexDirection:"column"}}>
          <div style={{background:isProject?(isClosed?B.textMuted:B.green):B.deepBlue,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{color:"#FFFFFFAA",fontSize:10,fontWeight:700,marginBottom:4}}>{selectedItem.id} · {isProject?(isClosed?"CLOSED PROJECT":"ACTIVE PROJECT"):(selectedItem.phase.toUpperCase()+" INITIATIVE")}</div>
              <div style={{color:"#FFFFFF",fontWeight:700,fontSize:14}}>{selectedItem.name}</div>
            </div>
            <button onClick={()=>setSelectedItem(null)} style={{background:"none",border:"none",color:"#FFFFFF",fontSize:20,cursor:"pointer"}}>×</button>
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
              {!isProject&&selectedItem.phase==="Strategy"&&<button onClick={()=>{onOpenRFP(selectedItem);setSelectedItem(null);}} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open RFP →</button>}
              {!isProject&&selectedItem.phase==="RFP"&&<button onClick={()=>{onOpenContracting(selectedItem);setSelectedItem(null);}} style={{background:B.green,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Activate Project →</button>}
              {isProject&&!isClosed&&<button onClick={()=>{onOpenWeekly(selectedItem);setSelectedItem(null);}} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit Weekly Update →</button>}
              {isProject&&<button onClick={()=>{onViewWeeklyReports&&onViewWeeklyReports(selectedItem);setSelectedItem(null);}} style={{background:"#FFFFFF",color:B.darkBlue,border:`1px solid ${B.darkBlue}`,borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Weekly Reports →</button>}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

export default function CPMApp() {
  const [page,setPage]=useState("landing");
  const [viewing,setViewing]=useState(null);
  const [rfpItem,setRfpItem]=useState(null);
  const [contractItem,setContractItem]=useState(null);
  const [contractMode,setContractMode]=useState(null);
  const [weeklyProject,setWeeklyProject]=useState(null);
  const [reportsProject,setReportsProject]=useState(null);
  const [pipeline,setPipeline]=useState(INIT_PIPELINE);
  const [projects,setProjects]=useState(INIT_PROJECTS);

  const genId = () => "CPM-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random()*900)+100);
  const blankPipelineRecord = (phase) => ({
    id: genId(), name:"", domain:"", phase, score:0, owner:"", budget:"", submitted: today, pillar:"",
    status: phase==="Strategy" ? "Pending CISO Review" : "RFP Draft",
    frameworks:[], problemStatement:"", visionStatement:"", businessOutcome:"", inScope:"", assumptions:"",
    milestones:[], kpis:[], depRisks:[],
  });

  const handleSubmitStrategy = (newItem) => { setPipeline(prev=>[newItem,...prev]); setPage("landing"); };
  const handleSaveRFP = (updatedItem) => {
    setPipeline(prev=>{
      const exists = prev.some(p=>p.id===updatedItem.id);
      return exists ? prev.map(p=>p.id===updatedItem.id?updatedItem:p) : [updatedItem,...prev];
    });
    setPage("landing");
  };
  const handleMoveToRFP = (item) => { const updated={...item,phase:"RFP"}; setPipeline(prev=>prev.map(p=>p.id===item.id?updated:p)); setRfpItem(updated); setPage("rfp"); };
  const handleOpenRFP = (item) => { setRfpItem(item); setPage("rfp"); };
  const handleNewStrategy = () => setPage("new");
  const handleNewRFP = () => { setRfpItem(blankPipelineRecord("RFP")); setPage("rfp"); };
  const handleNewActiveProject = () => { setContractItem({...blankPipelineRecord("RFP"),name:""}); setContractMode("new-active"); setPage("contracting"); };
  const handleNewClosedProject = () => { setContractItem({...blankPipelineRecord("RFP"),name:""}); setContractMode("new-closed"); setPage("contracting"); };
  const handleOpenContracting = (item) => { setContractItem(item); setContractMode(null); setPage("contracting"); };
  const handleActivateProject = (activatedItem) => {
    const willBeClosed = contractMode==="new-closed";
    setPipeline(prev=>prev.filter(p=>p.id!==activatedItem.id));
    setProjects(prev=>[{
      id:activatedItem.id, name:activatedItem.name, domain:activatedItem.domain,
      progress: willBeClosed?100:0, status: willBeClosed?"Closed":"On Track",
      risks: activatedItem.risks?.filter(r=>r.status==="Open").length||0, issues:0,
      pm: activatedItem.pm, pmEmail: activatedItem.pmEmail,
      contractStart: activatedItem.contractStart, contractEnd: activatedItem.contractEnd,
      budget: activatedItem.contractValue?`$${Number(activatedItem.contractValue).toLocaleString()}`:activatedItem.budget,
      contractValue: activatedItem.contractValue,
      spent: willBeClosed && activatedItem.contractValue ? `$${Number(activatedItem.contractValue).toLocaleString()}` : "$0",
      dueDate: activatedItem.contractEnd||"TBD",
      closureDate: willBeClosed?today:undefined,
      milestone: willBeClosed?"Closure & Handover":(activatedItem.milestones?.[0]?.name||"Project Kick-off"),
      milestoneStatus: willBeClosed?"Completed":"Not Started",
      deliverables: activatedItem.deliverables||[],
      milestonesList: activatedItem.milestones||[],
      risksList: activatedItem.risks||[],
      dependenciesList: activatedItem.dependencies||[],
      contractData: activatedItem,
    },...prev]);
    setContractMode(null); setPage("landing");
  };
  const handleOpenWeekly = (project) => {
    setWeeklyProject({
      id: project.id, name: project.name, domain: project.domain, pm: project.pm,
      pmEmail: project.pmEmail || `${(project.pm||"pm").split(" ")[0].toLowerCase()}@org.com`,
      contractStart: project.contractStart || "2025-01-15",
      contractEnd: project.contractEnd || project.dueDate || "2025-12-31",
      contractValue: project.contractValue || "0",
      deliverables: (project.deliverables && project.deliverables.length>0) ? project.deliverables : MOCK_PROJECT.deliverables,
      milestones: (project.milestonesList && project.milestonesList.length>0) ? project.milestonesList : MOCK_PROJECT.milestones,
      initialRisks: (project.risksList && project.risksList.length>0) ? project.risksList : MOCK_PROJECT.initialRisks,
      initialDependencies: (project.dependenciesList && project.dependenciesList.length>0) ? project.dependenciesList : MOCK_PROJECT.initialDependencies,
    });
    setPage("weekly");
  };
  const handleSubmitWeekly = () => { setPage("landing"); };
  const handleViewWeeklyReports = (project) => { setReportsProject(project); setPage("reports"); };
  const handleMovePhase = (item) => {
    if (item.phase==="RFP") handleOpenContracting(item);
    else setPipeline(prev=>prev.map(p=>p.id===item.id?{...p,phase:nextPhase[p.phase]}:p));
  };

  if (page==="new") return <PageNewInitiative onDiscard={()=>setPage("landing")} onSubmit={handleSubmitStrategy}/>;
  if (page==="view") return <PageViewInitiative item={viewing} onBack={()=>setPage("landing")} onMoveToRFP={handleMoveToRFP} onOpenWeekly={handleOpenWeekly} onViewWeeklyReports={handleViewWeeklyReports}/>;
  if (page==="rfp") return <PageRFP strategy={rfpItem} onBack={()=>setPage("landing")} onSubmit={handleSaveRFP}/>;
  if (page==="contracting") return <PageContracting strategy={contractItem} rfp={contractItem?.rfpData} onBack={()=>{setContractMode(null);setPage("landing");}} onActivate={handleActivateProject} mode={contractMode}/>;
  if (page==="weekly") return <PageWeeklyUpdate project={weeklyProject} onBack={()=>setPage("landing")} onSubmit={handleSubmitWeekly}/>;
  if (page==="reports") return <PageWeeklyReportsHistory project={reportsProject} history={MOCK_HISTORY} onBack={()=>setPage("landing")} onSubmitNew={()=>handleOpenWeekly(reportsProject)} onViewWeek={()=>{}}/>;
  return (
    <PageLanding pipeline={pipeline} projects={projects}
      onNewInitiative={handleNewStrategy}
      onNewRFP={handleNewRFP}
      onNewActiveProject={handleNewActiveProject}
      onNewClosedProject={handleNewClosedProject}
      onViewInitiative={(item)=>{setViewing(item);setPage("view");}}
      onOpenRFP={handleOpenRFP}
      onOpenContracting={handleOpenContracting}
      onOpenWeekly={handleOpenWeekly}
      onViewWeeklyReports={handleViewWeeklyReports}
      onMovePhase={handleMovePhase}/>
  );
}
