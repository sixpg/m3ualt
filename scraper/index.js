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
  SPORTS_JSON: "https://sports.vodep39240327.workers.dev/sports.json",

  LOCAL_JSON: [
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/2",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/3",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/4",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/5",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/6",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/local-tamil-tv/page/7",
  ],

  TELUGU_JSON: [
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/page/2",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/page/3",
    "https://b4u.vodep39240327.workers.dev/1.json?url=https://tulnit.com/channel/telugu-tv/page/4",
  ],
};

// ================= PLAYLIST HEADER =================
const PLAYLIST_HEADER = `#EXTM3U
#EXTM3U x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz"
#EXTM3U x-tvg-url="https://mitthu786.github.io/tvepg/tataplay/epg.xml.gz"
#EXTM3U x-tvg-url="https://avkb.short.gy/tsepg.xml.gz"
# ===== CosmicSports Playlist =====
# Join Telegram: @FrostDrift7
`;

// ================= PLAYLIST FOOTER =================
const PLAYLIST_FOOTER = `
# =========================================
# This m3u link is only for educational purposes
# =========================================
`;

function section(title) {
  return `\n# ---------------=== ${title} ===-------------------\n`;
}

// ================= LOCAL TELUGU JSON =================
function convertLocalTelugu(jsonArray) {
  if (!Array.isArray(jsonArray)) return "";
  const out = [];

  jsonArray.forEach((ch) => {
    if (!ch.stream_url) return;

    const name = ch.title || "Unknown";
    const logo = ch.image || "";

    out.push(
      `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="CS 📺 | Local Channel Telugu",${name}`,
      ch.stream_url
    );
  });

  return out.join("\n");
}

// ================= LOCAL TAMIL JSON =================
function convertLocalTamil(jsonArray) {
  if (!Array.isArray(jsonArray)) return "";
  const out = [];

  jsonArray.forEach((ch) => {
    if (!ch.stream_url) return;

    const name = ch.title || "Unknown";
    const logo = ch.image || "";

    out.push(
      `#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="CS 📺 | Local Channel Tamil",${name}`,
      ch.stream_url
    );
  });

  return out.join("\n");
}

// ================= HOTSTAR =================
function convertHotstar(data) {
  if (typeof data !== "string" || !data.trim().startsWith("#EXTM3U")) {
    let json = data;
    if (!Array.isArray(json) && typeof json === "object") {
      const possibleKeys = ["channels", "data", "results", "streams", "list"];
      for (const key of possibleKeys) {
        if (Array.isArray(json[key])) {
          json = json[key];
          break;
        }
      }
    }

    if (Array.isArray(json)) {
      const out = [];
      json.forEach((ch) => {
        const rawUrl =
          ch.m3u8_url ||
          ch.mpd_url ||
          ch.url ||
          ch.playback_url ||
          ch.streamUrl;

        if (!rawUrl) return;

        try {
          const urlObj = new URL(rawUrl);

          const cookieMatch = rawUrl.match(/hdntl=[^&]*/);
          const cookie = cookieMatch ? cookieMatch[0] : "";

          const userAgent =
            decodeURIComponent(
              urlObj.searchParams.get("User-agent") || ""
            ) ||
            "Hotstar;in.startv.hotstar/25.02.24.8.11169 (Android/15)";

          urlObj.searchParams.delete("User-agent");
          urlObj.searchParams.delete("Origin");
          urlObj.searchParams.delete("Referer");

          const logo = ch.logo || ch.logo_url || ch.image || "";
          const name = ch.name || ch.title || ch.channel_name || "Unknown";

          out.push(
            `#EXTINF:-1 group-title="VOOT | Jio Cinema" tvg-logo="${logo}" ,${name}`,
            `#EXTVLCOPT:http-user-agent=${userAgent}`,
            `#EXTHTTP:${JSON.stringify({
              cookie: cookie,
              Origin: "https://www.hotstar.com",
              Referer: "https://www.hotstar.com/",
            })}`,
            urlObj.toString()
          );
        } catch (e) {}
      });

      return out.join("\n");
    }

    return "";
  }

  return data;
}

// ================= JIO =================
function convertJioJson(json) {
  if (!json) return "";

  const out = [];

  for (const id in json) {
    const ch = json[id];

    const cookie = `hdnea=${ch.url.match(/__hdnea__=([^&]*)/)?.[1] || ""}`;

    const category = (ch.category || ch.genre || "General").toUpperCase();

    out.push(
      `#EXTINF:-1 tvg-id="${id}" tvg-logo="${ch.tvg_logo}" group-title="JIOTV+ | ${category}",${ch.channel_name}`,
      `#KODIPROP:inputstream.adaptive.license_type=clearkey`,
      `#KODIPROP:inputstream.adaptive.license_key=${ch.kid}:${ch.key}`,
      `#EXTHTTP:${JSON.stringify({
        Cookie: cookie,
        "User-Agent": ch.user_agent,
      })}`,
      ch.url
    );
  }

  return out.join("\n");
}

// ================= SONYLIV =================
function convertSonyliv(json) {
  if (!Array.isArray(json.matches)) return "";

  return json.matches
    .filter((m) => m.isLive)
    .map((m) => {
      const url = m.dai_url || m.pub_url;
      if (!url) return null;

      return `#EXTINF:-1 tvg-logo="${m.src}" group-title="SonyLiv | Sports",${m.match_name}\n${url}`;
    })
    .filter(Boolean)
    .join("\n");
}

// ================= FANCODE =================
function convertFancode(json) {
  if (!Array.isArray(json.matches)) return "";

  return json.matches
    .filter((m) => m.status === "LIVE")
    .map((m) => {
      const url = m.adfree_url || m.dai_url;
      if (!url) return null;

      return `#EXTINF:-1 tvg-logo="${m.src}" group-title="FanCode | Sports",${m.match_name}\n${url}`;
    })
    .filter(Boolean)
    .join("\n");
}

// ================= ICC TV =================
function convertIccTv(json) {
  if (!Array.isArray(json.tournaments)) return "";

  const out = [];

  json.tournaments.forEach((t) => {
    if (t.status !== "success") return;

    t.live_streams.forEach((s) => {
      if (!s.mpd || !s.keys) return;

      out.push(
        `#KODIPROP:inputstream.adaptive.license_type=clearkey`,
        `#KODIPROP:inputstream.adaptive.license_key=${s.keys}`,
        `#EXTINF:-1 group-title="T20 World Cup |Live Matches" tvg-logo="${
          s.match?.thumbnail || ""
        }",ICC-${s.title || "Live"}`,
        s.mpd
      );
    });
  });

  return out.join("\n");
}

// ================= SPORTS JSON =================
function convertSportsJson(json) {
  if (!json || !Array.isArray(json.streams)) return "";

  const out = [];

  json.streams.forEach((s, i) => {
    if (!s.url) return;

    const urlObj = new URL(s.url);

    const drm = urlObj.searchParams.get("drmLicense") || "";
    const [kid, key] = drm.split(":");

    const ua = urlObj.searchParams.get("User-Agent") || "";
    const hdnea = urlObj.searchParams.get("__hdnea__") || "";

    urlObj.searchParams.delete("drmLicense");
    urlObj.searchParams.delete("User-Agent");

    out.push(
      `#EXTINF:-1 tvg-id="${1100 + i}" tvg-logo="https://img.u0k.workers.dev/CosmicSports.webp" group-title="SPORTS | ${
        s.language || "LIVE"
      }",${s.language}`,
      `#KODIPROP:inputstream.adaptive.license_type=clearkey`,
      `#KODIPROP:inputstream.adaptive.license_key=${kid}:${key}`,
      `#EXTHTTP:${JSON.stringify({
        Cookie: hdnea ? `__hdnea__=${hdnea}` : "",
        "User-Agent": ua,
      })}`,
      urlObj.toString()
    );
  });

  return out.join("\n");
}

// ================= SAFE FETCH =================
async function safeFetch(url, name, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      console.log(`✅ Loaded ${name}`);
      return res.data;
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed for ${name}`);

      if (attempt > retries) {
        console.warn(`❌ Skipped ${name}`);
        return null;
      }

      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// ================= MAIN =================
async function run() {
  const out = [];

  out.push(PLAYLIST_HEADER.trim());

  if (Array.isArray(SOURCES.TELUGU_JSON)) {
    let allLocalChannels = [];

    for (const url of SOURCES.TELUGU_JSON) {
      const data = await safeFetch(url, "Local Telugu");
      if (Array.isArray(data)) {
        allLocalChannels = allLocalChannels.concat(data);
      }
    }

    if (allLocalChannels.length > 0) {
      out.push(
        section("CS 📺 | Local Channel Telugu"),
        convertLocalTelugu(allLocalChannels)
      );
    }
  }

  if (Array.isArray(SOURCES.LOCAL_JSON)) {
    let allLocalChannels = [];

    for (const url of SOURCES.LOCAL_JSON) {
      const data = await safeFetch(url, "Local Tamil");
      if (Array.isArray(data)) {
        allLocalChannels = allLocalChannels.concat(data);
      }
    }

    if (allLocalChannels.length > 0) {
      out.push(
        section("CS 📺 | Local Channel Tamil"),
        convertLocalTamil(allLocalChannels)
      );
    }
  }

  const hotstar = await safeFetch(SOURCES.HOTSTAR_M3U, "Hotstar");
  if (hotstar) out.push(section("VOOT | Jio Cinema"), hotstar);

  const zee5 = await safeFetch(SOURCES.ZEE5_M3U, "ZEE5");
  if (zee5) {
    const formatted = zee5.replace(
      /group-title="([^"]+)"/g,
      (m, g) => `group-title="ZEE5 | ${g.toUpperCase()}"`
    );

    out.push(section("ZEE5"), formatted);
  }

  const jio = await safeFetch(SOURCES.JIO_JSON, "JIO");
  if (jio) out.push(section("JIOTV+"), convertJioJson(jio));

  const sports = await safeFetch(SOURCES.SPORTS_JSON, "Sports");
  if (sports)
    out.push(section("Sports"), convertSportsJson(sports));

  const icc = await safeFetch(SOURCES.ICC_TV_JSON, "ICC TV");
  if (icc) out.push(section("ICC TV"), convertIccTv(icc));

  const sony = await safeFetch(SOURCES.SONYLIV_JSON, "SonyLiv");
  if (sony) out.push(section("SonyLiv | Sports"), convertSonyliv(sony));

  const fan = await safeFetch(SOURCES.FANCODE_JSON, "FanCode");
  if (fan) out.push(section("FanCode | Sports"), convertFancode(fan));

  out.push(PLAYLIST_FOOTER.trim());

  fs.writeFileSync(OUTPUT_FILE, out.join("\n") + "\n");

  console.log(`✅ ${OUTPUT_FILE} generated successfully`);
}

run();
