import { loginUser } from "../auth.js";
import { validateRequired, markFieldError, showToast } from "../utils.js";
import { fadeIn } from "../animations.js";

// export async function renderLogin(params, mount) {
//   mount.innerHTML = `
//     <section class="max-w-md mx-auto px-5 py-16 sm:py-24">
//       <div class="ticket pl-9 pr-6 sm:pr-8 py-9">
//         <div class="ticket-notch"></div>
//         <p class="eyebrow mb-2">Welcome back</p>
//         <h1 class="font-display text-2xl mb-6">Log in to Guildwork</h1>

//         <form id="login-form" novalidate class="space-y-4">
//           <div>
//             <label class="text-sm font-medium block mb-1.5" for="email">Email</label>
//             <input id="email" name="email" type="email" required
//               class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
//           </div>
//           <div>
//             <label class="text-sm font-medium block mb-1.5" for="password">Password</label>
//             <input id="password" name="password" type="password" required
//               class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
//           </div>
//           <button type="submit" id="submit-btn" class="w-full bg-ink text-paper font-semibold py-3.5 rounded-sm hover:bg-ink2 transition-colors">
//             Log in
//           </button>
//         </form>

//         <p class="text-sm text-slate2 mt-6 text-center">
//           New here? <a href="#/register" data-link class="text-brass font-semibold">Create an account</a>
//         </p>
//       </div>
//     </section>
//   `;

  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = ["email", "password"];
    const { valid, errors, values } = validateRequired(form, fields);
    fields.forEach((f) => markFieldError(form, f, errors.includes(f)));
    if (!valid) {
      showToast("Please enter your email and password.", "error");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Logging in\u2026";
    try {
      await loginUser({ email: values.email, password: values.password });
      
      showToast("Welcome back!", "success");
      
      //  window.location.hash = "#/home";
         window.location.href = "index.html";

    } catch (err) {
      showToast(friendlyAuthError(err), "error");
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });

  fadeIn(".ticket");
// }

function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "That email or password doesn't match our records.";
  }
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait a moment and try again.";
  return "Couldn't log you in. Please try again.";
}
