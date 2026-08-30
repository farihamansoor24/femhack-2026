import { getState } from "./state.js";
import { showToast } from "./utils.js";
import { animatePageIn } from "./animations.js";

const routes = [];
let notFoundHandler = null;

/**
 * @param {string} pattern e.g. "/provider/:id"
 * @param {(params: object, mount: HTMLElement) => void} handler
 * @param {{auth?: boolean, role?: 'customer'|'provider'}} guard
 */
export function registerRoute(pattern, handler, guard = {}) {
  const paramNames = [];
  const regex = new RegExp(
    "^" +
      pattern
        .split("/")
        .map((seg) => {
          if (seg.startsWith(":")) {
            paramNames.push(seg.slice(1));
            return "([^/]+)";
          }
          return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/") +
      "$"
  );
  routes.push({ regex, paramNames, handler, guard });
}

export function registerNotFound(handler) {
  notFoundHandler = handler;
}

function matchRoute(path) {
  for (const route of routes) {
    const m = path.match(route.regex);
    if (m) {
      const params = {};
      route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1])));
      return { route, params };
    }
  }
  return null;
}

function currentPath() {
  const hash = window.location.hash || "#/home";
  return hash.slice(1).split("?")[0] || "/home";
}

export async function handleRoute() {
  const mount = document.getElementById("app");
  if (!mount) return;
  const path = currentPath();
  const matched = matchRoute(path);

  if (!matched) {
    if (notFoundHandler) {
      mount.innerHTML = "";
      notFoundHandler(mount);
      animatePageIn(mount);
    }
    return;
  }

  const { route, params } = matched;
  const { user, profile, ready } = getState();

  if (route.guard.auth && ready && !user) {
    showToast("Please log in to continue.", "error");
    window.location.hash = "#/login";
    return;
  }
  if (route.guard.role && ready && profile && profile.role !== route.guard.role) {
    showToast(`That page is for ${route.guard.role}s.`, "error");
    window.location.hash = "#/home";
    return;
  }

  mount.innerHTML = "";
  try {
    await route.handler(params, mount);
    animatePageIn(mount);
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    mount.innerHTML = `<div class="max-w-2xl mx-auto px-5 py-24 text-center">
      <p class="font-display text-2xl mb-2">Something went wrong.</p>
      <p class="text-slate2">${err.message || "Please try again."}</p>
    </div>`;
  }
}

export function initRouter() {
  window.addEventListener("hashchange", handleRoute);
  // Intercept clicks on [data-link] to keep default hash navigation
  // but allow us to run without a full reload.
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (!link) return;
    // let the browser follow the hash normally; hashchange fires handleRoute
  });
  if (!window.location.hash) window.location.hash = "#/home";
  handleRoute();
}

export function navigate(path) {
  window.location.hash = `#${path}`;
}
