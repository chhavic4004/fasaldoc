import { useState, useRef, useEffect, useCallback } from "react";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const LANGUAGES = [
  { code:"en", native:"EN" }, { code:"hi", native:"हि" }, { code:"mr", native:"म" },
  { code:"ta", native:"த" }, { code:"te", native:"తె" }, { code:"kn", native:"ಕ" },
  { code:"pa", native:"ਪ" }, { code:"gu", native:"ગ" }, { code:"bn", native:"ব" },
];

const LANG_NAMES = {
  en:"English", hi:"Hindi", mr:"Marathi", ta:"Tamil", te:"Telugu",
  kn:"Kannada", pa:"Punjabi", gu:"Gujarati", bn:"Bengali"
};

function resolveLanguageContext(selectedLangCode, stateProfile) {
  const userSelectedLanguage = selectedLangCode ? (LANG_NAMES[selectedLangCode] || null) : null;
  const stateDefaultLanguage = stateProfile?.dialect || "Hindi";
  const resolvedLanguage = userSelectedLanguage || stateDefaultLanguage;
  return { userSelectedLanguage, stateDefaultLanguage, resolvedLanguage };
}

const STATE_PROFILES = {
  "Maharashtra":    { dialect:"Marathi",    ttsLang:"mr-IN", dominantSoil:"Black Cotton Soil", rainfall:"500–3000mm", tempRange:"24–42°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Monsoon)":m>=10?"Rabi":"Zaid/Summer"; }, commonDiseases:["Early/Late Blight","Bollworm","Yellow Mosaic","Powdery Mildew"], pestAlert:"Fall Armyworm active in Marathwada.", govtSchemes:["Nanaji Deshmukh Krishi Sanjivani","PM-KISAN","PMFBY"], soilAdvice:"Apply Zinc Sulphate 25 kg/ha every 3 seasons.", helpline:"1800-233-4000", agriUniversity:"VNMKV, Parbhani", zones:["Konkan","Marathwada","Vidarbha"], waterSituation:"83% rainfed. Drip push active.", majorCrops:["Sugarcane","Cotton","Soybean","Onion","Grapes"] },
  "Punjab":         { dialect:"Punjabi",    ttsLang:"pa-IN", dominantSoil:"Deep Alluvial Loam", rainfall:"450–900mm", tempRange:"1–45°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=4&&m<=9?"Kharif (Rice/Maize)":"Rabi (Wheat/Mustard)"; }, commonDiseases:["Yellow Rust","Karnal Bunt","Rice Blast","Mealybug"], pestAlert:"Whitefly on Cotton. Rice Hispa Jul–Sep.", govtSchemes:["PRKVY","MSP Procurement","PMFBY"], soilAdvice:"Apply gypsum 5t/ha for sodic soils.", helpline:"1800-180-2117", agriUniversity:"PAU, Ludhiana", zones:["Shivalik","Central Plains","Western Sandy"], waterSituation:"98% irrigated. Groundwater depleting.", majorCrops:["Wheat","Rice (Basmati)","Cotton","Potato"] },
  "Haryana":        { dialect:"Haryanvi",   ttsLang:"hi-IN", dominantSoil:"Sandy Loam Alluvial", rainfall:"300–800mm", tempRange:"2–46°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=4&&m<=9?"Kharif (Paddy/Cotton)":"Rabi (Wheat/Mustard)"; }, commonDiseases:["Loose Smut","Yellow Rust","Pink Bollworm","Downy Mildew"], pestAlert:"Locust risk in western districts.", govtSchemes:["Meri Fasal Mera Byora","PMFBY","PM-KISAN"], soilAdvice:"Saline soils: gypsum + flooding. Add FYM 10t/ha.", helpline:"1800-180-2117", agriUniversity:"CCSHAU, Hisar", zones:["Shivalik","Western Canal","Eastern Canal"], waterSituation:"70% irrigated. Mewat water-scarce.", majorCrops:["Wheat","Rice","Cotton","Bajra","Mustard"] },
  "Uttar Pradesh":  { dialect:"Bhojpuri",   ttsLang:"hi-IN", dominantSoil:"Deep Alluvial (Indo-Gangetic)", rainfall:"600–1000mm", tempRange:"4–45°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Paddy/Maize)":m>=10?"Rabi (Wheat/Potato)":"Zaid (Vegetables)"; }, commonDiseases:["Sugarcane Red Rot","Wheat Rust","Potato Late Blight","Rice Blast"], pestAlert:"Termite in sugarcane sandy soils.", govtSchemes:["ODOP","PM-KISAN","PMFBY"], soilAdvice:"Eastern UP acidic — apply lime. NPK balance needed.", helpline:"1800-180-5566", agriUniversity:"ANDUAT, Ayodhya", zones:["Tarai","Western UP","Bundelkhand"], waterSituation:"Canal + tubewell. Bundelkhand drought-prone.", majorCrops:["Wheat","Sugarcane","Rice","Potato","Mango"] },
  "Gujarat":        { dialect:"Gujarati",   ttsLang:"gu-IN", dominantSoil:"Black Cotton / Sandy Loam", rainfall:"400–1900mm", tempRange:"8–46°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Cotton/Groundnut)":"Rabi (Wheat/Cumin)"; }, commonDiseases:["Cotton Sucking Pests","Tikka Leaf Spot","Semilooper","Leaf Rust"], pestAlert:"Thrips & Whitefly on Cotton.", govtSchemes:["Mukhyamantri Kisan Sahay","PMFBY","PM-KISAN"], soilAdvice:"Groundnut: Gypsum 250kg/ha. Boron critical for cotton.", helpline:"1800-233-0150", agriUniversity:"AAU, Anand", zones:["Saurashtra","Kutch","South Gujarat"], waterSituation:"Narmada canal transforms North Gujarat.", majorCrops:["Cotton","Groundnut","Wheat","Castor","Cumin"] },
  "Karnataka":      { dialect:"Kannada",    ttsLang:"kn-IN", dominantSoil:"Red Loam / Black Cotton (North)", rainfall:"500–3000mm", tempRange:"10–40°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Jowar/Cotton/Ragi)":m>=10?"Rabi (Wheat/Sunflower)":"Summer (Horticulture)"; }, commonDiseases:["Ragi Blast","Bollworm","Coffee Leaf Rust","Areca Koleroga"], pestAlert:"Shoot Borer in Arecanut. Mealy Bug on Grapes.", govtSchemes:["Raitha Siri","Krishi Bhagya","PM-KISAN"], soilAdvice:"Red soils: lime for pH. FYM 5t/ha before Kharif.", helpline:"155321", agriUniversity:"UAS, Dharwad", zones:["Malnad","North Interior","Coastal"], waterSituation:"Krishna/Cauvery irrigation. Drip for horticulture.", majorCrops:["Ragi","Coffee","Cotton","Sugarcane","Areca Nut"] },
  "Tamil Nadu":     { dialect:"Tamil",      ttsLang:"ta-IN", dominantSoil:"Red Loam / Alluvial (Delta)", rainfall:"700–1500mm", tempRange:"18–42°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=9&&m<=12?"Samba (NE Monsoon Paddy)":m>=5&&m<=9?"Kuruvai (SW Monsoon)":"Navarai (Rabi Paddy)"; }, commonDiseases:["Rice Blast","Banana Bunchy Top","Coconut Eriophyid Mite","Top Shoot Borer"], pestAlert:"Coconut Black-Headed Caterpillar coastal TN.", govtSchemes:["Uzhavar Sandhai","TN Agri Gold","PM-KISAN"], soilAdvice:"Laterite: lime + P-fertilizer. Delta: green manure.", helpline:"1800-425-1551", agriUniversity:"TNAU, Coimbatore", zones:["Cauvery Delta","North-West Dry","Nilgiris"], waterSituation:"Cauvery basin. 50% irrigated via tanks.", majorCrops:["Rice","Banana","Coconut","Sugarcane","Tea"] },
  "West Bengal":    { dialect:"Bengali",    ttsLang:"bn-IN", dominantSoil:"Fertile Alluvial / Red Laterite (Rarh)", rainfall:"1200–3000mm", tempRange:"8–40°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=10?"Aman Paddy / Jute":m>=11||m<=1?"Boro Paddy / Rabi Veg":"Summer Paddy / Potato"; }, commonDiseases:["Rice Brown Spot","Jute Stem Rot","Potato Late Blight","Tea Mosquito Bug"], pestAlert:"Brown Plant Hopper in Aman paddy August onwards.", govtSchemes:["Krishak Bandhu","PMFBY","PM-KISAN"], soilAdvice:"Sundarban: salt-tolerant varieties. Rarh: FYM + lime.", helpline:"1800-103-2801", agriUniversity:"BCKV, Mohanpur", zones:["North Bengal Terai","Gangetic Plains","Sundarban"], waterSituation:"Flood + drought coexist. Sundarban salinity rising.", majorCrops:["Rice (3 crops)","Jute","Potato","Tea","Vegetables"] },
  "Andhra Pradesh": { dialect:"Telugu",     ttsLang:"te-IN", dominantSoil:"Alluvial (Delta) / Red Sandy", rainfall:"600–1200mm", tempRange:"12–45°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=10?"Kharif (Paddy/Cotton)":"Rabi (Paddy/Groundnut)"; }, commonDiseases:["Rice Bacterial Blight","Pink Bollworm","Chili Leaf Curl","Tikka"], pestAlert:"Yellow Stem Borer in rice delta.", govtSchemes:["YSR Rythu Bharosa","APNF","PMFBY"], soilAdvice:"Rayalaseema: micro-irrigation + organic carbon boost.", helpline:"1902", agriUniversity:"ANGRAU, Guntur", zones:["Krishna-Godavari Delta","Rayalaseema","North Coastal"], waterSituation:"Polavaram under construction. Rayalaseema drought.", majorCrops:["Rice","Cotton","Chili","Tobacco","Groundnut"] },
  "Telangana":      { dialect:"Telugu",     ttsLang:"te-IN", dominantSoil:"Mixed Red-Black / Black Cotton", rainfall:"700–1100mm", tempRange:"12–46°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=10?"Kharif (Paddy/Cotton/Maize)":"Rabi (Jowar/Chickpea)"; }, commonDiseases:["Cotton Bollworm","Rice Blast","Maize Stem Borer","Turmeric Blotch"], pestAlert:"Pink Bollworm resistance in Bt Cotton.", govtSchemes:["Rythu Bandhu","Rythu Bima","PMFBY"], soilAdvice:"25% more Potash in black soils. Zn+Fe+B for cotton.", helpline:"1800-4250-900", agriUniversity:"PJTSAU, Hyderabad", zones:["Northern","Southern","Eastern Telangana"], waterSituation:"Kaleshwaram Lift Irrigation Scheme transforms state.", majorCrops:["Cotton","Rice","Maize","Turmeric","Chili"] },
  "Rajasthan":      { dialect:"Rajasthani", ttsLang:"hi-IN", dominantSoil:"Sandy to Sandy Loam (Desert)", rainfall:"100–900mm", tempRange:"1–50°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Bajra/Moth/Guar)":m>=10?"Rabi (Wheat/Mustard/Gram)":"Zaid (Irrigation zones only)"; }, commonDiseases:["Mustard Alternaria","Bajra Ergot","Gram Wilt","Cumin Blight"], pestAlert:"Desert Locust risk Bikaner/Barmer/Jaisalmer.", govtSchemes:["PMFBY","Jal Swavlamban","PM-KISAN"], soilAdvice:"Mulching essential. Sulphur 20kg/ha for mustard/cumin.", helpline:"1800-180-6127", agriUniversity:"SKRAU, Bikaner", zones:["Thar Desert","Semi-Arid Eastern","Hadoti"], waterSituation:"IGNP canal crucial for west. Micro-irrigation push.", majorCrops:["Bajra","Wheat","Mustard","Gram","Cumin","Coriander"] },
  "Madhya Pradesh": { dialect:"Malwi Hindi",ttsLang:"hi-IN", dominantSoil:"Black Cotton (Malwa) / Red-Yellow", rainfall:"800–1500mm", tempRange:"4–45°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Soybean/Cotton)":"Rabi (Wheat/Chickpea)"; }, commonDiseases:["Soybean Yellow Mosaic","Wheat Rust","Chickpea Wilt","Bollworm"], pestAlert:"Whitefly vector for Soybean YMV in Malwa belt.", govtSchemes:["Bhavantar Bhugtan Yojana","PMFBY","PM-KISAN"], soilAdvice:"Malwa black soils: P + Micronutrients. Avoid over-tillage.", helpline:"1800-180-1551", agriUniversity:"JNKVV, Jabalpur", zones:["Malwa Plateau","Bundelkhand","Narmada Valley"], waterSituation:"40% irrigated. Bundelkhand drought needs watershed.", majorCrops:["Soybean","Wheat","Chickpea","Cotton","Garlic"] },
  "Bihar":          { dialect:"Bhojpuri",   ttsLang:"hi-IN", dominantSoil:"Fertile Alluvial (Calcareous)", rainfall:"1000–1500mm", tempRange:"6–44°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Kharif (Paddy/Maize)":m>=10?"Rabi (Wheat/Mustard)":"Zaid (Vegetables)"; }, commonDiseases:["Brown Plant Hopper","Yellow Rust","Maize Stem Borer","Late Blight"], pestAlert:"Fall Armyworm in Maize — Kosi belt.", govtSchemes:["Bihar Agriculture Road Map","PMFBY","Rashtriya KVY"], soilAdvice:"Post-flood: FYM + micronutrients. ZnSO4 25kg/ha.", helpline:"1800-180-1551", agriUniversity:"RPCAU, Pusa", zones:["North Bihar Plains","South Bihar","Chotanagpur"], waterSituation:"Flood-prone north vs drought-prone south.", majorCrops:["Rice","Wheat","Maize","Lychee","Potato"] },
  "Kerala":         { dialect:"Malayalam",  ttsLang:"ml-IN", dominantSoil:"Laterite / Alluvial / Sandy Coastal", rainfall:"2000–4000mm", tempRange:"18–36°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=9?"Virippu (SW Monsoon Paddy)":m>=9&&m<=12?"Mundakan (NE Monsoon)":"Puncha (Summer Paddy)"; }, commonDiseases:["Coconut Root Wilt","Rubber Leaf Fall","Tea Blister Blight","Pepper Phytophthora"], pestAlert:"Coconut Rhinoceros Beetle northern Kerala.", govtSchemes:["Karshika Karmasena","Kerala Farmer Welfare Fund","PM-KISAN"], soilAdvice:"Laterite: lime + rock phosphate. Target pH 5.5–6.5.", helpline:"1800-425-3246", agriUniversity:"KAU, Thrissur", zones:["Coastal Lowlands","Midland","Highland"], waterSituation:"Abundant rain but rapid runoff. Flood risk.", majorCrops:["Coconut","Rubber","Tea","Cardamom","Pepper","Banana"] },
  "Odisha":         { dialect:"Odia",       ttsLang:"or-IN", dominantSoil:"Red Loam / Alluvial Coastal / Laterite", rainfall:"1200–1600mm", tempRange:"10–44°C", currentSeason:()=>{ const m=new Date().getMonth(); return m>=5&&m<=10?"Kharif (Paddy/Maize)":"Rabi (Pulses/Oilseeds)"; }, commonDiseases:["Rice Blast","Gall Midge","Turmeric Rhizome Rot","Ginger Soft Rot"], pestAlert:"Gall Midge: plant resistant varieties (Abhaya, Surendra).", govtSchemes:["KALIA Scheme","Odisha Millet Mission","PMFBY"], soilAdvice:"Laterite: lime 2–4t/ha. Zinc + Boron deficient tribal zones.", helpline:"1800-345-6770", agriUniversity:"OUAT, Bhubaneswar", zones:["Coastal Plains","Northern Plateau","Eastern Ghats"], waterSituation:"Mahanadi politics. Coastal well-irrigated, interior rain-fed.", majorCrops:["Rice","Turmeric","Ginger","Tomato","Cashew"] },
};

const CROPS = ["Rice","Wheat","Tomato","Potato","Cotton","Maize","Sugarcane","Onion","Soybean","Groundnut","Chili","Brinjal"];
const SEV_CLR = { Mild:"#00D4CC", Moderate:"#E8A020", Severe:"#FF2D55" };
const STATUS_CLR = { RECOVERED:"#00D4CC", ONGOING:"#E8A020", WORSENED:"#FF2D55", MONITORING:"#A080E0", UNKNOWN:"#6B5530" };

const STORAGE_KEY = "fasaldoc_history_v2";
async function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}
async function saveHistory(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ── JSON CLEANER ──────────────────────────────────────────────
function extractJSON(txt) {
  // Strip markdown code fences if present
  txt = txt.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response.");
  let raw = m[0];
  // Replace literal newlines/tabs inside string values with escaped versions
  raw = raw.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => {
    const fixed = inner
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `"${fixed}"`;
  });
  return JSON.parse(raw);
}

// ── GROQ API HELPER ──────────────────────────────────────────
async function callGemini(prompt, imgB64 = null) {
  const content = [];
  if (imgB64) {
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${imgB64}` } });
  }
  content.push({ type: "text", text: prompt });

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content }],
      temperature: 0.4,
      max_tokens: 2800
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || "";
}

// ── HELPERS ───────────────────────────────────────────────────
function Ticker({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0; const step = value / 60;
    const id = setInterval(() => { v = Math.min(v + step, value); setN(Math.round(v)); if (v >= value) clearInterval(id); }, 16);
    return () => clearInterval(id);
  }, [value]);
  return <>{n}</>;
}
function Panel({ children, accent = "#E8650A", style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ border: `3px solid ${accent}`, background: "#120D02", position: "relative", ...style }}>
      {["tl","tr","bl","br"].map(p => (
        <div key={p} style={{ position:"absolute",width:9,height:9,borderRadius:"50%",background:accent,opacity:0.75,top:p[0]==="t"?-5:"auto",bottom:p[0]==="b"?-5:"auto",left:p[1]==="l"?-5:"auto",right:p[1]==="r"?-5:"auto" }}/>
      ))}
      {children}
    </div>
  );
}
function Strip({ children, bg = "#E8650A", color = "#0F0A00", style = {} }) {
  return <div style={{ display:"inline-block",background:bg,color,padding:"3px 12px",fontFamily:"'Bebas Neue',cursive",fontSize:"0.68rem",letterSpacing:"0.22em",...style }}>{children}</div>;
}
function SevBadge({ severity }) {
  const c = SEV_CLR[severity] || "#E8650A";
  return <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.7rem",letterSpacing:".14em",color:c,border:`2px solid ${c}`,padding:"2px 8px" }}>{severity?.toUpperCase()}</span>;
}
function StatusBadge({ status }) {
  const c = STATUS_CLR[status] || "#6B5530";
  return <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.65rem",letterSpacing:".12em",color:c,border:`2px solid ${c}`,padding:"2px 7px" }}>{status}</span>;
}

// ── HISTORY DETAIL MODAL ──────────────────────────────────────
function HistoryModal({ record, onClose, onUpdate }) {
  const [newNote, setNewNote] = useState("");
  const [status, setStatus] = useState(record.status || "ONGOING");
  const [saving, setSaving] = useState(false);
  const [fuResult, setFuResult] = useState(null);
  const [fuLoading, setFuLoading] = useState(false);
  const imgRef = useRef();

  const saveUpdate = async () => {
    setSaving(true);
    const updated = { ...record, status, notes: [...(record.notes || []), newNote.trim()].filter(Boolean), lastUpdated: new Date().toLocaleDateString("en-IN", { day:"2-digit",month:"short",year:"numeric" }).toUpperCase() };
    await onUpdate(updated);
    setNewNote(""); setSaving(false);
  };

  const runFollowUp = async (imgB64) => {
    setFuLoading(true);
    try {
      const txt = await callGemini(
        `Follow-up photo for crop that had: ${record.disease} (${record.severity}) in ${record.crop}. Original treatment: ${record.treatment?.pesticide||"unknown"}. Is disease recovering, stable, or worsening? Reply ONLY as JSON: {"status":"RECOVERED|MONITORING|ONGOING|WORSENED","assessment":"2 sentences","actionNeeded":"1 sentence"}`,
        imgB64
      );
      try { const r = extractJSON(txt); setFuResult(r); setStatus(r.status); } catch {}
    } catch {}
    setFuLoading(false);
  };

  const handleFuImg = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => runFollowUp(ev.target.result.split(",")[1]);
    r.readAsDataURL(f);
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",background:"#0F0A00",border:"3px solid #E8650A",animation:"slideUp .25s ease" }}>
        <div style={{ background:"#E8650A",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:1 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.1rem",letterSpacing:".1em",color:"#0F0A00",lineHeight:1 }}>🌿 CROP MEDICAL FILE</div>
            <div style={{ fontSize:"0.6rem",color:"rgba(0,0,0,0.65)",letterSpacing:".1em" }}>{record.crop} · {record.state} · {record.date}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(0,0,0,0.2)",border:"none",color:"#0F0A00",fontSize:"1.2rem",cursor:"pointer",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",gap:12 }}>
          <Panel accent={SEV_CLR[record.severity]||"#E8650A"} style={{ padding:"12px 14px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.4rem",color:"#FFF0D0",letterSpacing:".05em",lineHeight:1 }}>{record.disease}</div>
                <div style={{ fontSize:"0.72rem",color:"#6B5530",marginTop:3 }}>{record.crop} · {record.state} · {record.date}</div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end" }}>
                <SevBadge severity={record.severity}/>
                <StatusBadge status={status}/>
              </div>
            </div>
            {record.description && <p style={{ fontSize:"0.8rem",color:"#C8B090",lineHeight:1.7 }}>{record.description}</p>}
          </Panel>

          {record.symptoms?.length > 0 && (
            <div>
              <Strip style={{ marginBottom:8,fontSize:"0.58rem" }}>🔍 SYMPTOMS OBSERVED</Strip>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:4 }}>
                {record.symptoms.map((s, i) => (
                  <span key={i} style={{ background:"rgba(232,101,10,.1)",border:"1px solid rgba(232,101,10,.3)",color:"#E8A870",padding:"3px 9px",fontSize:"0.72rem" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {record.treatment && (
            <Panel accent="#2E2010" style={{ padding:"12px 14px" }}>
              <Strip style={{ marginBottom:10,fontSize:"0.58rem" }}>💊 TREATMENT PRESCRIBED</Strip>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                <div style={{ borderLeft:"3px solid #E8650A",paddingLeft:10 }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",letterSpacing:".12em",color:"#E8650A",marginBottom:3 }}>CHEMICAL</div>
                  <div style={{ fontSize:"0.82rem",fontWeight:700,color:"#FFF0D0",marginBottom:2 }}>{record.treatment.pesticide||"—"}</div>
                  <div style={{ fontSize:"0.7rem",color:"#A08070",lineHeight:1.6 }}>
                    {record.treatment.dosage && <div>Dose: {record.treatment.dosage}</div>}
                    {record.treatment.frequency && <div>Freq: {record.treatment.frequency}</div>}
                  </div>
                </div>
                <div style={{ borderLeft:"3px solid #00D4CC",paddingLeft:10 }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",letterSpacing:".12em",color:"#00D4CC",marginBottom:3 }}>ORGANIC</div>
                  <div style={{ fontSize:"0.72rem",color:"#80C8C4",lineHeight:1.6 }}>{record.treatment.organic||"—"}</div>
                </div>
              </div>
            </Panel>
          )}

          {record.sevenDayPlan?.length > 0 && (
            <Panel accent="#2E2010" style={{ padding:"12px 14px" }}>
              <Strip style={{ marginBottom:10,fontSize:"0.58rem" }}>📅 7-DAY RECOVERY PLAN</Strip>
              {record.sevenDayPlan.map((item, i) => (
                <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",padding:"6px 0",borderBottom:i<record.sevenDayPlan.length-1?"1px solid rgba(232,101,10,.1)":"none" }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.7rem",minWidth:28,textAlign:"center",padding:"2px 3px",background:i===0?"#E8650A":"#1E1408",color:i===0?"#0F0A00":"#6B5530",flexShrink:0 }}>D{item.day}</div>
                  <div style={{ fontSize:"0.75rem",color:"#C8B090",lineHeight:1.6 }}>{item.action}</div>
                </div>
              ))}
            </Panel>
          )}

          <Panel accent="#2E2010" style={{ padding:"12px 14px" }}>
            <Strip style={{ marginBottom:10,fontSize:"0.58rem" }}>📝 FARMER'S NOTES</Strip>
            {record.notes?.length > 0 ? (
              <div style={{ marginBottom:10,display:"flex",flexDirection:"column",gap:6 }}>
                {record.notes.map((note, i) => (
                  <div key={i} style={{ background:"rgba(255,240,208,0.04)",borderLeft:"3px solid #E8A020",padding:"6px 10px",fontSize:"0.75rem",color:"#C8B090",lineHeight:1.65 }}>
                    <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.55rem",color:"#6B5530",marginRight:6 }}>NOTE {i+1}:</span>{note}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:"0.72rem",color:"#3E3020",marginBottom:10,fontStyle:"italic" }}>Koi note nahi diya gaya abhi tak…</div>
            )}
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="Aaj ki observation likhein…"
              style={{ width:"100%",background:"#1A1100",border:"2px solid #2E2010",color:"#FFF0D0",padding:"8px 10px",fontFamily:"'Baloo 2',sans-serif",fontSize:"0.78rem",lineHeight:1.6,resize:"vertical",minHeight:60,outline:"none",marginBottom:8 }}
            />
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <button onClick={saveUpdate} disabled={saving||(!newNote.trim()&&status===record.status)} style={{ background:"#E8650A",color:"#0F0A00",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:"0.85rem",letterSpacing:".1em",padding:"8px 18px",cursor:"pointer",opacity:(saving||(!newNote.trim()&&status===record.status))?0.4:1 }}>
                {saving?"SAVING…":"💾 SAVE UPDATE"}
              </button>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ background:"#1A1100",border:"2px solid #2E2010",color:"#FFF0D0",fontFamily:"'Baloo 2',sans-serif",fontSize:"0.78rem",padding:"6px 8px",outline:"none" }}>
                {["ONGOING","MONITORING","RECOVERED","WORSENED","UNKNOWN"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </Panel>

          <Panel accent="#A080E0" style={{ padding:"12px 14px" }}>
            <Strip bg="#A080E0" color="#0F0A00" style={{ marginBottom:10,fontSize:"0.58rem" }}>📷 FOLLOW-UP SCAN</Strip>
            <p style={{ fontSize:"0.75rem",color:"#C0A0E0",lineHeight:1.65,marginBottom:10 }}>Nayi photo lo — AI batayega treatment ka kya asar hua.</p>
            <input ref={imgRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFuImg} capture="environment"/>
            <button onClick={() => imgRef.current?.click()} disabled={fuLoading} style={{ background:"#A080E0",color:"#0F0A00",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:"0.85rem",letterSpacing:".1em",padding:"8px 18px",cursor:"pointer" }}>
              {fuLoading?"🔄 ANALYZING…":"📸 UPLOAD FOLLOW-UP PHOTO"}
            </button>
            {fuResult && (
              <div style={{ marginTop:10,background:"rgba(160,128,224,0.1)",border:"1px solid rgba(160,128,224,0.3)",padding:"10px 12px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.65rem",letterSpacing:".12em",color:"#A080E0" }}>AI ASSESSMENT</div>
                  <StatusBadge status={fuResult.status}/>
                </div>
                <p style={{ fontSize:"0.78rem",color:"#C0A0E0",lineHeight:1.7,marginBottom:6 }}>{fuResult.assessment}</p>
                <div style={{ borderLeft:"3px solid #A080E0",paddingLeft:8,fontSize:"0.72rem",color:"#E0D0F0" }}>{fuResult.actionNeeded}</div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── LOCATION CARD ─────────────────────────────────────────────
function LocationCard({ profile, state }) {
  const [expanded, setExpanded] = useState(false);
  if (!profile) return null;
  return (
    <Panel accent="#00D4CC" style={{ marginBottom:12 }}>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
          <Strip bg="#00D4CC" color="#0F0A00" style={{ fontSize:"0.6rem" }}>📍 LOCATION INTEL · {state.toUpperCase()}</Strip>
          <button onClick={() => setExpanded(e => !e)} style={{ background:"transparent",border:"1px solid #00D4CC",color:"#00D4CC",fontFamily:"'Bebas Neue',cursive",fontSize:"0.62rem",letterSpacing:".1em",padding:"3px 10px",cursor:"pointer" }}>{expanded?"▲ LESS":"▼ MORE"}</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10 }}>
          {[
            { label:"SEASON",val:profile.currentSeason().split("(")[0].trim(),color:"#E8A020" },
            { label:"SOIL",val:profile.dominantSoil.split("(")[0].trim(),color:"#00D4CC" },
            { label:"RAIN",val:profile.rainfall,color:"#4A90D9" },
          ].map(item => (
            <div key={item.label} style={{ background:"rgba(0,0,0,0.3)",border:`1px solid ${item.color}40`,padding:"6px 7px" }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.52rem",letterSpacing:".15em",color:item.color,marginBottom:2 }}>{item.label}</div>
              <div style={{ fontSize:"0.7rem",fontWeight:700,color:"#FFF0D0",lineHeight:1.2 }}>{item.val}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
          {profile.commonDiseases.slice(0,3).map((d, i) => (
            <span key={i} style={{ background:"rgba(255,45,85,0.1)",border:"1px solid rgba(255,45,85,0.3)",color:"#FF8899",padding:"2px 8px",fontSize:"0.66rem" }}>{d}</span>
          ))}
        </div>
        {expanded && (
          <div style={{ animation:"fadeUp .3s ease",display:"flex",flexDirection:"column",gap:8,marginTop:8 }}>
            <div style={{ borderLeft:"3px solid #FF2D55",paddingLeft:10,fontSize:"0.75rem",color:"#FFAABB" }}><span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",color:"#FF2D55",letterSpacing:".1em" }}>PEST ALERT: </span>{profile.pestAlert}</div>
            <div style={{ borderLeft:"3px solid #4A90D9",paddingLeft:10,fontSize:"0.75rem",color:"#90B8D9" }}><span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",color:"#4A90D9",letterSpacing:".1em" }}>WATER: </span>{profile.waterSituation}</div>
            <div style={{ borderLeft:"3px solid #7B9E4A",paddingLeft:10,fontSize:"0.75rem",color:"#B8D490" }}><span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",color:"#7B9E4A",letterSpacing:".1em" }}>SOIL CARE: </span>{profile.soilAdvice}</div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",color:"#E8A020",letterSpacing:".12em",marginBottom:5 }}>🌾 MAJOR CROPS</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                {profile.majorCrops.map((c, i) => (<span key={i} style={{ background:"rgba(232,160,32,0.1)",border:"1px solid rgba(232,160,32,0.25)",color:"#E8C060",padding:"2px 8px",fontSize:"0.66rem" }}>{c}</span>))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",color:"#00D4CC",letterSpacing:".12em",marginBottom:5 }}>🏛 GOVT SCHEMES</div>
              {profile.govtSchemes.map((s, i) => (<div key={i} style={{ fontSize:"0.7rem",color:"#80C8C4",padding:"2px 0",borderBottom:"1px solid rgba(0,212,204,0.08)" }}>▸ {s}</div>))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
              <div style={{ background:"rgba(232,101,10,0.08)",padding:"7px 8px" }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.52rem",letterSpacing:".1em",color:"#E8650A",marginBottom:3 }}>🎓 UNIVERSITY</div>
                <div style={{ fontSize:"0.66rem",color:"#C8A070",lineHeight:1.5 }}>{profile.agriUniversity}</div>
              </div>
              <div style={{ background:"rgba(0,212,204,0.08)",padding:"7px 8px" }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.52rem",letterSpacing:".1em",color:"#00D4CC",marginBottom:3 }}>📞 HELPLINE</div>
                <div style={{ fontSize:"0.66rem",color:"#80C8C4",lineHeight:1.5 }}>{profile.helpline}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ── LIVE CHATBOT ──────────────────────────────────────────────
function LiveChatBot({ state, crop, lang }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role:"assistant", text:`FasalDoc AI is ready. Ask anything for ${state} farming.` }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const msgsEnd = useRef(null);
  const profile = STATE_PROFILES[state] || { dialect:"Hindi", ttsLang:"hi-IN" };

  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, thinking]);

  const ask = async (userText) => {
    setMessages(p => [...p, { role:"user", text:userText }]);
    setThinking(true);
    try {
      const { userSelectedLanguage, stateDefaultLanguage, resolvedLanguage } = resolveLanguageContext(lang, profile);
      const reply = await callGemini(
        `You are FasalDoc AI — a warm expert krishi sevak.
LANGUAGE CONTROL RULES:
1. If User Selected Language is provided -> use ONLY that language.
2. If User Selected Language is NOT provided -> use State Default Language.
3. Never mix languages.
4. Entire response must be in one language only.
5. Do not include bilingual explanations.
User Selected Language: ${userSelectedLanguage || "NULL"}
State Default Language: ${stateDefaultLanguage}
Resolved Language: ${resolvedLanguage}
State: ${state} | Crop: ${crop} | Season: ${profile.currentSeason?.()} | Soil: ${profile.dominantSoil}
Farmer: "${userText}"
Reply 3-5 sentences. Be warm, hyper-local, practical.`
      );
      setMessages(p => [...p, { role:"assistant", text:reply }]);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(reply);
        u.rate = 0.88;
        const targetLang = profile.ttsLang || "hi-IN";
        const applyVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          const v = voices.find(v => v.lang === targetLang)
            || voices.find(v => v.lang.startsWith(targetLang.split("-")[0]))
            || voices.find(v => v.lang === "en-IN")
            || voices[0] || null;
          u.voice = v; u.lang = v ? v.lang : targetLang;
          u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false);
          u.onerror = () => setSpeaking(false);
          window.speechSynthesis.speak(u);
        };
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) { applyVoice(); }
        else { window.speechSynthesis.onvoiceschanged = () => { applyVoice(); window.speechSynthesis.onvoiceschanged = null; }; }
      }
    } catch (e) { setMessages(p => [...p, { role:"assistant", text:`Error: ${e.message}` }]); }
    setThinking(false);
  };

  const send = () => { if (!input.trim() || thinking) return; ask(input.trim()); setInput(""); };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{ position:"fixed",bottom:72,right:16,zIndex:200,width:58,height:58,borderRadius:"50%",border:"3px solid #E8650A",background:open?"#E8650A":"#0F0A00",color:open?"#0F0A00":"#E8650A",fontSize:"1.5rem",cursor:"pointer",boxShadow:"0 0 20px rgba(232,101,10,0.5)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .25s" }}>
        {open?"✕":"🤖"}
      </button>
      {open && (
        <div style={{ position:"fixed",bottom:140,right:12,zIndex:199,width:Math.min(window.innerWidth-24,380),height:480,display:"flex",flexDirection:"column",border:"3px solid #E8650A",background:"#0F0A00",boxShadow:"0 0 40px rgba(232,101,10,0.35)",animation:"slideUp .25s ease" }}>
          <div style={{ background:"#E8650A",padding:"10px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
            <span style={{ fontSize:"1.1rem" }}>🌾</span>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1rem",letterSpacing:".12em",color:"#0F0A00",lineHeight:1 }}>FASAL MITRA AI</div>
              <div style={{ fontSize:"0.56rem",color:"rgba(0,0,0,0.65)",letterSpacing:".08em" }}>{profile.dialect?.toUpperCase()} · {state.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"82%",padding:"8px 12px",fontSize:"0.8rem",lineHeight:1.7,background:m.role==="user"?"#E8650A":"#1A1100",color:m.role==="user"?"#0F0A00":"#FFF0D0",border:m.role==="user"?"none":"1px solid #2E2010",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",fontWeight:m.role==="user"?600:400 }}>{m.text}</div>
              </div>
            ))}
            {thinking && (
              <div style={{ display:"flex",justifyContent:"flex-start" }}>
                <div style={{ background:"#1A1100",border:"1px solid #2E2010",padding:"10px 16px",borderRadius:"12px 12px 12px 2px",display:"flex",gap:5,alignItems:"center" }}>
                  {[0,1,2].map(j => (<div key={j} style={{ width:7,height:7,borderRadius:"50%",background:"#E8650A",animation:`pulse 1.2s ease ${j*0.2}s infinite` }}/>))}
                </div>
              </div>
            )}
            <div ref={msgsEnd}/>
          </div>
          <div style={{ padding:"8px 10px",borderTop:"2px solid #1E1408",display:"flex",gap:8,flexShrink:0,background:"#120D02" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&send()} placeholder={`${state} ki fasal ke baare mein…`} style={{ flex:1,background:"#1A1100",border:"2px solid #2E2010",color:"#FFF0D0",padding:"8px 10px",fontFamily:"'Baloo 2',sans-serif",fontSize:"0.82rem",outline:"none" }}/>
            <button onClick={send} disabled={!input.trim()||thinking} style={{ background:"#E8650A",color:"#0F0A00",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:"0.9rem",letterSpacing:".1em",padding:"0 14px",cursor:"pointer",opacity:(!input.trim()||thinking)?0.4:1 }}>SEND</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────
function HistoryTab({ records, onUpdate, onDelete }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = records
    .filter(r => filter==="ALL" || r.status===filter)
    .filter(r => !search || r.disease?.toLowerCase().includes(search.toLowerCase()) || r.crop?.toLowerCase().includes(search.toLowerCase()));

  const total = records.length;
  const recovered = records.filter(r => r.status==="RECOVERED").length;
  const ongoing = records.filter(r => r.status==="ONGOING"||r.status==="WORSENED").length;
  const severe = records.filter(r => r.severity==="Severe").length;

  return (
    <div className="fade-up">
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14 }}>
        {[{label:"TOTAL",val:total,color:"#E8650A"},{label:"ONGOING",val:ongoing,color:"#FF2D55"},{label:"RECOVERED",val:recovered,color:"#00D4CC"},{label:"SEVERE",val:severe,color:"#E8A020"}].map(s => (
          <div key={s.label} style={{ background:"#120D02",border:`2px solid ${s.color}40`,padding:"8px 6px",textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.6rem",color:s.color,lineHeight:1 }}>{s.val}</div>
            <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.52rem",letterSpacing:".12em",color:"#6B5530" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Disease ya crop search karein…" style={{ width:"100%",background:"#1A1100",border:"2px solid #2E2010",color:"#FFF0D0",padding:"8px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:"0.82rem",outline:"none",marginBottom:8 }}/>
      <div style={{ display:"flex",gap:5,marginBottom:8,flexWrap:"wrap" }}>
        {["ALL","ONGOING","MONITORING","RECOVERED","WORSENED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background:filter===f?(STATUS_CLR[f]||"#E8650A"):"transparent",border:`1.5px solid ${STATUS_CLR[f]||"#E8650A"}`,color:filter===f?"#0F0A00":(STATUS_CLR[f]||"#E8650A"),fontFamily:"'Bebas Neue',cursive",fontSize:"0.62rem",letterSpacing:".1em",padding:"3px 10px",cursor:"pointer" }}>{f}</button>
        ))}
      </div>
      {filtered.length===0 ? (
        <Panel accent="#2E2010" style={{ padding:"28px 16px",textAlign:"center" }}>
          <div style={{ fontSize:"2.2rem",marginBottom:10 }}>🌱</div>
          <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1rem",color:"#3E3020",letterSpacing:".12em" }}>{records.length===0?"ABHI KOI DIAGNOSIS NAHI HUA":"KOI RECORD MATCH NAHI HUA"}</div>
        </Panel>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {filtered.map((rec, i) => (
            <div key={rec.id} style={{ border:`2px solid ${SEV_CLR[rec.severity]||"#2E2010"}30`,background:"#120D02",cursor:"pointer",animation:`fadeUp .3s ease ${i*.05}s both` }} onClick={() => setSelected(rec)}>
              <div style={{ display:"flex" }}>
                <div style={{ width:5,background:SEV_CLR[rec.severity]||"#2E2010",flexShrink:0 }}/>
                <div style={{ flex:1,padding:"10px 12px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5 }}>
                    <div>
                      <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.05rem",color:"#FFF0D0",letterSpacing:".05em",lineHeight:1 }}>{rec.disease}</div>
                      <div style={{ fontSize:"0.68rem",color:"#6B5530",marginTop:2 }}>{rec.crop} · {rec.state} · {rec.date}</div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end" }}>
                      <SevBadge severity={rec.severity}/>
                      <StatusBadge status={rec.status||"UNKNOWN"}/>
                    </div>
                  </div>
                  {rec.treatment?.pesticide && (
                    <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                      <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.55rem",letterSpacing:".1em",color:"#E8650A" }}>💊 Rx:</span>
                      <span style={{ fontSize:"0.72rem",color:"#C8A070" }}>{rec.treatment.pesticide}</span>
                    </div>
                  )}
                  <div style={{ marginTop:6,fontSize:"0.62rem",color:"#3E3020",letterSpacing:".08em",fontFamily:"'Bebas Neue',cursive" }}>TAP FOR FULL MEDICAL FILE →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {records.length > 0 && (
        <button onClick={() => { if (window.confirm("Saari history delete karein?")) onDelete(); }} style={{ marginTop:14,width:"100%",background:"transparent",border:"2px solid #2E2010",color:"#3E3020",fontFamily:"'Bebas Neue',cursive",fontSize:"0.7rem",letterSpacing:".1em",padding:"9px",cursor:"pointer" }}>
          🗑 CLEAR ALL HISTORY
        </button>
      )}
      {selected && <HistoryModal record={selected} onClose={() => setSelected(null)} onUpdate={async updated => { await onUpdate(updated); setSelected(updated); }}/>}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("diagnose");
  const [lang, setLang] = useState(null);
  const [state, setState] = useState("Maharashtra");
  const [crop, setCrop] = useState("Tomato");
  const [image, setImage] = useState(null);
  const [imgB64, setImgB64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diag, setDiag] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoaded, setHistLoaded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const fileRef = useRef();
  const uttRef = useRef(null); // keep SpeechSynthesisUtterance alive, prevent GC

  const profile = STATE_PROFILES[state];
  const { resolvedLanguage } = resolveLanguageContext(lang, profile);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);
  useEffect(() => { loadHistory().then(h => { setHistory(h); setHistLoaded(true); }); }, []);

  const anim = (i) => ({ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(20px)", transition:`opacity .5s ease ${i*.08}s, transform .5s ease ${i*.08}s` });

  const upload = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImage(ev.target.result); setImgB64(ev.target.result.split(",")[1]); };
    r.readAsDataURL(f);
    setDiag(null); setError(null);
  };

  const diagnose = async () => {
    if (!imgB64) return;
    setLoading(true); setError(null); setDiag(null);
    try {
      const locCtx = profile ? `STATE: ${state} | SOIL: ${profile.dominantSoil} | SEASON: ${profile.currentSeason()} | CLIMATE: ${profile.tempRange} | Rainfall: ${profile.rainfall} | DISEASE PRESSURE: ${profile.commonDiseases.join(", ")} | PEST ALERTS: ${profile.pestAlert} | SOIL ADVICE: ${profile.soilAdvice} | GOVT SCHEMES: ${profile.govtSchemes.join(", ")}` : "";
      const { resolvedLanguage } = resolveLanguageContext(lang, profile);

      const txt = await callGemini(
        `You are an expert plant pathologist and agricultural advisor for India.
RESOLVED OUTPUT LANGUAGE: ${resolvedLanguage}. Write EVERY text field ENTIRELY in ${resolvedLanguage}. No mixing. No English unless ${resolvedLanguage} is English.
Crop: ${crop} | State: ${state} | Season: ${profile?.currentSeason?.() || ""}
${locCtx}

Analyze the crop image and return ONLY valid JSON (no markdown, no backticks, no extra text):
{"crop":"${crop}","disease":"name in ${resolvedLanguage}","confidence":85,"severity":"Mild|Moderate|Severe","description":"2 sentences in ${resolvedLanguage}","symptoms":["symptom1 in ${resolvedLanguage}","symptom2 in ${resolvedLanguage}","symptom3 in ${resolvedLanguage}"],"causes":"1 sentence in ${resolvedLanguage}","chemicalTreatment":{"pesticide":"name","dosage":"amount","method":"in ${resolvedLanguage}","frequency":"in ${resolvedLanguage}"},"organicTreatment":"1 sentence in ${resolvedLanguage} using local ${state} materials","soilCare":"1 sentence in ${resolvedLanguage} for ${state} soil","localRecommendation":"2 sentences in ${resolvedLanguage} about ${state} season and where to buy medicine","govtScheme":"scheme name in ${resolvedLanguage}","sevenDayPlan":[{"day":1,"action":"in ${resolvedLanguage}"},{"day":2,"action":""},{"day":3,"action":""},{"day":4,"action":""},{"day":5,"action":""},{"day":6,"action":""},{"day":7,"action":""}],"warning":"1 sentence in ${resolvedLanguage} about ${state} seasonal risk","voiceScript":"4 warm sentences in ${resolvedLanguage} as a friendly krishi sevak talking to a farmer."}`,
        imgB64
      );

      const result = extractJSON(txt);

      const normalized = {
        crop: result.crop || crop,
        disease: result.disease || "Unknown",
        confidence: Math.max(1, Math.min(100, Number(result.confidence) || 75)),
        severity: ["Mild", "Moderate", "Severe"].includes(result.severity) ? result.severity : "Moderate",
        description: result.description || "",
        symptoms: Array.isArray(result.symptoms) ? result.symptoms.filter(Boolean).slice(0, 5) : [],
        causes: result.causes || "",
        chemicalTreatment: {
          pesticide: result.chemicalTreatment?.pesticide || "",
          dosage: result.chemicalTreatment?.dosage || "",
          method: result.chemicalTreatment?.method || "",
          frequency: result.chemicalTreatment?.frequency || "",
        },
        organicTreatment: result.organicTreatment || "",
        soilCare: result.soilCare || "",
        localRecommendation: result.localRecommendation || "",
        govtScheme: result.govtScheme || "",
        sevenDayPlan: Array.isArray(result.sevenDayPlan) ? result.sevenDayPlan.slice(0, 7) : [],
        warning: result.warning || "",
        voiceScript: result.voiceScript || `${result.disease || "Disease"} detected. ${result.description || ""} ${result.warning || ""}`.trim(),
      };
      setDiag(normalized);

      const newRecord = {
        id: Date.now().toString(),
        rawDate: new Date().toISOString(),
        date: new Date().toLocaleDateString("en-IN", { day:"2-digit",month:"short",year:"numeric" }).toUpperCase(),
        state, crop:normalized.crop, disease:normalized.disease, severity:normalized.severity,
        status:"ONGOING", description:normalized.description, symptoms:normalized.symptoms, causes:normalized.causes,
        treatment:{ pesticide:normalized.chemicalTreatment?.pesticide, dosage:normalized.chemicalTreatment?.dosage, method:normalized.chemicalTreatment?.method, frequency:normalized.chemicalTreatment?.frequency, organic:normalized.organicTreatment, soilCare:normalized.soilCare },
        localRecommendation:normalized.localRecommendation, govtScheme:normalized.govtScheme,
        sevenDayPlan:normalized.sevenDayPlan, warning:normalized.warning, notes:[], lastUpdated:null,
      };
      const updated = [newRecord, ...history];
      setHistory(updated); await saveHistory(updated);
    } catch (err) { setError(`Analysis failed: ${err.message}`); }
    setLoading(false);
  };

  const updateRecord = async (updated) => {
    const newHistory = history.map(r => r.id===updated.id ? updated : r);
    setHistory(newHistory); await saveHistory(newHistory);
  };

  const clearHistory = async () => { setHistory([]); await saveHistory([]); };

  const speak = () => {
    if (!diag || !window.speechSynthesis) return;

    // Toggle off
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      uttRef.current = null;
      return;
    }

    // Build full on-screen diagnosis text to speak
    const parts = [];
    if (diag.disease)                         parts.push(diag.disease + ".");
    if (diag.crop && diag.crop !== diag.disease) parts.push(diag.crop + ".");
    if (diag.description)                     parts.push(diag.description);
    if (diag.symptoms?.length)                parts.push(diag.symptoms.filter(Boolean).join(". ") + ".");
    if (diag.causes)                          parts.push(diag.causes);
    if (diag.localRecommendation)             parts.push(diag.localRecommendation);
    if (diag.govtScheme)                      parts.push(diag.govtScheme + ".");
    if (diag.chemicalTreatment?.pesticide)    parts.push(diag.chemicalTreatment.pesticide + ".");
    if (diag.chemicalTreatment?.dosage)       parts.push(diag.chemicalTreatment.dosage + ".");
    if (diag.chemicalTreatment?.frequency)    parts.push(diag.chemicalTreatment.frequency + ".");
    if (diag.organicTreatment)                parts.push(diag.organicTreatment);
    if (diag.soilCare)                        parts.push(diag.soilCare);
    if (diag.sevenDayPlan?.length)            parts.push(diag.sevenDayPlan.map(d => `Day ${d.day}: ${d.action}`).join(". "));
    if (diag.warning)                         parts.push(diag.warning);
    const txt = parts.filter(Boolean).join(" ").trim();
    if (!txt) return;

    // Show feedback immediately on click
    setSpeaking(true);

    const targetLang = profile?.ttsLang || "hi-IN";
    const voices = window.speechSynthesis.getVoices();
    const exact  = voices.find(v => v.lang === targetLang);
    const prefix = voices.find(v => v.lang.startsWith(targetLang.split("-")[0]));
    const indian = voices.find(v => v.lang === "en-IN");
    const chosen = exact || prefix || indian || (voices.length ? voices[0] : null);

    const u = new SpeechSynthesisUtterance(txt);
    u.rate = 0.9;
    u.lang = chosen ? chosen.lang : targetLang;
    if (chosen) u.voice = chosen;

    // Heartbeat: Chrome silently pauses long utterances — resume if paused
    let heartbeat = null;
    u.onstart = () => {
      setSpeaking(true);
      heartbeat = setInterval(() => {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 5000);
    };
    u.onend   = () => { setSpeaking(false); clearInterval(heartbeat); uttRef.current = null; };
    u.onerror = (ev) => { setSpeaking(false); clearInterval(heartbeat); uttRef.current = null; console.warn("TTS:", ev.error); };

    // Store ref so utterance isn't garbage-collected before onstart fires
    uttRef.current = u;

    // 100ms gap between cancel() and speak() fixes Chrome's silent-drop race condition
    window.speechSynthesis.cancel();
    setTimeout(() => window.speechSynthesis.speak(u), 100);
  };

  return (
    <div style={{ minHeight:"100vh",fontFamily:"'Baloo 2',sans-serif",color:"#FFF0D0",background:"#0F0A00",overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Baloo+2:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background-color:#0F0A00;background-image:repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(232,101,10,.04) 18px,rgba(232,101,10,.04) 19px);}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#0F0A00;} ::-webkit-scrollbar-thumb{background:#E8650A;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes flicker{0%,100%{opacity:1}45%{opacity:.55}92%{opacity:.8}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp .35s ease both;}
        select,textarea{background:#1A1100;border:2px solid #E8650A;color:#FFF0D0;font-family:'Baloo 2',sans-serif;font-size:.88rem;padding:8px 10px;border-radius:0;outline:none;appearance:none;cursor:pointer;}
        select:focus,textarea:focus{border-color:#00D4CC;} select option{background:#1A1100;}
        .btn-main{width:100%;background:#E8650A;color:#0F0A00;border:none;padding:15px;font-family:'Bebas Neue',cursive;font-size:1.25rem;letter-spacing:.14em;cursor:pointer;transition:background .2s;}
        .btn-main:hover{background:#00D4CC;} .btn-main:disabled{opacity:.35;cursor:not-allowed;background:#E8650A;}
        .btn-ghost{background:transparent;border:2px solid #00D4CC;color:#00D4CC;font-family:'Bebas Neue',cursive;font-size:.75rem;letter-spacing:.15em;padding:5px 14px;cursor:pointer;transition:all .2s;}
        .btn-ghost:hover{background:#00D4CC;color:#0F0A00;}
        .nav-btn{flex:1;background:transparent;border:none;cursor:pointer;padding:11px 0;font-family:'Bebas Neue',cursive;font-size:.72rem;letter-spacing:.1em;color:#6B5530;transition:color .2s;position:relative;}
        .nav-btn.active{color:#FFF0D0;}
        .nav-btn.active::before{content:'';position:absolute;top:0;left:8%;right:8%;height:3px;background:#E8650A;}
      `}</style>

      <div style={{ maxWidth:480,margin:"0 auto",padding:"0 0 88px" }}>

        {/* HEADER */}
        <div style={{ padding:"18px 16px 0",position:"relative",overflow:"hidden",...anim(0) }}>
          <div style={{ position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.6rem",letterSpacing:"0.25em",color:"#6B5530",marginBottom:4 }}>DIGITAL CROP DIAGNOSIS · INDIA</div>
              <div style={{ display:"flex",alignItems:"baseline",lineHeight:0.9 }}>
                <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"3.4rem",color:"#E8650A" }}>FASAL</span>
                <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"3.4rem",color:"#FFF0D0" }}>DOC</span>
              </div>
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4,maxWidth:150,justifyContent:"flex-end",paddingTop:6 }}>
              <button
                type="button"
                onPointerDown={(e) => { e.preventDefault(); setLang(null); }}
                aria-pressed={lang === null}
                style={{ minWidth:36,minHeight:30,background:lang===null?"#00D4CC":"#1A1100",color:lang===null?"#0F0A00":"#6B5530",border:lang===null?"2px solid #00D4CC":"2px solid #2E2010",boxShadow:lang===null?"0 0 0 1px #00D4CC inset":"none",fontFamily:"'Baloo 2',sans-serif",fontSize:"0.68rem",padding:"3px 8px",cursor:"pointer",borderRadius:0,fontWeight:700,transition:"all .15s",touchAction:"manipulation" }}
              >
                AUTO
              </button>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); setLang(l.code); }}
                  aria-pressed={lang===l.code}
                  style={{ minWidth:32,minHeight:30,background:lang===l.code?"#E8650A":"#1A1100",color:lang===l.code?"#0F0A00":"#6B5530",border:lang===l.code?"2px solid #E8650A":"2px solid #2E2010",boxShadow:lang===l.code?"0 0 0 1px #E8650A inset":"none",fontFamily:"'Baloo 2',sans-serif",fontSize:"0.68rem",padding:"3px 8px",cursor:"pointer",borderRadius:0,fontWeight:700,transition:"all .15s",touchAction:"manipulation" }}
                >
                  {l.native}
                </button>
              ))}
              <div style={{ width:"100%",textAlign:"right",fontSize:"0.58rem",letterSpacing:".08em",color:"#6B5530",fontFamily:"'Bebas Neue',cursive" }}>
                LANGUAGE: {resolvedLanguage.toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ height:3,background:"linear-gradient(90deg,#E8650A,#00D4CC,transparent)",marginTop:14,marginLeft:-16,marginRight:-16 }}/>
        </div>

        {/* SELECTS */}
        <div style={{ padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,...anim(2) }}>
          <div>
            <Strip style={{ marginBottom:5,fontSize:"0.58rem" }}>📍 STATE</Strip>
            <select value={state} onChange={e => setState(e.target.value)}>{Object.keys(STATE_PROFILES).map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div>
            <Strip bg="#00D4CC" style={{ marginBottom:5,fontSize:"0.58rem" }}>🌾 CROP</Strip>
            <select value={crop} onChange={e => setCrop(e.target.value)}>{CROPS.map(c => <option key={c}>{c}</option>)}</select>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex",borderTop:"3px solid #1E1408",borderBottom:"3px solid #1E1408",background:"#120D02",...anim(3) }}>
          {[["diagnose","DIAGNOSE"],["history","📋 HISTORY"],["location","📍 MY STATE"],["guide","MANUAL"]].map(([t,lb]) => (
            <button key={t} className={`nav-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>{lb}</button>
          ))}
        </div>

        <div style={{ padding:"14px 16px 0" }}>

          {/* DIAGNOSE */}
          {tab==="diagnose" && (
            <div className="fade-up">
              {!diag && !loading && (
                <>
                  <Panel accent="#E8650A" style={{ marginBottom:10,cursor:"pointer" }} onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={upload} capture="environment"/>
                    {image ? (
                      <div style={{ position:"relative" }}>
                        <img src={image} alt="" style={{ width:"100%",maxHeight:220,objectFit:"cover",display:"block" }}/>
                        <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(15,10,0,.88))",padding:"22px 14px 10px" }}>
                          <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.65rem",letterSpacing:".22em",color:"#00D4CC" }}>TAP TO REPLACE SPECIMEN</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding:"34px 20px",textAlign:"center" }}>
                        <div style={{ fontSize:"2.8rem",marginBottom:12 }}>📷</div>
                        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.5rem",letterSpacing:".1em",color:"#FFF0D0",marginBottom:6 }}>CAPTURE SPECIMEN</div>
                        <div style={{ fontSize:"0.78rem",color:"#6B5530",lineHeight:1.65 }}>Analysis tailored for <span style={{ color:"#E8650A" }}>{state}</span> soil & climate.</div>
                      </div>
                    )}
                  </Panel>
                  {image && <button className="btn-main" onClick={diagnose}>⬡ RUN {state.toUpperCase()} DIAGNOSIS ⬡</button>}
                </>
              )}

              {loading && (
                <Panel accent="#00D4CC" style={{ padding:"36px 0",textAlign:"center" }}>
                  <div style={{ display:"inline-block",width:38,height:38,border:"3px solid rgba(0,212,204,.2)",borderTop:"3px solid #00D4CC",borderRadius:"50%",animation:"spin .85s linear infinite",marginBottom:14 }}/>
                  <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.1rem",letterSpacing:".18em",color:"#00D4CC",animation:"flicker 2.2s infinite" }}>SCANNING WITH GEMINI AI</div>
                </Panel>
              )}

              {error && (
                <Panel accent="#FF2D55" style={{ padding:18 }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1rem",color:"#FF2D55",marginBottom:6 }}>⚠ ANALYSIS ERROR</div>
                  <p style={{ fontSize:"0.81rem",color:"#A08070",lineHeight:1.65,marginBottom:12 }}>{error}</p>
                  <button className="btn-ghost" style={{ borderColor:"#FF2D55",color:"#FF2D55" }} onClick={() => setError(null)}>RETRY</button>
                </Panel>
              )}

              {diag && (
                <div>
                  <Panel accent={SEV_CLR[diag.severity]||"#E8650A"} style={{ marginBottom:10 }}>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 96px" }}>
                      <div style={{ padding:"14px 14px 14px 16px",borderRight:`2px solid ${SEV_CLR[diag.severity]||"#E8650A"}` }}>
                        <Strip bg={SEV_CLR[diag.severity]||"#E8650A"} color="#0F0A00" style={{ marginBottom:10,fontSize:"0.6rem" }}>PATHOLOGY REPORT · {state.toUpperCase()}</Strip>
                        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.75rem",letterSpacing:".05em",color:"#FFF0D0",lineHeight:1.1,marginBottom:5 }}>{diag.disease}</div>
                        <div style={{ fontSize:"0.76rem",color:"#6B5530",marginBottom:10 }}>{diag.crop} · {state}</div>
                        <p style={{ fontSize:"0.81rem",color:"#C8B090",lineHeight:1.72 }}>{diag.description}</p>
                        <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
                          <button className="btn-ghost" onClick={speak} disabled={speaking} style={{ animation:speaking?"pulse 1.4s infinite":"none" }}>
                            {speaking?"🔊 SPEAKING…":"▶ SPEAK"}
                          </button>
                          {speaking && <button className="btn-ghost" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); }} style={{ borderColor:"#FF2D55",color:"#FF2D55" }}>◼ STOP</button>}
                        </div>
                      </div>
                      <div style={{ padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6 }}>
                        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"2.6rem",color:SEV_CLR[diag.severity]||"#E8650A",lineHeight:1,textAlign:"center" }}><Ticker value={diag.confidence}/>%</div>
                        <div style={{ fontSize:"0.58rem",letterSpacing:".12em",color:"#6B5530",textAlign:"center" }}>CONFIDENCE</div>
                        <div style={{ width:"100%",height:3,background:"#1E1408" }}><div style={{ height:"100%",background:SEV_CLR[diag.severity]||"#E8650A",width:`${diag.confidence}%`,transition:"width 1.2s ease .3s" }}/></div>
                        <SevBadge severity={diag.severity}/>
                      </div>
                    </div>
                  </Panel>

                  {diag.localRecommendation && (
                    <Panel accent="#00D4CC" style={{ marginBottom:10,padding:"12px 14px" }}>
                      <Strip bg="#00D4CC" color="#0F0A00" style={{ marginBottom:10,fontSize:"0.6rem" }}>📍 {state.toUpperCase()} LOCAL RECOMMENDATION</Strip>
                      <p style={{ fontSize:"0.82rem",color:"#80C8C4",lineHeight:1.75 }}>{diag.localRecommendation}</p>
                      {diag.govtScheme && <div style={{ marginTop:8,borderLeft:"3px solid #00D4CC",paddingLeft:8,fontSize:"0.75rem",color:"#A0D8D4" }}><span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.6rem",color:"#00D4CC" }}>🏛 SCHEME: </span>{diag.govtScheme}</div>}
                    </Panel>
                  )}

                  <Panel accent="#2E2010" style={{ marginBottom:10,padding:"12px 14px" }}>
                    <Strip style={{ marginBottom:10 }}>TREATMENT PROTOCOL</Strip>
                    <div style={{ borderLeft:"3px solid #E8650A",paddingLeft:12,marginBottom:10 }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.62rem",color:"#E8650A",marginBottom:3 }}>CHEMICAL</div>
                      <div style={{ fontWeight:700,color:"#FFF0D0",marginBottom:3 }}>{diag.chemicalTreatment?.pesticide}</div>
                      <div style={{ fontSize:"0.76rem",color:"#A08070",lineHeight:1.7 }}>Dosage: {diag.chemicalTreatment?.dosage} · {diag.chemicalTreatment?.frequency}</div>
                    </div>
                    <div style={{ borderLeft:"3px solid #00D4CC",paddingLeft:12,marginBottom:10 }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.62rem",color:"#00D4CC",marginBottom:3 }}>ORGANIC ALTERNATIVE</div>
                      <div style={{ fontSize:"0.78rem",color:"#A08070",lineHeight:1.65 }}>{diag.organicTreatment}</div>
                    </div>
                    <div style={{ borderLeft:"3px solid #7B9E4A",paddingLeft:12 }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.62rem",color:"#7B9E4A",marginBottom:3 }}>SOIL CARE</div>
                      <div style={{ fontSize:"0.78rem",color:"#A08070",lineHeight:1.65 }}>{diag.soilCare}</div>
                    </div>
                  </Panel>

                  <Panel accent="#2E2010" style={{ marginBottom:10,padding:"12px 14px" }}>
                    <Strip style={{ marginBottom:10 }}>7-DAY RECOVERY PLAN</Strip>
                    {diag.sevenDayPlan?.map((item, i) => (
                      <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",padding:"6px 0",borderBottom:i<6?"1px solid rgba(232,101,10,.08)":"none" }}>
                        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.7rem",minWidth:28,textAlign:"center",padding:"2px 3px",background:i===0?"#E8650A":"#1E1408",color:i===0?"#0F0A00":"#6B5530",flexShrink:0 }}>D{item.day}</div>
                        <div style={{ fontSize:"0.78rem",color:"#C8B090",lineHeight:1.6 }}>{item.action}</div>
                      </div>
                    ))}
                  </Panel>

                  {diag.warning && <Panel accent="#FF2D55" style={{ marginBottom:10,padding:"12px 14px" }}><Strip bg="#FF2D55" style={{ marginBottom:8,fontSize:"0.6rem" }}>⚠ {state.toUpperCase()} ADVISORY</Strip><p style={{ fontSize:"0.78rem",color:"#FFAABB",lineHeight:1.7 }}>{diag.warning}</p></Panel>}

                  <div style={{ background:"rgba(0,212,204,0.06)",border:"1px solid rgba(0,212,204,0.2)",padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div>
                      <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.58rem",color:"#00D4CC",marginBottom:2 }}>✅ SAVED TO CROP MEDICAL HISTORY</div>
                      <div style={{ fontSize:"0.7rem",color:"#6B5530" }}>Tap "📋 HISTORY" tab to view & add notes</div>
                    </div>
                    <button onClick={() => setTab("history")} style={{ background:"#00D4CC",color:"#0F0A00",border:"none",fontFamily:"'Bebas Neue',cursive",fontSize:"0.68rem",letterSpacing:".1em",padding:"7px 12px",cursor:"pointer",whiteSpace:"nowrap" }}>VIEW →</button>
                  </div>

                  <button className="btn-main" onClick={() => { setDiag(null); setImage(null); setImgB64(null); }}>+ NEW SPECIMEN</button>
                </div>
              )}
            </div>
          )}

          {tab==="history" && (
            histLoaded
              ? <HistoryTab records={history} onUpdate={updateRecord} onDelete={clearHistory}/>
              : <div style={{ textAlign:"center",padding:"40px 0",color:"#6B5530",fontFamily:"'Bebas Neue',cursive",letterSpacing:".15em" }}>LOADING HISTORY…</div>
          )}

          {tab==="location" && (
            <div className="fade-up">
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.1rem",letterSpacing:".15em",color:"#6B5530",marginBottom:12 }}>📍 {state.toUpperCase()} AGRI INTELLIGENCE</div>
              <LocationCard profile={profile} state={state}/>
            </div>
          )}

          {tab==="guide" && (
            <div className="fade-up">
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"1.1rem",letterSpacing:".15em",color:"#6B5530",marginBottom:12 }}>FIELD OPERATIONS MANUAL</div>
              {[
                ["01","CAPTURE & DIAGNOSE","Upload a close-up photo. Gemini AI uses your state's soil, season & climate for hyper-local diagnosis.","#E8650A"],
                ["02","CROP MEDICAL HISTORY","Every diagnosis is auto-saved. Open 📋 HISTORY tab to see full medical file — symptoms, treatment, notes.","#00D4CC"],
                ["03","UPDATE STATUS","In any record, update status: ONGOING → MONITORING → RECOVERED. Add daily farmer notes.","#E8A020"],
                ["04","FOLLOW-UP SCAN","Upload a new photo after treatment. AI assesses whether it's recovering or worsening.","#A080E0"],
                ["05","📍 MY STATE","See your state's soil, disease watch, water situation, govt schemes & university helpline.","#E8650A"],
                ["06","LIVE AI CHATBOT","Tap 🤖 bottom-right. Chat in your dialect for real-time farming advice.","#00D4CC"],
              ].map(([num, title, body, accent], i) => (
                <div key={i} style={{ display:"flex",marginBottom:8,animation:`fadeUp .3s ease ${i*.07}s both` }}>
                  <div style={{ background:accent,color:"#0F0A00",fontFamily:"'Bebas Neue',cursive",fontSize:"1.5rem",padding:"12px 14px",display:"flex",alignItems:"flex-start",justifyContent:"center",flexShrink:0,minWidth:58 }}>{num}</div>
                  <div style={{ border:`2px solid ${accent}`,borderLeft:"none",padding:"12px 14px",flex:1,background:"#120D02" }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:"0.82rem",letterSpacing:".12em",color:"#FFF0D0",marginBottom:5 }}>{title}</div>
                    <p style={{ fontSize:"0.78rem",color:"#6B5530",lineHeight:1.65 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"#0F0A00",borderTop:"3px solid #E8650A",display:"flex",justifyContent:"center" }}>
        <div style={{ maxWidth:480,width:"100%",display:"flex" }}>
          {[["diagnose","DIAGNOSE"],["history","📋 HISTORY"],["location","MY STATE"],["guide","MANUAL"]].map(([t,lb]) => (
            <button key={t} className={`nav-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>{lb}</button>
          ))}
        </div>
      </div>

      <LiveChatBot state={state} crop={crop} lang={lang}/>
    </div>
  );
}
