function vAll() {
  const L = T.filter(t => t.status === fil);
  return `<div class="sum">${Object.keys(ST).map(s => `<div class="box ${fil === s ? 'sel' : ''}" onclick="setFil('${s}')"><b>${T.filter(t => t.status === s).length}</b><span class="mut">${ST[s][0]}</span></div>`).join('')}</div>
<h3>${ST[fil][0]} (${L.length})</h3>${L.map(t => card(t, fil === 'deleted' ? '' : `<div class="row" style="margin-top:8px">${fil !== 'done' ? `<select id="a_${t.id}" style="flex:1;min-width:150px;width:auto"><option value="">ช่างส่วนกลาง</option>${techs.map(p => `<option value="${p.id}" ${p.id === t.tech_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><button onclick="assign('${t.id}')">มอบหมาย</button>` : ''}<button class="d" onclick="del('${t.id}')">ลบงาน</button></div>`)).join('') || '<div class="card mut">ไม่มีรายการ</div>'}`
}

window.assign = async function (id) { 
  const v = $('#a_' + id).value, p = techs.find(x => x.id === v); 
  const t = T.find(x => x.id === id);
  const updateData = { tech_id: v || null, tech_name: p ? p.name : null };
  if (v && t && t.status === 'accepted') {
    updateData.status = 'doing';
    updateData.history = logh(t, 'doing');
  }
  const { error } = await sb.from('tickets').update(updateData).eq('id', id); 
  if (error) return toast(error.message); 
  if (t) Object.assign(t, updateData);
  toast(v ? `มอบหมายงานให้ ${p ? p.name : 'ช่าง'} แล้ว (สถานะ: กำลังดำเนินการ)` : 'ยกเลิกการมอบหมายแล้ว');
  go(); 
}

window.del = async function (id) {
  if (armed !== id) { 
    armed = id; 
    toast('กด “ลบงาน” อีกครั้งเพื่อยืนยัน (ประวัติจะยังอยู่)'); 
    setTimeout(() => { if (armed === id) armed = '' }, 4000); 
    return; 
  }
  armed = ''; 
  const t = T.find(x => x.id === id);
  const { error } = await sb.from('tickets').update({ status: 'deleted', deleted_at: new Date().toISOString(), deleted_by: me.name, history: logh(t, 'deleted') }).eq('id', id); 
  if (error) return toast(error.message); 
  go();
}

function vStats() {
  const doneT = T.filter(t => t.status === 'done');
  const months = [...new Set(doneT.map(t => (t.done_at || t.created_at || '').slice(0,7)).filter(Boolean))].sort().reverse();
  if (!months.includes(statM) && months.length > 0) statM = months[0];

  const mTickets = doneT.filter(t => (t.done_at || t.created_at || '').startsWith(statM));
  const total = mTickets.length;

  const byTech = {};
  mTickets.forEach(t => {
      const n = t.tech_name || 'ไม่ระบุช่าง';
      byTech[n] = (byTech[n] || 0) + 1;
  });

  return `<div class="card row sp"><b>📊 สถิติการทำงานช่าง</b>
    <select style="width:auto; border-color:var(--pri); color:var(--pri); font-weight:bold;" onchange="setStatM(this.value)">
      ${months.map(m => `<option value="${m}" ${m === statM ? 'selected' : ''}>เดือน ${m}</option>`).join('') || '<option>ยังไม่มีข้อมูลงานเสร็จ</option>'}
    </select>
  </div>
  <div class="card scroll">
    <div style="margin-bottom:12px; font-size:15px;"><b>สรุปรวมงานเสร็จในเดือนนี้: <span style="color:var(--pri)">${total} งาน</span></b></div>
    <table>
      <tr><th>ชื่อช่าง</th><th style="width:80px; text-align:center">จำนวนงาน</th><th>คิดเป็นสัดส่วน (%)</th></tr>
      ${Object.entries(byTech).sort((a,b) => b[1]-a[1]).map(([n, v]) => {
          const pct = total > 0 ? Math.round((v/total)*100) : 0;
          return `<tr><td>${esc(n)}</td><td style="text-align:center; font-weight:bold;">${v}</td><td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="flex:1; background:var(--chip); height:12px; border-radius:6px; overflow:hidden;">
                <div style="width:${pct}%; background:var(--pri); height:100%; border-radius:6px;"></div>
              </div>
              <span style="width:40px; font-size:13px; color:var(--mut); font-weight:bold;">${pct}%</span>
            </div>
          </td></tr>`;
      }).join('') || '<tr><td colspan="3" class="mut" style="text-align:center; padding:20px 0;">ไม่มีงานที่ทำเสร็จในเดือนนี้</td></tr>'}
    </table>
  </div>`
}

function vStock() {
  const r = fT ? U.filter(u => u.tech_name === fT) : U, tn = [...new Set(U.map(u => u.tech_name))], tot = {}, byT = {};
  r.forEach(u => { const k = u.name + ' (' + u.unit + ')'; const q = Number(u.qty) || 0; tot[k] = (tot[k] || 0) + q; (byT[u.tech_name] ??= {})[k] = (byT[u.tech_name][k] || 0) + q });
  return `<div class="card row sp"><select style="width:auto" onchange="setFT(this.value)"><option value="">ช่างทั้งหมด</option>${tn.map(x => `<option ${x === fT ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><button onclick="csv()">ดาวน์โหลด CSV</button></div>
<div class="card scroll"><b>สรุปตามวัสดุ</b><table>${Object.entries(tot).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('') || '<tr><td class="mut">ยังไม่มีการเบิก</td></tr>'}</table></div>
<div class="card scroll"><b>สรุปตามช่าง</b><table>${Object.entries(byT).map(([t, m]) => `<tr><td>${esc(t)}</td><td>${Object.entries(m).map(([n, v]) => esc(n) + ' × ' + v).join('<br>')}</td></tr>`).join('')}</table></div>
<div class="card scroll"><b>รายการทั้งหมด</b><table><tr><th>วันที่</th><th>ช่าง</th><th>ใบงาน</th><th>วัสดุ</th><th>จำนวน</th></tr>${r.map(u => `<tr><td>${fmt(u.created_at)}</td><td>${esc(u.tech_name)}</td><td>${esc(u.ticket_id)}</td><td>${esc(u.name)}</td><td>${u.qty} ${esc(u.unit)}</td></tr>`).join('')}</table></div>`
}

window.csv = function () {
  const c = s => '"' + String(s ?? '').replace(/"/g, '""') + '"', r = fT ? U.filter(u => u.tech_name === fT) : U;
  const txt = '\uFEFFวันที่,ช่าง,ใบงาน,วัสดุ,จำนวน,หน่วย\n' + r.map(u => [fmt(u.created_at), u.tech_name, u.ticket_id, u.name, u.qty, u.unit].map(c).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv' })); a.download = 'material-usage.csv'; a.click();
}

function vGear() {
  const M = [['reporter', 'ผู้แจ้ง', 'ไม่ต้องล็อกอิน (แจ้งซ่อม, ประวัติ, ค้นหา)'], ['tech', 'ช่าง', 'งานกลาง รับงาน อัปเดตงาน เบิกวัสดุ'], ['admin', 'แอดมิน (พี่ผึ้ง)', 'งานทั้งหมด สถิติช่าง รายงานวัสดุ']];
  return `<div class="card"><b>⚙️ โหมดทดสอบ</b><p class="mut">เลือกบทบาทเพื่อดูหน้าจอของบทบาทนั้น ไม่ต้องล็อกอิน</p></div>` + M.map(([k, n, d]) => `<div class="card row sp" style="${dm === k ? 'border-color:var(--pri)' : ''}"><div><b>${n}</b><div class="mut">${d}</div></div><button class="${dm === k ? 'on' : 'p'}" onclick="setDm('${k}')">${dm === k ? 'กำลังใช้อยู่' : 'เลือก'}</button></div>`).join('');
}