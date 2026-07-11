// ---------------------------------------------------------------------------
// State — identity lives in the server session cookie; `user` mirrors
// GET /api/auth/me. demoCode holds the simulated-email confirmation code
// returned at signup so the confirm screen can display it.
// ---------------------------------------------------------------------------
const state = {
  stadiums: [],
  user: null,
  ownerBoxes: [],
  demoCode: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.needs_confirmation) showConfirmBanner();
    const e = new Error(data.error || "Request failed");
    e.status = res.status;
    throw e;
  }
  return data;
}

// ---------------------------------------------------------------------------
// Views (auth -> confirm -> prefs -> app) + tabs
// ---------------------------------------------------------------------------
const ONBOARD_VIEWS = ["viewAuth", "viewConfirm", "viewPrefs"];

function showView(id) {
  ONBOARD_VIEWS.forEach((v) => $(`#${v}`).classList.remove("active"));
  $$(".tab-panel[id^='panel-']").forEach((p) => p.classList.remove("active"));
  if (ONBOARD_VIEWS.includes(id)) {
    $(`#${id}`).classList.add("active");
    $("#mainTabs").classList.add("hidden");
  } else {
    $("#mainTabs").classList.remove("hidden");
    $(`#panel-${id}`).classList.add("active");
    $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
  }
}

$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.tab);
    // refresh the tab's data so status changes made by the other side
    // (e.g. an owner accepting) show up without a full page reload
    if (btn.dataset.tab === "browse") loadListings();
    if (btn.dataset.tab === "renter" && state.user?.role === "renter") refreshRenterRequests();
    if (btn.dataset.tab === "owner" && state.user?.role === "owner") {
      loadOwnerBoxes();
      refreshOwnerRequests();
    }
  });
});

// ---------------------------------------------------------------------------
// Header (user chip, login/logout) + role gating
// ---------------------------------------------------------------------------
function renderHeader() {
  const u = state.user;
  $("#userChip").classList.toggle("hidden", !u);
  $("#btnLogout").classList.toggle("hidden", !u);
  $("#btnShowAuth").classList.toggle("hidden", !!u);
  $("#tabOwner").classList.toggle("hidden", !u || u.role !== "owner");
  $("#tabRenter").classList.toggle("hidden", !u || u.role !== "renter");
  if (u) {
    $("#chipName").textContent = u.name;
    $("#chipRole").textContent = u.role;
    $("#chipUnconfirmed").classList.toggle("hidden", u.confirmed);
  }

  const renter = u && u.role === "renter";
  $("#btnSuggest").disabled = !renter;
  $("#btnNearMe").disabled = !renter;
  $("#browseIdentity").textContent = u
    ? `Browsing as ${u.name} (${u.role})`
    : "Browsing as guest — log in as a renter to request a suite.";
}

function showConfirmBanner() {
  const u = state.user;
  const show = !!u && !u.confirmed;
  $("#confirmBanner").classList.toggle("hidden", !show);
  if (show && state.demoCode) {
    $("#bannerCodeHint").textContent = `(demo code: ${state.demoCode})`;
    $("#bannerCodeHint").classList.remove("hidden");
  }
}

async function showApp() {
  renderHeader();
  showConfirmBanner();
  showView("browse");
  await loadListings();
  if (state.user?.role === "owner") {
    await loadOwnerBoxes();
    await refreshOwnerRequests();
  } else if (state.user?.role === "renter") {
    fillPrefsForm($("#formPrefs"), state.user.preferences || {});
    await refreshRenterRequests();
  }
}

// ---------------------------------------------------------------------------
// Auth: login / signup (Screen 1) / confirm (Screen 2) / logout
// ---------------------------------------------------------------------------
$("#formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    state.user = await api("/api/auth/login", { method: "POST", body: JSON.stringify(fd) });
    state.demoCode = null;
    e.target.reset();
    await showApp();
  } catch (err) {
    $("#loginHint").textContent = err.message;
  }
});

$("#formSignup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  const payload = {
    role: fd.role,
    name: fd.name,
    email: fd.email,
    password: fd.password,
    location: fd.location,
    social_media: fd.social_handle ? { [fd.social_platform]: fd.social_handle } : {},
  };
  try {
    const me = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) });
    state.demoCode = me.demo_confirmation_code;
    delete me.demo_confirmation_code;
    state.user = me;
    e.target.reset();
    $("#demoCode").textContent = state.demoCode;
    renderHeader();
    showView("viewConfirm");
  } catch (err) {
    $("#signupHint").textContent = err.message;
  }
});

// The social row is required for renters only (roadmap: owners vet renters
// through their socials).
$$("#formSignup input[name='role']").forEach((r) =>
  r.addEventListener("change", () => {
    const isRenter = $("#formSignup input[name='role']:checked").value === "renter";
    $("#formSignup input[name='social_handle']").required = isRenter;
    $("#socialHint").textContent = isRenter
      ? "Renters must link at least one social account — owners use it to vet requests."
      : "Optional for owners.";
  })
);
$("#formSignup input[name='social_handle']").required = true;

async function confirmWithCode(code, hintEl) {
  try {
    state.user = await api("/api/auth/confirm", { method: "POST", body: JSON.stringify({ code }) });
    state.demoCode = null;
    if (state.user.role === "renter") {
      renderPrefStadiums($("#prefStadiums"));
      showView("viewPrefs");
      renderHeader();
      showConfirmBanner();
    } else {
      await showApp();
    }
  } catch (err) {
    hintEl.textContent = err.message;
  }
}

$("#formConfirm").addEventListener("submit", (e) => {
  e.preventDefault();
  confirmWithCode($("#confirmCode").value.trim(), $("#confirmHint"));
});

$("#bannerConfirmBtn").addEventListener("click", () => {
  confirmWithCode($("#bannerCode").value.trim(), $("#bannerHint"));
});

async function resendCode(hintEl) {
  try {
    const d = await api("/api/auth/resend-code", { method: "POST" });
    state.demoCode = d.demo_confirmation_code;
    $("#demoCode").textContent = state.demoCode;
    hintEl.textContent = "New code sent (see above / server log).";
    showConfirmBanner();
  } catch (err) {
    hintEl.textContent = err.message;
  }
}
$("#btnResendCode").addEventListener("click", () => resendCode($("#confirmHint")));
$("#bannerResendBtn").addEventListener("click", () => resendCode($("#bannerHint")));

$("#btnSkipConfirm").addEventListener("click", () => showApp());

$("#btnLogout").addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.demoCode = null;
  state.ownerBoxes = [];
  renderHeader();
  showConfirmBanner();
  showView("viewAuth");
});

$("#btnShowAuth").addEventListener("click", () => showView("viewAuth"));
$("#btnBackToBrowse").addEventListener("click", () => showView("browse"));

// ---------------------------------------------------------------------------
// Preferences (Screen 3 onboarding + the My Reservations tab share logic)
// ---------------------------------------------------------------------------
function renderPrefStadiums(container, selected = []) {
  container.innerHTML = state.stadiums
    .map((s) => `<label><input type="checkbox" name="preferred_stadiums" value="${s.id}"
      ${selected.includes(s.id) ? "checked" : ""}> ${s.name} — ${s.city}</label>`)
    .join("");
}

function fillPrefsForm(form, prefs) {
  form.price_min.value = prefs.price_min ?? "";
  form.price_max.value = prefs.price_max ?? "";
  form.capacity_bucket.value = prefs.capacity_bucket ?? "";
  form.preferred_teams.value = (prefs.preferred_teams || []).join(", ");
  form.location.value = state.user?.location || "";
  renderPrefStadiums(form.querySelector(".check-grid"), prefs.preferred_stadiums || []);
}

async function submitPrefs(form, hintEl) {
  const payload = {
    price_min: form.price_min.value || null,
    price_max: form.price_max.value || null,
    capacity_bucket: form.capacity_bucket.value || null,
    preferred_stadiums: Array.from(form.querySelectorAll("input[name='preferred_stadiums']:checked")).map((c) => c.value),
    preferred_teams: form.preferred_teams.value.split(",").map((t) => t.trim()).filter(Boolean),
    location: form.location.value || null,
  };
  const me = await api("/api/my/preferences", { method: "PUT", body: JSON.stringify(payload) });
  state.user = { ...state.user, preferences: me.preferences, location: me.location };
  if (hintEl) hintEl.textContent = "Preferences saved.";
}

$("#formOnboardPrefs").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await submitPrefs(e.target, null);
    await showApp();
  } catch (err) {
    $("#onboardPrefsHint").textContent = err.message;
  }
});

$("#btnSkipPrefs").addEventListener("click", () => showApp());

$("#formPrefs").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await submitPrefs(e.target, $("#prefsHint"));
  } catch (err) {
    $("#prefsHint").textContent = err.message;
  }
});

// ---------------------------------------------------------------------------
// Stadiums (shared across tabs)
// ---------------------------------------------------------------------------
async function loadStadiums() {
  state.stadiums = await api("/api/stadiums");
  const opts = state.stadiums.map((s) => `<option value="${s.id}">${s.name} — ${s.city}</option>`).join("");
  $("#filterStadium").innerHTML = `<option value="">All venues</option>${opts}`;
  $("#ownerStadiumSelect").innerHTML = opts;
}

// ---------------------------------------------------------------------------
// Browse tab
// ---------------------------------------------------------------------------
function stubCard(entry, deal) {
  const dealBadge = deal ? `<span class="stub-deal">Save $${entry.discount}</span>` : "";
  return `
    <div class="stub">
      <div class="stub-main">
        ${dealBadge}
        <div class="stub-venue">${entry.stadium_name} · ${entry.stadium_city}</div>
        <div class="stub-title">${entry.box_description || "Private suite"}</div>
        <div class="stub-loc">${entry.box_location || "Location on request"}</div>
        <div class="stub-meta">
          <span>${entry.capacity} guests</span>
          <span>${entry.description || "Game night"}</span>
        </div>
      </div>
      <div class="stub-stub">
        <div class="stub-date">${entry.date}</div>
        <div class="stub-price">$${entry.price}</div>
        <button class="stub-btn" data-box="${entry.box_id}" data-date="${entry.date}">Request</button>
      </div>
    </div>`;
}

function renderListings(entries, deal = false) {
  const grid = $("#listingGrid");
  if (!entries.length) {
    grid.innerHTML = `<p class="empty-state">No listings match right now — check back soon.</p>`;
    return;
  }
  grid.innerHTML = entries.map((e) => stubCard(e, deal)).join("");
  $$(".stub-btn").forEach((btn) => btn.addEventListener("click", onRequestClick));
}

async function onRequestClick(e) {
  const { box: boxId, date } = e.target.dataset;
  if (!state.user) {
    showView("viewAuth");
    return;
  }
  if (state.user.role !== "renter") {
    alert("Requests are for renter accounts — you're logged in as an owner.");
    return;
  }
  const message = prompt("Add a note for the owner (optional):", "") || "";
  try {
    await api("/api/requests", {
      method: "POST",
      body: JSON.stringify({ box_id: boxId, date, message }),
    });
    alert("Request sent to the owner. Track its status under My Reservations.");
    refreshRenterRequests();
  } catch (err) {
    if (err.status !== 403) alert(err.message);
  }
}

async function loadListings() {
  const stadiumId = $("#filterStadium").value;
  const sortBy = $("#sortBy").value;
  let entries;
  if (stadiumId) {
    entries = await api(`/api/feed/by-stadium/${stadiumId}?sort_by=${sortBy}`);
  } else {
    entries = await api(`/api/feed/available`);
  }
  renderListings(entries);
}

$("#filterStadium").addEventListener("change", loadListings);
$("#sortBy").addEventListener("change", loadListings);
$("#btnRefresh").addEventListener("click", loadListings);
$("#btnBestDeals").addEventListener("click", async () => {
  const deals = await api("/api/feed/best-deals");
  renderListings(deals, true);
});
$("#btnSuggest").addEventListener("click", async () => {
  const entries = await api("/api/feed/suggest");
  renderListings(entries);
});
$("#btnNearMe").addEventListener("click", async () => {
  const entries = await api("/api/feed/by-location");
  renderListings(entries);
});

// ---------------------------------------------------------------------------
// Owner tab
// ---------------------------------------------------------------------------
async function loadOwnerBoxes() {
  state.ownerBoxes = await api("/api/my/boxes");
  $("#ownerBoxSelect").innerHTML =
    `<option value="">Select your box…</option>` +
    state.ownerBoxes.map((b) => `<option value="${b.id}">${b.description || b.id} — cap ${b.capacity}</option>`).join("");
}

$("#formBox").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  fd.capacity = Number(fd.capacity);
  try {
    await api("/api/my/boxes", { method: "POST", body: JSON.stringify(fd) });
    $("#boxHint").textContent = "Box created.";
    e.target.reset();
    await loadOwnerBoxes();
  } catch (err) {
    $("#boxHint").textContent = err.message;
  }
});

$("#formListing").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  fd.price = Number(fd.price);
  try {
    await api(`/api/boxes/${fd.box_id}/listings`, {
      method: "POST",
      body: JSON.stringify(fd),
    });
    $("#listingHint").textContent = "Listing published.";
    e.target.reset();
    loadListings();
  } catch (err) {
    $("#listingHint").textContent = err.message;
  }
});

async function refreshOwnerRequests() {
  const box = $("#ownerRequests");
  const reqs = await api("/api/my/requests");
  if (!reqs.length) {
    box.innerHTML = `<p class="empty-state">No requests yet.</p>`;
    return;
  }
  box.innerHTML = reqs.map(reqRow).join("");
  wireOwnerActions();
}

function reqRow(r) {
  const canAct = r.status === "pending";
  return `
    <div class="req-row" data-id="${r.id}">
      <div>
        <div><strong>${r.date}</strong> · $${r.price} · box ${r.box_id.slice(0, 6)}…</div>
        <span class="status-pill status-${r.status}">${r.status}</span>
        ${r.message ? `<div class="hint">“${r.message}”</div>` : ""}
        ${r.reject_reason ? `<div class="hint">${r.reject_reason}</div>` : ""}
      </div>
      ${canAct ? `
      <div class="req-actions">
        <button class="ghost-btn accept-btn" data-id="${r.id}">Accept</button>
        <button class="ghost-btn reject-btn" data-id="${r.id}">Decline</button>
      </div>` : ""}
    </div>`;
}

function wireOwnerActions() {
  $$(".accept-btn").forEach((b) => b.addEventListener("click", async () => {
    try {
      await api(`/api/requests/${b.dataset.id}/accept`, { method: "POST" });
    } catch (err) {
      if (err.status !== 403) alert(err.message);
    }
    refreshOwnerRequests();
  }));
  $$(".reject-btn").forEach((b) => b.addEventListener("click", async () => {
    try {
      await api(`/api/requests/${b.dataset.id}/reject`, { method: "POST", body: JSON.stringify({}) });
    } catch (err) {
      if (err.status !== 403) alert(err.message);
    }
    refreshOwnerRequests();
  }));
}

// ---------------------------------------------------------------------------
// Renter tab
// ---------------------------------------------------------------------------
async function refreshRenterRequests() {
  const box = $("#renterRequests");
  const reqs = await api("/api/my/requests");
  if (!reqs.length) {
    box.innerHTML = `<p class="empty-state">No requests yet — browse suites to send one.</p>`;
    return;
  }
  box.innerHTML = reqs.map(renterReqRow).join("");
  wireRenterActions();
}

function renterReqRow(r) {
  let extra = "";
  if (r.status === "accepted") {
    extra = `<div class="req-actions"><button class="ghost-btn pay-btn" data-id="${r.id}" data-amount="${r.price}">Pay & confirm</button></div>`;
  } else if (r.status === "paid") {
    extra = `<div class="req-actions"><button class="ghost-btn instr-btn" data-id="${r.id}">Get instructions</button></div>`;
  } else if (r.status === "completed") {
    extra = r.survey
      ? `<div class="hint">Thanks for the feedback!</div>`
      : `<div class="req-actions"><button class="ghost-btn survey-btn" data-id="${r.id}">Leave feedback</button></div>`;
    if (r.instructions) extra = `<div class="hint">${r.instructions}</div>` + extra;
  }
  return `
    <div class="req-row" data-id="${r.id}">
      <div>
        <div><strong>${r.date}</strong> · $${r.price}</div>
        <span class="status-pill status-${r.status}">${r.status}</span>
        ${r.reject_reason ? `<div class="hint">${r.reject_reason}</div>` : ""}
      </div>
      ${extra}
    </div>`;
}

function wireRenterActions() {
  $$(".pay-btn").forEach((b) => b.addEventListener("click", async () => {
    const amount = Number(b.dataset.amount);
    try {
      await api(`/api/requests/${b.dataset.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ amount, deposit: amount * 1.2, provider: "stripe", token: "tok_demo" }),
      });
    } catch (err) {
      if (err.status !== 403) alert(err.message);
    }
    refreshRenterRequests();
  }));
  $$(".instr-btn").forEach((b) => b.addEventListener("click", async () => {
    await api(`/api/requests/${b.dataset.id}/instructions`);
    refreshRenterRequests();
  }));
  $$(".survey-btn").forEach((b) => b.addEventListener("click", async () => {
    const boxExp = prompt("Rate the box experience (1-5):", "5");
    const bookingExp = prompt("Rate the booking process (1-5):", "5");
    if (!boxExp || !bookingExp) return;
    await api(`/api/requests/${b.dataset.id}/survey`, {
      method: "POST",
      body: JSON.stringify({ box_experience: Number(boxExp), booking_experience: Number(bookingExp) }),
    });
    refreshRenterRequests();
  }));
}

// ---------------------------------------------------------------------------
// Init — restore the session (if any), then land on browse or auth
// ---------------------------------------------------------------------------
(async function init() {
  await loadStadiums();
  try {
    state.user = await api("/api/auth/me");
  } catch {
    state.user = null;
  }
  if (state.user) {
    await showApp();
  } else {
    renderHeader();
    await loadListings();
    showView("browse");
  }
})();
