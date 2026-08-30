import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// import { SEED_PROVIDERS } from "./seed-data.js";
import { generateBookingId } from "./utils.js";

// ---------- Providers ----------

export async function seedProvidersIfEmpty() {
  const snap = await getDocs(collection(db, "providers"));
  if (!snap.empty) return;
  await Promise.all(
    SEED_PROVIDERS.map((p) => setDoc(doc(db, "providers", p.id), p))
  );
}

export async function getAllProviders() {
  const snap = await getDocs(collection(db, "providers"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    // hide provider accounts that haven't filled in a service/name yet
    .filter((p) => p.service && p.name);
}

export async function getProviderById(id) {
  const snap = await getDoc(doc(db, "providers", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function upsertProviderProfile(uid, data) {
  await setDoc(doc(db, "providers", uid), { id: uid, ...data }, { merge: true });
}

// ---------- Bookings ----------

export async function createBooking({
  customerId,
  customerName,
  providerId,
  providerName,
  service,
  date,
  time,
  location,
  description,
}) {
  const bookingId = generateBookingId();
  const ref = await addDoc(collection(db, "bookings"), {
    bookingId,
    customerId,
    customerName,
    providerId,
    providerName,
    service,
    date,
    time,
    location,
    description,
    status: "pending",
    review: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { docId: ref.id, bookingId };
}

// Sorted client-side (instead of an orderBy() in the query) so no
// composite Firestore index needs to be created for the demo to work.
function sortByCreatedDesc(docs) {
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });
}

export function listenCustomerBookings(customerId, onChange) {
  const q = query(collection(db, "bookings"), where("customerId", "==", customerId));
  return onSnapshot(q, (snap) => {
    onChange(sortByCreatedDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  });
}

export function listenProviderBookings(providerId, onChange) {
  const q = query(collection(db, "bookings"), where("providerId", "==", providerId));
  return onSnapshot(q, (snap) => {
    onChange(sortByCreatedDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  });
}

const ALLOWED_TRANSITIONS = {
  pending: ["accepted", "rejected"],
  accepted: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  rejected: [],
};

export function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export async function updateBookingStatus(bookingDocId, fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    throw new Error(`Cannot move a booking from "${fromStatus}" to "${toStatus}".`);
  }
  await updateDoc(doc(db, "bookings", bookingDocId), {
    status: toStatus,
    updatedAt: serverTimestamp(),
  });
}

// ---------- Reviews ----------

export async function submitReview(bookingDocId, providerId, { rating, comment }) {
  const bookingRef = doc(db, "bookings", bookingDocId);
  const bookingSnap = await getDoc(bookingRef);
  if (!bookingSnap.exists()) throw new Error("Booking not found.");
  const booking = bookingSnap.data();

  if (booking.status !== "completed") {
    throw new Error("You can only review a completed booking.");
  }
  if (booking.review) {
    throw new Error("This booking already has a review.");
  }

  await updateDoc(bookingRef, {
    review: { rating, comment, createdAt: new Date().toISOString() },
    updatedAt: serverTimestamp(),
  });

  // Recompute the provider's running average rating.
  const providerRef = doc(db, "providers", providerId);
  const providerSnap = await getDoc(providerRef);
  if (providerSnap.exists()) {
    const p = providerSnap.data();
    const prevCount = p.reviewCount || 0;
    const prevRating = p.rating || 0;
    const newCount = prevCount + 1;
    const newRating = (prevRating * prevCount + rating) / newCount;
    await updateDoc(providerRef, {
      rating: Math.round(newRating * 10) / 10,
      reviewCount: newCount,
    });
  }
}
