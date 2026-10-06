const doctors = [
  { id: "d1", name: "Dr. Maya Rao", specialty: "General Physician" },
  { id: "d2", name: "Dr. Arjun Mehta", specialty: "Dermatologist" },
  { id: "d3", name: "Dr. Sara Khan", specialty: "Pediatrician" }
];

const patients = [
  { id: "P-1042", name: "Aarav Sharma", age: 29, blood: "O+", condition: "Seasonal allergy", phone: "90000 10001" },
  { id: "P-1187", name: "Diya Patel", age: 34, blood: "A+", condition: "Routine follow-up", phone: "90000 10002" },
  { id: "P-1265", name: "Kabir Singh", age: 12, blood: "B+", condition: "Annual check-up", phone: "90000 10003" },
  { id: "P-1310", name: "Meera Nair", age: 41, blood: "AB+", condition: "Migraine review", phone: "90000 10004" }
];

const today = new Date();
const isoDate = d => {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
};
const future = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

let appointments = [
  { id: 1, patientId: "P-1042", doctorId: "d1", date: future(2), time: "10:00 AM", reason: "Seasonal allergy", status: "upcoming" },
  { id: 2, patientId: "P-1042", doctorId: "d2", date: future(8), time: "03:00 PM", reason: "Skin consultation", status: "upcoming" },
  { id: 3, patientId: "P-1042", doctorId: "d1", date: future(-5), time: "11:00 AM", reason: "Routine consultation", status: "completed" }
];

let currentRole = "patient";
let activeFilter = "all";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function doctorById(id) { return doctors.find(d => d.id === id); }
function patientById(id) { return patients.find(p => p.id === id); }

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function navigate(view) {
  const allowedDoctor = view === "patients" && currentRole !== "doctor";
  const target = allowedDoctor ? "dashboard" : view;
  $$(".view").forEach(v => v.classList.toggle("active", v.id === `${target}View`));
  $$(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === target));
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}

function setupRole() {
  const isDoctor = currentRole === "doctor";
  $$(".doctor-only").forEach(el => el.classList.toggle("hidden", !isDoctor));
  $$(".patient-only").forEach(el => el.classList.toggle("hidden", isDoctor));
  $("#roleBadge").textContent = isDoctor ? "Doctor Demo" : "Patient Demo";
  $("#logoutBtn").textContent = "Switch Role";
}

function renderStats() {
  const visible = currentRole === "doctor"
    ? appointments
    : appointments.filter(a => a.patientId === "P-1042");
  $("#statAppointments").textContent = visible.filter(a => a.status === "upcoming").length;
  $("#statCompleted").textContent = visible.filter(a => a.status === "completed").length;
  $("#statPatients").textContent = patients.length;
}

function renderNextAppointment() {
  const upcoming = appointments
    .filter(a => a.status === "upcoming" && (currentRole === "doctor" || a.patientId === "P-1042"))
    .sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const target = $("#nextAppointment");
  if (!upcoming.length) {
    target.innerHTML = `<div class="empty">No upcoming appointments.</div>`;
    return;
  }
  const a = upcoming[0];
  const d = doctorById(a.doctorId);
  target.innerHTML = appointmentMarkup(a, d);
}

function appointmentMarkup(a, doctor) {
  const patient = patientById(a.patientId);
  const personName = currentRole === "doctor" ? patient?.name : doctor.name;
  const subtitle = currentRole === "doctor" ? `${doctor.name} · ${doctor.specialty}` : doctor.specialty;
  return `
    <div class="appointment-card">
      <div class="appointment-main">
        <div class="avatar">${personName.split(" ").map(x => x[0]).slice(0,2).join("")}</div>
        <div>
          <h3>${personName}</h3>
          <p class="date-line">${formatDate(a.date)} · ${a.time}</p>
          <p>${subtitle}</p>
          <p>${escapeHtml(a.reason)}</p>
        </div>
      </div>
      <div class="card-actions">
        <span class="status ${a.status}">${capitalize(a.status)}</span>
        ${a.status === "upcoming" ? `<button class="action-btn danger cancel-btn" data-id="${a.id}">Cancel</button>` : ""}
      </div>
    </div>`;
}

function renderAppointments() {
  const list = $("#appointmentsList");
  let visible = appointments.filter(a => currentRole === "doctor" || a.patientId === "P-1042");
  if (activeFilter !== "all") visible = visible.filter(a => a.status === activeFilter);
  visible.sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  list.innerHTML = visible.length
    ? visible.map(a => appointmentMarkup(a, doctorById(a.doctorId))).join("")
    : `<div class="empty">No ${activeFilter === "all" ? "" : activeFilter + " "}appointments found.</div>`;
}

function renderPatients() {
  const grid = $("#patientsGrid");
  if (currentRole !== "doctor") return;
  grid.innerHTML = patients.map(p => `
    <article class="patient-card">
      <div class="patient-head">
        <div class="avatar">${p.name.split(" ").map(x => x[0]).join("")}</div>
        <div><h3>${p.name}</h3><small>${p.id}</small></div>
      </div>
      <div class="patient-info">
        <div class="info-box"><span>Age</span><strong>${p.age}</strong></div>
        <div class="info-box"><span>Blood group</span><strong>${p.blood}</strong></div>
        <div class="info-box"><span>Relevant note</span><strong>${p.condition}</strong></div>
        <div class="info-box"><span>Phone</span><strong>${p.phone}</strong></div>
      </div>
    </article>`).join("");
}

function populateDoctors() {
  $("#doctorSelect").innerHTML = doctors.map(d =>
    `<option value="${d.id}">${d.name} — ${d.specialty}</option>`).join("");
}

function openBooking() {
  $("#dateInput").min = isoDate(today);
  $("#dateInput").value = future(1);
  $("#bookingForm").reset();
  $("#dateInput").min = isoDate(today);
  $("#dateInput").value = future(1);
  $("#modalBackdrop").classList.remove("hidden");
  setTimeout(() => $("#doctorSelect").focus(), 0);
}

function closeBooking() { $("#modalBackdrop").classList.add("hidden"); }

function cancelAppointment(id) {
  const a = appointments.find(item => item.id === Number(id));
  if (!a || a.status !== "upcoming") return;
  if (!confirm("Cancel this appointment?")) return;
  a.status = "cancelled";
  renderAll();
  showToast("Appointment cancelled.");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

function renderAll() {
  setupRole();
  renderStats();
  renderNextAppointment();
  renderAppointments();
  renderPatients();
}

document.addEventListener("click", e => {
  const viewButton = e.target.closest("[data-view]");
  if (viewButton) {
    e.preventDefault();
    navigate(viewButton.dataset.view);
  }
  const cancel = e.target.closest(".cancel-btn");
  if (cancel) cancelAppointment(cancel.dataset.id);
  const filter = e.target.closest(".filter-btn");
  if (filter) {
    activeFilter = filter.dataset.filter;
    $$(".filter-btn").forEach(b => b.classList.toggle("active", b === filter));
    renderAppointments();
  }
});

$("#openBookingBtn").addEventListener("click", openBooking);
$("#closeModalBtn").addEventListener("click", closeBooking);
$("#modalBackdrop").addEventListener("click", e => {
  if (e.target === $("#modalBackdrop")) closeBooking();
});

$("#bookingForm").addEventListener("submit", e => {
  e.preventDefault();
  const date = $("#dateInput").value;
  if (date < isoDate(today)) {
    showToast("Please choose today or a future date.");
    return;
  }
  appointments.push({
    id: Date.now(),
    patientId: "P-1042",
    doctorId: $("#doctorSelect").value,
    date,
    time: $("#timeSelect").value,
    reason: $("#reasonInput").value.trim(),
    status: "upcoming"
  });
  closeBooking();
  activeFilter = "all";
  $$(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
  renderAll();
  navigate("appointments");
  showToast("Appointment booked successfully.");
});

$("#logoutBtn").addEventListener("click", () => {
  currentRole = currentRole === "patient" ? "doctor" : "patient";
  activeFilter = "all";
  navigate("dashboard");
  showToast(`Switched to ${currentRole === "doctor" ? "Doctor" : "Patient"} Demo.`);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeBooking();
});

populateDoctors();
renderAll();
