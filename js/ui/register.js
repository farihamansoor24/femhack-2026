import { registerUser } from "../auth.js";
import { validateRequired, markFieldError, showToast } from "../utils.js";
import { fadeIn } from "../animations.js";

 let selectedRole = "customer";

// export async function renderRegister(params, mount) {
//   selectedRole = "customer";
//   mount.innerHTML = `
//     <section class="max-w-md mx-auto px-5 py-16 sm:py-24">
//       <div class="ticket pl-9 pr-6 sm:pr-8 py-9">
//         <div class="ticket-notch"></div>
//         <p class="eyebrow mb-2">Join the guild</p>
//         <h1 class="font-display text-2xl mb-6">Create your account</h1>

//         <div class="grid grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Account type">
//           <button type="button" data-role="customer" class="role-btn chip active !py-3 !px-3 text-center">I need a service</button>
//           <button type="button" data-role="provider" class="role-btn chip !py-3 !px-3 text-center">I provide a service</button>
//         </div>

//         <form id="register-form" novalidate class="space-y-4">
//           <div>
//             <label class="text-sm font-medium block mb-1.5" for="name">Full name</label>
//             <input id="name" name="name" type="text" required
//               class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
//           </div>
//           <div>
//             <label class="text-sm font-medium block mb-1.5" for="email">Email</label>
//             <input id="email" name="email" type="email" required
//               class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
//           </div>
//           <div>
//             <label class="text-sm font-medium block mb-1.5" for="password">Password</label>
//             <input id="password" name="password" type="password" minlength="6" required
//               class="w-full px-4 py-3 border border-ink/10 rounded-sm text-sm focus:border-brass outline-none" />
//             <p class="text-xs text-slate2 mt-1">At least 6 characters.</p>
//           </div>
//           <button type="submit" id="submit-btn" class="w-full bg-ink text-paper font-semibold py-3.5 rounded-sm hover:bg-ink2 transition-colors">
//             Create account
//           </button>
//         </form>

//         <p class="text-sm text-slate2 mt-6 text-center">
//           Already have an account? <a href="#/login" data-link class="text-brass font-semibold">Log in</a>
//         </p>
//       </div>
//     </section>
//   `;

//   // mount.querySelectorAll(".role-btn").forEach((btn) => {
//   //   btn.addEventListener("click", () => {
//   //     selectedRole = btn.dataset.role;
//   //     mount.querySelectorAll(".role-btn").forEach((b) => b.classList.remove("active"));
//   //     btn.classList.add("active");
//   //   });
//   // });

  const form = document.getElementById("register-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = ["name", "email", "password"];
    const { valid, errors, values } = validateRequired(form, fields);
    fields.forEach((f) => markFieldError(form, f, errors.includes(f)));
    if (!valid) {
      
      showToast("Please fill in every field.", "error");
      return;
    }
    if (values.password.length < 6) {
      markFieldError(form, "password", true);
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Creating account\u2026";
    try {
      await registerUser({ name: values.name, email: values.email, password: values.password, role: selectedRole });
      showToast("Account created. Welcome to Guildwork!", "success");
      // window.location.hash = selectedRole === "provider" ? "#/provider/profile" : "#/home";
          window.location.href = selectedRole === "provider" ? "#/provider/profile" : "index.html";

    } catch (err) {
     
      showToast(friendlyAuthError(err), "error");
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });

  fadeIn(".ticket");


function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "That email is already registered. Try logging in instead.";
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  if (code.includes("weak-password")) return "Please choose a stronger password.";
  return "Couldn't create your account. Please try again.";
}
