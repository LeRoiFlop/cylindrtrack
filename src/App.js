import { useState, useMemo } from "react";

const MACHINES_DEF = [
  { id:"F0NN", nom:"Machine F0NN", postes:[
    {id:"applicateur", nom:"Cylindre Applicateur"},
    {id:"calibreur",   nom:"Cylindre Calibreur"},
    {id:"presseur",    nom:"Cylindre Presseur"},
  ]},
  { id:"F00H", nom:"Machine F00H", postes:[
    {id:"presseur", nom:"Cylindre Presseur"},
  ]},
];

const LOCS  = ["Sur Machine","Chez Fournisseur","En Stock","Hors Service"];
const ETATS = ["Neuf","Bon","Usé","Rectification","Rebut"];

const HEXCEL_BLUE = "#2B5CAD";
const HEXCEL_DARK = "#1A3A6E";
const HEXCEL_LIGHT = "#EAF0FB";

const LOC_CFG = {
  "Sur Machine":      {bg:"#EAF0FB",fg:"#1A3A6E",dot:"#2B5CAD",icon:"⚙️"},
  "Chez Fournisseur": {bg:"#FFF8E1",fg:"#6D4C00",dot:"#F9A825",icon:"🏭"},
  "En Stock":         {bg:"#E8F5E9",fg:"#1B5E20",dot:"#2E7D32",icon:"📦"},
  "Hors Service":     {bg:"#FFEBEE",fg:"#7B0000",dot:"#C62828",icon:"🛑"},
};

const mkId = (m,p,n) => `${m}-${p.slice(0,4).toUpperCase()}-${String(n).padStart(3,"0")}`;

const INIT = [
  {id:mkId("F0NN","applicateur",1), nom:"Applicateur A1", machineId:"F0NN", posteId:"applicateur", localisation:"Sur Machine",      fournisseur:"",          cycles:1850, etat:"Bon",          obs:""},
  {id:mkId("F0NN","applicateur",2), nom:"Applicateur A2", machineId:"F0NN", posteId:"applicateur", localisation:"Chez Fournisseur", fournisseur:"RectifPro", cycles:2100, etat:"Rectification", obs:"Usure état surface"},
  {id:mkId("F0NN","applicateur",3), nom:"Applicateur A3", machineId:"F0NN", posteId:"applicateur", localisation:"En Stock",         fournisseur:"",          cycles:0,    etat:"Neuf",          obs:""},
  {id:mkId("F0NN","calibreur",1),   nom:"Calibreur C1",   machineId:"F0NN", posteId:"calibreur",   localisation:"Sur Machine",      fournisseur:"",          cycles:940,  etat:"Bon",           obs:""},
  {id:mkId("F0NN","calibreur",2),   nom:"Calibreur C2",   machineId:"F0NN", posteId:"calibreur",   localisation:"En Stock",         fournisseur:"",          cycles:0,    etat:"Neuf",          obs:""},
  {id:mkId("F0NN","presseur",1),    nom:"Presseur P1",    machineId:"F0NN", posteId:"presseur",    localisation:"Sur Machine",      fournisseur:"",          cycles:3200, etat:"Usé",           obs:"⚠️ Proche seuil"},
  {id:mkId("F0NN","presseur",2),    nom:"Presseur P2",    machineId:"F0NN", posteId:"presseur",    localisation:"Chez Fournisseur", fournisseur:"Surfatec",  cycles:3500, etat:"Rectification", obs:""},
  {id:mkId("F0NN","presseur",3),    nom:"Presseur P3",    machineId:"F0NN", posteId:"presseur",    localisation:"En Stock",         fournisseur:"",          cycles:0,    etat:"Bon",           obs:""},
  {id:mkId("F00H","presseur",1),    nom:"Presseur H1",    machineId:"F00H", posteId:"presseur",    localisation:"Sur Machine",      fournisseur:"",          cycles:780,  etat:"Bon",           obs:""},
  {id:mkId("F00H","presseur",2),    nom:"Presseur H2",    machineId:"F00H", posteId:"presseur",    localisation:"En Stock",         fournisseur:"",          cycles:0,    etat:"Neuf",          obs:""},
];

const INIT_HIST = [
  {date:"2026-01-15", cylindreId:mkId("F0NN","applicateur",2), action:"Chez Fournisseur", fournisseur:"RectifPro", operateur:"Dupont J.", notes:"BL n°2026-045"},
  {date:"2026-01-02", cylindreId:mkId("F0NN","presseur",2),    action:"Chez Fournisseur", fournisseur:"Surfatec",  operateur:"Martin P.", notes:""},
];

const fmt  = s => s ? new Date(s).toLocaleDateString("fr-FR") : "—";
const todayISO = () => new Date().toISOString().slice(0,10);

const inp = {background:"#F8FAFF",border:"1px solid #C5D5EA",borderRadius:8,padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit",color:"#1a1a2e"};
const lbl = {fontSize:11,fontWeight:700,color:HEXCEL_BLUE,marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:.5};

function Badge({loc,small}){
  const c=LOC_CFG[loc]||LOC_CFG["Sur Machine"];
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:c.bg,color:c.fg,border:`1px solid ${c.dot}40`,padding:small?"2px 8px":"4px 11px",borderRadius:20,fontSize:small?11:12,fontWeight:700,whiteSpace:"nowrap"}}>
    <span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>{c.icon} {loc}
  </span>;
}

function Btn({children,onClick,variant="primary",small,disabled,style={}}){
  const V={
    primary:  {background:HEXCEL_BLUE,color:"#fff"},
    secondary:{background:HEXCEL_LIGHT,color:HEXCEL_BLUE},
    danger:   {background:"#FFEBEE",color:"#C62828"},
    ghost:    {background:"#F0F4FA",color:"#555"},
    success:  {background:"#E8F5E9",color:"#1B5E20"},
  };
  return <button onClick={onClick} disabled={disabled} style={{...V[variant],border:"none",borderRadius:9,padding:small?"5px 11px":"9px 16px",fontSize:small?12:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.4:1,transition:"opacity .15s",...style}}>{children}</button>;
}

function Modal({title,onClose,children,width=480}){
  return <div style={{position:"fixed",inset:0,background:"rgba(5,20,50,.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:"#fff",borderRadius:18,padding:26,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontSize:16,fontWeight:900,color:HEXCEL_DARK}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#bbb"}}>✕</button>
      </div>
      {children}
    </div>
  </div>;
}

/* ── Formulaire cylindre ── */
function CylForm({initial, machines, onSave, onClose}){
  const [d,setD]=useState({...initial});
  const machine=machines.find(m=>m.id===d.machineId);
  const f=(k,v)=>setD(p=>({...p,[k]:v}));

  return <Modal title={initial.id?`✏️ Modifier — ${initial.nom||initial.id}`:"➕ Nouveau cylindre"} onClose={onClose}>
    {/* Nom du cylindre — mis en avant */}
    <div style={{background:"#EBF3FF",borderRadius:12,padding:"12px 14px",marginBottom:18,border:"2px solid #BDD7EE"}}>
      <label style={{...lbl,color:HEXCEL_BLUE}}>🏷️ Nom du cylindre</label>
      <input value={d.nom||""} onChange={e=>f("nom",e.target.value)} style={{...inp,fontSize:15,fontWeight:700}} placeholder="Ex : Applicateur A1, Presseur Principal…"/>
      <div style={{fontSize:11,color:"#888",marginTop:5}}>Ce nom apparaîtra partout dans l'application.</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div>
        <label style={lbl}>Machine</label>
        <select value={d.machineId} onChange={e=>f("machineId",e.target.value)} style={inp}>
          {machines.map(m=><option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Sous-ensemble</label>
        <select value={d.posteId} onChange={e=>f("posteId",e.target.value)} style={inp}>
          {(machine?.postes||[]).map(p=><option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Localisation</label>
        <select value={d.localisation} onChange={e=>f("localisation",e.target.value)} style={inp}>
          {LOCS.map(l=><option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>État de surface</label>
        <select value={d.etat} onChange={e=>f("etat",e.target.value)} style={inp}>
          {ETATS.map(e=><option key={e}>{e}</option>)}
        </select>
      </div>
      {/* Fournisseur simplifié : visible seulement si Chez Fournisseur */}
      {d.localisation==="Chez Fournisseur"&&<div style={{gridColumn:"span 2"}}>
        <label style={lbl}>🏭 Chez quel fournisseur ?</label>
        <input value={d.fournisseur||""} onChange={e=>f("fournisseur",e.target.value)} style={inp} placeholder="Nom du fournisseur…"/>
      </div>}
      <div>
        <label style={lbl}>Cycles effectués</label>
        <input type="number" value={d.cycles} onChange={e=>f("cycles",+e.target.value)} style={inp}/>
      </div>
      <div style={{gridColumn:"span 2"}}>
        <label style={lbl}>Observations</label>
        <textarea value={d.obs} onChange={e=>f("obs",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
      </div>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
      <Btn onClick={onClose} variant="ghost">Annuler</Btn>
      <Btn onClick={()=>onSave(d)} disabled={!d.nom?.trim()}>Enregistrer</Btn>
    </div>
  </Modal>;
}

/* ── Modal renommage rapide ── */
function RenameModal({cylindre, onSave, onClose}){
  const [nom,setNom]=useState(cylindre.nom||"");
  return <Modal title="🏷️ Renommer le cylindre" onClose={onClose} width={380}>
    <div style={{marginBottom:8,fontSize:13,color:"#666"}}>Cylindre : <strong>{cylindre.id}</strong></div>
    <label style={lbl}>Nouveau nom</label>
    <input value={nom} onChange={e=>setNom(e.target.value)} style={{...inp,fontSize:15,fontWeight:700}} autoFocus
      onKeyDown={e=>e.key==="Enter"&&nom.trim()&&onSave(nom.trim())}
      placeholder="Ex : Applicateur Principal…"/>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
      <Btn onClick={onClose} variant="ghost">Annuler</Btn>
      <Btn onClick={()=>nom.trim()&&onSave(nom.trim())} disabled={!nom.trim()}>✅ Renommer</Btn>
    </div>
  </Modal>;
}

/* ── Action rapide après scan ── */
function ActionModal({cylindre,machine,poste,onAction,onClose}){
  const [op,setOp]=useState("");
  const [notes,setNotes]=useState("");
  const [fourn,setFourn]=useState(cylindre.fournisseur||"");
  const [sel,setSel]=useState(null);

  const actions=[
    {key:"Sur Machine",     icon:"⚙️",label:"Monter sur machine",  bg:"#E3F2FD",fg:HEXCEL_BLUE},
    {key:"Chez Fournisseur",icon:"🏭",label:"Expédier fournisseur",bg:"#FFF8E1",fg:"#6D4C00"},
    {key:"En Stock",        icon:"📦",label:"Mettre en stock",      bg:"#E8F5E9",fg:"#1B5E20"},
    {key:"Hors Service",    icon:"🛑",label:"Hors service",         bg:"#FFEBEE",fg:"#7B0000"},
  ].filter(a=>a.key!==cylindre.localisation);

  return <Modal title={`🔧 Action — ${cylindre.nom||cylindre.id}`} onClose={onClose} width={440}>
    <div style={{background:"#F5F8FF",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,display:"flex",gap:16,flexWrap:"wrap"}}>
      <div><div style={{color:"#888",fontSize:10}}>MACHINE</div><strong>{machine?.nom}</strong></div>
      <div><div style={{color:"#888",fontSize:10}}>POSTE</div><strong>{poste?.nom}</strong></div>
      <div><div style={{color:"#888",fontSize:10}}>ÉTAT ACTUEL</div><Badge loc={cylindre.localisation} small/></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {actions.map(a=><button key={a.key} onClick={()=>setSel(a.key)} style={{background:sel===a.key?a.fg:a.bg,color:sel===a.key?"#fff":a.fg,border:`2px solid ${sel===a.key?a.fg:a.fg+"40"}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",fontWeight:800,fontSize:13,transition:"all .15s",textAlign:"center"}}>
        <div style={{fontSize:24,marginBottom:4}}>{a.icon}</div>{a.label}
      </button>)}
    </div>
    {sel==="Chez Fournisseur"&&<div style={{marginBottom:12}}>
      <label style={lbl}>🏭 Chez quel fournisseur ?</label>
      <input value={fourn} onChange={e=>setFourn(e.target.value)} style={inp} placeholder="Nom du fournisseur…"/>
    </div>}
    <div style={{marginBottom:10}}><label style={lbl}>Opérateur *</label><input value={op} onChange={e=>setOp(e.target.value)} style={inp} placeholder="Votre nom"/></div>
    <div style={{marginBottom:18}}><label style={lbl}>Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)} style={inp} placeholder="Observations…"/></div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <Btn onClick={onClose} variant="ghost">Annuler</Btn>
      <Btn onClick={()=>onAction({newLoc:sel,operateur:op,notes,fournisseur:fourn})} disabled={!sel||!op.trim()}>✅ Confirmer</Btn>
    </div>
  </Modal>;
}

/* ── QR Modal ── */
function QRModal({cylindre,machine,poste,onClose}){
  const url=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cylindre.id)}&margin=2`;
  return <Modal title="📱 QR Code" onClose={onClose} width={340}>
    <div style={{textAlign:"center"}}>
      <img src={url} width={180} height={180} alt="QR" style={{borderRadius:10,border:"2px solid #DDE8F5",display:"block",margin:"0 auto"}}/>
      <div style={{fontWeight:800,fontSize:15,color:HEXCEL_DARK,marginTop:12}}>{cylindre.nom||cylindre.id}</div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>{cylindre.id}</div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>{machine?.nom} · {poste?.nom}</div>
      <Badge loc={cylindre.localisation}/>
      <div style={{marginTop:14,background:"#F5F8FF",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#555",textAlign:"left"}}>
        📌 Collez ce QR code sur la caisse. Un scan ouvrira directement la fiche du cylindre.
      </div>
    </div>
  </Modal>;
}

/* ── Historique par cylindre (accordéon) ── */
function HistoriqueTab({cyls, hist, gm, gp}){
  const [open, setOpen] = useState({});
  const toggle = id => setOpen(o => ({...o, [id]: !o[id]}));

  // Grouper l'historique par cylindre
  const cylsAvecHist = cyls.filter(c => hist.some(h => h.cylindreId === c.id));
  const cylsSansHist = cyls.filter(c => !hist.some(h => h.cylindreId === c.id));

  const CylAccordion = ({c}) => {
    const m = gm(c.machineId); const p = gp(c.machineId, c.posteId);
    const entries = hist.filter(h => h.cylindreId === c.id);
    const isOpen = open[c.id];
    return <div style={{background:"#fff",borderRadius:12,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.06)",overflow:"hidden"}}>
      {/* En-tête cliquable */}
      <div onClick={()=>toggle(c.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer",background:isOpen?HEXCEL_LIGHT:"#fff",borderBottom:isOpen?`2px solid ${HEXCEL_BLUE}30`:"none",transition:"background .15s"}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:HEXCEL_DARK,fontSize:14}}>{c.nom||<em style={{color:"#aaa"}}>Sans nom</em>}</div>
          <div style={{fontSize:11,color:"#888",marginTop:2}}>{m?.nom} · {p?.nom} · <span style={{color:"#aaa"}}>{c.id}</span></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Badge loc={c.localisation} small/>
          <span style={{background:HEXCEL_BLUE+"18",color:HEXCEL_BLUE,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>{entries.length} mouvement{entries.length>1?"s":""}</span>
          <span style={{color:"#bbb",fontSize:16,fontWeight:700}}>{isOpen?"▾":"▸"}</span>
        </div>
      </div>
      {/* Liste des mouvements */}
      {isOpen&&<div>
        {entries.length===0&&<div style={{padding:"16px",color:"#aaa",fontSize:13,textAlign:"center"}}>Aucun mouvement</div>}
        {entries.map((h,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"11px 16px",background:i%2===0?"#fff":"#F8FAFF",borderBottom:"1px solid #EEF2FA"}}>
          {/* Timeline dot */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:3}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:LOC_CFG[h.action]?.dot||HEXCEL_BLUE,flexShrink:0}}/>
            {i<entries.length-1&&<div style={{width:2,height:"100%",minHeight:20,background:"#E0E8F5",marginTop:3}}/>}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontSize:12,color:"#888",fontWeight:600}}>{fmt(h.date)}</span>
              <Badge loc={h.action} small/>
              {h.fournisseur&&<span style={{fontSize:11,background:"#FFF8E1",color:"#6D4C00",padding:"2px 8px",borderRadius:20,fontWeight:600}}>🏭 {h.fournisseur}</span>}
            </div>
            <div style={{fontSize:12,color:"#555"}}>
              par <strong>{h.operateur}</strong>
              {h.notes&&<span style={{color:"#999",fontStyle:"italic",marginLeft:8}}>· {h.notes}</span>}
            </div>
          </div>
        </div>)}
      </div>}
    </div>;
  };

  return <div>
    <div style={{fontWeight:800,color:HEXCEL_DARK,fontSize:15,marginBottom:14}}>📅 Historique par cylindre</div>
    {cylsAvecHist.length===0&&<div style={{textAlign:"center",padding:40,color:"#aaa",background:"#fff",borderRadius:12}}>Aucun mouvement enregistré</div>}
    {cylsAvecHist.map(c=><CylAccordion key={c.id} c={c}/>)}
    {cylsSansHist.length>0&&<>
      <div style={{fontSize:12,color:"#bbb",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,margin:"16px 0 8px"}}>Cylindres sans historique</div>
      {cylsSansHist.map(c=><CylAccordion key={c.id} c={c}/>)}
    </>}
  </div>;
}

/* ══════════════════════════════════════════
   APP PRINCIPALE
══════════════════════════════════════════ */
export default function App(){
  const [tab,setTab]=useState("dashboard");
  const machines=MACHINES_DEF;
  const [cyls,setCyls]=useState(INIT);
  const [hist,setHist]=useState(INIT_HIST);

  const [scannedCyl,setScannedCyl]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [editCyl,setEditCyl]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [renaming,setRenaming]=useState(null);
  const [showQR,setShowQR]=useState(null);
  const [filterM,setFilterM]=useState("Toutes");
  const [filterL,setFilterL]=useState("Tous");
  const [search,setSearch]=useState("");
  const [expanded,setExpanded]=useState({F0NN:true,F00H:true});

  const gm=id=>machines.find(m=>m.id===id);
  const gp=(mid,pid)=>gm(mid)?.postes.find(p=>p.id===pid);

  const stats=useMemo(()=>({
    machine:cyls.filter(c=>c.localisation==="Sur Machine").length,
    fourn:  cyls.filter(c=>c.localisation==="Chez Fournisseur").length,
    stock:  cyls.filter(c=>c.localisation==="En Stock").length,
    hs:     cyls.filter(c=>c.localisation==="Hors Service").length,
    total:  cyls.length,
  }),[cyls]);

  const filtered=useMemo(()=>cyls.filter(c=>{
    const q=search.toLowerCase();
    const okS=!q||c.id.toLowerCase().includes(q)||(c.nom||"").toLowerCase().includes(q)||gm(c.machineId)?.nom.toLowerCase().includes(q)||gp(c.machineId,c.posteId)?.nom.toLowerCase().includes(q);
    return okS&&(filterM==="Toutes"||c.machineId===filterM)&&(filterL==="Tous"||c.localisation===filterL);
  }),[cyls,search,filterM,filterL]);

  const handleQR=id=>{
    const c=cyls.find(x=>x.id===id);
    setScanning(false);
    if(c) setScannedCyl(c);
    else alert(`Cylindre "${id}" introuvable.`);
  };

  const handleAction=({newLoc,operateur,notes,fournisseur})=>{
    setCyls(cs=>cs.map(c=>c.id!==scannedCyl.id?c:{...c,localisation:newLoc,
      fournisseur:newLoc==="Chez Fournisseur"?fournisseur:(newLoc!=="Chez Fournisseur"?""  :c.fournisseur),
    }));
    setHist(h=>[{date:todayISO(),cylindreId:scannedCyl.id,action:newLoc,fournisseur:newLoc==="Chez Fournisseur"?fournisseur:"",operateur,notes},...h]);
    setScannedCyl(null);
  };

  const saveCyl=data=>{
    if(editCyl){
      setCyls(cs=>cs.map(c=>c.id===editCyl.id?{...data,id:editCyl.id}:c));
    } else {
      const n=cyls.filter(c=>c.machineId===data.machineId&&c.posteId===data.posteId).length+1;
      setCyls(cs=>[...cs,{...data,id:mkId(data.machineId,data.posteId,n)}]);
    }
    setShowForm(false); setEditCyl(null);
  };

  const rename=(id,newNom)=>{
    setCyls(cs=>cs.map(c=>c.id===id?{...c,nom:newNom}:c));
    setRenaming(null);
  };

  const delCyl=id=>{ if(confirm("Supprimer ce cylindre ?")) setCyls(cs=>cs.filter(c=>c.id!==id)); };

  const EMPTY={machineId:machines[0].id,posteId:machines[0].postes[0].id,localisation:"En Stock",etat:"Neuf",fournisseur:"",cycles:0,obs:"",nom:""};

  const TABS=[{k:"dashboard",i:"📊",l:"Bord"},{k:"machines",i:"🏭",l:"Machines"},{k:"scanner",i:"📷",l:"Scanner"},{k:"historique",i:"📅",l:"Historique"}];

  /* ── Ligne cylindre réutilisable ── */
  const CylRow=({c,i,showMachine})=>{
    const m=gm(c.machineId); const p=gp(c.machineId,c.posteId);
    return <div style={{padding:"11px 14px",background:i%2===0?"#fff":"#F8FAFF",borderBottom:"1px solid #EEF2FA",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{minWidth:160}}>
        <div style={{fontWeight:800,color:HEXCEL_DARK,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
          {c.nom||<span style={{color:"#aaa",fontStyle:"italic"}}>Sans nom</span>}
          <button onClick={()=>setRenaming(c)} title="Renommer" style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#aaa",padding:0,lineHeight:1}}>✏️</button>
        </div>
        <div style={{fontSize:11,color:"#aaa"}}>{c.id}{showMachine&&` · ${m?.nom} · ${p?.nom}`}</div>
      </div>
      <Badge loc={c.localisation} small/>
      {c.localisation==="Chez Fournisseur"&&c.fournisseur&&<span style={{fontSize:12,background:"#FFF8E1",color:"#6D4C00",padding:"2px 8px",borderRadius:20,fontWeight:600}}>🏭 {c.fournisseur}</span>}
      <div style={{flex:1}}/>
      <div style={{display:"flex",gap:5}}>
        <Btn small variant="ghost" onClick={()=>setShowQR(c)} style={{fontSize:14,padding:"4px 8px"}}>📱</Btn>
        <Btn small variant="secondary" onClick={()=>{setEditCyl(c);setShowForm(true);}}>✏️ Modifier</Btn>
        <Btn small variant="danger" onClick={()=>delCyl(c.id)}>🗑️</Btn>
      </div>
    </div>;
  };

  return <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#EEF3FA",minHeight:"100vh",display:"flex",flexDirection:"column"}}>

    {/* HEADER */}
    <div style={{background:`linear-gradient(135deg,${HEXCEL_DARK} 0%,${HEXCEL_BLUE} 100%)`,padding:"14px 16px 0",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,.25)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        {/* Logo Hexcel SVG */}
        <svg width="110" height="34" viewBox="0 0 110 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Texte HEXCEL */}
          <text x="0" y="26" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="22" fill="white" letterSpacing="-0.5">HEXCEL</text>
          {/* Hexagones */}
          <polygon points="83,2 89,5.5 89,12.5 83,16 77,12.5 77,5.5" fill="white" opacity="1"/>
          <polygon points="91,10 97,13.5 97,20.5 91,24 85,20.5 85,13.5" fill="white" opacity=".85"/>
          <polygon points="83,18 89,21.5 89,28.5 83,32 77,28.5 77,21.5" fill="white" opacity=".7"/>
        </svg>
        <div style={{flex:1}}>
          <div style={{color:"#A8C4E8",fontSize:11}}>Suivi de parc cylindres · F0NN & F00H</div>
        </div>
      </div>
      <div style={{display:"flex",gap:1}}>
        {TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{background:tab===t.k?"#fff":"transparent",color:tab===t.k?HEXCEL_BLUE:"#A8C4E8",border:"none",borderRadius:"9px 9px 0 0",padding:"7px 12px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
          <span style={{fontSize:15}}>{t.i}</span>{t.l}
        </button>)}
      </div>
    </div>

    <div style={{flex:1,padding:14,maxWidth:900,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>

      {/* ═══ DASHBOARD ═══ */}
      {tab==="dashboard"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[
            {l:"Sur Machine",   v:stats.machine,...LOC_CFG["Sur Machine"]},
            {l:"Chez Fourn.",   v:stats.fourn,  ...LOC_CFG["Chez Fournisseur"]},
            {l:"En Stock",      v:stats.stock,  ...LOC_CFG["En Stock"]},
            {l:"Total",         v:stats.total,  bg:"#F5F7FA",fg:"#333",dot:"#999",icon:"🔢"},
          ].map(s=><div key={s.l} style={{background:s.bg,border:`2px solid ${s.dot}25`,borderRadius:12,padding:"12px 8px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
            <div style={{fontSize:20}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.fg,lineHeight:1.1}}>{s.v}</div>
            <div style={{fontSize:10,color:s.fg+"99",fontWeight:700,marginTop:2}}>{s.l}</div>
          </div>)}
        </div>

        {/* Vue par machine */}
        {machines.map(m=>{
          const mc=cyls.filter(c=>c.machineId===m.id);
          return <div key={m.id} style={{background:"#fff",borderRadius:12,padding:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:800,color:HEXCEL_DARK,marginBottom:12,fontSize:14}}>🏭 {m.nom}</div>
            {m.postes.map(p=>{
              const pc=mc.filter(c=>c.posteId===p.id);
              if(!pc.length) return null;
              return <div key={p.id} style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{p.nom}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {pc.map(c=><div key={c.id} style={{background:LOC_CFG[c.localisation]?.bg,border:`1px solid ${LOC_CFG[c.localisation]?.dot}40`,borderRadius:10,padding:"7px 12px",fontSize:12,cursor:"pointer"}} onClick={()=>setScannedCyl(c)}>
                    <div style={{fontWeight:800,color:HEXCEL_DARK}}>{c.nom||<em style={{color:"#aaa"}}>Sans nom</em>}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                      {LOC_CFG[c.localisation]?.icon} <span style={{color:"#666"}}>{c.localisation}</span>
                      {c.localisation==="Chez Fournisseur"&&c.fournisseur&&<span style={{color:"#F9A825",fontWeight:700}}>· {c.fournisseur}</span>}
                    </div>
                  </div>)}
                </div>
              </div>;
            })}
          </div>;
        })}
        <div style={{fontSize:11,color:"#aaa",textAlign:"center",marginTop:8}}>💡 Cliquez sur un cylindre pour changer son état</div>
      </div>}

      {/* ═══ MACHINES ═══ */}
      {tab==="machines"&&<div>
        <div style={{fontWeight:800,color:HEXCEL_DARK,fontSize:15,marginBottom:14}}>🏭 Machines & sous-ensembles</div>
        {machines.map(m=>{
          const isOpen=expanded[m.id];
          return <div key={m.id} style={{background:"#fff",borderRadius:14,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,.06)",overflow:"hidden"}}>
            <div onClick={()=>setExpanded(e=>({...e,[m.id]:!isOpen}))} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer",background:HEXCEL_DARK}}>
              <span style={{fontSize:18}}>🏭</span>
              <div style={{flex:1}}>
                <div style={{color:"#fff",fontWeight:800,fontSize:14}}>{m.nom}</div>
                <div style={{color:"#90B8E0",fontSize:11}}>{m.postes.length} sous-ensemble{m.postes.length>1?"s":""} · {cyls.filter(c=>c.machineId===m.id).length} cylindres</div>
              </div>
              <span style={{color:"#90B8E0",fontSize:16}}>{isOpen?"▾":"▸"}</span>
            </div>
            {isOpen&&m.postes.map(p=>{
              const pc=cyls.filter(c=>c.machineId===m.id&&c.posteId===p.id);
              return <div key={p.id} style={{borderBottom:"1px solid #EEF2FA"}}>
                <div style={{padding:"9px 16px 5px",background:"#F0F6FF",fontWeight:700,fontSize:12,color:HEXCEL_BLUE,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>⚙️ {p.nom} <span style={{color:"#aaa",fontWeight:400}}>({pc.length})</span></span>
                </div>
                {pc.map((c,i)=><CylRow key={c.id} c={c} i={i} showMachine={false}/>)}
                <div style={{padding:"8px 16px"}}>
                  <Btn small variant="ghost" onClick={()=>{setEditCyl(null);setShowForm(true);}}>+ Ajouter un cylindre</Btn>
                </div>
              </div>;
            })}
          </div>;
        })}
      </div>}



      {/* ═══ SCANNER ═══ */}
      {tab==="scanner"&&<div style={{textAlign:"center",paddingTop:20}}>
        <div style={{fontSize:70,marginBottom:14}}>📷</div>
        <div style={{fontWeight:800,fontSize:19,color:HEXCEL_DARK,marginBottom:8}}>Scanner un cylindre</div>
        <div style={{color:"#666",fontSize:13,maxWidth:300,margin:"0 auto 28px"}}>
          Scannez le QR code sur la caisse → choisissez l'action en un clic.
        </div>
        <Btn onClick={()=>setScanning(true)} style={{fontSize:15,padding:"13px 30px"}}>📷 Ouvrir la caméra</Btn>
        <div style={{marginTop:30,background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.06)",maxWidth:400,margin:"30px auto 0"}}>
          <div style={{fontWeight:700,color:HEXCEL_DARK,marginBottom:10}}>🧪 Tester sans caméra</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {cyls.map(c=><button key={c.id} onClick={()=>handleQR(c.id)} style={{background:"#F0F6FF",border:"1px solid #C5D5EA",borderRadius:8,padding:"8px 12px",cursor:"pointer",textAlign:"left",fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <div>
                <span style={{fontWeight:800,color:HEXCEL_BLUE}}>{c.nom||c.id}</span>
                <span style={{color:"#aaa",fontSize:11,marginLeft:6}}>{c.id}</span>
              </div>
              <Badge loc={c.localisation} small/>
            </button>)}
          </div>
        </div>
      </div>}

      {/* ═══ HISTORIQUE ═══ */}
      {tab==="historique"&&<HistoriqueTab cyls={cyls} hist={hist} gm={gm} gp={gp}/>}
    </div>

    {/* MODALS */}
    {scanning&&<Modal title="📷 Scanner" onClose={()=>setScanning(false)} width={380}>
      <div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:50,marginBottom:12}}>📷</div>
        <div style={{color:"#666",fontSize:13,marginBottom:20}}>La caméra fonctionne sur mobile.<br/>Simulez un scan ci-dessous :</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {cyls.map(c=><button key={c.id} onClick={()=>handleQR(c.id)} style={{background:"#F0F6FF",border:"1px solid #C5D5EA",borderRadius:8,padding:"8px 12px",cursor:"pointer",textAlign:"left",fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,color:HEXCEL_BLUE}}>{c.nom||c.id}</span>
            <Badge loc={c.localisation} small/>
          </button>)}
        </div>
      </div>
    </Modal>}

    {scannedCyl&&<ActionModal cylindre={scannedCyl} machine={gm(scannedCyl.machineId)} poste={gp(scannedCyl.machineId,scannedCyl.posteId)} onAction={handleAction} onClose={()=>setScannedCyl(null)}/>}

    {showForm&&<CylForm initial={editCyl||EMPTY} machines={machines} onSave={saveCyl} onClose={()=>{setShowForm(false);setEditCyl(null);}}/>}

    {renaming&&<RenameModal cylindre={renaming} onSave={(nom)=>rename(renaming.id,nom)} onClose={()=>setRenaming(null)}/>}

    {showQR&&<QRModal cylindre={showQR} machine={gm(showQR.machineId)} poste={gp(showQR.machineId,showQR.posteId)} onClose={()=>setShowQR(null)}/>}
  </div>;
}
