// ===========================================================
// db.js
// All Firestore reads/writes. Business rules are enforced here,
// centrally, so no individual page can bypass them.
// ===========================================================

import { db,collection, doc, addDoc, updateDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, serverTimestamp, } from "./firebase-config.js";

/* ------------------------------------------------------------------ *
 * Providers / profiles
 * ------------------------------------------------------------------ */

export async function listProviders() {
  const q = query(collection(db, "users"), where("role", "==", "provider"));
  
  const snap = await getDocs(q);
  
  return snap.docs.map(d => d.data());
}

export async function getProvider(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("Provider not found.");
  return snap.data();
}

/**
 * Update the signed-in user's own profile (name, bio, and — for
 * providers — trade/hourlyRate/profileImageUrl). Role is never
 * touched here; it's set once at signup.
 */
export async function updateUserProfile(uid, data) {
  const name = (data.name || "").trim();
  if (!name) throw new Error("Name is required.");

  const payload = {
    name,
    bio: (data.bio || "").trim(),
    updatedAt: serverTimestamp()
  };
  if (data.profileImageUrl !== undefined) payload.profileImageUrl = data.profileImageUrl;
  if (data.role === "provider") {
    const trade = (data.trade || "").trim();
    if (!trade) throw new Error("Trade / service category is required.");
    payload.trade = trade;
    payload.hourlyRate = Number(data.hourlyRate) || 0;
  }

  await updateDoc(doc(db, "users", uid), payload);
  return payload;
}

/* ------------------------------------------------------------------ *
 * Bookings — status flow:
 *   pending -> accepted -> in_progress -> completed
 *   pending -> rejected                              (terminal)
 * ------------------------------------------------------------------ */

const ALLOWED_TRANSITIONS = {
  pending: ["accepted", "rejected"],
  accepted: ["in_progress"],
  in_progress: ["completed"],
  rejected: [],
  completed: []
};

function validateBookingInput({ service, preferredDate, preferredTime }) {
  const errors = [];
  if (!service || service.trim() === "") errors.push("Service description is required.");
  if (!preferredDate) errors.push("Preferred date is required.");
  if (!preferredTime) errors.push("Preferred time is required.");
  if (preferredDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const chosen = new Date(preferredDate + "T00:00:00");
    if (chosen < today) errors.push("Preferred date can't be in the past.");
  }
  if (errors.length) throw new Error(errors.join(" "));
}

export async function createBooking({ customer, provider, service, description, preferredDate, preferredTime }) {
  validateBookingInput({ service, preferredDate, preferredTime });

  const docRef = await addDoc(collection(db, "bookings"), {
    customerId: customer.uid,
    customerName: customer.name,
    providerId: provider.uid,
    providerName: provider.name,
    providerTrade: provider.trade || "",
    service: service.trim(),
    description: (description || "").trim(),
    preferredDate, preferredTime,
    status: "pending",
    reviewed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const ticketNumber = "DP-" + docRef.id.slice(-6).toUpperCase();
  await updateDoc(docRef, { bookingId: docRef.id, ticketNumber });
  return { id: docRef.id, ticketNumber };
}

export async function getBookingsForCustomer(customerId) {
  const q = query(collection(db, "bookings"), where("customerId", "==", customerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBookingsForProvider(providerId) {
  const q = query(collection(db, "bookings"), where("providerId", "==", providerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getBooking(bookingId) {
  const snap = await getDoc(doc(db, "bookings", bookingId));
  if (!snap.exists()) throw new Error("Booking not found.");
  return { id: snap.id, ...snap.data() };
}

export async function updateBookingStatus(bookingId, newStatus) {
  const bookingRef = doc(db, "bookings", bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error("Booking not found.");

  const current = snap.data().status;
  const allowed = ALLOWED_TRANSITIONS[current] || [];

  if (!allowed.includes(newStatus)) {
    if (current === "completed") throw new Error("This booking is completed and can't be edited through the normal workflow.");
    if (current === "rejected") throw new Error(`This booking was rejected and can't be moved to ${newStatus.replace("_", " ")}.`);
    throw new Error(`Can't move a booking from "${current}" to "${newStatus}".`);
  }

  await updateDoc(bookingRef, { status: newStatus, updatedAt: serverTimestamp() });
}

/* ------------------------------------------------------------------ *
 * Reviews — doc ID == booking ID, which is what makes a second
 * review for the same booking impossible.
 * ------------------------------------------------------------------ */

export async function submitReview({ bookingId, customerId, providerId, rating, comment }) {
  if (!rating || rating < 1 || rating > 5) throw new Error("Please choose a rating from 1 to 5 stars.");
  if (!comment || comment.trim().length < 5) throw new Error("Please write at least a short comment (5+ characters).");

  const booking = await getBooking(bookingId);
  if (booking.status !== "completed") throw new Error("This booking can't be reviewed until it's marked completed.");
  if (booking.customerId !== customerId) throw new Error("Only the customer who booked this job can leave a review.");

  const reviewRef = doc(db, "reviews", bookingId);
  const existing = await getDoc(reviewRef);
  if (existing.exists() || booking.reviewed) throw new Error("You've already submitted a review for this booking.");

  await setDoc(reviewRef, {
    bookingId, customerId, providerId,
    rating: Number(rating), comment: comment.trim(),
    createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, "bookings", bookingId), { reviewed: true });

  const providerRef = doc(db, "users", providerId);
  const providerSnap = await getDoc(providerRef);
  if (providerSnap.exists()) {
    const p = providerSnap.data();
    const prevCount = p.reviewCount || 0;
    const prevRating = p.rating || 0;
    const newCount = prevCount + 1;
    const newRating = ((prevRating * prevCount) + Number(rating)) / newCount;
    await updateDoc(providerRef, { reviewCount: newCount, rating: newRating });
  }
}

export async function getReviewForBooking(bookingId) {
  const snap = await getDoc(doc(db, "reviews", bookingId));
  return snap.exists() ? snap.data() : null;
}
