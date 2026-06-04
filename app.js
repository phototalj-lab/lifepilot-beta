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
  attachment: document.getElementById("itemAttachment"),
  attach: document.getElementById("attachBtn"),
  attachmentStatus: document.getElementById("attachmentStatus"),
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
  cloudFocus: document.getElementById("cloudFocus"),
  cloudHint: document.getElementById("cloudHint"),
  cloudStatus: document.getElementById("cloudStatus"),
  cloudSync: document.getElementById("cloudSyncBtn"),
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
let pendingAttachment = null;
const maxAttachmentBytes = 4 * 1024 * 1024;
let suppressCloudSave = false;

const viewLabels = {
  today: ["viewTodayTitle", "listTodayTitle"],
  money: ["viewMoneyTitle", "listMoneyTitle"],
  docs: ["viewDocsTitle", "listDocsTitle"],
  health: ["viewHealthTitle", "listHealthTitle"]
};

const translations = {
  lt: {
    brandSubtitle: "Kasdienis valdymo centras",
    navToday: "Siandien",
    navMoney: "Pinigai",
    navDocs: "Dok.",
    navDocsLong: "Dokumentai",
    navHealth: "Sveikata",
    readiness: "Gyvenimo parengtis",
    loadSample: "Ikrauti pavyzdzius",
    clearCompleted: "Istrinti atliktus",
    quickPlaceholder: "Prideti saskaita, uzduoti, dokumenta, vizita...",
    catAdmin: "Admin",
    catMoney: "Pinigai",
    catDocs: "Dokumentai",
    catHealth: "Sveikata",
    catWork: "Darbas",
    impactHigh: "Aukstas",
    impactMedium: "Vidutinis",
    impactLow: "Zemas",
    add: "Prideti",
    attachFile: "Prisegti",
    noAttachment: "Dokumentas nepridetas",
    attachedFile: "Prideta: {name}",
    attachmentTooLarge: "Failas per didelis. Maks. 4MB.",
    attachmentReadError: "Failo nepavyko ikelti.",
    attachmentLocalOnly: "Dokumentas liko lokaliai. Firebase Storage reikia Blaze plano.",
    openAttachment: "Atidaryti dokumenta",
    removeAttachment: "Nuimti",
    brainTitle: "Minciu surinkimas",
    brainCopy: "Irasyk netvarkingas pastabas. LifePilot pavers jas prioritetais su datomis.",
    brainPlaceholder: "Pavyzdys: apmoketi nuoma rytoj, pratesti draudima, uzsirasyti pas gydytoja pirmadieni",
    voice: "Balsu",
    listening: "Klausau",
    voiceInput: "Balso ivedimas",
    voiceReady: "Balso ivedimas parengtas, jei irenginys palaiko.",
    voiceStopped: "Balso ivedimas sustabdytas.",
    voiceAndroid: "Klausau Android telefone...",
    voiceUnsupported: "Siame irenginyje balso ivedimas nepalaikomas.",
    voiceFailed: "Balso ivedimas nepavyko arba leidimas atmestas.",
    voiceNoteAdded: "Balso pastaba prideta.",
    analyze: "Analizuoti",
    addParsed: "Prideti rastus",
    dailyEyebrow: "AI dienos planas",
    planReady: "Paruosta, kai tu pasiruoses",
    planButton: "Suplanuoti diena",
    planEmptyStart: "Sugeneruok aisku veiksmu eiles tvarka is atviru prioritetu.",
    urgent: "Skubu",
    thisWeek: "Sia savaite",
    moneyRisk: "Pinigu rizika",
    done: "Atlikta",
    riskRadar: "Riziku radaras",
    notificationCenter: "Pranesimu centras",
    installApp: "Idiegti",
    test: "Testas",
    settings: "Nustatymai",
    name: "Vardas",
    optional: "Neprivaloma",
    language: "Kalba",
    currency: "Valiuta",
    exportBackup: "Eksportuoti kopija",
    importBackup: "Importuoti kopija",
    filterAll: "Visi",
    filterOpen: "Atviri",
    filterDone: "Atlikti",
    viewTodayTitle: "Siandienos prioritetai",
    listTodayTitle: "Kas dabar svarbiausia",
    viewMoneyTitle: "Pinigu stebejimas",
    listMoneyTitle: "Islaidos, saskaitos ir rizika",
    viewDocsTitle: "Dokumentu radaras",
    listDocsTitle: "Dokumentai ir terminai",
    viewHealthTitle: "Sveikatos linija",
    listHealthTitle: "Vizitai ir rutina",
    personalNamed: "{name}, diena surusiuota pagal svarba.",
    personalDefault: "Tavo diena, surusiuota pagal svarba.",
    nothingHere: "Siame vaizde dar nieko nera.",
    dueLate: "veluoja {days} d.",
    dueToday: "terminas siandien",
    dueIn: "terminas po {days} d.",
    highImpact: "auksta itaka",
    mediumImpact: "vidutine itaka",
    lowImpact: "zema itaka",
    clearDay: "Rami diena",
    noOpenPriorities: "Atviru prioritetu nera. Gali minute atsikvepti.",
    handleUrgent: "Pirmiausia sutvarkyk {count} skubu prioriteta",
    handleUrgentMany: "Pirmiausia sutvarkyk {count} skubius prioritetus",
    startWithCategory: "Pradek nuo {category}, tada uzbaik lengvus darbus",
    lowerPriorityWait: " {count} zemesnio prioriteto uzduotis gali palaukti.",
    lowerPriorityWaitMany: " {count} zemesnio prioriteto uzduociu gali palaukti.",
    score: "Balas",
    reasonLate: "veluoja {days} d.",
    reasonToday: "terminas siandien",
    reasonSoon: "terminas po {days} d.",
    reasonMoney: "pinigu rizika",
    reasonDocs: "dokumento terminas",
    reasonHealth: "sveikatos apsauga",
    reasonHigh: "auksta itaka",
    reasonClean: "palaiko svaria savaite",
    saved: "Issaugota",
    exported: "Eksportuota",
    imported: "Importuota",
    invalidFile: "Netinkamas failas",
    radarAct: "Pirmiausia tvarkyk raudonas zonas",
    radarWatch: "Neleisk tam tapti skubu",
    radarCalm: "Dideliu spaudimo tasku nera",
    levelHigh: "Auksta rizika",
    levelWatch: "Stebeti",
    levelStable: "Stabilu",
    riskOverdue: "Veluoja",
    riskOverdueCopy: "{count} uzduotis jau praleido termina.",
    riskOverdueCopyMany: "{count} uzduotys jau praleido termina.",
    riskOverdueEmpty: "Praleistu terminu dabar nera.",
    riskMoney: "Pinigai",
    riskMoneyCopy: "{amount} galima rizika is saskaitu ir finansu uzduociu.",
    riskMoneyEmpty: "Atviru pinigu uzduociu nera.",
    riskDocs: "Dokumentai",
    riskDocsCopy: "{count} dokumentu uzduotis reikia demesio sia savaite.",
    riskDocsCopyMany: "{count} dokumentu uzduociu reikia demesio sia savaite.",
    riskDocsEmpty: "Atviru dokumentu terminu nera.",
    riskHealth: "Sveikata",
    riskHealthCopy: "{count} sveikatos rutina ar vizitas laukia.",
    riskHealthCopyMany: "{count} sveikatos rutinos ar vizitu laukia.",
    riskHealthEmpty: "Atviru sveikatos uzduociu nera.",
    notifyOn: "Ijungta",
    notifyOff: "Isjungta",
    notifyBlocked: "Blokuota",
    notifyUnsupported: "Nepalaikoma",
    notifyEnabled: "Pranesimai ijungti",
    notifyEnable: "Ijungti",
    notifyFocus: "{count} priminimas arti termino",
    notifyFocusMany: "{count} priminimai arti termino",
    notifyFocusEmpty: "Greitu priminimu nera",
    notifyEmpty: "Dabar niekam nereikia priminimo.",
    alertTitle: "LifePilot pranesimai ijungti",
    alertBody: "Priminsiu apie skubias uzduotis, kol programa atidaryta.",
    testTitle: "LifePilot testas",
    testBody: "Pranesimai veikia sioje narsykleje.",
    settingsFocus: "Asmeniniai nustatymai ir atsargine kopija",
    cloudEyebrow: "Cloud Sync",
    cloudSyncNow: "Sinchronizuoti",
    cloudOffTitle: "Firebase neprijungtas",
    cloudOffHint: "Irasyk Firebase config, kad veiktu sync tarp irenginiu.",
    cloudReadyTitle: "Firebase paruostas",
    cloudReadyHint: "Spausk sync arba palauk auto sinchronizacijos.",
    cloudConnectingTitle: "Jungiu Firebase...",
    cloudOnlineTitle: "Cloud sync ijungtas",
    cloudOnlineHint: "Uzduotys ir nustatymai saugomi Firestore.",
    cloudSyncingTitle: "Sinchronizuoju...",
    cloudErrorTitle: "Cloud sync klaida",
    cloudStatusOff: "Off",
    cloudStatusReady: "Ready",
    cloudStatusConnecting: "Connecting",
    cloudStatusOnline: "Online",
    cloudStatusSyncing: "Syncing",
    cloudStatusError: "Error"
  },
  en: {
    brandSubtitle: "Daily control room",
    navToday: "Today",
    navMoney: "Money",
    navDocs: "Docs",
    navDocsLong: "Documents",
    navHealth: "Health",
    readiness: "Life readiness",
    loadSample: "Load sample data",
    clearCompleted: "Clear completed",
    quickPlaceholder: "Add bill, task, document, appointment...",
    catAdmin: "Admin",
    catMoney: "Money",
    catDocs: "Docs",
    catHealth: "Health",
    catWork: "Work",
    impactHigh: "High",
    impactMedium: "Medium",
    impactLow: "Low",
    add: "Add",
    attachFile: "Attach",
    noAttachment: "No document attached",
    attachedFile: "Attached: {name}",
    attachmentTooLarge: "File is too large. Max 4MB.",
    attachmentReadError: "Could not load this file.",
    attachmentLocalOnly: "Document stayed local. Firebase Storage needs the Blaze plan.",
    openAttachment: "Open document",
    removeAttachment: "Remove",
    brainTitle: "Brain dump",
    brainCopy: "Paste messy life notes. LifePilot turns them into dated priorities.",
    brainPlaceholder: "Example: oplati arendu zavtra, prodli strahovku, pozvoni vrachu v ponedelnik",
    voice: "Voice",
    listening: "Listening",
    voiceInput: "Voice input",
    voiceReady: "Voice input is ready when supported.",
    voiceStopped: "Voice input stopped.",
    voiceAndroid: "Listening on Android...",
    voiceUnsupported: "Voice input is not supported on this device.",
    voiceFailed: "Voice input failed or permission was denied.",
    voiceNoteAdded: "Voice note added.",
    analyze: "Analyze",
    addParsed: "Add parsed",
    dailyEyebrow: "AI Daily Plan",
    planReady: "Ready when you are",
    planButton: "Plan my day",
    planEmptyStart: "Generate a clear order of action from your open priorities.",
    urgent: "Urgent",
    thisWeek: "This week",
    moneyRisk: "Money risk",
    done: "Done",
    riskRadar: "Risk Radar",
    notificationCenter: "Notification Center",
    installApp: "Install app",
    test: "Test",
    settings: "Settings",
    name: "Name",
    optional: "Optional",
    language: "Language",
    currency: "Currency",
    exportBackup: "Export backup",
    importBackup: "Import backup",
    filterAll: "All",
    filterOpen: "Open",
    filterDone: "Done",
    viewTodayTitle: "Today priority map",
    listTodayTitle: "What matters now",
    viewMoneyTitle: "Money watch",
    listMoneyTitle: "Costs, bills and risk",
    viewDocsTitle: "Document radar",
    listDocsTitle: "Papers and deadlines",
    viewHealthTitle: "Health line",
    listHealthTitle: "Appointments and routines",
    personalNamed: "{name}, your day is sorted by what matters.",
    personalDefault: "Your day, sorted by what matters.",
    nothingHere: "Nothing in this view yet.",
    dueLate: "{days} days late",
    dueToday: "due today",
    dueIn: "due in {days} days",
    highImpact: "high impact",
    mediumImpact: "medium impact",
    lowImpact: "low impact",
    clearDay: "Clear day",
    noOpenPriorities: "No open priorities. You can breathe for a minute.",
    handleUrgent: "Handle {count} urgent priority first",
    handleUrgentMany: "Handle {count} urgent priorities first",
    startWithCategory: "Start with {category}, then clear the easy wins",
    lowerPriorityWait: " {count} lower priority item can wait.",
    lowerPriorityWaitMany: " {count} lower priority items can wait.",
    score: "Score",
    reasonLate: "{days} days late",
    reasonToday: "due today",
    reasonSoon: "due in {days} days",
    reasonMoney: "money risk",
    reasonDocs: "document deadline",
    reasonHealth: "health protection",
    reasonHigh: "high impact",
    reasonClean: "keeps the week clean",
    saved: "Saved",
    exported: "Exported",
    imported: "Imported",
    invalidFile: "Invalid file",
    radarAct: "Act on red zones first",
    radarWatch: "Keep these from becoming urgent",
    radarCalm: "No major pressure points",
    levelHigh: "High risk",
    levelWatch: "Watch",
    levelStable: "Stable",
    riskOverdue: "Overdue",
    riskOverdueCopy: "{count} item already past due.",
    riskOverdueCopyMany: "{count} items already past due.",
    riskOverdueEmpty: "No missed deadlines right now.",
    riskMoney: "Money",
    riskMoneyCopy: "{amount} estimated exposure from bills and finance tasks.",
    riskMoneyEmpty: "No money tasks open.",
    riskDocs: "Documents",
    riskDocsCopy: "{count} document task needs attention this week.",
    riskDocsCopyMany: "{count} document tasks need attention this week.",
    riskDocsEmpty: "No document deadlines open.",
    riskHealth: "Health",
    riskHealthCopy: "{count} health routine or appointment task waiting.",
    riskHealthCopyMany: "{count} health routine or appointment tasks waiting.",
    riskHealthEmpty: "No health tasks open.",
    notifyOn: "On",
    notifyOff: "Off",
    notifyBlocked: "Blocked",
    notifyUnsupported: "Unsupported",
    notifyEnabled: "Alerts enabled",
    notifyEnable: "Enable alerts",
    notifyFocus: "{count} reminder in range",
    notifyFocusMany: "{count} reminders in range",
    notifyFocusEmpty: "No reminders due soon",
    notifyEmpty: "Nothing needs a reminder right now.",
    alertTitle: "LifePilot alerts enabled",
    alertBody: "I will remind you about urgent tasks while this app is open.",
    testTitle: "LifePilot test",
    testBody: "Notifications are working in this browser.",
    settingsFocus: "Personal setup and backup",
    cloudEyebrow: "Cloud Sync",
    cloudSyncNow: "Sync now",
    cloudOffTitle: "Firebase is not connected",
    cloudOffHint: "Add Firebase config to enable cross-device sync.",
    cloudReadyTitle: "Firebase is ready",
    cloudReadyHint: "Tap sync or wait for autosync.",
    cloudConnectingTitle: "Connecting Firebase...",
    cloudOnlineTitle: "Cloud sync is on",
    cloudOnlineHint: "Tasks and settings are backed by Firestore.",
    cloudSyncingTitle: "Syncing...",
    cloudErrorTitle: "Cloud sync error",
    cloudStatusOff: "Off",
    cloudStatusReady: "Ready",
    cloudStatusConnecting: "Connecting",
    cloudStatusOnline: "Online",
    cloudStatusSyncing: "Syncing",
    cloudStatusError: "Error"
  },
  ru: {
    brandSubtitle: "Panel na kazhdyi den",
    navToday: "Segodnya",
    navMoney: "Dengi",
    navDocs: "Doky",
    navDocsLong: "Dokumenty",
    navHealth: "Zdorovie",
    readiness: "Gotovnost k zhizni",
    loadSample: "Zagruzit primer",
    clearCompleted: "Ubrat gotovye",
    quickPlaceholder: "Dobavit schet, delo, dokument, vizit...",
    catAdmin: "Admin",
    catMoney: "Dengi",
    catDocs: "Dokumenty",
    catHealth: "Zdorovie",
    catWork: "Rabota",
    impactHigh: "Vysokii",
    impactMedium: "Srednii",
    impactLow: "Nizkii",
    add: "Dobavit",
    attachFile: "Prikrepit",
    noAttachment: "Dokument ne prikreplen",
    attachedFile: "Prikreplen: {name}",
    attachmentTooLarge: "Fail slishkom bolshoi. Maks. 4MB.",
    attachmentReadError: "Ne poluchilos zagruzit fail.",
    attachmentLocalOnly: "Dokument ostalsya lokalno. Firebase Storage trebuet Blaze plan.",
    openAttachment: "Otkryt dokument",
    removeAttachment: "Ubrat",
    brainTitle: "Zapisi iz golovy",
    brainCopy: "Vstav gryaznye zametki. LifePilot prevratit ih v prioritety s datami.",
    brainPlaceholder: "Primer: oplati arendu zavtra, prodli strahovku, pozvoni vrachu v ponedelnik",
    voice: "Golos",
    listening: "Slushayu",
    voiceInput: "Golosovoi vvod",
    voiceReady: "Golosovoi vvod gotov, esli ustroistvo podderzhivaet.",
    voiceStopped: "Golosovoi vvod ostanovlen.",
    voiceAndroid: "Slushayu na Android...",
    voiceUnsupported: "Golosovoi vvod na etom ustroistve ne podderzhivaetsya.",
    voiceFailed: "Golosovoi vvod ne srabotal ili net razresheniya.",
    voiceNoteAdded: "Golosovaya zametka dobavlena.",
    analyze: "Analiz",
    addParsed: "Dobavit naidennye",
    dailyEyebrow: "AI plan dnya",
    planReady: "Gotov, kogda ty gotov",
    planButton: "Plan na den",
    planEmptyStart: "Soberi ponyatnyi poryadok deistvii iz otkrytyh prioritetov.",
    urgent: "Srochno",
    thisWeek: "Na etoi nedele",
    moneyRisk: "Deneznyi risk",
    done: "Gotovo",
    riskRadar: "Radar riskov",
    notificationCenter: "Centr uvedomlenii",
    installApp: "Ustanovit",
    test: "Test",
    settings: "Nastroiki",
    name: "Imya",
    optional: "Neobyazatelno",
    language: "Yazyk",
    currency: "Valyuta",
    exportBackup: "Eksport backup",
    importBackup: "Import backup",
    filterAll: "Vse",
    filterOpen: "Otkrytye",
    filterDone: "Gotovye",
    viewTodayTitle: "Karta prioritetov na segodnya",
    listTodayTitle: "Chto vazhno seichas",
    viewMoneyTitle: "Kontrol deneg",
    listMoneyTitle: "Rashody, scheta i riski",
    viewDocsTitle: "Radar dokumentov",
    listDocsTitle: "Bumagi i dedlainy",
    viewHealthTitle: "Liniya zdorovya",
    listHealthTitle: "Vizity i rutina",
    personalNamed: "{name}, den otsortirovan po vazhnosti.",
    personalDefault: "Tvoi den otsortirovan po vazhnosti.",
    nothingHere: "V etom razdele poka nichego net.",
    dueLate: "prosrocheno na {days} dn.",
    dueToday: "srok segodnya",
    dueIn: "srok cherez {days} dn.",
    highImpact: "vysokoe vliyanie",
    mediumImpact: "srednee vliyanie",
    lowImpact: "nizkoe vliyanie",
    clearDay: "Den svoboden",
    noOpenPriorities: "Otkrytyh prioritetov net. Mozhno minutku vydohnut.",
    handleUrgent: "Snachala zakroi {count} srochnyi prioritet",
    handleUrgentMany: "Snachala zakroi {count} srochnyh prioriteta",
    startWithCategory: "Nachni s {category}, potom zakroi legkie pobedy",
    lowerPriorityWait: " {count} delo nizhe po prioritetu mozhet podozhdat.",
    lowerPriorityWaitMany: " {count} del nizhe po prioritetu mogut podozhdat.",
    score: "Ball",
    reasonLate: "prosrocheno na {days} dn.",
    reasonToday: "srok segodnya",
    reasonSoon: "srok cherez {days} dn.",
    reasonMoney: "deneznyi risk",
    reasonDocs: "srok dokumenta",
    reasonHealth: "zaschita zdorovya",
    reasonHigh: "vysokoe vliyanie",
    reasonClean: "derzhit nedelyu v poryadke",
    saved: "Sohraneno",
    exported: "Eksportirovano",
    imported: "Importirovano",
    invalidFile: "Nevernyi fail",
    radarAct: "Snachala krasnye zony",
    radarWatch: "Ne dai etomu stat srochnym",
    radarCalm: "Silnyh tochek davleniya net",
    levelHigh: "Vysokii risk",
    levelWatch: "Nablyudat",
    levelStable: "Stabilno",
    riskOverdue: "Prosrochki",
    riskOverdueCopy: "{count} delo uzhe prosrocheno.",
    riskOverdueCopyMany: "{count} del uzhe prosrocheno.",
    riskOverdueEmpty: "Propuschennyh srokov seichas net.",
    riskMoney: "Dengi",
    riskMoneyCopy: "{amount} primernyi risk po schetam i finansovym delam.",
    riskMoneyEmpty: "Otkrytyh denezhnyh del net.",
    riskDocs: "Dokumenty",
    riskDocsCopy: "{count} delo po dokumentam trebuet vnimaniya na etoi nedele.",
    riskDocsCopyMany: "{count} del po dokumentam trebuyut vnimaniya na etoi nedele.",
    riskDocsEmpty: "Otkrytyh srokov po dokumentam net.",
    riskHealth: "Zdorovie",
    riskHealthCopy: "{count} zadacha po zdorovyu zhdet.",
    riskHealthCopyMany: "{count} zadach po zdorovyu zhdut.",
    riskHealthEmpty: "Otkrytyh del po zdorovyu net.",
    notifyOn: "Vkl",
    notifyOff: "Vykl",
    notifyBlocked: "Blok",
    notifyUnsupported: "Net podderzhki",
    notifyEnabled: "Uvedomleniya vkl",
    notifyEnable: "Vklyuchit",
    notifyFocus: "{count} napominanie blizko",
    notifyFocusMany: "{count} napominanii blizko",
    notifyFocusEmpty: "Blizkih napominanii net",
    notifyEmpty: "Seichas napominanie ne nuzhno.",
    alertTitle: "LifePilot uvedomleniya vklyucheny",
    alertBody: "Budu napominat o srochnyh delah, poka prilozhenie otkryto.",
    testTitle: "LifePilot test",
    testBody: "Uvedomleniya rabotayut v etom brauzere.",
    settingsFocus: "Lichnye nastroiki i backup",
    cloudEyebrow: "Cloud Sync",
    cloudSyncNow: "Sync",
    cloudOffTitle: "Firebase ne podklyuchen",
    cloudOffHint: "Vstav Firebase config, chtoby vklyuchit sync mezhdu ustroistvami.",
    cloudReadyTitle: "Firebase gotov",
    cloudReadyHint: "Nazhmi sync ili dozhdis autosync.",
    cloudConnectingTitle: "Podklyuchayu Firebase...",
    cloudOnlineTitle: "Cloud sync vklyuchen",
    cloudOnlineHint: "Dela i nastroiki hranyatsya v Firestore.",
    cloudSyncingTitle: "Sinhroniziruyu...",
    cloudErrorTitle: "Cloud sync oshibka",
    cloudStatusOff: "Off",
    cloudStatusReady: "Ready",
    cloudStatusConnecting: "Connecting",
    cloudStatusOnline: "Online",
    cloudStatusSyncing: "Syncing",
    cloudStatusError: "Error"
  }
};

const tagColors = {
  admin: "#2364aa",
  money: "#2f855a",
  docs: "#6b46c1",
  health: "#c53030",
  work: "#b7791f"
};

function t(key, vars = {}) {
  const table = translations[state.settings.language] || translations.en;
  const template = table[key] || translations.en[key] || key;
  return Object.entries(vars).reduce((text, [name, value]) => {
    return text.replaceAll(`{${name}}`, String(value));
  }, template);
}

function pluralKey(count, oneKey, manyKey) {
  return count === 1 ? oneKey : manyKey;
}

function applyLanguage() {
  document.documentElement.lang = state.settings.language === "ru" ? "ru-Latn" : state.settings.language;
  document.querySelectorAll("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach(node => {
    node.title = t(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(node => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  if (pendingAttachment) {
    setAttachmentStatus(t("attachedFile", { name: pendingAttachment.name }), "saved");
  } else {
    setAttachmentStatus(t("noAttachment"));
  }
}

function categoryLabel(category) {
  return t({
    admin: "catAdmin",
    money: "catMoney",
    docs: "catDocs",
    health: "catHealth",
    work: "catWork"
  }[category] || "catAdmin");
}

function impactLabel(impact) {
  return Number(impact) === 3 ? t("impactHigh") : Number(impact) === 2 ? t("impactMedium") : t("impactLow");
}

function impactReason(impact) {
  return Number(impact) === 3 ? t("highImpact") : Number(impact) === 2 ? t("mediumImpact") : t("lowImpact");
}

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
  scheduleCloudSave();
}

function loadSettings() {
  const defaults = { name: "", language: "lt", currency: "EUR" };
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey));
    return { ...defaults, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(state.settings));
  scheduleCloudSave();
}

function cloudPayload() {
  return {
    settings: state.settings,
    items: state.items
  };
}

function scheduleCloudSave(immediate = false) {
  if (suppressCloudSave) return;
  const cloud = window.LifePilotCloud;
  if (!cloud?.isConfigured?.()) return;
  cloud.save(cloudPayload(), immediate);
}

function applyCloudPayload(payload) {
  if (!payload || !Array.isArray(payload.items)) return;
  const run = () => {
    suppressCloudSave = true;
    state.items = payload.items.map(normalizeImportedItem).filter(Boolean);
    state.settings = { ...state.settings, ...(payload.settings && typeof payload.settings === "object" ? payload.settings : {}) };
    localStorage.setItem(storeKey, JSON.stringify(state.items));
    localStorage.setItem(settingsKey, JSON.stringify(state.settings));
    suppressCloudSave = false;
    render();
  };

  if (window.LifePilotCloud?.withRemoteApply) {
    window.LifePilotCloud.withRemoteApply(run);
  } else {
    run();
  }
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
  const when = days < 0 ? t("dueLate", { days: Math.abs(days) }) : days === 0 ? t("dueToday") : t("dueIn", { days });
  const impact = impactReason(item.impact);
  return `${when} / ${impact}`;
}

function planReason(item) {
  const days = daysUntil(item.date);
  const reasons = [];
  if (days < 0) reasons.push(t("reasonLate", { days: Math.abs(days) }));
  if (days === 0) reasons.push(t("reasonToday"));
  if (days > 0 && days <= 2) reasons.push(t("reasonSoon", { days }));
  if (item.category === "money") reasons.push(t("reasonMoney"));
  if (item.category === "docs") reasons.push(t("reasonDocs"));
  if (item.category === "health") reasons.push(t("reasonHealth"));
  if (Number(item.impact) === 3) reasons.push(t("reasonHigh"));
  if (!reasons.length) reasons.push(t("reasonClean"));
  return reasons.slice(0, 3).join(", ");
}

async function addItem() {
  const title = els.title.value.trim() || pendingAttachment?.name || "";
  if (!title) return;
  els.add.disabled = true;
  els.attach.disabled = true;

  let attachment = pendingAttachment;
  if (attachment?.dataUrl && window.LifePilotCloud?.isConfigured?.()) {
    setAttachmentStatus(t("cloudSyncingTitle"), "saved");
    try {
      attachment = await window.LifePilotCloud.uploadAttachment(attachment);
    } catch (error) {
      console.warn("LifePilot attachment upload failed", error);
      setAttachmentStatus(t("attachmentLocalOnly"), "error");
    }
  }

  state.items.push({
    id: crypto.randomUUID(),
    title,
    category: els.category.value,
    impact: Number(els.impact.value),
    date: els.date.value || todayIso(),
    attachment,
    done: false,
    createdAt: Date.now()
  });

  els.title.value = "";
  els.date.value = "";
  clearPendingAttachment();
  saveItems();
  render();
  els.add.disabled = false;
  els.attach.disabled = false;
}

function readAttachment(file) {
  if (!file) return;
  if (file.size > maxAttachmentBytes) {
    pendingAttachment = null;
    els.attachment.value = "";
    setAttachmentStatus(t("attachmentTooLarge"), "error");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    pendingAttachment = {
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataUrl: reader.result
    };
    setAttachmentStatus(t("attachedFile", { name: file.name }), "saved");
  });
  reader.addEventListener("error", () => {
    pendingAttachment = null;
    els.attachment.value = "";
    setAttachmentStatus(t("attachmentReadError"), "error");
  });
  reader.readAsDataURL(file);
}

function clearPendingAttachment() {
  pendingAttachment = null;
  els.attachment.value = "";
  setAttachmentStatus(t("noAttachment"));
}

function setAttachmentStatus(text, mode = "idle") {
  els.attachmentStatus.textContent = text;
  els.attachmentStatus.classList.toggle("error", mode === "error");
  els.attachmentStatus.classList.toggle("saved", mode === "saved");
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
  els.voice.textContent = listening ? t("listening") : t("voice");
  isListening = listening;
}

function voiceLocale() {
  if (state.settings.language === "ru") return "ru-RU";
  if (state.settings.language === "lt") return "lt-LT";
  return "en-US";
}

function startVoiceInput() {
  if (isListening) {
    if (recognition) recognition.stop();
    setVoiceStatus(t("voiceStopped"));
    return;
  }

  if (window.LifePilotVoice && typeof window.LifePilotVoice.start === "function") {
    setVoiceStatus(t("voiceAndroid"), true);
    window.LifePilotVoice.start(voiceLocale());
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceStatus(t("voiceUnsupported"), false);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = voiceLocale();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => setVoiceStatus(`${t("listening")}...`, true);
  recognition.onerror = () => setVoiceStatus(t("voiceFailed"));
  recognition.onend = () => setVoiceStatus(t("voiceReady"));
  recognition.onresult = event => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    appendVoiceText(text);
    setVoiceStatus(t("voiceNoteAdded"));
  };
  recognition.start();
}

window.receiveVoiceInput = text => {
  appendVoiceText(text);
  setVoiceStatus(t("voiceNoteAdded"));
};

window.receiveVoiceStatus = text => {
  setVoiceStatus(text || t("voiceReady"));
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
    .replace(/\b(siandien|rytoj|poryt|sia savaite|kita savaite|po \d+ dienu?|pirmadienis|pirmadieni|antradienis|antradieni|treciadienis|treciadieni|ketvirtadienis|ketvirtadieni|penktadienis|penktadieni|sestadienis|sestadieni|sekmadienis|sekmadieni)\b/gi, "")
    .replace(/\b(сегодня|завтра|послезавтра|на этой неделе|на следующей неделе|через \d+ дня?|через \d+ дней|понедельник|понедельникe|вторник|среда|среду|четверг|пятница|пятницу|суббота|воскресенье)\b/gi, "")
    .replace(/\b(v|vo|na|do|k|ko|by|on|in|i|iki|pas)\b/gi, "")
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
  const lithuanianTests = [
    ["money", ["apmoketi", "moketi", "saskaita", "nuoma", "bankas", "atlyginimas", "prenumerata", "skola", "bauda"]],
    ["docs", ["pasas", "viza", "draudimas", "mokestis", "sutartis", "dokumentas", "pazyma", "pratesti"]],
    ["health", ["gydytojas", "gydytoja", "odontologas", "klinika", "vaistai", "sveikata", "miegas", "vaistine", "uzsirasyti"]],
    ["work", ["darbas", "klientas", "susitikimas", "laiskas", "projektas", "skambutis", "paskambinti"]]
  ];
  const allTests = tests.map(([category, words]) => {
    const extra = lithuanianTests.find(([ltCategory]) => ltCategory === category)?.[1] || [];
    return [category, words.concat(extra)];
  });
  const match = allTests.find(([, words]) => words.some(word => value.includes(word)));
  return match ? match[0] : "admin";
}

function detectImpact(text) {
  const value = text.toLowerCase();
  if (/\b(skubu|veluoja|skola|bauda|problema)\b/.test(value)) return 3;
  if (/\b(urgent|asap|late|overdue|srochno|gorit|dolg|shtraf|problem|срочно|горит|долг|штраф|проблема|просрочено)\b/.test(value)) return 3;
  if (detectCategory(text) === "money" || detectCategory(text) === "docs") return 3;
  if (/\b(uzsirasyti|paskambinti|issiusti|padaryti|pratesti)\b/.test(value)) return 2;
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
  const lithuanianDays = value.match(/\bpo\s+(\d+)\s+(?:diena|dienas|dienu)\b/);
  if (lithuanianDays) return offsetDate(Number(lithuanianDays[1]));
  if (/\b(siandien)\b/.test(value)) return todayIso();
  if (/\b(rytoj)\b/.test(value)) return offsetDate(1);
  if (/\b(poryt)\b/.test(value)) return offsetDate(2);
  if (/\b(sia savaite)\b/.test(value)) return offsetDate(5);
  if (/\b(kita savaite)\b/.test(value)) return offsetDate(9);
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
  const lithuanianDays = [
    ["sekmadienis", "sekmadieni"],
    ["pirmadienis", "pirmadieni"],
    ["antradienis", "antradieni"],
    ["treciadienis", "treciadieni"],
    ["ketvirtadienis", "ketvirtadieni"],
    ["penktadienis", "penktadieni"],
    ["sestadienis", "sestadieni"]
  ];
  const lithuanianIndex = lithuanianDays.findIndex(names => names.some(name => value.includes(name)));
  if (lithuanianIndex >= 0) return lithuanianIndex;

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
  applyLanguage();
  if (!isListening) els.voice.textContent = t("voice");
  const labels = viewLabels[state.view];
  els.viewTitle.textContent = t(labels[0]);
  els.listTitle.textContent = t(labels[1]);
  els.personalLine.textContent = state.settings.name
    ? t("personalNamed", { name: state.settings.name })
    : t("personalDefault");

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
  renderCapturePreview();
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
    EUR: "\u20ac",
    RUB: "\u20bd",
    GBP: "\u00a3"
  };
  return `${symbols[state.settings.currency] || "$"}${amount}`;
}

function renderList() {
  els.itemList.innerHTML = "";
  const items = visibleItems();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = t("nothingHere");
    els.itemList.append(empty);
    return;
  }

  items.forEach(item => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    const score = priorityScore(item);
    node.classList.toggle("done", item.done);
    node.querySelector("h4").textContent = item.title;
    node.querySelector("p").textContent = explain(item);
    node.querySelector(".tag").textContent = categoryLabel(item.category);
    node.querySelector(".tag").style.background = tagColors[item.category] || tagColors.admin;
    renderItemAttachment(node, item);
    node.querySelector(".score").textContent = score;
    node.querySelector(".score").classList.toggle("hot", score >= 78);
    node.querySelector(".score").classList.toggle("warm", score >= 55 && score < 78);
    node.querySelector(".check").addEventListener("click", () => toggleDone(item.id));
    node.querySelector(".delete").addEventListener("click", () => deleteItem(item.id));
    els.itemList.append(node);
  });
}

function renderItemAttachment(node, item) {
  const container = node.querySelector(".attachment-link");
  const href = item.attachment?.dataUrl || item.attachment?.url;
  if (!href) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  const link = document.createElement("a");
  link.href = href;
  link.download = item.attachment.name || "lifepilot-document";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = `${t("openAttachment")}: ${item.attachment.name || "document"}`;

  container.hidden = false;
  container.innerHTML = "";
  container.append(link);
}

function renderCapturePreview() {
  els.capturePreview.innerHTML = "";
  els.acceptCapture.disabled = parsedDraft.length === 0;

  if (!parsedDraft.length) return;

  parsedDraft.forEach(item => {
    const node = els.previewTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".preview-tag").textContent = categoryLabel(item.category);
    node.querySelector(".preview-tag").style.background = tagColors[item.category] || tagColors.admin;
    node.querySelector("strong").textContent = item.title;
    node.querySelector("small").textContent = `${item.date} / ${impactLabel(item.impact)}`;
    els.capturePreview.append(node);
  });
}

function renderDailyPlan(plan, openCount) {
  els.planList.innerHTML = "";

  if (!plan.length) {
    els.planFocus.textContent = t("clearDay");
    const empty = document.createElement("p");
    empty.className = "plan-empty";
    empty.textContent = t("noOpenPriorities");
    els.planList.append(empty);
    return;
  }

  const hotCount = plan.filter(item => priorityScore(item) >= 78).length;
  const firstCategory = plan[0].category;
  els.planFocus.textContent = hotCount
    ? t(pluralKey(hotCount, "handleUrgent", "handleUrgentMany"), { count: hotCount })
    : t("startWithCategory", { category: categoryLabel(firstCategory).toLowerCase() });

  plan.forEach((item, index) => {
    const node = els.planTemplate.content.firstElementChild.cloneNode(true);
    const waiting = openCount - plan.length;
    const remaining = waiting > 0 && index === plan.length - 1 ? t(pluralKey(waiting, "lowerPriorityWait", "lowerPriorityWaitMany"), { count: waiting }) : "";
    node.querySelector(".step-number").textContent = index + 1;
    node.querySelector("strong").textContent = item.title;
    node.querySelector("p").textContent = `${planReason(item)}. ${t("score")} ${priorityScore(item)}.${remaining}`;
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
      title: t("riskOverdue"),
      count: overdue.length,
      view: "today",
      copy: overdue.length ? t(pluralKey(overdue.length, "riskOverdueCopy", "riskOverdueCopyMany"), { count: overdue.length }) : t("riskOverdueEmpty"),
      severity: overdue.length ? "hot" : "calm"
    },
    {
      key: "money",
      title: t("riskMoney"),
      count: money.length,
      view: "money",
      copy: money.length ? t("riskMoneyCopy", { amount: formatMoney(money.length * 120) }) : t("riskMoneyEmpty"),
      severity: money.some(item => priorityScore(item) >= 78) ? "hot" : money.length ? "warn" : "calm"
    },
    {
      key: "docs",
      title: t("riskDocs"),
      count: docs.length,
      view: "docs",
      copy: docs.length ? t(pluralKey(docs.length, "riskDocsCopy", "riskDocsCopyMany"), { count: docs.filter(item => daysUntil(item.date) <= 7).length }) : t("riskDocsEmpty"),
      severity: docs.some(item => daysUntil(item.date) <= 2) ? "hot" : docs.length ? "warn" : "calm"
    },
    {
      key: "health",
      title: t("riskHealth"),
      count: health.length,
      view: "health",
      copy: health.length ? t(pluralKey(health.length, "riskHealthCopy", "riskHealthCopyMany"), { count: health.length }) : t("riskHealthEmpty"),
      severity: health.some(item => priorityScore(item) >= 78) ? "hot" : health.length ? "warn" : "calm"
    }
  ];
}

function renderSettings() {
  if (!translations[state.settings.language]) state.settings.language = "lt";
  els.profileName.value = state.settings.name;
  els.language.value = state.settings.language;
  els.currency.value = state.settings.currency;
  els.settingsFocus.textContent = t("settingsFocus");
  renderCloudStatus(lastCloudStatus);
  if (!els.settingsStatus.classList.contains("warn") && !els.settingsStatus.classList.contains("error")) {
    els.settingsStatus.textContent = t("saved");
  }
}

let lastCloudStatus = { status: window.LifePilotCloud?.isConfigured?.() ? "ready" : "off", detail: "" };

function renderCloudStatus(detail = lastCloudStatus) {
  lastCloudStatus = detail || lastCloudStatus;
  const status = lastCloudStatus.status || "off";
  const titleKey = {
    off: "cloudOffTitle",
    ready: "cloudReadyTitle",
    connecting: "cloudConnectingTitle",
    online: "cloudOnlineTitle",
    syncing: "cloudSyncingTitle",
    error: "cloudErrorTitle"
  }[status] || "cloudOffTitle";
  const hintKey = {
    off: "cloudOffHint",
    ready: "cloudReadyHint",
    connecting: "cloudReadyHint",
    online: "cloudOnlineHint",
    syncing: "cloudOnlineHint",
    error: "cloudOffHint"
  }[status] || "cloudOffHint";
  const statusKey = {
    off: "cloudStatusOff",
    ready: "cloudStatusReady",
    connecting: "cloudStatusConnecting",
    online: "cloudStatusOnline",
    syncing: "cloudStatusSyncing",
    error: "cloudStatusError"
  }[status] || "cloudStatusOff";

  els.cloudFocus.textContent = t(titleKey);
  els.cloudHint.textContent = lastCloudStatus.detail || t(hintKey);
  els.cloudStatus.textContent = t(statusKey);
  els.cloudStatus.className = `cloud-status ${status}`;
  els.cloudSync.disabled = status === "off" || status === "connecting" || status === "syncing";
}

function setSettingsStatus(text, mode = "saved") {
  els.settingsStatus.textContent = text;
  els.settingsStatus.classList.toggle("warn", mode === "warn");
  els.settingsStatus.classList.toggle("error", mode === "error");
  clearTimeout(setSettingsStatus.timer);
  setSettingsStatus.timer = setTimeout(() => {
    els.settingsStatus.textContent = t("saved");
    els.settingsStatus.classList.remove("warn", "error");
  }, 2200);
}

function updateSetting(key, value) {
  state.settings = { ...state.settings, [key]: value };
  saveSettings();
  setSettingsStatus(t("saved"));
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
  setSettingsStatus(t("exported"));
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
      setSettingsStatus(t("imported"));
      render();
    } catch {
      els.importFile.value = "";
      setSettingsStatus(t("invalidFile"), "error");
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
    attachment: normalizeAttachment(item.attachment),
    done: Boolean(item.done),
    createdAt: Number(item.createdAt) || Date.now()
  };
}

function normalizeAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const dataUrl = typeof attachment.dataUrl === "string" && attachment.dataUrl.startsWith("data:") ? attachment.dataUrl : null;
  const url = typeof attachment.url === "string" && /^https?:\/\//.test(attachment.url) ? attachment.url : null;
  if (!dataUrl && !url) return null;
  return {
    name: typeof attachment.name === "string" ? attachment.name.slice(0, 120) : "document",
    type: typeof attachment.type === "string" ? attachment.type.slice(0, 80) : "application/octet-stream",
    size: Number(attachment.size) || 0,
    dataUrl,
    url,
    path: typeof attachment.path === "string" ? attachment.path.slice(0, 240) : null
  };
}

function renderRiskRadar() {
  const risks = buildRisks();
  const hot = risks.filter(risk => risk.severity === "hot").length;
  const warn = risks.filter(risk => risk.severity === "warn").length;

  els.radarFocus.textContent = hot ? t("radarAct") : warn ? t("radarWatch") : t("radarCalm");
  els.radarLevel.textContent = hot ? t("levelHigh") : warn ? t("levelWatch") : t("levelStable");
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
  els.notifyStatus.textContent = permission === "granted" ? t("notifyOn") : permission === "denied" ? t("notifyBlocked") : permission === "unsupported" ? t("notifyUnsupported") : t("notifyOff");
  els.notify.textContent = permission === "granted" ? t("notifyEnabled") : t("notifyEnable");
  els.notify.disabled = permission === "granted" || permission === "unsupported";
  els.testNotify.disabled = permission !== "granted";
  els.notifyFocus.textContent = reminders.length ? t(pluralKey(reminders.length, "notifyFocus", "notifyFocusMany"), { count: reminders.length }) : t("notifyFocusEmpty");

  els.notifyList.innerHTML = "";
  if (!reminders.length) {
    const empty = document.createElement("p");
    empty.className = "plan-empty";
    empty.textContent = t("notifyEmpty");
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
    sendNotification(t("alertTitle"), t("alertBody"));
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
els.attach.addEventListener("click", () => els.attachment.click());
els.attachment.addEventListener("change", () => readAttachment(els.attachment.files[0]));
els.seed.addEventListener("click", seedItems);
els.plan.addEventListener("click", buildDailyPlan);
els.notify.addEventListener("click", enableNotifications);
els.install.addEventListener("click", installApp);
els.testNotify.addEventListener("click", () => sendNotification(t("testTitle"), t("testBody")));
els.profileName.addEventListener("input", () => updateSetting("name", els.profileName.value.trim()));
els.language.addEventListener("change", () => updateSetting("language", els.language.value));
els.currency.addEventListener("change", () => updateSetting("currency", els.currency.value));
els.exportData.addEventListener("click", exportBackup);
els.importData.addEventListener("click", () => els.importFile.click());
els.importFile.addEventListener("change", () => importBackupFile(els.importFile.files[0]));
els.cloudSync.addEventListener("click", async () => {
  if (!window.LifePilotCloud?.isConfigured?.()) {
    renderCloudStatus({ status: "off", detail: t("cloudOffHint") });
    return;
  }
  await window.LifePilotCloud.pull();
  scheduleCloudSave(true);
});
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

window.addEventListener("lifepilot-cloud-status", event => {
  renderCloudStatus(event.detail);
});

window.LifePilotApp = {
  getCloudPayload: cloudPayload,
  applyCloudPayload,
  renderCloudStatus
};

registerServiceWorker();
render();
if (window.LifePilotCloud?.isConfigured?.()) {
  window.LifePilotCloud.pull();
}
setInterval(checkDueNotifications, 60000);
setTimeout(checkDueNotifications, 2000);
