const storeKey = "lifepilot-items-v1";
const notifiedKey = "lifepilot-notified-v1";
const settingsKey = "lifepilot-settings-v1";

const state = {
  view: "today",
  filter: "all",
  items: loadItems(),
  settings: loadSettings()
};

const els = {
  title: document.getElementById("itemTitle"),
  category: document.getElementById("itemCategory"),
  impact: document.getElementById("itemImpact"),
  date: document.getElementById("itemDate"),
  add: document.getElementById("addBtn"),
  seed: document.getElementById("seedBtn"),
  clearDone: document.getElementById("clearDoneBtn"),
  brainDump: document.getElementById("brainDump"),
  voice: document.getElementById("voiceBtn"),
  voiceStatus: document.getElementById("voiceStatus"),
  capture: document.getElementById("captureBtn"),
  acceptCapture: document.getElementById("acceptCaptureBtn"),
  capturePreview: document.getElementById("capturePreview"),
  plan: document.getElementById("planBtn"),
  planFocus: document.getElementById("planFocus"),
  planList: document.getElementById("planList"),
  personalLine: document.getElementById("personalLine"),
  radarFocus: document.getElementById("radarFocus"),
  radarLevel: document.getElementById("radarLevel"),
  radarGrid: document.getElementById("radarGrid"),
  notifyFocus: document.getElementById("notifyFocus"),
  notifyStatus: document.getElementById("notifyStatus"),
  notify: document.getElementById("notifyBtn"),
  install: document.getElementById("installBtn"),
  testNotify: document.getElementById("testNotifyBtn"),
  notifyList: document.getElementById("notifyList"),
  profileName: document.getElementById("profileName"),
  language: document.getElementById("languageSelect"),
  currency: document.getElementById("currencySelect"),
  exportData: document.getElementById("exportBtn"),
  importData: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  settingsFocus: document.getElementById("settingsFocus"),
  settingsStatus: document.getElementById("settingsStatus"),
  itemList: document.getElementById("itemList"),
  template: document.getElementById("itemTemplate"),
  previewTemplate: document.getElementById("previewTemplate"),
  planTemplate: document.getElementById("planTemplate"),
  radarTemplate: document.getElementById("radarTemplate"),
  notifyTemplate: document.getElementById("notifyTemplate"),
  viewTitle: document.getElementById("viewTitle"),
  listTitle: document.getElementById("listTitle"),
  readinessScore: document.getElementById("readinessScore"),
  scoreBar: document.getElementById("scoreBar")
};

let parsedDraft = [];
let captureTimer = null;
let deferredInstallPrompt = null;
let recognition = null;
let isListening = false;

const viewLabels = {
  today: ["Today priority map", "What matters now"],
  money: ["Money watch", "Costs, bills and risk"],
  docs: ["Document radar", "Papers and deadlines"],
  health: ["Health line", "Appointments and routines"]
};

const tagColors = {
  admin: "#2364aa",
  money: "#2f855a",
  docs: "#6b46c1",
  health: "#c53030",
  work: "#b7791f"
};

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey));
    return Array.isArray(saved) ? saved : starterItems();
  } catch {
    return starterItems();
  }
}

function starterItems() {
  return [
    { id: crypto.randomUUID(), title: "Pay rent and check balance", category: "money", impact: 3, date: todayIso(), done: false, createdAt: Date.now() },
    { id: crypto.randomUUID(), title: "Renew insurance document", category: "docs", impact: 2, date: offsetDate(7), done: false, createdAt: Date.now() },
    { id: crypto.randomUUID(), title: "Book dentist appointment", category: "health", impact: 2, date: offsetDate(10), done: false, createdAt: Date.now() },
    { id: crypto.randomUUID(), title: "Send invoice reminder", category: "work", impact: 2, date: offsetDate(4), done: false, createdAt: Date.now() },
    { id: crypto.randomUUID(), title: "Cancel unused subscription", category: "money", impact: 1, date: offsetDate(14), done: false, createdAt: Date.now() }
  ];
}

function saveItems() {
  localStorage.setItem(storeKey, JSON.stringify(state.items));
}

function loadSettings() {
  const defaults = { name: "", language: "en", currency: "USD" };
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey));
    return { ...defaults, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(state.settings));
}

function loadNotified() {
  try {
    const saved = JSON.parse(localStorage.getItem(notifiedKey));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveNotified(records) {
  localStorage.setItem(notifiedKey, JSON.stringify(records));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(date) {
  const today = new Date(todayIso());
  const due = new Date(date || todayIso());
  return Math.ceil((due - today) / 86400000);
}

function priorityScore(item) {
  const urgency = Math.max(0, 12 - daysUntil(item.date));
  return Math.min(99, urgency * 6 + Number(item.impact) * 18 + categoryBoost(item.category));
}

function categoryBoost(category) {
  return {
    money: 10,
    docs: 8,
    health: 9,
    work: 5,
    admin: 4
  }[category] || 0;
}

function explain(item) {
  const days = daysUntil(item.date);
  const when = days < 0 ? `${Math.abs(days)} days late` : days === 0 ? "due today" : `due in ${days} days`;
  const impact = Number(item.impact) === 3 ? "high impact" : Number(item.impact) === 2 ? "medium impact" : "low impact";
  return `${when} / ${impact}`;
}

function planReason(item) {
  const days = daysUntil(item.date);
  const reasons = [];
  if (days < 0) reasons.push(`${Math.abs(days)} days late`);
  if (days === 0) reasons.push("due today");
  if (days > 0 && days <= 2) reasons.push(`due in ${days} days`);
  if (item.category === "money") reasons.push("money risk");
  if (item.category === "docs") reasons.push("document deadline");
  if (item.category === "health") reasons.push("health protection");
  if (Number(item.impact) === 3) reasons.push("high impact");
  if (!reasons.length) reasons.push("keeps the week clean");
  return reasons.slice(0, 3).join(", ");
}

function addItem() {
  const title = els.title.value.trim();
  if (!title) return;

  state.items.push({
    id: crypto.randomUUID(),
    title,
    category: els.category.value,
    impact: Number(els.impact.value),
    date: els.date.value || todayIso(),
    done: false,
    createdAt: Date.now()
  });

  els.title.value = "";
  els.date.value = "";
  saveItems();
  render();
}

function analyzeDump() {
  parsedDraft = parseBrainDump(els.brainDump.value);
  renderCapturePreview();
}

function appendVoiceText(text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  const separator = els.brainDump.value.trim() ? ", " : "";
  els.brainDump.value = `${els.brainDump.value.trim()}${separator}${clean}`;
  analyzeDump();
}

function setVoiceStatus(text, listening = false) {
  els.voiceStatus.textContent = text;
  els.voice.classList.toggle("listening", listening);
  els.voice.textContent = listening ? "Listening" : "Voice";
  isListening = listening;
}

function voiceLocale() {
  return state.settings.language === "ru" ? "ru-RU" : "en-US";
}

function startVoiceInput() {
  if (isListening) {
    if (recognition) recognition.stop();
    setVoiceStatus("Voice input stopped.");
    return;
  }

  if (window.LifePilotVoice && typeof window.LifePilotVoice.start === "function") {
    setVoiceStatus("Listening on Android...", true);
    window.LifePilotVoice.start(voiceLocale());
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceStatus("Voice input is not supported on this device.", false);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = voiceLocale();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => setVoiceStatus("Listening...", true);
  recognition.onerror = () => setVoiceStatus("Voice input failed or permission was denied.");
  recognition.onend = () => setVoiceStatus("Voice input ready.");
  recognition.onresult = event => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    appendVoiceText(text);
    setVoiceStatus("Voice note added.");
  };
  recognition.start();
}

window.receiveVoiceInput = text => {
  appendVoiceText(text);
  setVoiceStatus("Voice note added.");
};

window.receiveVoiceStatus = text => {
  setVoiceStatus(text || "Voice input ready.");
};

function acceptParsedItems() {
  if (!parsedDraft.length) return;
  state.items.push(...parsedDraft.map(item => ({ ...item, id: crypto.randomUUID(), done: false, createdAt: Date.now() })));
  parsedDraft = [];
  els.brainDump.value = "";
  saveItems();
  renderCapturePreview();
  render();
}

function buildDailyPlan() {
  const open = state.items
    .filter(item => !item.done)
    .sort((a, b) => priorityScore(b) - priorityScore(a));

  const plan = open.slice(0, 5);
  renderDailyPlan(plan, open.length);
}

function parseBrainDump(text) {
  return text
    .split(/\n|;|,(?=\s*[\p{L}\d])/u)
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => ({
      title: cleanTitle(part),
      category: detectCategory(part),
      impact: detectImpact(part),
      date: detectDate(part)
    }))
    .filter(item => item.title.length > 2)
    .slice(0, 8);
}

function cleanTitle(text) {
  return text
    .replace(/\b(today|tomorrow|tonight|this week|next week|in \d+ days?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/\b(segodnya|zavtra|zavtro|poslezavtra|na etoi nedele|na sleduyushei nedele|cherez \d+ dnya?|cherez \d+ dnei|ponedelnik|vtornik|sreda|sredu|chetverg|pyatnica|pyatnicu|subbota|voskresene)\b/gi, "")
    .replace(/\b(сегодня|завтра|послезавтра|на этой неделе|на следующей неделе|через \d+ дня?|через \d+ дней|понедельник|понедельникe|вторник|среда|среду|четверг|пятница|пятницу|суббота|воскресенье)\b/gi, "")
    .replace(/\b(v|vo|na|do|k|ko|by|on|in)\b/gi, "")
    .replace(/\b(в|во|на|до|к|ко)\b/gi, "")
    .replace(/\b\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-: ]+|[-: ]+$/g, "");
}

function detectCategory(text) {
  const value = text.toLowerCase();
  const tests = [
    ["money", ["pay", "bill", "rent", "bank", "salary", "invoice", "subscription", "oplati", "oplatit", "oplata", "schet", "schyot", "dengi", "arenda", "karta", "kredit", "dolg", "оплати", "оплатить", "оплата", "счет", "счёт", "деньги", "аренда", "карта", "банк", "кредит", "долг"]],
    ["docs", ["passport", "visa", "insurance", "tax", "contract", "document", "renew", "prodli", "prodlit", "pasport", "viza", "strahovka", "nalog", "dogovor", "dokument", "spravka", "продли", "продлить", "паспорт", "виза", "страховка", "налог", "договор", "документ", "справка"]],
    ["health", ["doctor", "dentist", "clinic", "medicine", "workout", "sleep", "pozvoni vrachu", "vrach", "stomatolog", "klinika", "lekarstvo", "zdorov", "son", "analiz", "apteka", "врач", "врачу", "доктор", "стоматолог", "клиника", "лекарство", "здоров", "сон", "анализ", "аптека"]],
    ["work", ["client", "meeting", "email", "invoice", "project", "call", "rabota", "klient", "vstrecha", "pismo", "proekt", "zvonok", "созвон", "работа", "клиент", "встреча", "письмо", "проект", "звонок", "почта"]]
  ];
  const match = tests.find(([, words]) => words.some(word => value.includes(word)));
  return match ? match[0] : "admin";
}

function detectImpact(text) {
  const value = text.toLowerCase();
  if (/\b(urgent|asap|late|overdue|srochno|gorit|dolg|shtraf|problem|срочно|горит|долг|штраф|проблема|просрочено)\b/.test(value)) return 3;
  if (detectCategory(text) === "money" || detectCategory(text) === "docs") return 3;
  if (/\b(book|call|send|renew|pozvonit|pozvoni|otpravit|sdelat|zapisat|записать|позвонить|позвони|отправить|сделать|продлить)\b/.test(value)) return 2;
  return 1;
}

function detectDate(text) {
  const value = text.toLowerCase();
  const numeric = value.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
  if (numeric) {
    const year = numeric[3] ? normalizeYear(numeric[3]) : new Date().getFullYear();
    return toIsoDate(year, Number(numeric[2]), Number(numeric[1]));
  }
  const relativeDays = value.match(/\b(?:in|cherez|через)\s+(\d+)\s+(?:day|days|den|dnya|dnei|день|дня|дней)\b/);
  if (relativeDays) return offsetDate(Number(relativeDays[1]));
  if (/\b(today|tonight|segodnya|сегодня)\b/.test(value)) return todayIso();
  if (/\b(tomorrow|zavtra|zavtro|завтра)\b/.test(value)) return offsetDate(1);
  if (/\b(poslezavtra|послезавтра)\b/.test(value)) return offsetDate(2);
  if (/\b(this week|na etoi nedele|на этой неделе|на неделе)\b/.test(value)) return offsetDate(5);
  if (/\b(next week|na sleduyushei nedele|на следующей неделе)\b/.test(value)) return offsetDate(9);

  const weekday = findWeekday(value);
  if (weekday !== null) return nextWeekdayIso(weekday);
  return todayIso();
}

function normalizeYear(year) {
  const value = Number(year);
  return value < 100 ? 2000 + value : value;
}

function toIsoDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return todayIso();
  return date.toISOString().slice(0, 10);
}

function findWeekday(value) {
  const days = [
    ["sunday", "voskresene", "воскресенье"],
    ["monday", "ponedelnik", "понедельник"],
    ["tuesday", "vtornik", "вторник"],
    ["wednesday", "sreda", "sredu", "среда", "среду"],
    ["thursday", "chetverg", "четверг"],
    ["friday", "pyatnica", "pyatnicu", "пятница", "пятницу"],
    ["saturday", "subbota", "суббота"]
  ];
  const index = days.findIndex(names => names.some(name => value.includes(name)));
  return index >= 0 ? index : null;
}

function nextWeekdayIso(targetDay) {
  const date = new Date();
  const diff = (targetDay + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function seedItems() {
  if (state.items.length) return;
  state.items = starterItems();
  saveItems();
  render();
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function visibleItems() {
  return state.items
    .filter(item => {
      if (state.view === "money") return item.category === "money";
      if (state.view === "docs") return item.category === "docs";
      if (state.view === "health") return item.category === "health";
      return true;
    })
    .filter(item => {
      if (state.filter === "open") return !item.done;
      if (state.filter === "done") return item.done;
      return true;
    })
    .sort((a, b) => priorityScore(b) - priorityScore(a));
}

function render() {
  const labels = viewLabels[state.view];
  els.viewTitle.textContent = labels[0];
  els.listTitle.textContent = labels[1];
  els.personalLine.textContent = state.settings.name
    ? `${state.settings.name}, your day is sorted by what matters.`
    : "Your day, sorted by what matters.";

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
  document.querySelectorAll(".segment").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });

  renderCounts();
  renderRiskRadar();
  renderNotifications();
  renderSettings();
  renderList();
}

function renderCounts() {
  const open = state.items.filter(item => !item.done);
  const urgent = open.filter(item => priorityScore(item) >= 78).length;
  const overdue = open.filter(item => daysUntil(item.date) < 0).length;
  const week = open.filter(item => daysUntil(item.date) <= 7).length;
  const done = state.items.filter(item => item.done).length;
  const baseReadiness = open.length ? 88 : 100;
  const readiness = Math.max(25, Math.min(100, Math.round(
    baseReadiness - overdue * 18 - urgent * 6 - Math.max(0, open.length - 4) * 2 + done * 3
  )));

  document.getElementById("todayCount").textContent = open.length;
  document.getElementById("moneyCount").textContent = open.filter(item => item.category === "money").length;
  document.getElementById("docsCount").textContent = open.filter(item => item.category === "docs").length;
  document.getElementById("healthCount").textContent = open.filter(item => item.category === "health").length;
  document.getElementById("urgentTotal").textContent = urgent;
  document.getElementById("weekTotal").textContent = week;
  document.getElementById("riskTotal").textContent = formatMoney(open.filter(item => item.category === "money").length * 120);
  document.getElementById("doneTotal").textContent = done;
  els.readinessScore.textContent = `${readiness}%`;
  els.scoreBar.style.width = `${readiness}%`;
}

function formatMoney(amount) {
  const symbols = {
    USD: "$",
    EUR: "€",
    RUB: "₽",
    GBP: "£"
  };
  return `${symbols[state.settings.currency] || "$"}${amount}`;
}

function renderList() {
  els.itemList.innerHTML = "";
  const items = visibleItems();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nothing in this view yet.";
    els.itemList.append(empty);
    return;
  }

  items.forEach(item => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const score = priorityScore(item);
    node.classList.toggle("done", item.done);
    node.querySelector("h4").textContent = item.title;
    node.querySelector("p").textContent = explain(item);
    node.querySelector(".tag").textContent = item.category;
    node.querySelector(".tag").style.background = tagColors[item.category] || tagColors.admin;
    node.querySelector(".score").textContent = score;
    node.querySelector(".score").classList.toggle("hot", score >= 78);
    node.querySelector(".score").classList.toggle("warm", score >= 55 && score < 78);
    node.querySelector(".check").addEventListener("click", () => toggleDone(item.id));
    node.querySelector(".delete").addEventListener("click", () => deleteItem(item.id));
    els.itemList.append(node);
  });
}

function renderCapturePreview() {
  els.capturePreview.innerHTML = "";
  els.acceptCapture.disabled = parsedDraft.length === 0;

  if (!parsedDraft.length) return;

  parsedDraft.forEach(item => {
    const node = els.previewTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".preview-tag").textContent = item.category;
    node.querySelector(".preview-tag").style.background = tagColors[item.category] || tagColors.admin;
    node.querySelector("strong").textContent = item.title;
    node.querySelector("small").textContent = `${item.date} / ${Number(item.impact) === 3 ? "high" : Number(item.impact) === 2 ? "medium" : "low"}`;
    els.capturePreview.append(node);
  });
}

function renderDailyPlan(plan, openCount) {
  els.planList.innerHTML = "";

  if (!plan.length) {
    els.planFocus.textContent = "Clear day";
    const empty = document.createElement("p");
    empty.className = "plan-empty";
    empty.textContent = "No open priorities. You can breathe for a minute.";
    els.planList.append(empty);
    return;
  }

  const hotCount = plan.filter(item => priorityScore(item) >= 78).length;
  const firstCategory = plan[0].category;
  els.planFocus.textContent = hotCount
    ? `Handle ${hotCount} urgent priority${hotCount === 1 ? "" : "ies"} first`
    : `Start with ${firstCategory}, then clear the easy wins`;

  plan.forEach((item, index) => {
    const node = els.planTemplate.content.firstElementChild.cloneNode(true);
    const remaining = openCount > plan.length && index === plan.length - 1 ? ` ${openCount - plan.length} lower priority item${openCount - plan.length === 1 ? "" : "s"} can wait.` : "";
    node.querySelector(".step-number").textContent = index + 1;
    node.querySelector("strong").textContent = item.title;
    node.querySelector("p").textContent = `${planReason(item)}. Score ${priorityScore(item)}.${remaining}`;
    els.planList.append(node);
  });
}

function buildRisks() {
  const open = state.items.filter(item => !item.done);
  const overdue = open.filter(item => daysUntil(item.date) < 0);
  const money = open.filter(item => item.category === "money");
  const docs = open.filter(item => item.category === "docs");
  const health = open.filter(item => item.category === "health");

  return [
    {
      key: "today",
      title: "Overdue",
      count: overdue.length,
      view: "today",
      copy: overdue.length ? `${overdue.length} item${overdue.length === 1 ? "" : "s"} already past due.` : "No missed deadlines right now.",
      severity: overdue.length ? "hot" : "calm"
    },
    {
      key: "money",
      title: "Money",
      count: money.length,
      view: "money",
      copy: money.length ? `${formatMoney(money.length * 120)} estimated exposure from bills and finance tasks.` : "No money tasks open.",
      severity: money.some(item => priorityScore(item) >= 78) ? "hot" : money.length ? "warn" : "calm"
    },
    {
      key: "docs",
      title: "Documents",
      count: docs.length,
      view: "docs",
      copy: docs.length ? `${docs.filter(item => daysUntil(item.date) <= 7).length} document task${docs.length === 1 ? "" : "s"} need attention this week.` : "No document deadlines open.",
      severity: docs.some(item => daysUntil(item.date) <= 2) ? "hot" : docs.length ? "warn" : "calm"
    },
    {
      key: "health",
      title: "Health",
      count: health.length,
      view: "health",
      copy: health.length ? `${health.length} health routine or appointment task${health.length === 1 ? "" : "s"} waiting.` : "No health tasks open.",
      severity: health.some(item => priorityScore(item) >= 78) ? "hot" : health.length ? "warn" : "calm"
    }
  ];
}

function renderSettings() {
  els.profileName.value = state.settings.name;
  els.language.value = state.settings.language;
  els.currency.value = state.settings.currency;
}

function setSettingsStatus(text, mode = "saved") {
  els.settingsStatus.textContent = text;
  els.settingsStatus.classList.toggle("warn", mode === "warn");
  els.settingsStatus.classList.toggle("error", mode === "error");
  clearTimeout(setSettingsStatus.timer);
  setSettingsStatus.timer = setTimeout(() => {
    els.settingsStatus.textContent = "Saved";
    els.settingsStatus.classList.remove("warn", "error");
  }, 2200);
}

function updateSetting(key, value) {
  state.settings = { ...state.settings, [key]: value };
  saveSettings();
  setSettingsStatus("Saved");
  render();
}

function exportBackup() {
  const backup = {
    app: "LifePilot",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    items: state.items
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lifepilot-backup-${todayIso()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setSettingsStatus("Exported");
}

function importBackupFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const backup = JSON.parse(reader.result);
      if (!backup || !Array.isArray(backup.items)) {
        throw new Error("Invalid backup");
      }
      state.items = backup.items.map(normalizeImportedItem).filter(Boolean);
      state.settings = { ...state.settings, ...(backup.settings && typeof backup.settings === "object" ? backup.settings : {}) };
      saveItems();
      saveSettings();
      els.importFile.value = "";
      setSettingsStatus("Imported");
      render();
    } catch {
      els.importFile.value = "";
      setSettingsStatus("Invalid file", "error");
    }
  });
  reader.readAsText(file);
}

function normalizeImportedItem(item) {
  if (!item || typeof item.title !== "string") return null;
  return {
    id: item.id || crypto.randomUUID(),
    title: item.title.slice(0, 120),
    category: ["admin", "money", "docs", "health", "work"].includes(item.category) ? item.category : "admin",
    impact: [1, 2, 3].includes(Number(item.impact)) ? Number(item.impact) : 2,
    date: item.date || todayIso(),
    done: Boolean(item.done),
    createdAt: Number(item.createdAt) || Date.now()
  };
}

function renderRiskRadar() {
  const risks = buildRisks();
  const hot = risks.filter(risk => risk.severity === "hot").length;
  const warn = risks.filter(risk => risk.severity === "warn").length;

  els.radarFocus.textContent = hot ? "Act on red zones first" : warn ? "Keep these from becoming urgent" : "No major pressure points";
  els.radarLevel.textContent = hot ? "High risk" : warn ? "Watch" : "Stable";
  els.radarLevel.classList.toggle("danger", hot > 0);
  els.radarLevel.classList.toggle("warning", hot === 0 && warn > 0);

  els.radarGrid.innerHTML = "";
  risks.forEach(risk => {
    const node = els.radarTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.view = risk.view;
    node.classList.toggle("hot", risk.severity === "hot");
    node.classList.toggle("warn", risk.severity === "warn");
    node.querySelector("strong").textContent = risk.title;
    node.querySelector("em").textContent = risk.count;
    node.querySelector(".radar-card-copy").textContent = risk.copy;
    node.addEventListener("click", () => switchView(risk.view, true));
    els.radarGrid.append(node);
  });
}

function notificationSupport() {
  return "Notification" in window;
}

function notificationPermission() {
  return notificationSupport() ? Notification.permission : "unsupported";
}

function reminderItems() {
  return state.items
    .filter(item => !item.done)
    .filter(item => daysUntil(item.date) <= 1 || priorityScore(item) >= 78)
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 6);
}

function renderNotifications() {
  const permission = notificationPermission();
  const reminders = reminderItems();

  els.notifyStatus.classList.toggle("on", permission === "granted");
  els.notifyStatus.classList.toggle("blocked", permission === "denied" || permission === "unsupported");
  els.notifyStatus.textContent = permission === "granted" ? "On" : permission === "denied" ? "Blocked" : permission === "unsupported" ? "Unsupported" : "Off";
  els.notify.textContent = permission === "granted" ? "Alerts enabled" : "Enable alerts";
  els.notify.disabled = permission === "granted" || permission === "unsupported";
  els.testNotify.disabled = permission !== "granted";
  els.notifyFocus.textContent = reminders.length ? `${reminders.length} reminder${reminders.length === 1 ? "" : "s"} in range` : "No reminders due soon";

  els.notifyList.innerHTML = "";
  if (!reminders.length) {
    const empty = document.createElement("p");
    empty.className = "plan-empty";
    empty.textContent = "Nothing needs a reminder right now.";
    els.notifyList.append(empty);
    return;
  }

  reminders.forEach(item => {
    const node = els.notifyTemplate.content.firstElementChild.cloneNode(true);
    const score = priorityScore(item);
    node.classList.toggle("hot", score >= 78);
    node.classList.toggle("warn", score >= 55 && score < 78);
    node.querySelector("span").textContent = daysUntil(item.date) < 0 ? "!" : daysUntil(item.date) === 0 ? "0" : "1";
    node.querySelector("strong").textContent = item.title;
    node.querySelector("p").textContent = `${explain(item)} / ${planReason(item)}`;
    els.notifyList.append(node);
  });
}

async function enableNotifications() {
  if (!notificationSupport()) {
    renderNotifications();
    return;
  }
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  renderNotifications();
  if (Notification.permission === "granted") {
    sendNotification("LifePilot alerts enabled", "I will remind you about urgent tasks while this app is open.");
  }
}

async function sendNotification(title, body) {
  if (notificationPermission() !== "granted") return;
  try {
    const options = {
      body,
      tag: `lifepilot-${title}`,
      icon: "./icon.svg",
      badge: "./icon.svg",
      renotify: false
    };
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    renderNotifications();
  }
}

function checkDueNotifications() {
  if (notificationPermission() !== "granted") return;
  const records = loadNotified();
  const today = todayIso();

  reminderItems().forEach(item => {
    const key = `${today}:${item.id}`;
    if (records[key]) return;
    records[key] = Date.now();
    sendNotification(item.title, `${explain(item)}. ${planReason(item)}.`);
  });

  saveNotified(records);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch {
    // LifePilot still works without offline install support.
  }
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.install.hidden = true;
}

function switchView(view, shouldScroll = false) {
  state.view = view;
  state.filter = "open";
  render();
  if (shouldScroll) {
    document.querySelector(".content").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function toggleDone(id) {
  state.items = state.items.map(item => item.id === id ? { ...item, done: !item.done } : item);
  saveItems();
  render();
}

function deleteItem(id) {
  state.items = state.items.filter(item => item.id !== id);
  saveItems();
  render();
}

document.querySelectorAll(".nav-button").forEach(button => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});

document.querySelectorAll(".segment").forEach(button => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    render();
  });
});

els.add.addEventListener("click", addItem);
els.title.addEventListener("keydown", event => {
  if (event.key === "Enter") addItem();
});
els.seed.addEventListener("click", seedItems);
els.plan.addEventListener("click", buildDailyPlan);
els.notify.addEventListener("click", enableNotifications);
els.install.addEventListener("click", installApp);
els.testNotify.addEventListener("click", () => sendNotification("LifePilot test", "Notifications are working in this browser."));
els.profileName.addEventListener("input", () => updateSetting("name", els.profileName.value.trim()));
els.language.addEventListener("change", () => updateSetting("language", els.language.value));
els.currency.addEventListener("change", () => updateSetting("currency", els.currency.value));
els.exportData.addEventListener("click", exportBackup);
els.importData.addEventListener("click", () => els.importFile.click());
els.importFile.addEventListener("change", () => importBackupFile(els.importFile.files[0]));
els.capture.addEventListener("click", analyzeDump);
els.voice.addEventListener("click", startVoiceInput);
els.acceptCapture.addEventListener("click", acceptParsedItems);
els.brainDump.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") analyzeDump();
});
els.brainDump.addEventListener("input", () => {
  clearTimeout(captureTimer);
  captureTimer = setTimeout(() => {
    if (els.brainDump.value.trim().length > 8) analyzeDump();
  }, 450);
});
els.clearDone.addEventListener("click", () => {
  state.items = state.items.filter(item => !item.done);
  saveItems();
  render();
});

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  els.install.hidden = false;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  els.install.hidden = true;
});

registerServiceWorker();
render();
setInterval(checkDueNotifications, 60000);
setTimeout(checkDueNotifications, 2000);
