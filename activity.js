/* Aggregate page activity only. No names, IP addresses, locations or referrers. */
(() => {
  const panel = document.getElementById('traction');
  if (!panel) return;
  const lang = document.documentElement.lang;
  const text = {
    en: {connecting:'Connecting to live activity…',unavailable:'Live activity is temporarily unavailable.',updated:'Updated',since:'Counting page views since',waiting:'Tracking begins with the first recorded page view.'},
    es: {connecting:'Conectando con la actividad en directo…',unavailable:'La actividad en directo no está disponible temporalmente.',updated:'Actualizado',since:'Vistas de página contadas desde',waiting:'El recuento comienza con la primera vista registrada.'},
    vi: {connecting:'Đang kết nối dữ liệu hoạt động…',unavailable:'Tạm thời không có dữ liệu hoạt động trực tiếp.',updated:'Cập nhật lúc',since:'Lượt xem trang được tính từ',waiting:'Bắt đầu đếm từ lượt xem trang đầu tiên được ghi nhận.'},
    fr: {connecting:'Connexion à l’activité en direct…',unavailable:'L’activité en direct est temporairement indisponible.',updated:'Mise à jour à',since:'Vues de page comptées depuis le',waiting:'Le comptage commence à la première vue enregistrée.'},
    de: {connecting:'Verbindung zur Live-Aktivität wird hergestellt…',unavailable:'Die Live-Aktivität ist vorübergehend nicht verfügbar.',updated:'Aktualisiert um',since:'Seitenaufrufe werden gezählt seit',waiting:'Die Zählung beginnt mit dem ersten erfassten Seitenaufruf.'},
    pl: {connecting:'Łączenie z aktywnością na żywo…',unavailable:'Aktywność na żywo jest chwilowo niedostępna.',updated:'Zaktualizowano o',since:'Odsłony są liczone od',waiting:'Liczenie rozpoczyna się od pierwszej zarejestrowanej odsłony.'}
  }[lang] || null;
  if (!text) return;
  const status = panel.querySelector('[data-activity-status]');
  const since = panel.querySelector('[data-activity-since]');
  const fields = ['totalViews','todayViews','activeSessions'];
  const locale = {en:'en-US',es:'es',vi:'vi-VN',fr:'fr-FR',de:'de-DE',pl:'pl-PL'}[lang];
  let sessionId, viewId, busy = false, counted = false;
  const loadedAt = Date.now();
  function randomId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes,byte => byte.toString(16).padStart(2,'0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  function unavailable() {
    fields.forEach(key => { panel.querySelector('[data-activity="'+key+'"]').textContent = '—'; });
    status.textContent = text.unavailable;
    panel.dataset.state = 'unavailable';
  }
  try {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    try { sessionId = sessionStorage.getItem('coast-activity-session-v1'); } catch (_) {}
    if (!uuid.test(sessionId || '')) sessionId = randomId();
    try { sessionStorage.setItem('coast-activity-session-v1',sessionId); } catch (_) {}
    viewId = randomId();
  } catch (_) { unavailable(); return; }
  async function refresh() {
    if (busy || document.visibilityState !== 'visible') return;
    busy = true;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    const countView = !counted && Date.now() - loadedAt < 120000;
    try {
      const response = await fetch('/api/activity', {
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',credentials:'same-origin',
        signal:abort.signal,body:JSON.stringify({sessionId,viewId,countView})
      });
      if (!response.ok) throw new Error('Activity unavailable');
      const data = await response.json();
      if (!fields.every(key => Number.isSafeInteger(data[key]) && data[key] >= 0) || !Number.isFinite(Date.parse(data.updatedAt)) || (data.startedAt !== null && !Number.isFinite(Date.parse(data.startedAt)))) throw new Error('Invalid activity response');
      fields.forEach(key => { panel.querySelector('[data-activity="'+key+'"]').textContent = new Intl.NumberFormat(locale).format(data[key]); });
      status.textContent = text.updated + ' ' + new Intl.DateTimeFormat(locale,{hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date(data.updatedAt));
      since.textContent = data.startedAt ? text.since + ' ' + new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'America/Chicago'}).format(new Date(data.startedAt)) + '.' : text.waiting;
      panel.dataset.state = 'live';
      if (countView) counted = true;
    } catch (_) { unavailable(); }
    finally { clearTimeout(timer);busy = false; }
  }
  status.textContent = text.connecting;
  refresh();
  setInterval(refresh,30000);
  document.addEventListener('visibilitychange',refresh);
})();
