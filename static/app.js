// ---------------------------------------------------------------------------
// State (kept in memory for this session — demo IDs from account creation)
// ---------------------------------------------------------------------------
const state = {
  stadiums: [],
  ownerId: null,
  renterId: null,
  ownerBoxes: [],
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
$$(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab-btn").forEach((b) => b.classList.remove("active"));
    $$(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(`#panel-${btn.dataset.tab}`).classList.add("active");
  });
});

// scoreboard clock
function tickClock() {
  const now = new Date();
  $("#clockNow").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
setInterval(tickClock, 1000 * 30);
tickClock();

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
  if (!state.renterId) {
    alert("Pick or create a renter account first (My Reservations tab), then select it in the browsing bar.");
    return;
  }
  const message = prompt("Add a note for the owner (optional):", "") || "";
  try {
    await api("/api/requests", {
      method: "POST",
      body: JSON.stringify({ renter_id: state.renterId, box_id: boxId, date, message }),
    });
    alert("Request sent to the owner. Track its status under My Reservations.");
    refreshRenterRequests();
  } catch (err) {
    alert(err.message);
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
  if (!state.renterId) return;
  const entries = await api(`/api/feed/suggest/${state.renterId}`);
  renderListings(entries);
});
$("#btnNearMe").addEventListener("click", async () => {
  if (!state.renterId) return;
  const entries = await api(`/api/feed/by-location/${state.renterId}`);
  renderListings(entries);
});

function refreshRenterDropdown() {
  const sel = $("#renterSelect");
  const opts = state.renterId
    ? `<option value="${state.renterId}" selected>${state.renterId}</option>`
    : "";
  sel.innerHTML = `<option value="">— none, showing all listings —</option>${opts}`;
  const enabled = !!state.renterId;
  $("#btnSuggest").disabled = !enabled;
  $("#btnNearMe").disabled = !enabled;
}
$("#renterSelect").addEventListener("change", (e) => {
  state.renterId = e.target.value || null;
  $("#btnSuggest").disabled = !state.renterId;
  $("#btnNearMe").disabled = !state.renterId;
});

// ---------------------------------------------------------------------------
// Owner tab
// ---------------------------------------------------------------------------
$("#formOwner").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const owner = await api("/api/owners", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(fd)),
    });
    state.ownerId = owner.id;
    $("#ownerHint").textContent = `Account created. Owner ID: ${owner.id}`;
    refreshOwnerRequests();
  } catch (err) {
    $("#ownerHint").textContent = err.message;
  }
});

$("#formBox").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.ownerId) {
    $("#boxHint").textContent = "Create an owner account first.";
    return;
  }
  const fd = Object.fromEntries(new FormData(e.target));
  fd.capacity = Number(fd.capacity);
  try {
    const box = await api(`/api/owners/${state.ownerId}/boxes`, {
      method: "POST",
      body: JSON.stringify(fd),
    });
    $("#boxHint").textContent = `Box created (ID ${box.id}).`;
    state.ownerBoxes.push(box);
    $("#ownerBoxSelect").innerHTML =
      `<option value="">Select your box…</option>` +
      state.ownerBoxes.map((b) => `<option value="${b.id}">${b.description || b.id} — cap ${b.capacity}</option>`).join("");
    e.target.reset();
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
  if (!state.ownerId) {
    box.innerHTML = `<p class="empty-state">Create an owner account to see requests.</p>`;
    return;
  }
  const reqs = await api(`/api/owners/${state.ownerId}/requests`);
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
    await api(`/api/requests/${b.dataset.id}/accept`, { method: "POST" });
    refreshOwnerRequests();
  }));
  $$(".reject-btn").forEach((b) => b.addEventListener("click", async () => {
    await api(`/api/requests/${b.dataset.id}/reject`, { method: "POST", body: JSON.stringify({}) });
    refreshOwnerRequests();
  }));
}

// ---------------------------------------------------------------------------
// Renter tab
// ---------------------------------------------------------------------------
$("#formRenter").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    const renter = await api("/api/renters", { method: "POST", body: JSON.stringify(fd) });
    state.renterId = renter.id;
    $("#renterHint").textContent = `Account created. Renter ID: ${renter.id}`;
    refreshRenterDropdown();
    refreshRenterRequests();
  } catch (err) {
    $("#renterHint").textContent = err.message;
  }
});

$("#formPrefs").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.renterId) {
    $("#prefsHint").textContent = "Create a renter account first.";
    return;
  }
  const fd = Object.fromEntries(new FormData(e.target));
  if (fd.price_min) fd.price_min = Number(fd.price_min);
  if (fd.price_max) fd.price_max = Number(fd.price_max);
  try {
    await api(`/api/renters/${state.renterId}/preferences`, { method: "PUT", body: JSON.stringify(fd) });
    $("#prefsHint").textContent = "Preferences saved.";
  } catch (err) {
    $("#prefsHint").textContent = err.message;
  }
});

async function refreshRenterRequests() {
  const box = $("#renterRequests");
  if (!state.renterId) {
    box.innerHTML = `<p class="empty-state">Create a renter account to track requests.</p>`;
    return;
  }
  const reqs = await api(`/api/renters/${state.renterId}/requests`);
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
    await api(`/api/requests/${b.dataset.id}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount, deposit: amount * 1.2, provider: "stripe", token: "tok_demo" }),
    });
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
// Init
// ---------------------------------------------------------------------------
(async function init() {
  await loadStadiums();
  await loadListings();
  refreshRenterDropdown();
})();
