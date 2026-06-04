(function () {
  const sdkVersion = "12.7.0";
  const config = window.LifePilotFirebase || {};
  let services = null;
  let userId = null;
  let saveTimer = null;
  let remoteUnsubscribe = null;
  let lastRemoteUpdate = 0;
  let applyingRemote = false;

  function emitStatus(status, detail = "") {
    window.dispatchEvent(new CustomEvent("lifepilot-cloud-status", {
      detail: { status, detail, userId, enabled: Boolean(config.enabled) }
    }));
  }

  function hasConfig() {
    const firebaseConfig = config.firebaseConfig || {};
    return Boolean(
      config.enabled &&
      firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      !firebaseConfig.apiKey.startsWith("PASTE_")
    );
  }

  function sanitizePayload(payload) {
    return {
      version: 1,
      updatedAt: Date.now(),
      settings: payload.settings || {},
      items: (payload.items || []).map(item => {
        const attachment = item.attachment ? { ...item.attachment } : null;
        if (attachment?.url) delete attachment.dataUrl;
        if (attachment && !attachment.url) delete attachment.dataUrl;
        return { ...item, attachment };
      })
    };
  }

  async function loadFirebase() {
    const [
      appModule,
      authModule,
      firestoreModule,
      storageModule
    ] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-storage.js`)
    ]);

    const app = appModule.initializeApp(config.firebaseConfig);
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);
    const storage = storageModule.getStorage(app);

    return {
      app,
      auth,
      db,
      storage,
      signInAnonymously: authModule.signInAnonymously,
      onAuthStateChanged: authModule.onAuthStateChanged,
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      setDoc: firestoreModule.setDoc,
      onSnapshot: firestoreModule.onSnapshot,
      serverTimestamp: firestoreModule.serverTimestamp,
      ref: storageModule.ref,
      uploadString: storageModule.uploadString,
      getDownloadURL: storageModule.getDownloadURL
    };
  }

  async function connect() {
    if (!hasConfig()) {
      emitStatus("off", "Firebase config missing");
      return false;
    }
    if (services && userId) return true;

    emitStatus("connecting");
    try {
      services = await loadFirebase();
      await services.signInAnonymously(services.auth);
      await new Promise(resolve => {
        const stop = services.onAuthStateChanged(services.auth, user => {
          if (!user) return;
          userId = user.uid;
          stop();
          resolve();
        });
      });
      listenRemote();
      emitStatus("online");
      return true;
    } catch (error) {
      console.warn("LifePilot Firebase connect failed", error);
      emitStatus("error", error.message || "Firebase error");
      return false;
    }
  }

  function stateDoc() {
    return services.doc(services.db, "users", userId, "lifePilot", "state");
  }

  function listenRemote() {
    if (remoteUnsubscribe || !services || !userId) return;
    remoteUnsubscribe = services.onSnapshot(stateDoc(), snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (!data || applyingRemote) return;
      const updatedAt = Number(data.updatedAt || 0);
      if (updatedAt <= lastRemoteUpdate) return;
      lastRemoteUpdate = updatedAt;
      window.LifePilotApp?.applyCloudPayload(data);
    }, error => {
      console.warn("LifePilot Firebase listen failed", error);
      emitStatus("error", error.message || "Sync listen error");
    });
  }

  async function save(payload, immediate = false) {
    if (applyingRemote) return;
    clearTimeout(saveTimer);
    const run = async () => {
      const connected = await connect();
      if (!connected) return;
      emitStatus("syncing");
      try {
        const clean = sanitizePayload(payload);
        lastRemoteUpdate = clean.updatedAt;
        await services.setDoc(stateDoc(), {
          ...clean,
          firebaseUpdatedAt: services.serverTimestamp()
        }, { merge: true });
        emitStatus("online");
      } catch (error) {
        console.warn("LifePilot Firebase save failed", error);
        emitStatus("error", error.message || "Sync save error");
      }
    };

    if (immediate) {
      await run();
      return;
    }
    saveTimer = setTimeout(run, 900);
  }

  async function pull() {
    const connected = await connect();
    if (!connected) return;
    emitStatus("syncing");
    try {
      const snapshot = await services.getDoc(stateDoc());
      if (snapshot.exists()) {
        window.LifePilotApp?.applyCloudPayload(snapshot.data());
      } else if (window.LifePilotApp?.getCloudPayload) {
        await save(window.LifePilotApp.getCloudPayload(), true);
      }
      emitStatus("online");
    } catch (error) {
      console.warn("LifePilot Firebase pull failed", error);
      emitStatus("error", error.message || "Sync pull error");
    }
  }

  async function uploadAttachment(attachment) {
    if (!attachment?.dataUrl) return attachment;
    const connected = await connect();
    if (!connected) return attachment;
    const safeName = (attachment.name || "document").replace(/[^\w.-]+/g, "_");
    const path = `users/${userId}/attachments/${Date.now()}-${safeName}`;
    const storageRef = services.ref(services.storage, path);
    await services.uploadString(storageRef, attachment.dataUrl, "data_url", {
      contentType: attachment.type || "application/octet-stream"
    });
    const url = await services.getDownloadURL(storageRef);
    return { ...attachment, url, path };
  }

  window.LifePilotCloud = {
    connect,
    pull,
    save,
    uploadAttachment,
    isConfigured: hasConfig,
    isApplyingRemote: () => applyingRemote,
    withRemoteApply(callback) {
      applyingRemote = true;
      try {
        callback();
      } finally {
        applyingRemote = false;
      }
    }
  };

  emitStatus(hasConfig() ? "ready" : "off");
})();
