/* ================================
   XShare - script.js
   Handles: Auth, LocalStorage, Q&A, Admin
================================ */

// --- LocalStorage Keys ---
const USERS_KEY = "xshare_users";
const EXPERIENCES_KEY = "xshare_experiences";
const PENDING_QA_KEY = "xshare_pending_qas";
const APPROVED_QA_KEY = "xshare_approved_qas";

// --- Utility Functions ---
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Auth Management ---
function registerUser(username, email, password, role = "student") {
  let users = getData(USERS_KEY);
  if (users.find(u => u.email === email)) {
    alert("Email already registered.");
    return false;
  }
  users.push({ username, email, password, role });
  setData(USERS_KEY, users);
  return true;
}

function loginUser(email, password) {
  let users = getData(USERS_KEY);
  let user = users.find(u => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem("xshare_loggedInUser", JSON.stringify(user));
    // Redirect based on role
    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } else {
    alert("Invalid login details.");
  }
}

function logoutUser() {
  localStorage.removeItem("xshare_loggedInUser");
  window.location.href = "index.html";
}

function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("xshare_loggedInUser"));
}

// --- Interview Experience ---
function addExperience(expData) {
  let exps = getData(EXPERIENCES_KEY);
  exps.push(expData);
  setData(EXPERIENCES_KEY, exps);
}

function renderExperiences(containerId) {
  let exps = getData(EXPERIENCES_KEY);
  let container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  exps.forEach((exp, idx) => {
    let card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${exp.company}</h3>
      <p><strong>CTC:</strong> ${exp.ctc}</p>
      <p><strong>Rounds:</strong> ${exp.rounds}</p>
      <p><strong>Questions:</strong> ${exp.questions}</p>
      <p><strong>Advice:</strong> ${exp.advice}</p>
      <div class="qa-section">
        <h4>Q&A</h4>
        <div id="qa-${idx}">${renderApprovedQA(idx)}</div>
        <input type="text" id="qInput-${idx}" placeholder="Ask a question..."/>
        <button onclick="askQuestion(${idx})">Post</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Q&A Logic ---
function askQuestion(expIndex) {
  let input = document.getElementById(`qInput-${expIndex}`);
  if (!input.value.trim()) return;

  let user = getLoggedInUser();
  if (!user) {
    alert("Login required to post a question.");
    return;
  }

  let pendingQAs = getData(PENDING_QA_KEY);
  pendingQAs.push({
    expIndex,
    question: input.value.trim(),
    askedBy: user.username,
    status: "pending"
  });
  setData(PENDING_QA_KEY, pendingQAs);

  alert("Question submitted for approval.");
  input.value = "";
}

// Show approved QAs under experience
function renderApprovedQA(expIndex) {
  let approved = getData(APPROVED_QA_KEY);
  let relevant = approved.filter(q => q.expIndex === expIndex);
  if (relevant.length === 0) return "<p>No questions yet.</p>";

  return relevant
    .map(
      q => `<div class="qa-item"><strong>${q.askedBy}:</strong> ${q.question}</div>`
    )
    .join("");
}

// --- Admin Panel Rendering ---
function renderAdminPanel(containerId) {
  let pending = getData(PENDING_QA_KEY);
  let exps = getData(EXPERIENCES_KEY);
  let container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (pending.length === 0) {
    container.innerHTML = "<p>No pending questions.</p>";
    return;
  }

  pending.forEach((q, idx) => {
    let exp = exps[q.expIndex];
    let card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p><strong>Company:</strong> ${exp.company}</p>
      <p><strong>Asked By:</strong> ${q.askedBy}</p>
      <p><strong>Question:</strong> ${q.question}</p>
      <button onclick="approveQuestion(${idx})">Approve</button>
      <button onclick="rejectQuestion(${idx})">Reject</button>
    `;
    container.appendChild(card);
  });
}

function approveQuestion(idx) {
  let pending = getData(PENDING_QA_KEY);
  let approved = getData(APPROVED_QA_KEY);

  let q = pending[idx];
  q.status = "approved";
  approved.push(q);

  pending.splice(idx, 1);

  setData(PENDING_QA_KEY, pending);
  setData(APPROVED_QA_KEY, approved);

  renderAdminPanel("admin-container");
}

function rejectQuestion(idx) {
  let pending = getData(PENDING_QA_KEY);
  pending.splice(idx, 1);
  setData(PENDING_QA_KEY, pending);

  renderAdminPanel("admin-container");
}

// --- On Page Load Hooks ---
document.addEventListener("DOMContentLoaded", () => {
  let path = window.location.pathname;

  if (path.includes("experiences.html")) {
    renderExperiences("experiences-container");
  }

  if (path.includes("admin.html")) {
    let user = getLoggedInUser();
    if (!user || user.role !== "admin") {
      alert("Unauthorized access!");
      window.location.href = "index.html";
    } else {
      renderAdminPanel("admin-container");
    }
  }
});
