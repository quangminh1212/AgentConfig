const $ = (sel) => document.querySelector(sel);

const state = {
  tools: [],
  mitmTools: [],
  statuses: {},
  settings: null,
  currentToolId: null,
};

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2600);
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || "Request failed");
  return data;
}

function statusBadge(tool, status) {
  if (tool.configType === "guide") {
    return { label: "Guide", cls: "badge-info" };
  }
  if (!status || status.installed === false) {
    return { label: "Not installed", cls: "badge-muted" };
  }
  if (status.configured) {
    return { label: "Connected", cls: "badge-ok" };
  }
  return { label: "Not configured", cls: "badge-warn" };
}

function iconHtml(tool) {
  const letter = escapeHtml((tool.name || "?")[0]);
  const color = tool.color || "#888";
  if (tool.image) {
    return `<img class="card-icon" src="${tool.image}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" /><div class="card-icon-fallback" style="background:${color};display:none">${letter}</div>`;
  }
  return `<div class="card-icon-fallback" style="background:${color}">${letter}</div>`;
}

function renderGrid() {
  const grid = $("#tools-grid");
  grid.innerHTML = state.tools.map((tool) => {
    const st = state.statuses[tool.id];
    const b = statusBadge(tool, st);
    return `
      <div class="card" data-tool="${tool.id}" role="button" tabindex="0">
        <div class="card-row">
          ${iconHtml(tool)}
          <div class="card-body">
            <h3 class="card-title">${escapeHtml(tool.name)}</h3>
            <span class="badge ${b.cls}">${b.label}</span>
          </div>
          <span class="chevron">›</span>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => openTool(el.dataset.tool));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openTool(el.dataset.tool);
      }
    });
  });

  const mitm = $("#mitm-grid");
  mitm.innerHTML = state.mitmTools.map((tool) => `
    <div class="card" style="cursor:default;opacity:0.92">
      <div class="card-row">
        ${iconHtml(tool)}
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(tool.name)}</h3>
          <span class="badge badge-muted">MITM · 9router</span>
        </div>
      </div>
    </div>
  `).join("");
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fillTemplate(tpl, vars) {
  return String(tpl || "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function openTool(toolId) {
  const tool = state.tools.find((t) => t.id === toolId);
  if (!tool) return;
  state.currentToolId = toolId;
  history.replaceState(null, "", `/tools/${toolId}`);
  $("#list-shell").classList.add("hidden");
  $("#detail-shell").classList.add("active");
  renderDetail(tool);
}

function closeTool() {
  state.currentToolId = null;
  history.replaceState(null, "", "/");
  $("#list-shell").classList.remove("hidden");
  $("#detail-shell").classList.remove("active");
}

function renderDetail(tool) {
  const st = state.statuses[tool.id] || {};
  const settings = state.settings || {};
  const base = $("#g-base").value || settings.defaultBaseUrl || "";
  const key = $("#g-key").value || settings.defaultApiKey || "";
  const model = $("#g-model").value || settings.defaultModel || tool.defaultModel || "";
  const b = statusBadge(tool, st);

  let body = `
    <div class="detail-head">
      ${iconHtml(tool)}
      <div>
        <h2>${escapeHtml(tool.name)} <span class="badge ${b.cls}">${b.label}</span></h2>
        <p>${escapeHtml(tool.description || "")}</p>
        ${st.configPath ? `<p class="meta">Config: ${escapeHtml(st.configPath)}</p>` : ""}
        ${st.baseUrl ? `<p class="meta">Current endpoint: ${escapeHtml(st.baseUrl)}</p>` : ""}
        ${st.model ? `<p class="meta">Model: ${escapeHtml(st.model)}</p>` : ""}
        ${tool.settingsHint ? `<p class="meta">Hint: ${escapeHtml(tool.settingsHint)}</p>` : ""}
      </div>
    </div>
  `;

  if (tool.configType === "writable") {
    body += `
      <div class="form-grid cols-2">
        <label class="field">Base URL
          <input class="input" id="d-base" value="${escapeHtml(base)}" />
        </label>
        <label class="field">API Key
          <input class="input" id="d-key" value="${escapeHtml(key)}" />
        </label>
        <label class="field">Model
          <input class="input" id="d-model" value="${escapeHtml(model)}" />
        </label>
      </div>
      <div class="actions">
        <button class="btn btn-primary" id="d-apply" type="button">Apply settings</button>
        <button class="btn btn-danger" id="d-reset" type="button">Reset</button>
      </div>
      <div id="d-msg"></div>
    `;
  } else {
    const notes = (tool.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");
    const code = tool.codeTemplate
      ? fillTemplate(tool.codeTemplate, { baseUrl: base, apiKey: key || "<API_KEY>", model: model || "model-id" })
      : "";
    body += `
      <div class="form-grid cols-2">
        <label class="field">Base URL (copy)
          <input class="input" id="d-base" value="${escapeHtml(base)}" readonly />
        </label>
        <label class="field">API Key (copy)
          <input class="input" id="d-key" value="${escapeHtml(key)}" readonly />
        </label>
      </div>
      ${notes ? `<ul class="notes">${notes}</ul>` : ""}
      ${code ? `<pre class="code-block">${escapeHtml(code)}</pre>
        <div class="actions"><button class="btn" id="d-copy" type="button">Copy config</button></div>` : ""}
      <div class="actions" style="margin-top:0.5rem">
        <button class="btn" id="d-copy-url" type="button">Copy Base URL</button>
        <button class="btn" id="d-copy-key" type="button">Copy API Key</button>
      </div>
    `;
  }

  $("#detail-card").innerHTML = body;

  if (tool.configType === "writable") {
    $("#d-apply")?.addEventListener("click", async () => {
      const msg = $("#d-msg");
      try {
        $("#d-apply").disabled = true;
        await api(`/api/tools/${tool.id}/apply`, {
          method: "POST",
          body: JSON.stringify({
            baseUrl: $("#d-base").value.trim(),
            apiKey: $("#d-key").value.trim(),
            model: $("#d-model").value.trim(),
          }),
        });
        msg.className = "msg ok";
        msg.textContent = "Settings applied successfully!";
        toast(`${tool.name}: applied`);
        await refreshStatuses();
        renderDetail(state.tools.find((t) => t.id === tool.id));
      } catch (e) {
        msg.className = "msg err";
        msg.textContent = e.message;
      } finally {
        $("#d-apply") && ($("#d-apply").disabled = false);
      }
    });
    $("#d-reset")?.addEventListener("click", async () => {
      const msg = $("#d-msg");
      try {
        await api(`/api/tools/${tool.id}/reset`, { method: "DELETE" });
        msg.className = "msg ok";
        msg.textContent = "Settings reset successfully!";
        toast(`${tool.name}: reset`);
        await refreshStatuses();
        renderDetail(state.tools.find((t) => t.id === tool.id));
      } catch (e) {
        msg.className = "msg err";
        msg.textContent = e.message;
      }
    });
  } else {
    $("#d-copy")?.addEventListener("click", async () => {
      const pre = document.querySelector(".code-block");
      if (pre) {
        await navigator.clipboard.writeText(pre.textContent);
        toast("Copied config");
      }
    });
    $("#d-copy-url")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText($("#d-base").value);
      toast("Copied Base URL");
    });
    $("#d-copy-key")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText($("#d-key").value);
      toast("Copied API Key");
    });
  }
}

async function refreshStatuses() {
  state.statuses = await api("/api/tools/statuses");
  if (!state.currentToolId) renderGrid();
}

async function loadAll() {
  const [toolsData, settings, statuses] = await Promise.all([
    api("/api/tools"),
    api("/api/settings"),
    api("/api/tools/statuses"),
  ]);
  state.tools = toolsData.tools || [];
  state.mitmTools = toolsData.mitmTools || [];
  state.settings = settings;
  state.statuses = statuses;
  $("#g-base").value = settings.defaultBaseUrl || "";
  $("#g-key").value = settings.defaultApiKey || "";
  $("#g-model").value = settings.defaultModel || "";
  renderGrid();

  // deep link /tools/:id
  const m = location.pathname.match(/^\/tools\/([^/]+)/);
  if (m) openTool(decodeURIComponent(m[1]));
}

$("#btn-back").addEventListener("click", closeTool);

$("#btn-save-settings").addEventListener("click", async () => {
  try {
    state.settings = await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        defaultBaseUrl: $("#g-base").value.trim(),
        defaultApiKey: $("#g-key").value.trim(),
        defaultModel: $("#g-model").value.trim(),
      }),
    });
    toast("Settings saved");
  } catch (e) {
    toast(e.message);
  }
});

$("#btn-apply-all").addEventListener("click", async () => {
  const btn = $("#btn-apply-all");
  btn.disabled = true;
  try {
    const baseUrl = $("#g-base").value.trim();
    if (!baseUrl) throw new Error("Base URL is required");
    // save first
    await api("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        defaultBaseUrl: baseUrl,
        defaultApiKey: $("#g-key").value.trim(),
        defaultModel: $("#g-model").value.trim(),
      }),
    });
    const out = await api("/api/tools/apply-all", {
      method: "POST",
      body: JSON.stringify({
        baseUrl,
        apiKey: $("#g-key").value.trim(),
        model: $("#g-model").value.trim(),
      }),
    });
    const ok = Object.values(out.results || {}).filter((r) => r.success).length;
    const fail = Object.values(out.results || {}).filter((r) => r.success === false).length;
    toast(`Apply-all: ${ok} ok, ${fail} fail`);
    await refreshStatuses();
  } catch (e) {
    toast(e.message);
  } finally {
    btn.disabled = false;
  }
});

$("#btn-refresh").addEventListener("click", async () => {
  await refreshStatuses();
  toast("Refreshed");
});

loadAll().catch((e) => {
  console.error(e);
  toast("Load failed: " + e.message);
});
