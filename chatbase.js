(function () {
  "use strict";

  if (document.getElementById("northwest-chatbot-root")) return;

  const BUSINESS = {
    name: "Northwest Security & Lock",
    phoneDisplay: "(503) 760-1402",
    phone: "+15037601402",
    email: "pnwlocksmithor@gmail.com",
    address: "14750 SE Division St, Portland, OR 97236",
    established: "1985",
  };

  const phoneLink = `tel:${BUSINESS.phone}`;
  const textLink = `sms:${BUSINESS.phone}`;

  const styles = document.createElement("style");
  styles.id = "northwest-chatbot-styles";
  styles.textContent = `
    #northwest-chatbot-root {
      --nw-gold: #f3b51b;
      --nw-gold-dark: #d89a00;
      --nw-ink: #111214;
      --nw-panel: #191b1f;
      --nw-line: rgba(255,255,255,.12);
      --nw-muted: #b8bcc5;
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483000;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #northwest-chatbot-root * { box-sizing: border-box; }
    .nw-chat-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 56px;
      padding: 0 18px;
      border: 1px solid rgba(0,0,0,.22);
      border-radius: 999px;
      background: var(--nw-gold);
      color: var(--nw-ink);
      box-shadow: 0 14px 42px rgba(0,0,0,.28);
      font: inherit;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
    }
    .nw-chat-toggle:hover { background: #ffc532; transform: translateY(-1px); }
    .nw-chat-toggle:focus-visible,
    .nw-chat-close:focus-visible,
    .nw-chat-form input:focus-visible,
    .nw-chat-form button:focus-visible,
    .nw-chat-chip:focus-visible,
    .nw-chat-action:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    .nw-chat-toggle svg { width: 23px; height: 23px; flex: 0 0 auto; }
    .nw-chat-panel {
      display: none;
      position: absolute;
      right: 0;
      bottom: 70px;
      width: min(390px, calc(100vw - 28px));
      height: min(600px, calc(100vh - 112px));
      min-height: 430px;
      overflow: hidden;
      border: 1px solid var(--nw-line);
      border-radius: 20px;
      background: var(--nw-panel);
      color: #fff;
      box-shadow: 0 24px 80px rgba(0,0,0,.42);
    }
    .nw-chat-panel[data-open="true"] { display: flex; flex-direction: column; }
    .nw-chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 17px;
      border-bottom: 1px solid var(--nw-line);
      background: #111214;
    }
    .nw-chat-mark {
      display: grid;
      width: 40px;
      height: 40px;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 12px;
      background: var(--nw-gold);
      color: var(--nw-ink);
      font-size: 20px;
      font-weight: 1000;
    }
    .nw-chat-heading { min-width: 0; flex: 1; }
    .nw-chat-heading strong { display: block; font-size: 14px; line-height: 1.2; }
    .nw-chat-heading span { color: var(--nw-muted); font-size: 12px; }
    .nw-chat-close {
      display: grid;
      width: 36px;
      height: 36px;
      place-items: center;
      border: 0;
      border-radius: 10px;
      background: rgba(255,255,255,.07);
      color: #fff;
      font: inherit;
      font-size: 23px;
      cursor: pointer;
    }
    .nw-chat-log {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
      scroll-behavior: smooth;
    }
    .nw-chat-message { display: flex; margin: 0 0 14px; }
    .nw-chat-message[data-role="user"] { justify-content: flex-end; }
    .nw-chat-bubble {
      max-width: 88%;
      padding: 11px 13px;
      border: 1px solid var(--nw-line);
      border-radius: 15px 15px 15px 4px;
      background: #24272d;
      color: #f7f7f8;
      font-size: 14px;
      line-height: 1.48;
      white-space: pre-line;
    }
    .nw-chat-message[data-role="user"] .nw-chat-bubble {
      border-color: transparent;
      border-radius: 15px 15px 4px 15px;
      background: var(--nw-gold);
      color: var(--nw-ink);
      font-weight: 700;
      white-space: normal;
    }
    .nw-chat-actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
    .nw-chat-action {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 7px 11px;
      border: 1px solid rgba(243,181,27,.46);
      border-radius: 999px;
      color: #ffd665;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
    }
    .nw-chat-action.primary { background: var(--nw-gold); color: var(--nw-ink); }
    .nw-chat-quick {
      display: flex;
      gap: 7px;
      overflow-x: auto;
      padding: 0 14px 12px;
      scrollbar-width: none;
    }
    .nw-chat-quick::-webkit-scrollbar { display: none; }
    .nw-chat-chip {
      flex: 0 0 auto;
      min-height: 34px;
      padding: 7px 11px;
      border: 1px solid var(--nw-line);
      border-radius: 999px;
      background: #24272d;
      color: #fff;
      font: inherit;
      font-size: 12px;
      font-weight: 750;
      cursor: pointer;
    }
    .nw-chat-chip:hover { border-color: var(--nw-gold); color: #ffd665; }
    .nw-chat-form {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid var(--nw-line);
      background: #111214;
    }
    .nw-chat-form input {
      min-width: 0;
      min-height: 44px;
      flex: 1;
      border: 1px solid var(--nw-line);
      border-radius: 12px;
      background: #23262b;
      color: #fff;
      padding: 0 12px;
      font: inherit;
      font-size: 14px;
    }
    .nw-chat-form input::placeholder { color: #9298a3; }
    .nw-chat-form button {
      width: 44px;
      min-height: 44px;
      border: 0;
      border-radius: 12px;
      background: var(--nw-gold);
      color: var(--nw-ink);
      font: inherit;
      font-size: 20px;
      font-weight: 1000;
      cursor: pointer;
    }
    .nw-chat-note {
      margin: 0;
      padding: 0 14px 11px;
      background: #111214;
      color: #8f96a2;
      font-size: 10px;
      text-align: center;
    }
    @media (max-width: 700px) {
      #northwest-chatbot-root { right: 12px; bottom: calc(78px + env(safe-area-inset-bottom)); }
      .nw-chat-panel {
        position: fixed;
        inset: 12px 12px calc(78px + env(safe-area-inset-bottom));
        width: auto;
        height: auto;
        min-height: 0;
      }
      .nw-chat-toggle span { display: none; }
      .nw-chat-toggle { width: 56px; padding: 0; justify-content: center; }
    }
    @media (prefers-reduced-motion: reduce) {
      .nw-chat-log { scroll-behavior: auto; }
      .nw-chat-toggle:hover { transform: none; }
    }
  `;
  document.head.appendChild(styles);

  const root = document.createElement("div");
  root.id = "northwest-chatbot-root";
  root.innerHTML = `
    <section class="nw-chat-panel" data-open="false" role="dialog" aria-modal="false" aria-label="Northwest Security and Lock assistant">
      <header class="nw-chat-header">
        <div class="nw-chat-mark" aria-hidden="true">N</div>
        <div class="nw-chat-heading">
          <strong>Northwest Security &amp; Lock</strong>
          <span>Portland locksmith assistant</span>
        </div>
        <button class="nw-chat-close" type="button" aria-label="Close chat">&times;</button>
      </header>
      <div class="nw-chat-log" role="log" aria-live="polite" aria-relevant="additions"></div>
      <div class="nw-chat-quick" aria-label="Common locksmith questions">
        <button class="nw-chat-chip" type="button" data-message="I am locked out">Emergency lockout</button>
        <button class="nw-chat-chip" type="button" data-message="I need help with a car key">Car key help</button>
        <button class="nw-chat-chip" type="button" data-message="I need my home rekeyed">Home rekey</button>
        <button class="nw-chat-chip" type="button" data-message="I need commercial security help">Business security</button>
      </div>
      <form class="nw-chat-form">
        <input type="text" maxlength="500" autocomplete="off" aria-label="Ask Northwest Security and Lock" placeholder="Ask about locksmith service...">
        <button type="submit" aria-label="Send message">&#8593;</button>
      </form>
      <p class="nw-chat-note">For emergencies, call the shop. Chat does not confirm an appointment.</p>
    </section>
    <button class="nw-chat-toggle" type="button" aria-expanded="false" aria-label="Open Northwest Security and Lock assistant">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16v12H8l-4 4V4Zm3 4v2h10V8H7Zm0 4v2h7v-2H7Z"/></svg>
      <span>Ask Northwest</span>
    </button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector(".nw-chat-panel");
  const toggle = root.querySelector(".nw-chat-toggle");
  const close = root.querySelector(".nw-chat-close");
  const log = root.querySelector(".nw-chat-log");
  const form = root.querySelector(".nw-chat-form");
  const input = form.querySelector("input");

  const actions = {
    call: { label: `Call ${BUSINESS.phoneDisplay}`, href: phoneLink, primary: true },
    text: { label: "Text job details", href: textLink },
    email: { label: "Email the shop", href: `mailto:${BUSINESS.email}` },
    directions: {
      label: "Open address",
      href: "https://www.google.com/maps/search/?api=1&query=14750%20SE%20Division%20St%2C%20Portland%2C%20OR%2097236",
    },
  };

  function addMessage(role, text, messageActions) {
    const row = document.createElement("div");
    row.className = "nw-chat-message";
    row.dataset.role = role;

    const bubble = document.createElement("div");
    bubble.className = "nw-chat-bubble";
    bubble.textContent = text;

    if (messageActions && messageActions.length) {
      const links = document.createElement("div");
      links.className = "nw-chat-actions";
      messageActions.forEach((action) => {
        const link = document.createElement("a");
        link.className = `nw-chat-action${action.primary ? " primary" : ""}`;
        link.href = action.href;
        link.textContent = action.label;
        if (action.href.startsWith("http")) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        links.appendChild(link);
      });
      bubble.appendChild(links);
    }

    row.appendChild(bubble);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  const includesAny = (value, terms) => terms.some((term) => value.includes(term));

  function makeTextAction(message) {
    return {
      label: "Text these details",
      href: `${textLink}?body=${encodeURIComponent(`Northwest Security & Lock service request: ${message}`)}`,
    };
  }

  function getAnswer(rawMessage) {
    const message = rawMessage.toLowerCase().replace(/[^a-z0-9\s'&-]/g, " ").replace(/\s+/g, " ").trim();

    if (includesAny(message, ["pick a lock", "lock picking", "bypass a lock", "break into", "disable alarm", "defeat a lock", "hotwire"])) {
      return {
        text: "I can’t provide instructions for bypassing locks, alarms, or access controls. If this is your property or vehicle, call Northwest Security & Lock for legitimate entry or repair service.",
        actions: [actions.call],
      };
    }

    if (includesAny(message, ["who are you", "what company", "what can you do", "how can you help", "about you"])) {
      return {
        text: `I’m the website assistant for ${BUSINESS.name}, a Portland locksmith serving vehicles, homes, and businesses since ${BUSINESS.established}. I only answer questions about Northwest services, service areas, and contacting the shop.`,
        actions: [actions.call, actions.text],
      };
    }

    if (/^(hi|hello|hey|help|good morning|good afternoon|good evening)$/.test(message)) {
      return {
        text: "Hi—I’m here specifically for Northwest Security & Lock. Tell me whether you need help with a lockout, car key, home lock, commercial door, or access control.",
        actions: [actions.call],
      };
    }

    if (includesAny(message, ["locked out", "lockout", "emergency", "urgent", "right now", "asap", "stuck outside"])) {
      return {
        text: `For a lockout or urgent problem, call ${BUSINESS.phoneDisplay}. A direct call is the fastest way to confirm the location, type of lockout, and current availability.`,
        actions: [actions.call, actions.text],
      };
    }

    if (includesAny(message, ["phone", "call", "contact", "email", "reach you"])) {
      return {
        text: `Call ${BUSINESS.phoneDisplay} or email ${BUSINESS.email}. For immediate service, calling is best.`,
        actions: [actions.call, actions.text, actions.email],
      };
    }

    if (includesAny(message, ["address", "located", "location", "where are you", "shop"])) {
      return {
        text: `${BUSINESS.name} is at ${BUSINESS.address}. Call before heading over if you need a specific service or immediate help.`,
        actions: [actions.call, actions.directions],
      };
    }

    if (includesAny(message, ["hours", "open", "24/7", "twenty four", "weekend", "tonight", "sunday", "saturday"])) {
      return {
        text: `The website lists 24/7 emergency availability. Call ${BUSINESS.phoneDisplay} to confirm the fastest available response for your job.`,
        actions: [actions.call],
      };
    }

    if (includesAny(message, ["service area", "serve", "portland", "gresham", "happy valley", "milwaukie", "clackamas", "beaverton", "oregon", "zip"])) {
      return {
        text: "Northwest is based in SE Portland and serves the Portland metro, including Portland, Gresham, Happy Valley, Milwaukie, and Clackamas. Call with your exact address to confirm coverage and timing.",
        actions: [actions.call, actions.text],
      };
    }

    if (includesAny(message, ["price", "cost", "quote", "estimate", "how much", "rate", "fee"])) {
      return {
        text: "Pricing depends on the lock, key, door or vehicle, location, timing, and parts required. Send the service type, location, photos, and vehicle year/make/model when relevant; the shop can then discuss the next step.",
        actions: [actions.call, makeTextAction(rawMessage)],
      };
    }

    if (includesAny(message, ["appointment", "schedule", "book", "availability", "available", "come out", "dispatch"])) {
      return {
        text: `This chat can’t confirm an appointment or dispatch time. Call ${BUSINESS.phoneDisplay}; the shop will confirm availability directly.`,
        actions: [actions.call, makeTextAction(rawMessage)],
      };
    }

    if (includesAny(message, ["car", "vehicle", "auto", "key fob", "fob", "transponder", "ignition", "lost key", "spare key", "motorcycle", "truck"])) {
      return {
        text: "Northwest handles vehicle lockouts and car-key questions. Have the year, make, model, location, key type, and whether any working key remains. Call to confirm the exact vehicle service and availability.",
        actions: [actions.call, makeTextAction(rawMessage)],
      };
    }

    if (includesAny(message, ["rekey", "new house", "moved", "deadbolt", "smart lock", "front door", "home", "house", "residential", "apartment", "tenant"])) {
      return {
        text: "Northwest provides residential rekeys, lock repair, deadbolt and smart-lock installation, and lockout help. Include the number of doors, hardware photos, location, and timing when you contact the shop.",
        actions: [actions.call, makeTextAction(rawMessage)],
      };
    }

    if (includesAny(message, ["commercial", "business", "office", "store", "master key", "door closer", "panic bar", "exit device", "keypad", "access control", "badge", "intercom"])) {
      return {
        text: "Northwest supports commercial locks, rekeys, master-key questions, door hardware, keypads, and access-control planning. Send the site location, door count, hardware photos, and what needs to change.",
        actions: [actions.call, makeTextAction(rawMessage)],
      };
    }

    if (includesAny(message, ["lock", "key", "door", "safe", "security", "repair", "install", "hardware", "locksmith"])) {
      return {
        text: "That may be something Northwest can help with. For an accurate answer, send the location, timing, and clear photos of the lock, key, door, or hardware—or call the shop directly.",
        actions: [actions.call, makeTextAction(rawMessage)],
      };
    }

    return {
      text: "I only help with Northwest Security & Lock—lockouts, vehicle keys, home locks, commercial hardware, access control, service areas, and contacting the shop. Ask me about one of those, or call for direct help.",
      actions: [actions.call],
    };
  }

  function respond(message) {
    const clean = message.trim();
    if (!clean) return;
    addMessage("user", clean);
    const answer = getAnswer(clean);
    window.setTimeout(() => addMessage("assistant", answer.text, answer.actions), 120);
  }

  function setOpen(open) {
    panel.dataset.open = String(open);
    panel.setAttribute("aria-modal", String(open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close Northwest Security and Lock assistant" : "Open Northwest Security and Lock assistant");
    if (open) window.setTimeout(() => input.focus(), 0);
  }

  toggle.addEventListener("click", () => setOpen(panel.dataset.open !== "true"));
  close.addEventListener("click", () => setOpen(false));
  root.querySelectorAll(".nw-chat-chip").forEach((chip) => {
    chip.addEventListener("click", () => respond(chip.dataset.message || ""));
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value;
    input.value = "";
    respond(message);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.dataset.open === "true") setOpen(false);
  });

  addMessage(
    "assistant",
    `Hi—I’m the ${BUSINESS.name} assistant. I only help with Northwest locksmith services. Are you dealing with a lockout, car key, home lock, commercial door, or access control?`,
    [actions.call]
  );
})();
