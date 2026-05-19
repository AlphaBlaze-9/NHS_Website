/* =========================================================
   BRIDGELAND NHS · SERVICE CARD
   Fetches inductee data from the Apps Script API,
   looks up by Student ID, populates the dashboard.
   ========================================================= */

const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwAvx4XLuYS30VuuyLUCJsS-xQTyVHpwNBdtQtvnmga2JUI7iv9rp0RXRTOqutY1_f7/exec";

// Service / attendance requirements
const REQUIREMENTS = {
  juniorSenior: { service: 9, attendance: 8 },
  seniorOnly:   { service: 3, attendance: 3 },
};

// ---------------- HELPERS ----------------

function toNum(v) {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmtBool(v) {
  if (v == null) return "—";
  const s = String(v).trim().toLowerCase();
  if (["y", "yes", "true", "1", "✓", "x", "complete", "signed"].includes(s)) return "Yes";
  if (["n", "no", "false", "0", "incomplete", "missing"].includes(s)) return "No";
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isYes(v) {
  return ["y", "yes", "true", "1", "✓", "x", "complete", "signed", "eligible"].includes(
    String(v || "").trim().toLowerCase()
  );
}

// ---------------- UI ----------------

const $ = id => document.getElementById(id);

function setStatus(msg, kind = "loading") {
  const el = $("status");
  if (!msg) { el.hidden = true; el.textContent = ""; el.className = "status"; return; }
  el.hidden = false;
  el.textContent = msg;
  el.className = `status status--${kind}`;
}

function setRing(elId, value, goal) {
  const pct = Math.min(100, Math.max(0, goal > 0 ? (value / goal) * 100 : 0));
  const el = document.getElementById(elId);
  el.style.strokeDashoffset = String(100 - pct);
}

function buildBadges(primaryData, fromTab) {
  const wrap = $("profile-badges");
  wrap.innerHTML = "";

  // Stole eligible
  const stole = primaryData.stole;
  if (stole) {
    const b = document.createElement("span");
    b.className = `badge ${isYes(stole) ? "badge--ok" : "badge--warn"}`;
    b.textContent = isYes(stole) ? "Stole Eligible" : "Stole Pending";
    wrap.appendChild(b);
  }

  // Permission slip
  const perm = primaryData.permission;
  if (perm) {
    const b = document.createElement("span");
    b.className = `badge ${isYes(perm) ? "badge--ok" : "badge--bad"}`;
    b.textContent = isYes(perm) ? "Slip Signed" : "Slip Missing";
    wrap.appendChild(b);
  }

  // Strikes
  const strikes = toNum(primaryData.strikes);
  if (strikes > 0) {
    const b = document.createElement("span");
    b.className = "badge badge--bad";
    b.textContent = `${strikes} Strike${strikes === 1 ? "" : "s"}`;
    wrap.appendChild(b);
  }

  // Year tag
  const yearTag = document.createElement("span");
  yearTag.className = "badge badge--neutral";
  yearTag.textContent = fromTab === "26-27" ? "26–27 Class" : "25–26 Class";
  wrap.appendChild(yearTag);
}

function buildEvents(events) {
  if (!events || !events.length) {
    $("events").hidden = true;
    return;
  }
  const list = $("events-list");
  list.innerHTML = "";
  events.forEach(e => {
    const li = document.createElement("li");
    li.textContent = e;
    list.appendChild(li);
  });
  $("events").hidden = false;
}

function renderResults(result) {
  const info = result.studentInfo;
  
  const fromTab = info.found26 ? "26-27" : "25-26";
  const primaryData = info.found26 ? info.data26 : info.data25;
  const data25 = info.found25 ? info.data25 : null;
  const data26 = info.found26 ? info.data26 : null;

  // header
  $("profile-name").textContent = primaryData.name || "Unknown Student";
  $("profile-id").textContent = result.studentId || "—";

  buildBadges(primaryData, fromTab);

  // Default to juniorSenior requirements.
  const req = REQUIREMENTS.juniorSenior;
  const isSeniorOnly = false; // We can't determine this accurately without the grade column

  // Service credits
  const service2425 = data25 ? toNum(data25.credits) : 0;
  const service2627 = data26 ? toNum(data26.credits) : 0;
  const serviceTotal = toNum(primaryData.credits);

  $("service-2425").textContent = data25 ? service2425 : "—";
  $("service-2627").textContent = data26 ? service2627 : "—";
  $("service-total").textContent = serviceTotal;
  $("service-goal").textContent = req.service;
  $("service-foot").textContent = isSeniorOnly
    ? "Senior-Only requirement · 3 service credits"
    : "Juniors–Seniors need 9 · Senior-Only need 3";

  // Attendance
  const att2425 = data25 ? toNum(data25.meetings) : 0;
  const att2627 = data26 ? toNum(data26.meetings) : 0;
  const attTotal = toNum(primaryData.meetings);

  $("attend-2425").textContent = data25 ? att2425 : "—";
  $("attend-2627").textContent = data26 ? att2627 : "—";
  $("attend-total").textContent = attTotal;
  $("attend-goal").textContent = req.attendance;
  $("attend-foot").textContent = isSeniorOnly
    ? "Senior-Only requirement · 3 meetings"
    : "Juniors–Seniors need 8 · Senior-Only need 3";

  // Rings (animated)
  document.getElementById("service-ring").style.strokeDashoffset = "100";
  document.getElementById("attend-ring").style.strokeDashoffset = "100";
  requestAnimationFrame(() => {
    setTimeout(() => {
      setRing("service-ring", serviceTotal, req.service);
      setRing("attend-ring", attTotal, req.attendance);
    }, 80);
  });

  // Mini stats
  const strikes = toNum(primaryData.strikes);
  $("strikes-val").textContent = strikes;
  $("strikes-note").textContent =
    strikes === 0 ? "Clean record" :
    strikes >= 3 ? "Above limit" :
    `${3 - strikes} until limit`;

  $("perm-val").textContent  = fmtBool(primaryData.permission);
  $("stole-val").textContent = fmtBool(primaryData.stole);

  $("senior-warn").hidden = fromTab !== "26-27";

  // Events
  buildEvents(result.upcomingEvents);

  // Reveal
  const results = $("results");
  results.hidden = false;
  results.dataset.show = "true";
  results.style.animation = "none";
  // eslint-disable-next-line no-unused-expressions
  results.offsetHeight;
  results.style.animation = "";

  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------------- MAIN LOOKUP ----------------

async function handleLookup(rawId) {
  // Normalize ID: uppercase and remove spaces
  let id = (rawId || "").toString().toUpperCase().replace(/\s+/g, "");
  if (!id) {
    setStatus("Please enter a Student ID.", "err");
    return;
  }

  setStatus("Searching the roster…", "loading");
  $("results").hidden = true;

  try {
    // Helper function to fetch by a specific ID string
    const fetchById = async (searchId) => {
      const url = `${APP_SCRIPT_URL}?studentId=${encodeURIComponent(searchId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    };

    // First try the normalized ID (e.g. S124515)
    let data = await fetchById(id);
    
    // If not found, and the ID starts with 'S', try without the 'S' (e.g. 124515)
    // Sometimes the sheet omits the S prefix.
    if (data.success && !data.studentInfo.found25 && !data.studentInfo.found26 && id.startsWith("S")) {
      const idWithoutS = id.substring(1);
      const fallbackData = await fetchById(idWithoutS);
      if (fallbackData.studentInfo.found25 || fallbackData.studentInfo.found26) {
        data = fallbackData;
        id = idWithoutS; // update the id for display if needed
      }
    }
    
    if (!data.success || (!data.studentInfo.found25 && !data.studentInfo.found26)) {
      setStatus(
        `No record found for "${rawId}". Double-check your ID, or contact an NHS officer if you believe this is an error.`,
        "err"
      );
      return;
    }

    setStatus("", "loading");
    renderResults(data);
    
  } catch (err) {
    console.error(err);
    setStatus(
      err.message ||
      "Couldn't connect to the server. Please try again later.",
      "err"
    );
  }
}

// ---------------- WIRE UP ----------------

document.addEventListener("DOMContentLoaded", () => {
  const form = $("lookup-form");
  const input = $("student-id");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLookup(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLookup(input.value);
    }
  });

  const params = new URLSearchParams(window.location.search);
  const presetId = params.get("id");
  if (presetId) {
    input.value = presetId;
    handleLookup(presetId);
  }
});
