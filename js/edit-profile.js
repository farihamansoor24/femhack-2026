// ===========================================================
// js/edit-profile.js
// ===========================================================

import { requireAuth } from "./auth.js";
import { updateUserProfile } from "./db.js";
import { renderNav } from "./nav.js";
import { toast } from "./ui.js";
import { fadeIn, shake, pulse } from "./anim.js";
import { uploadToCloudinary, validateImageFile } from "./cloudinary.js";

let currentUser, currentProfile;
let pendingImageUrl = null; // set once a new photo finishes uploading

requireAuth(null, async ({ user, profile }) => {
  currentUser = user;
  currentProfile = profile;
  renderNav({ profile, active: "profile" });
  fadeIn("#head-block");
  fadeIn("#photo-card", { delay: .05, x: -10, y: 0 });
  fadeIn("#form-card", { delay: .1, x: 10, y: 0 });
  populateForm();
});

function populateForm() {
  document.getElementById("name").value = currentProfile.name || "";
  document.getElementById("email").value = currentProfile.email || "";
  document.getElementById("bio").value = currentProfile.bio || "";
  setAvatar(currentProfile.profileImageUrl, currentProfile.name);

  if (currentProfile.role === "provider") {
    document.getElementById("provider-only").classList.remove("hidden");
    const tradeSelect = document.getElementById("trade");
    if (tradeSelect) {
      tradeSelect.value = (currentProfile.trade || "").toLowerCase();
    }
    document.getElementById("hourlyRate").value = currentProfile.hourlyRate || "";
  }
}

function setAvatar(url, name) {
  const preview = document.getElementById("avatar-preview");
  if (url) {
    preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover" alt="Profile photo">`;
  } else {
    preview.textContent = initials(name);
  }
}

/* ---------------- Photo upload ---------------- */
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("photo-input");
const progressWrap = document.getElementById("upload-progress-wrap");
const progressBar = document.getElementById("upload-progress-bar");
const dropzoneLabel = document.getElementById("dropzone-label");
const avatarRing = document.getElementById("avatar-ring");

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

["dragover", "dragenter"].forEach(evt => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("border-rust", "bg-rust/10"); });
});
["dragleave", "drop"].forEach(evt => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("border-rust", "bg-rust/10"); });
});
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

async function handleFile(file) {
  try {
    validateImageFile(file);
  } catch (err) {
    toast(err.message, "error");
    shake(dropzone);
    return;
  }

  // Instant local preview while the upload streams in the background.
  const localUrl = URL.createObjectURL(file);
  setAvatar(localUrl, currentProfile.name);

  progressWrap.classList.remove("hidden");
  progressBar.style.width = "0%";
  dropzoneLabel.textContent = "Uploading…";

  try {
    const secureUrl = await uploadToCloudinary(file, (pct) => { progressBar.style.width = pct + "%"; });
    pendingImageUrl = secureUrl;
    setAvatar(secureUrl, currentProfile.name);
    dropzoneLabel.textContent = "Click or drag a photo here";
    progressWrap.classList.add("hidden");
    pulse(avatarRing.parentElement, 1.06);
    toast("Photo uploaded — don't forget to save.");
  } catch (err) {
    dropzoneLabel.textContent = "Click or drag a photo here";
    progressWrap.classList.add("hidden");
    setAvatar(currentProfile.profileImageUrl, currentProfile.name);
    toast(err.message, "error");
  }
}

/* ---------------- Save form ---------------- */
const form = document.getElementById("profile-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const bio = document.getElementById("bio").value.trim();
  const isProvider = currentProfile.role === "provider";
  const tradeSelect = document.getElementById("trade");
  const trade = isProvider ? (tradeSelect ? tradeSelect.value.toLowerCase().trim() : "") : undefined;
  const hourlyRate = isProvider ? document.getElementById("hourlyRate").value : undefined;

  let valid = true;
  setErr("name", !name); if (!name) valid = false;
  if (isProvider) { setErr("trade", !trade); if (!trade) valid = false; }
  if (!valid) { shake(form); return; }

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true; btn.textContent = "Saving…";

  try {
    const payload = { name, bio, role: currentProfile.role };
    if (isProvider) { payload.trade = trade; payload.hourlyRate = hourlyRate; }
    if (pendingImageUrl) payload.profileImageUrl = pendingImageUrl;

    await updateUserProfile(currentUser.uid, payload);

    // keep local state in sync in case the user keeps editing
    currentProfile = { ...currentProfile, ...payload };
    pendingImageUrl = null;

    showSuccess("Profile updated.");
    toast("Profile saved");
  } catch (err) {
    showError(err.message);
    shake(form);
  } finally {
    btn.disabled = false; btn.textContent = "Save changes";
  }
});

function setErr(id, isBad) { document.getElementById(id + "-error")?.classList.toggle("hidden", !isBad); }
function showError(msg) { document.getElementById("form-success").classList.add("hidden"); const el = document.getElementById("form-error"); el.textContent = msg; el.classList.remove("hidden"); }
function showSuccess(msg) { document.getElementById("form-error").classList.add("hidden"); const el = document.getElementById("form-success"); el.textContent = msg; el.classList.remove("hidden"); }
function initials(name) { return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }