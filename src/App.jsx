import { useState, useMemo } from "react";

// Brand tokens
const B = {
  deepBlue:      "#005587",
  darkBlue:      "#0076A8",
  midBlue:       "#00A3E0",
  lightBlue:     "#62B5E5",
  pageBg:        "#F2F6FA",
  cardBg:        "#FFFFFF",
  border:        "#C8DFF0",
  borderLight:   "#E2EFF8",
  activeBg:      "#E8F4FC",
  inputBg:       "#FAFCFE",
  textDark:      "#0D2E45",
  textMid:       "#2A5070",
  textMuted:     "#6A90A8",
  headerText:    "#C8E8F8",
  green:         "#1A8A4A",
  greenLight:    "#EAF7EF",
  amber:         "#B86A00",
  amberLight:    "#FFF4E0",
  red:           "#C0392B",
  redLight:      "#FDECEA",
  critical:      "#7A0E1F",
  criticalLight: "#F7DDE2",
  lineColor:     "#C8DFF0",
};

// Reference data
const DOMAINS     = ["Identity & Access Management","Network Security","GRC & Compliance","Security Operations (SOC)","Application Security","Cloud Security","Data Protection","Threat Intelligence","Third-Party Risk","Cyber Transformation"];
const PILLARS     = ["Cyber Resilience","Risk Reduction","Regulatory Compliance","Digital Transformation Enablement","Talent & Culture","Operational Excellence"];
const FRAMEWORKS  = ["NIST CSF","ISO 27001","NIST 800-53","CIS Controls","DORA","NCA ECC","PCI DSS","GDPR","SOC 2"];
const DELIV_TYPES = ["Document","System","Report","Workshop","Training","Assessment","Tool"];
const RFP_STATUS_STEPS = ["Draft","Internally Approved","Issued","Q&A Period","Closed"];
const MS_STATUSES  = ["Not Started","In Progress","On Track","At Risk","Delayed","Completed"];
const RISK_CATS    = ["Technical","Operational","Financial","Compliance","Vendor","Security","Schedule","Resource"];
const RISK_LEVELS  = ["High","Medium","Low"];
const RISK_STATUSES = ["Open","Mitigated","Closed","Accepted"];

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

const RISK_MATRIX = {
  "High-High":"Critical","High-Medium":"High","High-Low":"Medium",
  "Medium-High":"High","Medium-Medium":"Medium","Medium-Low":"Low",
  "Low-High":"Medium","Low-Medium":"Low","Low-Low":"Low",
};

// Mock data
const INIT_PIPELINE = [
  { id:"CPM-2025-001", name:"IAM Modernisation Programme",         domain:"Identity & Access Management", phase:"Strategy",    score:88, owner:"Sarah Al-Mansouri", budget:"$1.2M",  submitted:"12 Apr 2025", pillar:"Risk Reduction",       status:"Pending CISO Review", frameworks:["NIST CSF","ISO 27001"], problemStatement:"Lack of centralised identity controls across business units.", visionStatement:"A unified IAM platform covering all users and privileged accounts.", businessOutcome:"Reduce identity-related incidents by 80%.", inScope:"All user identities across HQ and subsidiaries.", assumptions:"Executive sponsorship confirmed.", milestones:[{name:"Discovery",date:"2025-06-01",deliverable:"As-Is Report"}], kpis:[{name:"MFA Coverage",baseline:"40%",target:"95%",method:"Monthly audit"}], depRisks:[{initiative:"Network Segmentation",dependency:"Shared directory",risk:"Delays IAM rollout",severity:"High"}] },
  { id:"CPM-2025-004", name:"Cloud Security Baseline Framework",   domain:"Cloud Security",               phase:"Strategy",    score:74, owner:"Khalid Ibrahim",    budget:"$680K",  submitted:"18 Apr 2025", pillar:"Cyber Resilience",     status:"Pending CISO Review", frameworks:["CIS Controls","NIST CSF"], problemStatement:"No consistent security baseline across cloud environments.", visionStatement:"Standardised controls across all cloud workloads.", businessOutcome:"Eliminate misconfiguration incidents.", inScope:"AWS and Azure production environments.", assumptions:"Cloud team available.", milestones:[{name:"Baseline Assessment",date:"2025-07-01",deliverable:"Gap Report"}], kpis:[{name:"Misconfiguration rate",baseline:"12%",target:"<2%",method:"Weekly CSPM scan"}], depRisks:[] },
  { id:"CPM-2025-002", name:"SOC Uplift & SIEM Migration",         domain:"Security Operations (SOC)",    phase:"RFP",         score:91, owner:"Ahmed Rashid",      budget:"$3.4M",  submitted:"02 Mar 2025", pillar:"Cyber Resilience",     status:"RFP Issued",          frameworks:["NIST CSF","CIS Controls"], problemStatement:"Current SIEM lacks coverage and correlation capability.", visionStatement:"Modern SOC with 24/7 detection and response.", businessOutcome:"MTTD reduced from 72hrs to under 4hrs.", inScope:"All IT and OT environments.", assumptions:"Vendor shortlist approved.", milestones:[{name:"RFP Close",date:"2025-05-30",deliverable:"Vendor Proposals"},{name:"Evaluation",date:"2025-06-30",deliverable:"Evaluation Report"}], kpis:[{name:"MTTD",baseline:"72hrs",target:"<4hrs",method:"SOC metrics dashboard"}], depRisks:[] },
  { id:"CPM-2025-005", name:"Data Loss Prevention Implementation", domain:"Data Protection",              phase:"RFP",         score:79, owner:"Fatima Al-Zahra",   budget:"$900K",  submitted:"14 Mar 2025", pillar:"Risk Reduction",       status:"RFP Draft",           frameworks:["GDPR","ISO 27001"], problemStatement:"No automated controls preventing sensitive data exfiltration.", visionStatement:"Organisation-wide DLP covering endpoints, email and cloud.", businessOutcome:"Zero data loss incidents post-implementation.", inScope:"All endpoints and email systems.", assumptions:"Data classification completed first.", milestones:[{name:"Requirements",date:"2025-06-01",deliverable:"Requirements Doc"}], kpis:[{name:"Data incidents",baseline:"8/yr",target:"0",method:"Incident register"}], depRisks:[] },
  { id:"CPM-2025-003", name:"Zero Trust Network Architecture",     domain:"Network Security",             phase:"Contracting", score:95, owner:"Omar Al-Hashimi",   budget:"$2.1M",  submitted:"15 Jan 2025", pillar:"Cyber Resilience",     status:"Under Negotiation",   frameworks:["NIST 800-53","NIST CSF"], problemStatement:"Flat network allowing lateral movement post-breach.", visionStatement:"Zero-trust architecture with micro-segmentation.", businessOutcome:"Contain breach impact to single segment.", inScope:"Core data centre and remote access.", assumptions:"Hardware refresh budget approved.", milestones:[{name:"Design Sign-off",date:"2025-05-15",deliverable:"Architecture Doc"}], kpis:[{name:"Segments implemented",baseline:"0",target:"12",method:"Network audit"}], depRisks:[] },
];

const INIT_PROJECTS = [
  { id:"CPM-2024-011", name:"PAM Solution Deployment",             domain:"Identity & Access Management", progress:78, status:"On Track", risks:1, issues:0, pm:"Rania Yousef",    budget:"$850K",  spent:"$612K",  dueDate:"30 Jun 2025", milestone:"Phase 3 UAT",              milestoneStatus:"On Track" },
  { id:"CPM-2024-008", name:"GRC Platform Implementation",         domain:"GRC & Compliance",             progress:45, status:"At Risk",  risks:3, issues:2, pm:"Tariq Al-Dosari", budget:"$1.5M",  spent:"$780K",  dueDate:"15 Aug 2025", milestone:"Requirements Sign-off",    milestoneStatus:"Delayed"  },
  { id:"CPM-2024-015", name:"Application Security Programme",      domain:"Application Security",         progress:62, status:"On Track", risks:0, issues:1, pm:"Nadia Karimi",    budget:"$620K",  spent:"$390K",  dueDate:"31 Jul 2025", milestone:"Pen Test Phase 2",         milestoneStatus:"On Track" },
  { id:"CPM-2024-019", name:"Threat Intelligence Platform",        domain:"Threat Intelligence",          progress:31, status:"Delayed",  risks:4, issues:2, pm:"Hassan Al-Amri",  budget:"$1.1M",  spent:"$420K",  dueDate:"01 Sep 2025", milestone:"Vendor Integration",       milestoneStatus:"Delayed"  },
  { id:"CPM-2024-022", name:"Employee Cyber Awareness Programme",  domain:"GRC & Compliance",             progress:89, status:"On Track", risks:0, issues:0, pm:"Sara Mahmoud",    budget:"$280K",  spent:"$248K",  dueDate:"30 May 2025", milestone:"Final Assessment",         milestoneStatus:"On Track" },
  { id:"CPM-2024-017", name:"Network Segmentation Project",        domain:"Network Security",             progress:54, status:"At Risk",  risks:2, issues:1, pm:"Yusuf Al-Farsi",  budget:"$740K",  spent:"$435K",  dueDate:"15 Sep 2025", milestone:"Firewall Rule Deployment", milestoneStatus:"At Risk"  },
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

// Helpers
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
const phaseColor  = p => ({Strategy:B.darkBlue,RFP:B.midBlue,Contracting:B.deepBlue}[p]||B.textMuted);
const phaseBg     = p => ({Strategy:"#E8F4FC",RFP:"#D0EDFA",Contracting:"#C0E0F0"}[p]||B.pageBg);
const statusColor = s => ({"On Track":B.green,"At Risk":B.amber,"Delayed":B.red,"Completed":B.green,"In Progress":B.midBlue,"Not Started":B.textMuted}[s]||B.textMuted);
const statusBg    = s => ({"On Track":B.greenLight,"At Risk":B.amberLight,"Delayed":B.redLight,"Completed":B.greenLight,"In Progress":B.activeBg,"Not Started":B.pageBg}[s]||B.pageBg);
const ratingColor = r => ({Critical:B.critical,High:B.red,Medium:B.amber,Low:B.green}[r]||B.textMuted);
const ratingBg    = r => ({Critical:B.criticalLight,High:B.redLight,Medium:B.amberLight,Low:B.greenLight}[r]||B.pageBg);
const nextPhase   = {Strategy:"RFP",RFP:"Contracting",Contracting:"Active Project"};
const nextLabel   = {Strategy:"Move to RFP →",RFP:"Move to Contracting →",Contracting:"Initiate Project →"};
const today = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

// Primitive UI
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
const Badge = ({children,color,bg}) => <span style={{fontSize:10,fontWeight:700,color:color||B.darkBlue,background:bg||B.activeBg,border:`1px solid ${(color||B.darkBlue)+"30"}`,borderRadius:3,padding:"2px 8px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{children}</span>;
const ProgressBar = ({pct,color}) => <div style={{height:6,background:B.borderLight,borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color||B.darkBlue,borderRadius:3,transition:"width 0.4s"}}/></div>;

// Shared header
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

// Section timeline
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

// Strategy form sections
function StrategyFormSections({section,setSection,form,setForm,readOnly}) {
  const set  = (k,v)        => setForm(f=>({...f,[k]:v}));
  const setA = (k,i,f2,v)  => setForm(f=>{const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
  const add  = (k,t)        => setForm(f=>({...f,[k]:[...f[k],t]}));
  const rem  = (k,i)        => setForm(f=>({...f,[k]:f[k].filter((_,j)=>j!==i)}));
  const togFw= fw           => set("frameworks",form.frameworks.includes(fw)?form.frameworks.filter(x=>x!==fw):[...form.frameworks,fw]);
  const setAns=(ck,qi,v)    => setForm(f=>({...f,answers:{...f.answers,[ck]:{...(f.answers[ck]||{}),[qi]:v}}}));
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
              <div><Lbl req={!readOnly}>Link to CISO Strategic Objective / Pillar</Lbl><Sel readOnly={readOnly} options={PILLARS} value={form.cisoPillar} onChange={v=>set("cisoPillar",v)} placeholder="Select pillar..."/></div>
              <div><Lbl req={!readOnly}>Expected Business Outcome</Lbl><Inp readOnly={readOnly} placeholder="e.g. Reduce incidents by 80%" value={form.businessOutcome} onChange={v=>set("businessOutcome",v)}/></div>
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

// RFP form sections
function RFPFormSections({section,setSection,rfp,setRfp,strategy}) {
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
              {FRAMEWORKS.map(fw=><button key={fw} onClick={()=>togFw(fw)} style={{padding:"5px 12px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:rfp.frameworks.includes(fw)?B.darkBlue:B.cardBg,color:rfp.frameworks.includes(fw)?"#FFFFFF":B.textMid,border:`1px solid ${rfp.frameworks.includes(fw)?B.darkBlue:B.border}`,fontWeight:rfp.frameworks.includes(fw)?700:400}}>{fw}</button>)}
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
              <thead><tr><TH w="20%">Milestone Name</TH><TH w="28%">Deliverable Description</TH><TH w="14%">Deliverable Type</TH><TH w="14%">Due Date</TH><TH>Responsible Party</TH><TH w="30px"/></tr></thead>
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
                  <Badge color={B.darkBlue} bg={B.activeBg}>CURRENT: {rfp.rfpStatus.toUpperCase()}</Badge>
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

// Page: New Initiative
function PageNewInitiative({onDiscard,onSubmit}) {
  const [section,setSection]=useState(0);
  const [form,setForm]=useState({...EMPTY_STRATEGY});
  const {score,filled}=calcScore(form.answers);
  const initId="CPM-"+new Date().getFullYear()+"-"+String(Math.floor(Math.random()*900)+100);
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle="New Initiative — Strategy & Initiation"
        right={<><div style={{color:B.headerText,fontSize:11}}>ID: <span style={{fontFamily:"monospace",color:"#FFFFFF"}}>{initId}</span></div><Badge color={B.midBlue} bg={B.midBlue+"40"}>DRAFT</Badge></>}
      />
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onDiscard} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:B.textMuted}}>Priority Score:</div>
          <div style={{fontSize:15,fontWeight:800,color:filled>0?scoreColor(score):B.textMuted}}>{filled>0?score:"—"}</div>
          {filled>0&&<Badge color={scoreColor(score)} bg={scoreColor(score)+"18"}>{scoreLabel(score)}</Badge>}
          <div style={{width:1,height:20,background:B.border}}/>
          <button onClick={onDiscard} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Discard Changes</button>
          <button onClick={()=>onSubmit({...form,id:initId,phase:"Strategy",score,submitted:today,status:"Pending CISO Review"})} style={{background:B.darkBlue,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Submit Initiative →</button>
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

// Page: View Initiative (read-only)
function PageViewInitiative({item,onBack,onMoveToRFP}) {
  const [section,setSection]=useState(0);
  const form={...EMPTY_STRATEGY,...item,frameworks:item.frameworks||[],kpis:item.kpis||[{name:"",baseline:"",target:"",method:""}],outOfScope:[{item:"",reason:""}],stakeholders:[{name:"",role:""}],integrations:[{initiative:"",nature:"",risk:""}],depRisks:item.depRisks||[],milestones:item.milestones||[],answers:{}};
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`Viewing: ${item.name}`}
        right={<><Badge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</Badge><Badge color={B.amber} bg={B.amberLight}>{item.status}</Badge></>}
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

// Page: RFP
function PageRFP({strategy,onBack,onSubmit}) {
  const [section,setSection]=useState(0);
  const [rfp,setRfp]=useState(EMPTY_RFP(strategy));
  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle={`RFP — ${strategy.name}`}
        right={<><Badge color={B.midBlue} bg={B.midBlue+"30"}>RFP PHASE</Badge><Badge color={B.amber} bg={B.amberLight}>{rfp.rfpStatus.toUpperCase()}</Badge></>}
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
      <RFPFormSections section={section} setSection={setSection} rfp={rfp} setRfp={setRfp} strategy={strategy}/>
    </div>
  );
}

// Page: Landing
function PageLanding({pipeline,projects,onNewInitiative,onViewInitiative,onOpenRFP,onOpenContracting,onMovePhase}) {
  const [activeTab,setActiveTab]=useState("overview");
  const [pipelineFilter,setPipelineFilter]=useState("All");
  const [projectFilter,setProjectFilter]=useState("All");
  const [selectedItem,setSelectedItem]=useState(null);

  const filteredPipeline=pipelineFilter==="All"?pipeline:pipeline.filter(p=>p.phase===pipelineFilter);
  const filteredProjects=projectFilter==="All"?projects:projects.filter(p=>p.status===projectFilter);
  const kpis=[
    {label:"Total Initiatives (Pipeline)",value:pipeline.length,                                       sub:"Awaiting initiation",  color:B.darkBlue},
    {label:"In Strategy Phase",           value:pipeline.filter(p=>p.phase==="Strategy").length,       sub:"Pending CISO review",  color:B.midBlue},
    {label:"In RFP Phase",                value:pipeline.filter(p=>p.phase==="RFP").length,            sub:"Under procurement",    color:B.lightBlue},
    {label:"In Contracting",              value:pipeline.filter(p=>p.phase==="Contracting").length,    sub:"Vendor negotiation",   color:B.deepBlue},
    {label:"Active Projects",             value:projects.length,                                        sub:"Fully initiated",      color:B.green},
    {label:"Projects At Risk / Delayed",  value:projects.filter(p=>p.status!=="On Track").length,      sub:"Require attention",    color:B.red},
  ];

  return(
    <div style={{fontFamily:"'Segoe UI','Trebuchet MS',system-ui,sans-serif",background:B.pageBg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <Header subtitle="CISO Portfolio Overview" right={<div style={{color:B.headerText,fontSize:11}}>Data as of {today}</div>}/>
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
        {[{id:"overview",label:"Portfolio Overview"},{id:"pipeline",label:"Initiative Pipeline"},{id:"projects",label:"Active Projects"},{id:"risks",label:"Risks & Issues"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"12px 20px",background:activeTab===t.id?B.darkBlue:"transparent",color:activeTab===t.id?"#FFFFFF":B.textMuted,border:"none",fontSize:12,fontWeight:activeTab===t.id?700:500,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",borderRadius:activeTab===t.id?"4px 4px 0 0":0,marginBottom:activeTab===t.id?-1:0}}>{t.label}</button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:8,padding:"8px 0"}}>
          <button onClick={onNewInitiative} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"7px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Initiative</button>
        </div>
      </div>
      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>Full portfolio visibility — from strategic initiative to active project completion.</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 28px 48px"}}>
        <div style={{maxWidth:1280,margin:"0 auto"}}>

          {activeTab==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:24}}>
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
                  <div style={{fontSize:11,fontWeight:700,color:B.deepBlue,letterSpacing:"0.08em",textTransform:"uppercase"}}>Initiative Pipeline — Phase Distribution</div>
                  <div style={{flex:1,height:1,background:B.lineColor}}/>
                </div>
                <div style={{display:"flex",gap:12,alignItems:"stretch"}}>
                  {["Strategy","RFP","Contracting"].map((phase,pi)=>{
                    const items=pipeline.filter(p=>p.phase===phase);
                    return(
                      <div key={phase} style={{flex:1,position:"relative"}}>
                        <div style={{background:phaseBg(phase),border:`1px solid ${phaseColor(phase)}40`,borderRadius:6,padding:"14px 16px",height:"100%",boxSizing:"border-box"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                            <Badge color={phaseColor(phase)} bg={phaseBg(phase)}>{phase.toUpperCase()}</Badge>
                            <div style={{fontSize:22,fontWeight:800,color:phaseColor(phase)}}>{items.length}</div>
                          </div>
                          {items.map(item=>(
                            <div key={item.id} onClick={()=>setSelectedItem(item)} style={{background:"#FFFFFF",border:`1px solid ${B.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,85,135,0.06)"}}>
                              <div style={{fontSize:12,fontWeight:700,color:B.textDark,marginBottom:3}}>{item.name}</div>
                              <div style={{fontSize:11,color:B.textMuted,marginBottom:6}}>{item.domain}</div>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                <span style={{fontSize:11,color:B.textMuted}}>{item.owner.split(" ")[0]}</span>
                                <div style={{fontSize:11,fontWeight:700,color:scoreColor(item.score)}}>Score: {item.score}</div>
                              </div>
                            </div>
                          ))}
                          {items.length===0&&<div style={{fontSize:12,color:B.textMuted,fontStyle:"italic",textAlign:"center",padding:"12px 0"}}>No initiatives</div>}
                        </div>
                        {pi<2&&<div style={{position:"absolute",right:-14,top:"50%",transform:"translateY(-50%)",color:B.lightBlue,fontSize:22,zIndex:1}}>›</div>}
                      </div>
                    );
                  })}
                  <div style={{flex:1}}>
                    <div style={{background:B.greenLight,border:`1px solid ${B.green}40`,borderRadius:6,padding:"14px 16px",height:"100%",boxSizing:"border-box"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                        <Badge color={B.green} bg={B.greenLight}>ACTIVE PROJECTS</Badge>
                        <div style={{fontSize:22,fontWeight:800,color:B.green}}>{projects.length}</div>
                      </div>
                      {projects.map(p=>(
                        <div key={p.id} style={{background:"#FFFFFF",border:`1px solid ${B.border}`,borderRadius:5,padding:"10px 12px",marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                            <div style={{fontSize:12,fontWeight:700,color:B.textDark,flex:1,marginRight:8}}>{p.name}</div>
                            <Badge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</Badge>
                          </div>
                          <ProgressBar pct={p.progress} color={statusColor(p.status)}/>
                          <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>{p.progress}% complete</div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                    {projects.filter(p=>p.status!=="On Track").map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:statusBg(p.status),border:`1px solid ${statusColor(p.status)}30`,borderRadius:5,marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:700,color:B.textDark}}>{p.name}</div>
                          <div style={{fontSize:11,color:B.textMuted}}>{p.risks} risk{p.risks!==1?"s":""} · {p.issues} issue{p.issues!==1?"s":""} · {p.progress}% complete</div>
                        </div>
                        <Badge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</Badge>
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
                {["All","Strategy","RFP","Contracting"].map(f=>(
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
                        <td style={{padding:"12px 14px"}}><Badge color={phaseColor(item.phase)} bg={phaseBg(item.phase)}>{item.phase.toUpperCase()}</Badge></td>
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
                            {item.phase==="Strategy"&&<button onClick={()=>onOpenRFP(item)} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Open RFP →</button>}
                            {item.phase==="RFP"&&<button onClick={()=>onOpenContracting(item)} style={{background:B.deepBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Open Contracting →</button>}
                            {item.phase==="Contracting"&&<button onClick={()=>onMovePhase(item)} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{nextLabel[item.phase]}</button>}
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
                {["All","On Track","At Risk","Delayed"].map(f=>(
                  <button key={f} onClick={()=>setProjectFilter(f)} style={{padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:projectFilter===f?B.darkBlue:B.cardBg,color:projectFilter===f?"#FFFFFF":B.textMid,border:`1px solid ${projectFilter===f?B.darkBlue:B.border}`,fontWeight:projectFilter===f?700:400}}>
                    {f}{f!=="All"&&` (${projects.filter(p=>p.status===f).length})`}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {filteredProjects.map(p=>(
                  <div key={p.id} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderLeft:`4px solid ${statusColor(p.status)}`,borderRadius:6,padding:"18px 22px"}}>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr auto",gap:16,alignItems:"center"}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><div style={{fontSize:13,fontWeight:700,color:B.textDark}}>{p.name}</div><Badge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</Badge></div>
                        <div style={{fontSize:11,color:B.textMuted,marginBottom:8}}>{p.domain} · PM: {p.pm}</div>
                        <ProgressBar pct={p.progress} color={statusColor(p.status)}/>
                        <div style={{fontSize:11,color:B.textMuted,marginTop:4}}>{p.progress}% complete</div>
                      </div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Current Milestone</div><div style={{fontSize:12,fontWeight:600,color:B.textDark,marginBottom:4}}>{p.milestone}</div><Badge color={statusColor(p.milestoneStatus)} bg={statusBg(p.milestoneStatus)}>{p.milestoneStatus.toUpperCase()}</Badge></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Due Date</div><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{p.dueDate}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Budget</div><div style={{fontSize:13,fontWeight:700,color:B.darkBlue}}>{p.budget}</div><div style={{fontSize:11,color:B.textMuted}}>Spent: {p.spent}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Risks</div><div style={{fontSize:20,fontWeight:800,color:p.risks>0?B.red:B.green}}>{p.risks}</div></div>
                      <div><div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Issues</div><div style={{fontSize:20,fontWeight:800,color:p.issues>0?B.amber:B.green}}>{p.issues}</div></div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        <button style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>View Project</button>
                        <button style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,borderRadius:3,padding:"6px 14px",fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Weekly Update</button>
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
                {[{label:"Open Risks",value:projects.reduce((a,p)=>a+p.risks,0),color:B.red,bg:B.redLight},{label:"Open Issues",value:projects.reduce((a,p)=>a+p.issues,0),color:B.amber,bg:B.amberLight},{label:"Projects Affected",value:projects.filter(p=>p.risks>0||p.issues>0).length,color:B.darkBlue,bg:B.activeBg}].map((k,i)=>(
                  <div key={i} style={{background:k.bg,border:`1px solid ${k.color}30`,borderRadius:6,padding:"18px 20px",borderTop:`3px solid ${k.color}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
                    <div style={{fontSize:40,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:B.deepBlue}}>{["Project","Domain","PM","Risks","Issues","Status","Progress","Action"].map(h=><th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:"#FFFFFF",letterSpacing:"0.07em",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
                  <tbody>{projects.filter(p=>p.risks>0||p.issues>0).map((p,i)=>(
                    <tr key={p.id} style={{background:i%2===0?B.cardBg:B.pageBg,borderBottom:`1px solid ${B.borderLight}`}}>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:13,fontWeight:600,color:B.textDark}}>{p.name}</div><div style={{fontSize:11,color:B.textMuted,fontFamily:"monospace"}}>{p.id}</div></td>
                      <td style={{padding:"12px 14px",fontSize:12,color:B.textMid}}>{p.domain}</td>
                      <td style={{padding:"12px 14px",fontSize:12,color:B.textMid,whiteSpace:"nowrap"}}>{p.pm}</td>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:18,fontWeight:800,color:p.risks>0?B.red:B.green}}>{p.risks}</div></td>
                      <td style={{padding:"12px 14px"}}><div style={{fontSize:18,fontWeight:800,color:p.issues>0?B.amber:B.green}}>{p.issues}</div></td>
                      <td style={{padding:"12px 14px"}}><Badge color={statusColor(p.status)} bg={statusBg(p.status)}>{p.status.toUpperCase()}</Badge></td>
                      <td style={{padding:"12px 14px",minWidth:100}}><ProgressBar pct={p.progress} color={statusColor(p.status)}/><div style={{fontSize:11,color:B.textMuted,marginTop:3}}>{p.progress}%</div></td>
                      <td style={{padding:"12px 14px"}}><button style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:3,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Risks</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {selectedItem&&(
        <div style={{position:"fixed",top:0,right:0,bottom:0,width:400,background:B.cardBg,boxShadow:"-4px 0 24px rgba(0,85,135,0.15)",zIndex:100,display:"flex",flexDirection:"column"}}>
          <div style={{background:B.deepBlue,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{color:B.headerText,fontSize:10,fontWeight:700,letterSpacing:"0.08em",marginBottom:4}}>{selectedItem.id}</div><div style={{color:"#FFFFFF",fontWeight:700,fontSize:14}}>{selectedItem.name}</div></div>
            <button onClick={()=>setSelectedItem(null)} style={{background:"none",border:"none",color:"#FFFFFF",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
            {[{label:"Domain",value:selectedItem.domain},{label:"Owner",value:selectedItem.owner},{label:"Phase",value:selectedItem.phase},{label:"Priority Score",value:selectedItem.score,color:scoreColor(selectedItem.score||0)},{label:"Status",value:selectedItem.status},{label:"Est. Budget",value:selectedItem.budget},{label:"CISO Pillar",value:selectedItem.pillar||selectedItem.cisoPillar},{label:"Submitted",value:selectedItem.submitted}].map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                <div style={{fontSize:12,color:B.textMuted,fontWeight:600}}>{row.label}</div>
                <div style={{fontSize:12,fontWeight:700,color:row.color||B.textDark}}>{row.value}</div>
              </div>
            ))}
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{onViewInitiative(selectedItem);setSelectedItem(null);}} style={{background:B.darkBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open Full Record →</button>
              {selectedItem.phase==="Strategy"&&<button onClick={()=>{onOpenRFP(selectedItem);setSelectedItem(null);}} style={{background:B.midBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open RFP Page →</button>}
              {selectedItem.phase==="RFP"&&<button onClick={()=>{onOpenContracting(selectedItem);setSelectedItem(null);}} style={{background:B.deepBlue,color:"#FFFFFF",border:"none",borderRadius:4,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Open Contracting Page →</button>}
              {selectedItem.phase==="Contracting"&&<button onClick={()=>{onMovePhase(selectedItem);setSelectedItem(null);}} style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,color:B.darkBlue,borderRadius:4,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{nextLabel[selectedItem.phase]}</button>}
              <button style={{background:B.greenLight,border:`1px solid ${B.green}30`,color:B.green,borderRadius:4,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓ Approve Initiative</button>
              <button style={{background:B.redLight,border:`1px solid ${B.red}30`,color:B.red,borderRadius:4,padding:"10px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Return for Revision</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Gantt chart for Contracting milestones
function GanttChart({milestones}) {
  const parsed = useMemo(()=>milestones.filter(m=>m.startDate&&m.endDate).map(m=>({
    ...m,
    start: new Date(m.startDate),
    end:   new Date(m.endDate),
  })).filter(m=>!isNaN(m.start)&&!isNaN(m.end)&&m.end>=m.start),[milestones]);

  if(parsed.length===0) return(
    <div style={{background:B.pageBg,border:`1px dashed ${B.border}`,borderRadius:6,padding:"28px",textAlign:"center",fontSize:12,color:B.textMuted}}>
      Enter start and end dates for milestones above to generate the Gantt chart.
    </div>
  );

  const minDate = new Date(Math.min(...parsed.map(m=>m.start)));
  const maxDate = new Date(Math.max(...parsed.map(m=>m.end)));
  const totalDays = Math.max((maxDate-minDate)/(1000*60*60*24),1);
  const msColors = [B.darkBlue,B.midBlue,B.lightBlue,"#0091C7","#0058A0","#004578"];

  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:600}}>
        <div style={{position:"relative",paddingTop:18}}>
          {parsed.map((m,i)=>{
            const leftPct  = ((m.start-minDate)/(totalDays*86400000))*100;
            const widthPct = Math.max(((m.end-m.start)/(totalDays*86400000))*100,1);
            const color    = msColors[i%msColors.length];
            const sc       = statusColor(m.status||"Not Started");
            return(
              <div key={i} style={{display:"flex",alignItems:"center",marginBottom:8,height:32}}>
                <div style={{width:180,flexShrink:0,paddingRight:12,overflow:"hidden"}}>
                  <div style={{fontSize:11,fontWeight:600,color:B.textDark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name||`Milestone ${i+1}`}</div>
                  <Badge color={sc} bg={statusBg(m.status||"Not Started")}>{m.status||"Not Started"}</Badge>
                </div>
                <div style={{flex:1,height:32,background:B.pageBg,border:`1px solid ${B.borderLight}`,borderRadius:4,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:`${leftPct}%`,width:`${widthPct}%`,top:4,bottom:4,background:color,borderRadius:3,display:"flex",alignItems:"center",paddingLeft:8,overflow:"hidden",minWidth:8}}>
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

// Helper for Contracting: empty contract template
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
  deliverables:[{ id:"D-001", name:"", description:"", type:"", milestone:"", dueDate:"", responsibleParty:"", qaReviewer:"", approver:"", status:"Not Started" }],
  milestones:(rfp?.milestones||strategy?.milestones||[]).map((m)=>({ ...m, startDate: m.date||"", endDate:"", weight:"", linkedDeliverables:"", status:"Not Started" })),
  pm:"", pmEmail:"", escalationContact:"",
  team:[{name:"",role:"",organisation:"",allocation:""}],
  risks:[{ id:"R-001", category:"", description:"", likelihood:"", impact:"", overrideRating:"", overrideComment:"", mitigation:"", owner:"", status:"Open" }],
  dependencies:(strategy?.depRisks||[]).map(d=>({ initiative:d.initiative||"", nature:d.dependency||"", riskIfDelayed:d.risk||"", severity:d.severity||"", owner:"", linkedStatus:"" })),
  note:"",
});

// Page: Contracting
function PageContracting({strategy,rfp,onBack,onActivate}) {
  const [section,setSection]   = useState(0);
  const [form,setForm]         = useState(EMPTY_CONTRACT(rfp,strategy));
  const [activated,setActivated] = useState(false);

  const set  = (k,v)        => setForm(f=>({...f,[k]:v}));
  const setA = (k,i,f2,v)   => setForm(f=>{const a=[...f[k]];a[i]={...a[i],[f2]:v};return{...f,[k]:a};});
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
      <Header subtitle={`Contracting & Award — ${strategy?.name||""}`}
        right={<Badge color={B.midBlue} bg={B.midBlue+"30"}>CONTRACTING PHASE</Badge>}
      />
      <div style={{background:"#FFFFFF",borderBottom:`1px solid ${B.border}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:B.textMid,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>← Back to Portfolio</button>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:B.textMuted}}>Priority Score: <span style={{fontWeight:800,color:scoreColor(strategy?.score||0)}}>{strategy?.score||"—"}</span></div>
          <div style={{width:1,height:20,background:B.border}}/>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"6px 16px",borderRadius:4,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Discard Changes</button>
          <button onClick={()=>setSection(8)} style={{background:"none",border:`1px solid ${B.darkBlue}`,color:B.darkBlue,padding:"6px 16px",borderRadius:4,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Save Draft</button>
          <button onClick={()=>{setActivated(true);onActivate&&onActivate({...strategy,...form,phase:"Active Project",status:"Active"});}} style={{background:B.green,border:"none",color:"#FFFFFF",padding:"6px 20px",borderRadius:4,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Activate Project →</button>
        </div>
      </div>
      <div style={{background:"#FFFFFF",padding:"7px 28px",borderBottom:`1px solid ${B.borderLight}`}}>
        <span style={{fontSize:12,color:B.textMuted}}>Finalise all project details following contract award. Once submitted and approved by the CISO, the project moves into active execution.</span>
      </div>

      <SectionTimeline sections={CONTRACT_SECTIONS} section={section} setSection={setSection}/>

      <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>

          {section===0&&(
            <div>
              <div style={{background:B.deepBlue,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:B.headerText,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>Carried Forward — Strategy & RFP Phase (Read Only)</div>
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
                      <div style={{fontSize:10,fontWeight:700,color:B.headerText,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>{f.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:f.color||"#FFFFFF"}}>{f.value||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,borderRadius:5,padding:"14px 16px",display:"flex",gap:12}}>
                <div style={{fontSize:18,color:B.darkBlue,flexShrink:0}}>→</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:B.deepBlue,marginBottom:4}}>Contracting Stage Instructions</div>
                  <div style={{fontSize:12,color:B.textMid,lineHeight:1.6}}>All content from the Strategy and RFP phases is referenced above. In the sections that follow, enter the confirmed contract details, finalise the vision, scope, milestones, and deliverables in line with the awarded contract, assign the project team, and complete the risk register. Once submitted and approved by the CISO, this project moves into active execution.</div>
                </div>
              </div>
            </div>
          )}

          {section===1&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Contract & Vendor Details"/>
              <div style={{background:B.greenLight,border:`1px solid ${B.green}40`,borderRadius:4,padding:"10px 14px",marginBottom:20,fontSize:12,color:B.green,fontWeight:600}}>
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
              <SLine title="Confirmed Budget"/>
              <G cols={3} gap={16}>
                <div><Lbl req>Contract Value (Confirmed)</Lbl><Inp placeholder="e.g. 1,200,000" value={form.contractValue} onChange={v=>set("contractValue",v)}/><div style={{fontSize:11,color:B.textMuted,marginTop:4}}>USD — confirmed contract figure</div></div>
                <div><Lbl>CAPEX Portion</Lbl><Inp placeholder="e.g. 800,000" value={form.capex} onChange={v=>set("capex",v)}/></div>
                <div><Lbl>OPEX Portion</Lbl><Inp placeholder="e.g. 400,000" value={form.opex} onChange={v=>set("opex",v)}/></div>
              </G>
              {(form.capex||form.opex)&&form.contractValue&&(
                <div style={{marginTop:8,padding:"7px 12px",borderRadius:4,fontSize:12,
                  background:Number(form.capex||0)+Number(form.opex||0)===Number(form.contractValue)?B.greenLight:B.redLight,
                  color:Number(form.capex||0)+Number(form.opex||0)===Number(form.contractValue)?B.green:B.red}}>
                  {Number(form.capex||0)+Number(form.opex||0)===Number(form.contractValue)?"✓ CAPEX + OPEX matches contract value":"⚠ CAPEX + OPEX does not match contract value"}
                </div>
              )}
            </div>
          )}

          {section===2&&(
            <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"24px 28px"}}>
              <SLine title="Final Vision & Strategic Alignment"/>
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>Pre-filled from the RFP phase. Make any final adjustments to align with the awarded contract scope.</div>
              <G cols={2} gap={16}>
                <div><Lbl req>Problem Statement</Lbl><Txt rows={4} placeholder="Final problem statement." value={form.problemStatement} onChange={v=>set("problemStatement",v)}/></div>
                <div><Lbl req>Vision Statement</Lbl><Txt rows={4} placeholder="Final vision statement." value={form.visionStatement} onChange={v=>set("visionStatement",v)}/></div>
              </G>
              <div style={{height:14}}/>
              <div><Lbl req>Expected Business Outcome</Lbl><Inp placeholder="e.g. Reduce privileged access incidents by 80% within 12 months of go-live" value={form.businessOutcome} onChange={v=>set("businessOutcome",v)}/></div>
              <SLine title="Value Realization Commitments"/>
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.textMid}}>
                Define the specific, measurable value this project commits to delivering. This is the CISO's vision translated into concrete, trackable outcomes.
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr><TH w="35%">Value Committed</TH><TH w="35%">Measurement Method</TH><TH>Target Realization Date</TH><TH w="30px"/></tr></thead>
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
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>Pre-filled from RFP. Finalise to match the awarded contract scope exactly.</div>
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
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.darkBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:14,fontSize:12,color:B.textMid}}>
                Register every contractual deliverable. Assign a QA Reviewer (technical review) and an Approver (formal sign-off). Status defaults to <strong>Not Started</strong> and becomes editable in the Execution phase.
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:900}}>
                  <thead><tr><TH w="6%">ID</TH><TH w="14%">Deliverable Name</TH><TH w="18%">Description</TH><TH w="9%">Type</TH><TH w="12%">Linked Milestone</TH><TH w="10%">Due Date</TH><TH w="10%">Responsible Party</TH><TH w="9%">QA Reviewer</TH><TH w="9%">Approver</TH><TH w="30px"/></tr></thead>
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
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>Pre-filled from RFP. Confirm start and end dates for each milestone as per the signed contract. The Gantt chart below updates automatically.</div>
              <div style={{overflowX:"auto",marginBottom:8}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:800}}>
                  <thead><tr><TH w="22%">Milestone Name</TH><TH w="13%">Start Date</TH><TH w="13%">End Date</TH><TH w="8%">Weight %</TH><TH w="22%">Linked Deliverables</TH><TH>Status</TH><TH w="30px"/></tr></thead>
                  <tbody>{form.milestones.map((m,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp placeholder="Milestone name..." value={m.name} onChange={v=>setA("milestones",i,"name",v)}/></TD>
                      <TD><Inp type="date" value={m.startDate} onChange={v=>setA("milestones",i,"startDate",v)}/></TD>
                      <TD><Inp type="date" value={m.endDate} onChange={v=>setA("milestones",i,"endDate",v)}/></TD>
                      <TD><Inp placeholder="e.g. 25" value={m.weight} onChange={v=>setA("milestones",i,"weight",v)}/></TD>
                      <TD><Inp placeholder="D-001, D-002..." value={m.linkedDeliverables} onChange={v=>setA("milestones",i,"linkedDeliverables",v)}/></TD>
                      <TD><Sel small options={MS_STATUSES} value={m.status} onChange={v=>setA("milestones",i,"status",v)} placeholder="Status..."/></TD>
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
                <div><Lbl req>Assigned Project Manager</Lbl><Inp placeholder="Full name or user search..." value={form.pm} onChange={v=>set("pm",v)}/><div style={{fontSize:11,color:B.textMuted,marginTop:4}}>Mandatory — responsible for weekly updates</div></div>
                <div><Lbl req>PM Email / Contact</Lbl><Inp placeholder="e.g. pm@organisation.com" value={form.pmEmail} onChange={v=>set("pmEmail",v)}/></div>
                <div><Lbl>Escalation Contact</Lbl><Inp placeholder="Senior sponsor or domain lead..." value={form.escalationContact} onChange={v=>set("escalationContact",v)}/></div>
              </G>
              <SLine title="Core Project Team"/>
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4}}>
                <thead><tr><TH w="25%">Full Name</TH><TH w="25%">Role</TH><TH w="25%">Organisation</TH><TH>% Allocation</TH><TH w="30px"/></tr></thead>
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
              <div style={{background:B.activeBg,border:`1px solid ${B.lightBlue}`,borderLeft:`4px solid ${B.midBlue}`,borderRadius:4,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.textMid}}>
                Risk Rating is auto-calculated from Likelihood × Impact. You may override the rating with a comment if needed.
              </div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                {["Critical","High","Medium","Low"].map(l=><Badge key={l} color={ratingColor(l)} bg={ratingBg(l)}>{l}</Badge>)}
                <span style={{fontSize:11,color:B.textMuted,alignSelf:"center",marginLeft:4}}>Rating matrix: H×H=Critical · H×M or M×H=High · M×M=Medium · any Low=Low</span>
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
                        {finalRating!=="—"&&(<Badge color={ratingColor(finalRating)} bg={ratingBg(finalRating)}>{r.overrideRating?"OVERRIDE: ":""}{finalRating.toUpperCase()}</Badge>)}
                        <Badge color={statusColor(r.status||"Open")} bg={statusBg(r.status||"Open")}>{(r.status||"Open").toUpperCase()}</Badge>
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
                            <div><Lbl>Override Rating</Lbl><Sel options={["Critical","High","Medium","Low"]} value={r.overrideRating} onChange={v=>setA("risks",i,"overrideRating",v)} placeholder="Override auto-rating..."/></div>
                            {r.overrideRating&&(<div style={{marginTop:8}}><Lbl req>Override Comment</Lbl><Inp placeholder="Reason for overriding the calculated rating..." value={r.overrideComment} onChange={v=>setA("risks",i,"overrideComment",v)}/></div>)}
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
              <div style={{background:B.amberLight,border:`1px solid ${B.amber}40`,borderRadius:4,padding:"10px 14px",marginBottom:18,fontSize:12,color:B.amber}}>Pre-filled from the Strategy phase dependency flags. Extend and update as required now that the project is confirmed.</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",marginBottom:4,minWidth:800}}>
                  <thead><tr><TH w="18%">Linked Initiative</TH><TH w="20%">Nature of Dependency</TH><TH w="20%">Risk if Delayed</TH><TH w="10%">Severity</TH><TH w="14%">Owner</TH><TH>Status of Linked Initiative</TH><TH w="30px"/></tr></thead>
                  <tbody>{form.dependencies.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?B.cardBg:B.pageBg}}>
                      <TD><Inp placeholder="Initiative name..." value={d.initiative} onChange={v=>setA("dependencies",i,"initiative",v)}/></TD>
                      <TD><Inp placeholder="e.g. Shared data pipeline" value={d.nature} onChange={v=>setA("dependencies",i,"nature",v)}/></TD>
                      <TD><Inp placeholder="e.g. Scope gap in Phase 2" value={d.riskIfDelayed} onChange={v=>setA("dependencies",i,"riskIfDelayed",v)}/></TD>
                      <TD><Sel small options={["High","Medium","Low"]} value={d.severity} onChange={v=>setA("dependencies",i,"severity",v)} placeholder="Select..."/></TD>
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
                  <div key={i} style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"14px 16px",borderTop:`3px solid ${item.color||B.border}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:B.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:6}}>{item.label}</div>
                    <div style={{fontSize:typeof item.value==="number"?28:13,fontWeight:700,color:item.color||B.textDark,lineHeight:1.3}}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <SLine title="Activation Readiness Checklist"/>
                {[
                  {label:"Contract details entered",         done:!!(form.vendorName&&form.contractRef&&form.contractValue)},
                  {label:"Vision & value realization defined", done:!!(form.visionStatement&&form.valueRealization[0]?.valueCommitted)},
                  {label:"Deliverables register complete",   done:form.deliverables.length>0&&form.deliverables[0].name!==""},
                  {label:"Milestones confirmed with dates",  done:form.milestones.length>0&&form.milestones[0].startDate!==""},
                  {label:"Project Manager assigned",         done:!!form.pm},
                  {label:"At least one risk identified",     done:form.risks.length>0&&form.risks[0].description!==""},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${B.borderLight}`}}>
                    <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:item.done?B.green:B.pageBg,border:`2px solid ${item.done?B.green:B.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFFFFF",fontSize:12,fontWeight:700}}>{item.done?"✓":""}</div>
                    <div style={{fontSize:13,color:item.done?B.textDark:B.textMuted,fontWeight:item.done?600:400}}>{item.label}</div>
                    {!item.done&&<span style={{fontSize:11,color:B.amber,marginLeft:"auto"}}>Incomplete</span>}
                  </div>
                ))}
              </div>
              <div style={{background:B.cardBg,border:`1px solid ${B.border}`,borderRadius:6,padding:"20px 24px",marginBottom:16}}>
                <SLine title="Submission Note to CISO (optional)"/>
                <Txt rows={3} placeholder="Add any context or notes for the CISO before project activation..." value={form.note} onChange={v=>set("note",v)}/>
              </div>
              {activated?(
                <div style={{background:B.greenLight,border:`2px solid ${B.green}`,borderRadius:6,padding:"20px 24px",textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:8}}>✓</div>
                  <div style={{fontSize:16,fontWeight:700,color:B.green,marginBottom:4}}>Project Activated</div>
                  <div style={{fontSize:13,color:B.textMid}}>This project has moved into the Execution phase. The PM can now submit weekly updates.</div>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"flex-end",gap:12}}>
                  <button onClick={onBack} style={{background:"none",border:`1px solid ${B.border}`,color:B.textMid,padding:"10px 24px",borderRadius:5,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Save & Return to Portfolio</button>
                  <button onClick={()=>{setActivated(true);onActivate&&onActivate({...strategy,...form,phase:"Active Project",status:"Active"});}} style={{background:B.green,border:"none",color:"#FFFFFF",fontWeight:700,fontSize:14,padding:"12px 36px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 16px ${B.green}40`}}>Submit for CISO Approval & Activate Project →</button>
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

// Root App
export default function App() {
  const [page,         setPage]        = useState("landing");
  const [viewing,      setViewing]     = useState(null);
  const [rfpItem,      setRfpItem]     = useState(null);
  const [contractItem, setContractItem]= useState(null);
  const [pipeline,     setPipeline]    = useState(INIT_PIPELINE);
  const [projects,     setProjects]    = useState(INIT_PROJECTS);

  const handleSubmitStrategy = (newItem) => {
    setPipeline(prev => [newItem, ...prev]);
    setPage("landing");
  };

  const handleSaveRFP = (updatedItem) => {
    setPipeline(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
    setPage("landing");
  };

  const handleMoveToRFP = (item) => {
    const updated = { ...item, phase: "RFP" };
    setPipeline(prev => prev.map(p => p.id === item.id ? updated : p));
    setRfpItem(updated);
    setPage("rfp");
  };

  const handleOpenRFP = (item) => {
    setRfpItem(item);
    setPage("rfp");
  };

  const handleOpenContracting = (item) => {
    setContractItem(item);
    setPage("contracting");
  };

  const handleActivateProject = (activatedItem) => {
    setPipeline(prev => prev.filter(p => p.id !== activatedItem.id));
    setProjects(prev => [{
      id:              activatedItem.id,
      name:            activatedItem.name,
      domain:          activatedItem.domain,
      progress:        0,
      status:          "On Track",
      risks:           activatedItem.risks?.filter(r => r.status === "Open").length || 0,
      issues:          0,
      pm:              activatedItem.pm,
      budget:          activatedItem.contractValue ? `$${Number(activatedItem.contractValue).toLocaleString()}` : activatedItem.budget,
      spent:           "$0",
      dueDate:         activatedItem.contractEnd || "TBD",
      milestone:       activatedItem.milestones?.[0]?.name || "Project Kick-off",
      milestoneStatus: "Not Started",
    }, ...prev]);
    setPage("landing");
  };

  const handleMovePhase = (item) => {
    if (item.phase === "RFP") {
      handleOpenContracting(item);
    } else {
      setPipeline(prev => prev.map(p => p.id === item.id ? { ...p, phase: nextPhase[p.phase] } : p));
    }
  };

  if (page === "new")
    return <PageNewInitiative onDiscard={() => setPage("landing")} onSubmit={handleSubmitStrategy}/>;

  if (page === "view")
    return <PageViewInitiative item={viewing} onBack={() => setPage("landing")} onMoveToRFP={handleMoveToRFP}/>;

  if (page === "rfp")
    return <PageRFP strategy={rfpItem} onBack={() => setPage("landing")} onSubmit={handleSaveRFP}/>;

  if (page === "contracting")
    return <PageContracting strategy={contractItem} rfp={contractItem?.rfpData} onBack={() => setPage("landing")} onActivate={handleActivateProject}/>;

  return (
    <PageLanding
      pipeline={pipeline}
      projects={projects}
      onNewInitiative={() => setPage("new")}
      onViewInitiative={(item) => { setViewing(item); setPage("view"); }}
      onOpenRFP={handleOpenRFP}
      onOpenContracting={handleOpenContracting}
      onMovePhase={handleMovePhase}
    />
  );
}
