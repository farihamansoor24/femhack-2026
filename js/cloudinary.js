// ===========================================================
// cloudinary.js
// Uploads an image file straight from the browser to Cloudinary
// using an unsigned upload preset — no server needed.
// ===========================================================

// import { cloudinaryConfig } from "./js/cloudinary-config.js";
const cloudinaryConfig = {
  cloudName: "bkvaftts",
  uploadPreset: "preset_femhack2026",
  // Optional: keep uploads organized in one folder in your Cloudinary
  // media library. Leave blank to disable.
  folder: "GUILDWORK-profile-photos"
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageFile(file) {
  if (!file) throw new Error("No file selected.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is too large — please choose one under 5MB.");
  }
}

/**
 * Uploads `file` to Cloudinary and resolves with the resulting
 * secure_url. Calls onProgress(percent) as the upload streams.
 */
export function uploadToCloudinary(file, onProgress) {
  validateImageFile(file);

  const { cloudName, uploadPreset, folder } = cloudinaryConfig;
  if (!cloudName || cloudName !== "bkvaftts") {
    return Promise.reject(new Error("Cloudinary isn't configured yet — set cloudName and uploadPreset in cloudinary-config.js."));
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (folder) formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let res;
      try { res = JSON.parse(xhr.responseText); } catch { res = null; }
      if (xhr.status >= 200 && xhr.status < 300 && res && res.secure_url) {
        resolve(res.secure_url);
      } else {
        reject(new Error((res && res.error && res.error.message) || "Upload failed. Check your Cloudinary preset/cloud name."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}
