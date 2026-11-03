function vAll() {
  const L = T.filter(t => t.status === fil);
  return `
  <div class="card" style="margin-bottom:12px; padding:14px 18px;">
    <div style="font-size:16px; font-weight:bold; color:var(--tx); margin-bottom:10px;">📋 สรุปสถานะใบงานทั้งหมด</div>
    <div class="sum">${Object.keys(ST).map(s => {
      const count = T.filter(t => t.status === s).length;
      return `<div class="box ${fil === s ? 'sel' : ''}" onclick="setFil('${s}')"><b>${count}</b><span class="mut" style="font-size:12px;">${ST[s][0]}</span></div>`;
    }).join('')}</div>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0 8px;">
    <h3 style="margin:0; font-size:17px; color:var(--tx); display:flex; align-items:center; gap:8px;">
      <span>หมวด: <b>${ST[fil][0]}</b></span>
      <span style="font-size:13px; background:var(--chip); color:var(--tx-soft); padding:2px 8px; border-radius:12px; font-weight:normal;">${L.length} รายการ</span>
    </h3>
  </div>

  ${L.map(t => card(t, fil === 'deleted' ? '' : `
    <div class="row sp" style="margin-top:12px; padding-top:10px; border-top:1px solid var(--bd);">
      ${fil !== 'done' ? `
        <div class="row" style="flex:1; min-width:260px; gap:8px;">
          <select id="a_${t.id}" style="flex:1; min-width:160px; width:auto; font-size:13px; padding:6px 10px;">
            <option value="">-- มอบหมาย: ช่างส่วนกลาง --</option>
            ${techs.map(p => `<option value="${p.id}" ${p.id === t.tech_id ? 'selected' : ''}>🛠️ ${esc(p.name)}</option>`).join('')}
          </select>
          <button class="p" style="padding:6px 14px; font-size:13px;" onclick="assign('${t.id}')">บันทึกมอบหมาย</button>
        </div>` : '<div></div>'}
      <button class="d" style="padding:6px 12px; font-size:13px;" onclick="del('${t.id}')">🗑️ ลบใบงาน</button>
    </div>`)).join('') || '<div class="card mut" style="text-align:center; padding:30px;">ไม่มีรายการในสถานะนี้</div>'}`
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
  const r = fT ? U.filter(u => u.tech_name === fT) : U;
  const tn = [...new Set(U.map(u => u.tech_name || 'ไม่ระบุช่าง'))];
  const tot = {}, byT = {};
  r.forEach(u => {
    const k = u.name + ' (' + (u.unit || 'ชิ้น') + ')';
    const q = Number(u.qty) || 0;
    const techKey = u.tech_name || 'ไม่ระบุช่าง';
    tot[k] = (tot[k] || 0) + q;
    (byT[techKey] ??= {})[k] = (byT[techKey][k] || 0) + q;
  });

  return `
  <div class="card row sp" style="align-items:center;">
    <div>
      <b style="font-size:16px;">📦 รายงานการเบิกใช้วัสดุอุปกรณ์</b>
      <div class="mut" style="font-size:12px;">สรุปข้อมูลการเบิกจ่ายตามรายการและรายช่าง</div>
    </div>
    <div class="row" style="gap:8px;">
      <select style="width:auto; padding:6px 12px; font-size:13px;" onchange="setFT(this.value)">
        <option value="">ช่างทั้งหมด</option>
        ${tn.map(x => `<option value="${esc(x)}" ${x === fT ? 'selected' : ''}>🛠️ ${esc(x)}</option>`).join('')}
      </select>
      <button class="p" style="padding:6px 14px; font-size:13px;" onclick="csv()">📥 ดาวน์โหลด CSV</button>
    </div>
  </div>

  <div class="card scroll">
    <div style="font-size:15px; font-weight:600; margin-bottom:8px; color:var(--tx);">📊 สรุปยอดรวมตามชนิดวัสดุ</div>
    <table>
      <tr><th>ชื่อวัสดุอุปกรณ์</th><th style="width:120px; text-align:right;">ยอดรวมที่เบิก</th></tr>
      ${Object.entries(tot).sort((a,b) => b[1]-a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td style="text-align:right; font-weight:bold; color:var(--nu-orange); font-size:15px;">${v}</td></tr>`).join('') || '<tr><td colspan="2" class="mut" style="text-align:center; padding:18px;">ยังไม่มีข้อมูลการเบิกจ่าย</td></tr>'}
    </table>
  </div>

  <div class="card scroll">
    <div style="font-size:15px; font-weight:600; margin-bottom:8px; color:var(--tx);">👨‍🔧 สรุปตามช่างผู้เบิก</div>
    <table>
      <tr><th style="width:200px;">ชื่อช่าง</th><th>รายการวัสดุที่เบิก</th></tr>
      ${Object.entries(byT).map(([t, m]) => `<tr><td style="font-weight:600;">🛠️ ${esc(t)}</td><td>${Object.entries(m).map(([n, v]) => `<span style="display:inline-block; background:var(--chip); padding:2px 8px; border-radius:6px; margin:2px 4px 2px 0; font-size:12px;">${esc(n)} × <b>${v}</b></span>`).join('')}</td></tr>`).join('') || '<tr><td colspan="2" class="mut" style="text-align:center; padding:18px;">ยังไม่มีข้อมูลการเบิกจ่าย</td></tr>'}
    </table>
  </div>

  <div class="card scroll">
    <div style="font-size:15px; font-weight:600; margin-bottom:8px; color:var(--tx);">📋 ประวัติการเบิกทั้งหมด (${r.length} รายการ)</div>
    <table>
      <tr><th>วัน-เวลา</th><th>ช่างผู้เบิก</th><th>รหัสใบงาน</th><th>วัสดุอุปกรณ์</th><th>จำนวน</th></tr>
      ${r.map(u => `<tr><td style="font-size:12px; color:var(--mut);">${fmt(u.created_at)}</td><td><b>${esc(u.tech_name || 'ไม่ระบุ')}</b></td><td><span style="font-family:monospace; font-size:12px;">${esc(u.ticket_id)}</span></td><td>${esc(u.name)}</td><td style="font-weight:bold; color:var(--nu-orange);">${u.qty} ${esc(u.unit || 'ชิ้น')}</td></tr>`).join('') || '<tr><td colspan="5" class="mut" style="text-align:center; padding:18px;">ยังไม่มีประวัติการเบิก</td></tr>'}
    </table>
  </div>`;
}

window.csv = function () {
  const c = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const r = fT ? U.filter(u => u.tech_name === fT) : U;
  const txt = '\uFEFFวันที่,ช่าง,ใบงาน,วัสดุ,จำนวน,หน่วย\n' + r.map(u => [fmt(u.created_at), u.tech_name, u.ticket_id, u.name, u.qty, u.unit].map(c).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv' }));
  a.download = 'scipark-material-usage.csv';
  a.click();
};