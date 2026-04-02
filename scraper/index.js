const axios = require("axios");
const fs = require("fs");

const OUTPUT_FILE = "stream.m3u";

// ================= SOURCES =================
const SOURCES = {
  HOTSTAR_M3U: "https://voot.vodep39240327.workers.dev?voot.m3u",
  ZEE5_M3U: "https://join-vaathala1-for-more.vodep39240327.workers.dev/zee5.m3u",
  JIO_JSON: "https://raw.githubusercontent.com/sixpg/jio/main/stream.json",
  SONYLIV_JSON: "https://raw.githubusercontent.com/drmlive/sliv-live-events/main/sonyliv.json",
  FANCODE_JSON: "https://fanco.vodep39240327.workers.dev/",
  ICC_TV_JSON: "https://icc.vodep39240327.workers.dev/icctv.jso",

  SPORTS_JSON: [
    "https://sports.vodep39240327.workers.dev/sports111.json",
    "https://gentle-moon-6383.lrl45.workers.dev/stream.json"
  ],

  SONYLIV_M3U: "https://raw.githubusercontent.com/Sflex0719/SonGharLive/refs/heads/main/SL.m3u",
  NEW_M3U: "https://vt-ip.vodep39240327.workers.dev/playlist.m3u8?url=http://jiotv.be/stalker_portal/c&mac=00:1A:79:97:55:B9&deviceId1=B8F453DCDAEE02318C9FA912D9E409EE96B75AE592A70B526AA84478533C0A66&deviceId2=B8F453DCDAEE02318C9FA912D9E409EE96B75AE592A70B526AA84478533C0A66&sn=500482917046B",
};

// ================= HEADER =================
const PLAYLIST_HEADER = `#EXTM3U
#EXTM3U x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz"
#EXTM3U x-tvg-url="https://mitthu786.github.io/tvepg/tataplay/epg.xml.gz"
#EXTM3U x-tvg-url="https://avkb.short.gy/tsepg.xml.gz"
# ===== CosmicSports Playlist =====
`;

const PLAYLIST_FOOTER = `
# =========================================
`;

function section(title) {
  return `\n# ---------------=== ${title} ===-------------------\n`;
}

// ================= LOGO =================
function getLogo(name){
  if(!name) return "https://img.u0k.workers.dev/CosmicSports.webp";
  const n = name.toLowerCase();

  if(n.includes("hindi")) return "https://upload.wikimedia.org/wikipedia/commons/3/3e/Star_Sports_1_Hindi.png";
  if(n.includes("english")) return "https://upload.wikimedia.org/wikipedia/commons/6/6b/Star_Sports_1.png";
  if(n.includes("tamil")) return "https://upload.wikimedia.org/wikipedia/commons/2/2f/Star_Sports_Tamil.png";
  if(n.includes("telugu")) return "https://upload.wikimedia.org/wikipedia/commons/5/5e/Star_Sports_Telugu.png";

  return "https://img.u0k.workers.dev/CosmicSports.webp";
}

// ================= SPORTS =================
function convertSportsJson(json){
 if(!json || !Array.isArray(json.streams)) return "";
 const out=[];
 json.streams.forEach((s,i)=>{
  if(!s.url) return;

  const urlObj=new URL(s.url);
  const drm=urlObj.searchParams.get("drmLicense")||"";
  const[kid,key]=drm.split(":");
  const ua=urlObj.searchParams.get("User-Agent")||"";
  const hdnea=urlObj.searchParams.get("__hdnea__")||"";

  urlObj.searchParams.delete("drmLicense");
  urlObj.searchParams.delete("User-Agent");

  const name = s.language || "IPL Live";
  const logo = getLogo(name);

  out.push(`#EXTINF:-1 tvg-id="${1100+i}" tvg-logo="${logo}" group-title="IPL LIVE",${name}`);
  out.push(`#KODIPROP:inputstream.adaptive.license_type=clearkey`);
  out.push(`#KODIPROP:inputstream.adaptive.license_key=${kid}:${key}`);
  out.push(`#EXTHTTP:${JSON.stringify({Cookie:hdnea?`__hdnea__=${hdnea}`:"","User-Agent":ua})}`);
  out.push(urlObj.toString());
 });
 return out.join("\n");
}

// ================= SAFE FETCH =================
async function safeFetch(url){
 try{
  const res=await axios.get(url,{timeout:60000});
  return res.data;
 }catch{
  return null;
 }
}

// ================= MAIN =================
async function run(){

 const out=[];
 out.push(PLAYLIST_HEADER.trim());

 // ✅ 1. IPL (TOP)
 let sportsCombined = [];
 for(const u of SOURCES.SPORTS_JSON){
  const d = await safeFetch(u);
  if(d && Array.isArray(d.streams)){
    sportsCombined = sportsCombined.concat(d.streams);
  }
 }
 if(sportsCombined.length){
  out.push(section("IPL"), convertSportsJson({streams: sportsCombined}));
 }

 // ✅ 2. Jio Cinema
 const hotstar=await safeFetch(SOURCES.HOTSTAR_M3U);
 if(hotstar) out.push(section("Jio Cinema"),hotstar);

 // ✅ 3. ZEE5
 const zee5=await safeFetch(SOURCES.ZEE5_M3U);
 if(zee5) out.push(section("ZEE5"),zee5);

 // ✅ 4. JIOTV+
 const jio=await safeFetch(SOURCES.JIO_JSON);
 if(jio){
  const outJ=[];
  for(const id in jio){
    const ch=jio[id];
    outJ.push(`#EXTINF:-1 tvg-logo="${ch.tvg_logo}" group-title="JIOTV+",${ch.channel_name}`);
    outJ.push(ch.url);
  }
  out.push(section("JIOTV+"),outJ.join("\n"));
 }

 // ✅ 5. FANCODE
 const fan=await safeFetch(SOURCES.FANCODE_JSON);
 if(fan) out.push(section("FANCODE"),fan);

 // ✅ 6. SONYLIV
 const sony=await safeFetch(SOURCES.SONYLIV_JSON);
 if(sony){
  const list = sony.matches?.filter(m=>m.isLive).map(m=>{
    return `#EXTINF:-1 tvg-logo="${m.src}" group-title="SONYLIV",${m.match_name}\n${m.dai_url||m.pub_url}`;
  }).join("\n");
  if(list) out.push(section("SONYLIV"),list);
 }

 // ✅ 7. SONYLIV DIGITAL
 const digital=await safeFetch(SOURCES.SONYLIV_M3U);
 if(digital){
  const fixed=digital.split("\n").map(l=>{
    if(l.startsWith("#EXTINF")){
      return l.replace(/group-title="[^"]*"/,'group-title="SONYLIV DIGITAL CHANNELS"');
    }
    return l;
  }).join("\n");

  out.push(section("SONYLIV DIGITAL CHANNELS"),fixed);
 }

 out.push(PLAYLIST_FOOTER.trim());

 fs.writeFileSync(OUTPUT_FILE,out.join("\n")+"\n");

 console.log("stream.m3u generated");
}

run();
