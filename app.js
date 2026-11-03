const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = t => t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
const toast = m => { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(window._t); window._t = setTimeout(() => t.style.display = 'none', 4000) };

const ST = { accepted: ['รับเรื่อง', 'var(--pri)'], doing: ['กำลังดำเนินการ', '#e67e22'], done: ['เสร็จสิ้น', 'var(--ok)'], deleted: ['ยกเลิก/ลบ', 'var(--bad)'] };
const REP = ['ระบบปรับอากาศ', 'เครื่องจักร', 'ระบบไฟฟ้ากำลัง', 'ระบบแสงสว่าง', 'ระบบประปา', 'ระบบ Internet', 'ระบบน้ำบริสุทธิ์ (DI)', 'ฝ้าเพดาน', 'ประตู', 'หน้าต่าง', 'ห้องน้ำ', 'พื้น', 'อื่น ๆ'];
const INS = ['ติดตั้งเครื่องจักร', 'ติดตั้งระบบไฟฟ้ากำลัง', 'ติดตั้งระบบแสงสว่าง', 'ติดตั้งระบบประปา', 'ติดตั้งระบบ Internet', 'ต่อเติมอาคาร', 'อื่น ๆ'];
const MATS = ['หลอดไฟ LED', 'บัลลาสต์/สตาร์ทเตอร์', 'สายไฟ', 'เบรกเกอร์', 'ก๊อกน้ำ', 'ท่อ PVC', 'น้ำยาแอร์', 'เทปพันสายไฟ', 'อื่นๆ'];

let me = null, uid = null, tab = 'login', T = [], U = [], techs = [], fil = 'accepted', fT = '', found = undefined, lastNo = '', armed = '', lastTrackEmail = '';
let statM = new Date().toISOString().slice(0,7); 
let hFil = 'all';
let adminView = 'admin'; // 'admin' | 'tech' | 'reporter' (สำหรับแอดมินทดสอบมุมมองบทบาทอื่น)

window.setAdminView = function(view) {
  adminView = view;
  if (view === 'admin') tab = 'all';
  else if (view === 'tech') tab = 'pool';
  else if (view === 'reporter') tab = 'report';
  found = undefined;
  if (tab === 'history') loadHistoryData();
  render();
};

window.setHFil = function(f) { hFil = f; render(); }
window.setStatM = function(m) { statM = m; render(); }

window.copyNo = function(no, e) {
  if(e) e.stopPropagation();
  navigator.clipboard.writeText(no);
  toast('คัดลอก ' + no + ' แล้ว!');
}

window.loadHistoryData = async function() {
  const email = (me && me.role === 'reporter' ? me.email : '') || localStorage.getItem('last_reporter_email');
  
  // 1. ถ้ามีอีเมล ให้ดึงรายการใบงานทั้งหมดของอีเมลนี้จาก Supabase ด้วย get_my_tickets
  if (email) {
    try {
      const { data, error } = await sb.rpc('get_my_tickets', { p_email: email });
      if (!error && Array.isArray(data)) {
        let myT = JSON.parse(localStorage.getItem('myT') || '[]');
        const map = new Map();
        data.forEach(t => map.set(t.id, { no: t.id, email: t.email, status: t.status }));
        myT.forEach(t => { if (!map.has(t.no)) map.set(t.no, t); });
        
        const merged = Array.from(map.values());
        localStorage.setItem('myT', JSON.stringify(merged));
        if (tab === 'history') render();
        return;
      }
    } catch (e) {
      console.warn('get_my_tickets RPC failed, fallback to local tracking:', e);
    }
  }

  // 2. Fallback: ตรวจสอบสถานะใบงานทีละรายการตามประวัติใน localStorage
  const myT = JSON.parse(localStorage.getItem('myT') || '[]');
  if(!myT.length) return;
  const promises = myT.map(t => sb.rpc('track_ticket', { p_id: t.no, p_email: t.email }).then(r => r.data).catch(() => null));
  const results = await Promise.all(promises);
  let updated = false;
  results.forEach((data, i) => {
      if (data && myT[i].status !== data.status) {
          myT[i].status = data.status; 
          updated = true;
      }
  });
  if (updated) {
      localStorage.setItem('myT', JSON.stringify(myT));
      if (tab === 'history') render();
  }
}

async function load(s) {
  if (!s?.user) {
    const saved = sessionStorage.getItem('repair_me');
    if (saved) {
      try {
        me = JSON.parse(saved);
        tab = me.role === 'admin' ? 'all' : me.role === 'tech' ? 'pool' : 'report';
        await go();
        return;
      } catch(e) {}
    }
    me = null; uid = null; tab = 'login'; render();
    return;
  }
  uid = s.user.id;
  const { data } = await sb.from('profiles').select('*').eq('id', uid).single();
  if (data) {
    me = data;
  } else {
    const role = (typeof loginRole !== 'undefined' && loginRole) ? loginRole : 'tech';
    me = { id: uid, name: (s.user.email || 'เจ้าหน้าที่').split('@')[0], role };
  }
  sessionStorage.setItem('repair_me', JSON.stringify(me));
  tab = me.role === 'admin' ? 'all' : me.role === 'tech' ? 'pool' : 'report';
  await go();
}

const DEV = !!CONFIG.DEV;

function initApp() {
  const saved = sessionStorage.getItem('repair_me') || localStorage.getItem('repair_reporter_me');
  if (saved) {
    try {
      me = JSON.parse(saved);
      if (me && me.role) {
        tab = me.role === 'admin' ? 'all' : me.role === 'tech' ? 'pool' : 'report';
        if (me.role === 'reporter') loadHistoryData();
        go();
        return;
      }
    } catch (e) {
      sessionStorage.removeItem('repair_me');
      localStorage.removeItem('repair_reporter_me');
    }
  }

  me = null;
  tab = 'login';
  render();

  if (!DEV) {
    sb.auth.getSession().then(({ data }) => { if (data?.session) load(data.session); });
    sb.auth.onAuthStateChange((_, s) => { if (s) load(s); });
  }
}

setTimeout(initApp, 0);

setInterval(() => {
  if (me && (me.role === 'admin' || me.role === 'tech') && !$('#dlg')?.open && !document.activeElement?.closest('form')) {
    go();
  } else if (me && me.role === 'reporter' && tab === 'history' && !$('#dlg')?.open) {
    loadHistoryData();
  }
}, 30000);

async function go() {
  if (me && (me.role === 'admin' || me.role === 'tech')) {
    T = (await sb.from('tickets').select('*').order('created_at', { ascending: false }).limit(200)).data || [];
    U = (await sb.from('usage').select('*').order('created_at', { ascending: false }).limit(200)).data || [];
    if (me.role === 'admin') {
      techs = (await sb.from('profiles').select('id,name').eq('role', 'tech')).data || [];
      if (DEV && !techs.length) {
        techs = [
          { id: 'tech-1', name: 'ช่างสมชาย (ไฟฟ้า)' },
          { id: 'tech-2', name: 'ช่างสมศักดิ์ (ประปา/แอร์)' },
          { id: 'dev-tech-1', name: 'ช่างทดสอบ' }
        ];
      }
    }
  }
  render();
}

window.login = async function (e) {
  e.preventDefault();
  const f = new FormData(e.target);
  toast('กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...');
  const { data, error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('pw') });
  if (error) return toast('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
  load(data.session);
}

// ล็อคการทำงานและการเข้าถึงแท็บตาม Role (แอดมินมีสิทธิ์เข้าถึงทุกแท็บเพื่อทดสอบ)
window.setTab = function (k) {
  if (!me) {
    tab = 'login';
    render();
    return;
  }

  const roleTabs = {
    reporter: ['report', 'history', 'track'],
    tech: ['pool', 'mine', 'tech_done'],
    admin: ['all', 'stock', 'stats', 'pool', 'mine', 'tech_done', 'report', 'history', 'track']
  };

  const allowed = roleTabs[me.role] || ['report'];
  if (!allowed.includes(k)) {
    tab = allowed[0];
  } else {
    tab = k;
    if (me.role === 'admin') {
      if (['pool', 'mine', 'tech_done'].includes(k)) adminView = 'tech';
      else if (['report', 'history', 'track'].includes(k)) adminView = 'reporter';
      else if (['all', 'stock', 'stats'].includes(k)) adminView = 'admin';
    }
  }

  found = undefined;
  if (tab === 'history') loadHistoryData();
  render();
}

window.setFil = function (f) { fil = f; render(); }
window.setFT = function (f) { fT = f; render(); }

window.signOut = function () {
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    sessionStorage.removeItem('repair_me');
    localStorage.removeItem('repair_reporter_me');
    if (!DEV) sb.auth.signOut();
    me = null;
    uid = null;
    tab = 'login';
    adminView = 'admin';
    if (typeof setAuthMode === 'function') setAuthMode('login');
    else render();
    toast('ออกจากระบบเรียบร้อยแล้ว');
  }
}

function render() {
  let navHtml = '';

  if (!me || tab === 'login') {
    navHtml = `
      <div style="display:flex; align-items:center; width:100%; justify-content:space-between;">
        <span class="mut" style="font-weight:600;">🔒 เข้าสู่ระบบตามบทบาท</span>
        ${DEV ? '<span style="font-size:12px; background:var(--chip); color:var(--pri); padding:2px 8px; border-radius:4px; font-weight:bold;">🛠️ โหมดทดสอบ (DEV Mode)</span>' : ''}
      </div>
    `;
  } else {
    // กำหนดชุดแท็บที่จะแสดง: หากเป็นแอดมิน ให้แสดงตาม adminView ที่กำลังเลือกทดสอบ
    let currentTabSet = me.role;
    if (me.role === 'admin') {
      currentTabSet = adminView;
    }

    const tabGroups = {
      admin: [['all', '📋 งานทั้งหมด'], ['stock', '📦 วัสดุที่เบิก'], ['stats', '📊 สถิติช่าง']],
      tech: [['pool', '📥 งานกลาง'], ['mine', '🛠️ งานของฉัน'], ['tech_done', '✅ งานที่ทำเสร็จ']],
      reporter: [['report', '📝 แจ้งซ่อม'], ['history', '📋 ประวัติของฉัน'], ['track', '🔍 ค้นหาใบงาน']]
    };

    const tabs = tabGroups[currentTabSet] || tabGroups.reporter;

    const roleBadges = {
      reporter: { icon: '👤', label: 'ผู้แจ้งซ่อม', color: 'var(--pri)' },
      tech: { icon: '🛠️', label: 'ช่างซ่อมบำรุง', color: '#e67e22' },
      admin: { icon: '👑', label: 'ผู้ดูแลระบบ', color: 'var(--bad)' }
    };
    const b = roleBadges[me.role] || { icon: '👤', label: 'ผู้ใช้', color: 'var(--pri)' };

    // แถบสลับทดสอบมุมมองสำหรับ Admin
    const adminSwitcherHtml = me.role === 'admin' ? `
      <div style="display:flex; align-items:center; gap:4px; background:var(--chip); padding:3px 6px; border-radius:8px;">
        <span style="font-size:11px; font-weight:bold; color:var(--pri); white-space:nowrap;">🧪 ทดสอบฟังก์ชันของ:</span>
        <button type="button" class="${adminView === 'admin' ? 'on' : ''}" style="padding:2px 8px; font-size:11px; border-radius:6px;" onclick="setAdminView('admin')">👑 แอดมิน</button>
        <button type="button" class="${adminView === 'tech' ? 'on' : ''}" style="padding:2px 8px; font-size:11px; border-radius:6px;" onclick="setAdminView('tech')">🛠️ ช่าง</button>
        <button type="button" class="${adminView === 'reporter' ? 'on' : ''}" style="padding:2px 8px; font-size:11px; border-radius:6px;" onclick="setAdminView('reporter')">👤 ผู้แจ้งซ่อม</button>
      </div>
    ` : '';

    navHtml = `
      <div style="display:flex; flex-direction:column; width:100%; gap:8px;">
        ${me.role === 'admin' ? `
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            ${adminSwitcherHtml}
            <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
              <span style="font-size:13px; white-space:nowrap;">
                ${b.icon} <b>${esc(me.name)}</b> 
                <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:${b.color}; color:#fff;">${b.label}</span>
              </span>
              <button class="d" style="padding:3px 8px; font-size:12px;" onclick="signOut()">ออกจากระบบ</button>
            </div>
          </div>
        ` : ''}
        <div style="display:flex; align-items:center; gap:6px; overflow-x:auto; padding-bottom:4px;">
          ${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" onclick="setTab('${k}')">${n}</button>`).join('')}
          ${me.role !== 'admin' ? `
            <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
              <span style="font-size:13px; white-space:nowrap;">
                ${b.icon} <b>${esc(me.role === 'reporter' && me.email ? me.email : me.name)}</b> 
                <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:${b.color}; color:#fff;">${b.label}</span>
              </span>
              <button class="d" style="padding:4px 8px; font-size:12px;" onclick="signOut()">ออกจากระบบ</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  $('#nav').innerHTML = navHtml;

  const views = {
    login: vLogin,
    report: vReport,
    history: vHistory,
    track: vTrack,
    pool: vPool,
    mine: vMine,
    tech_done: vTechDone,
    all: vAll,
    stock: vStock,
    stats: vStats
  };

  const activeView = (!me || tab === 'login') ? vLogin : (views[tab] || views.report);
  $('#app').innerHTML = activeView();
}

const url = p => sb.storage.from('photos').getPublicUrl(p).data.publicUrl;
const ph = (a, l) => a?.length ? `<div class="mut" style="margin-top:6px">${l}</div><div class="row" style="gap:6px">${a.map(p => `<img class="th" src="${url(p)}" loading="lazy" onclick="zoom('${p}')">`).join('')}</div>` : '';
window.zoom = function (p) { $('#dlg').innerHTML = `<img src="${url(p)}" style="max-width:100%;border-radius:8px"><div style="margin-top:10px"><button onclick="document.querySelector('#dlg').close()">ปิด</button></div>`; $('#dlg').showModal() }

const card = (t, x = '') => {
  let stName = ST[t.status] ? ST[t.status][0] : 'ไม่ระบุ';
  let stColor = ST[t.status] ? ST[t.status][1] : 'var(--mut)';
  if (t.status === 'done') {
    const isInstall = t.done_type === 'ติดตั้ง/ต่อเติม' || (!t.done_type && t.cat === 'ติดตั้ง/ต่อเติม');
    stName = isInstall ? 'ติดตั้งเสร็จสิ้น' : 'ซ่อมเสร็จสิ้น';
    stColor = isInstall ? '#2980b9' : 'var(--ok)';
  }
  return `<div class="card"><div class="row sp"><div><b>${esc(t.id)}</b> <span onclick="copyNo('${t.id}', event)" style="cursor:pointer; font-size:14px; margin-left:4px" title="คัดลอกเลขใบงาน">📋</span></div><span class="st" style="color:${stColor}">${stName}</span></div>
<div>อาคาร ${esc(t.bld)} ชั้น ${esc(t.flr)} ห้อง/บริเวณ ${esc(t.room)}${t.urgent ? ' <b style="color:var(--bad)">ด่วน</b>' : ''}</div>
<div class="mut">${esc((t.types || []).join(', '))}</div>
<div class="mut">${(t.items || []).map(i => esc(i.item) + (i.sym ? ' – ' + esc(i.sym) : '') + (i.asset ? ' [' + esc(i.asset) + ']' : '')).join(' | ')}</div>
<div class="mut">${t.name ? `แจ้งโดย ${esc(t.name)} ${esc(t.tel || '')} ${t.ext ? 'ภายใน ' + esc(t.ext) : ''} · ` : ''}${fmt(t.created_at)}</div>
<div class="mut">ช่าง: ${t.tech_name ? esc(t.tech_name) : 'ช่างส่วนกลาง (รอรับงาน)'}</div>
${t.note ? `<div class="${t.blocked ? 'blk' : 'mut'}">${t.blocked ? 'ติดปัญหา: ' : 'หมายเหตุ: '}${esc(t.note)}</div>` : ''}
${ph(t.photos, 'รูปประกอบการแจ้ง')}${ph(t.done_photos, 'รูปหลังดำเนินการ')}
${t.status === 'deleted' ? `<div class="blk">ยกเลิก/ลบโดย ${t.deleted_by ? ' (' + esc(t.deleted_by) + ')' : ''} · ${fmt(t.deleted_at)}</div>` : ''}
${t.status === 'done' ? `<div class="mut">${t.cannot ? '<b style="color:var(--bad)">ไม่สามารถดำเนินการได้</b> · ' : ''}${t.budget ? 'งบประมาณ ' + t.budget + ' บาท · ' : ''}${t.done_type ? `[${t.done_type === 'ติดตั้ง/ต่อเติม' ? 'ติดตั้งเสร็จ' : 'ซ่อมเสร็จ'}] ` : ''}เสร็จ ${fmt(t.done_at)}</div>` : ''}${x}</div>`;
};

function steps(t) {
  if (t.status === 'deleted') return '';
  const o = ['accepted', 'doing', 'done'], i = o.indexOf(t.status), h = {};
  (t.history || []).forEach(x => h[x.s] = x.at);
  const doneLabel = (t.done_type === 'ติดตั้ง/ต่อเติม' || (!t.done_type && t.cat === 'ติดตั้ง/ต่อเติม')) ? 'ติดตั้งเสร็จสิ้น' : 'ซ่อมเสร็จสิ้น';
  return `<div class="steps">${o.map((s, j) => `<div class="${j <= i ? 'a' : ''}">${s === 'done' ? doneLabel : (ST[s] ? ST[s][0] : s)}<br>${h[s] ? fmt(h[s]) : ''}</div>`).join('')}</div>`
}

const shrink = f => new Promise((res, rej) => { const im = new Image(), u = URL.createObjectURL(f); im.onload = () => { const s = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => b ? res(b) : rej(new Error('แปลงรูปไม่สำเร็จ')), 'image/jpeg', .8) }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('เปิดรูปไม่ได้')) }; im.src = u });
const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9));
async function up(files, dir) { const out = []; for (const f of [...files].slice(0, 4)) { const p = `${dir}/${uuid()}.jpg`, { error } = await sb.storage.from('photos').upload(p, await shrink(f), { contentType: 'image/jpeg' }); if (error) throw error; out.push(p) } return out }
