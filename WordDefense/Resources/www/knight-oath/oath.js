/* Knight recruitment uses the existing authenticated Firestore and lobby adapters. */
(() => {
  'use strict';
  const FIRST_END = Date.parse('2026-12-14T00:00:00+09:00');
  const PERIOD = 14 * 86400000;
  const asset = name => 'knight-oath/assets/' + name + '.png';
  const lobby = () => window.WDLobby;
  const member = () => lobby()?.state.knightMembership;
  const recruitmentVisible = () => !member() || Date.now() < member().end;
  const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let account = '', ready = false, syncing = false, autoShown = false, popup = null, signing = false;
  let supplyKnown = '', supplyBusy = false;
  function season(now = Date.now()) {
    const cohort = now < FIRST_END ? 1 : 2 + Math.floor((now - FIRST_END) / PERIOD);
    return { cohort, end: FIRST_END + (cohort - 1) * PERIOD };
  }
  function countdown(end) {
    const remaining = Math.max(0, end - Date.now());
    if (remaining > 0 && remaining < 3600000) return '1시간 미만';
    const hours = Math.floor(remaining / 3600000);
    return Math.floor(hours / 24) + '일 ' + String(hours % 24).padStart(2, '0') + '시간';
  }
  function decode(document) {
    const f = document.fields;
    return { uid: f.uid.stringValue, nick: f.nick.stringValue, cohort: Number(f.cohort.integerValue),
      end: Date.parse(f.endAt.timestampValue), joinedAt: Date.parse(f.joinedAt.timestampValue) };
  }
  function applyMembership(value) {
    lobby().state.knightMembership = value;
    lobby()._pf.save(true);
    document.querySelectorAll('[data-knight-cohort]').forEach(el => { el.textContent = value ? value.cohort + '기' : '없음'; });
    document.querySelectorAll('.sb[data-k="knight"]').forEach(el => { el.hidden = !recruitmentVisible(); });
  }
  async function ensureSupply(auth, value) {
    if (!value || Date.now() < value.end || supplyKnown === auth.uid || supplyBusy) return;
    supplyBusy = true;
    try {
      const net = window.WDNet, id = 'knight_' + auth.uid;
      const fields = net._.encF({uid:auth.uid,claimed:false,title:value.cohort+'기 결성 축하 보급',
        body:'마감된 '+value.cohort+'기 기사단의 결성 축하 보급입니다.',
        rw:{gem:1000,key:5,stone:3,sk:30,gold:50000}});
      try {
        await net._.call(':commit',{writes:[{update:{name:net._.dn('mail_grants_v2',id),fields},updateTransforms:[net._.REQ('createdAt')],currentDocument:{exists:false}}]},'POST',auth);
      } catch (error) {
        // The server's deterministic grant survives retries, restarts and other devices.
        await net._.call('/mail_grants_v2/'+encodeURIComponent(id),null,'GET',auth);
      }
      if (account !== auth.uid) return;
      supplyKnown = auth.uid;
      await net.pull();
      setTimeout(() => { if (account === auth.uid) net.pull(); },800);
    } catch (_) { /* Existing inbox sync retries after reconnection. No local currency grant. */ }
    finally { supplyBusy = false; }
  }
  async function sync() {
    const net = window.WDNet;
    if (syncing || !lobby()?._b146.loaded() || !net?._ || !net.on() || navigator.onLine === false) return;
    syncing = true;
    try {
      const auth = await net._.token();
      const changed = account !== auth.uid;
      account = auth.uid;
      if (changed) { ready = false; autoShown = false; supplyKnown = ''; applyMembership(null); }
      let value = null;
      try { value = decode(await net._.call('/knight_members/' + encodeURIComponent(auth.uid), null, 'GET', auth)); }
      catch (error) { if (error.status !== 404) throw error; }
      applyMembership(value); ready = true;
      await ensureSupply(auth,value);
    } catch (error) {
      ready = false;
    } finally { syncing = false; }
  }
  function rewardsHTML(cohort) {
    const img = lobby()._att.IMG;
    const rewards = [['보석',1000,img.gem],['열쇠',5,img.key],['강화석',3,img.stone],['스킬석',30,asset('skill-stone')],['골드',50000,img.coin]];
    const items = rewards.map(([name,n,src]) => ({img:src,name:name==='골드'?'50,000':name,n:0,quantityLabel:name==='골드'?'':'×'+n.toLocaleString('ko-KR')}));
    return `<section class="ko-rewards"><h4>${cohort}기 결성 축하 보급</h4><div class="ko-items">${window.WDAcq.cardsHTML(items)}</div></section>`;
  }
  function open() {
    if (!lobby() || !recruitmentVisible() || popup?.isConnected) return;
    const signed = member();
    const sc = signed ? {cohort:signed.cohort,end:signed.end} : season();
    popup = lobby().modal(`<div class="ko-document">
      <button class="ko-close wd-x" type="button" aria-label="닫기"></button>
      <header class="ko-header"><img class="ko-helmet" src="${asset('helmet')}" alt=""><h3>${sc.cohort}기 기사단 서약서</h3></header>
      <div class="ko-countdown">모집 마감까지 <b data-ko-time>${countdown(sc.end)}</b></div>
      <div class="ko-oath"><p>나는 단어의 성벽을 지키는 기사로서</p>
      <p>적이 몰려와도 물러서지 않고<br>한 글자 한 글자로 성을 지키며<br>함께 선 동료를 끝까지 지킬 것을 맹세한다</p>
      <p>이 서약은 ${sc.cohort}기의 이름으로 영원히 기록된다</p></div>
      <div class="ko-signature"><span>기사단 서명</span><b data-ko-signature>${signed ? esc(signed.nick) : ''}</b><img class="ko-seal" src="${asset('wax-seal')}" alt="서약 인장"></div>
      ${rewardsHTML(sc.cohort)}<p class="ko-error" role="status" aria-live="polite"></p>
      <button type="button" class="ko-submit btn gold" ${signed ? 'disabled' : ''}>${signed ? '서약완료' : '서약하기'}</button></div>`,
      {cls:'ko-popup', x:false, dismiss:true, onclose:() => { popup = null; }});
    popup.querySelector('.ko-close').addEventListener('click',() => { if (!signing) lobby().closeModal(popup); });
    popup.dataset.cohort = sc.cohort;
    popup.querySelector('.ko-submit').addEventListener('click', sign);
    autoShown = true;
  }
  async function sign() {
    if (signing || !popup?.isConnected || member()) return;
    signing = true;
    const current = popup, button = current.querySelector('.ko-submit');
    button.disabled = true;
    current._dismiss = false;
    current.querySelector('.ko-error').textContent = '';
    try {
      const net = window.WDNet, auth = await net._.token(), sc = season();
      const nick = String(lobby().state.nick || '').trim();
      if (!nick) throw new Error('닉네임을 먼저 정해 주세요.');
      if (account && account !== auth.uid) throw new Error('계정이 변경됐어요. 다시 열어 주세요.');
      if (+current.dataset.cohort !== sc.cohort) throw new Error('다음 기수 모집이 시작됐어요. 다시 열어 주세요.');
      const name = net._.dn('knight_members',auth.uid);
      const fields = net._.encF({uid:auth.uid,nick,cohort:sc.cohort,mailed:false});
      fields.endAt = {timestampValue:new Date(sc.end).toISOString()};
      try {
        await net._.call(':commit',{writes:[{update:{name,fields},updateTransforms:[net._.REQ('joinedAt')],currentDocument:{exists:false}}]},'POST',auth);
      } catch (error) {
        // A retry after a lost response or another device's signup reads the one immutable record.
        let saved;
        try { saved = decode(await net._.call('/knight_members/'+encodeURIComponent(auth.uid),null,'GET',auth)); }
        catch (_) { throw error; }
        applyMembership(saved);
      }
      if (!member()) applyMembership({uid:auth.uid,nick,cohort:sc.cohort,end:sc.end,joinedAt:Date.now()});
      const signature = current.querySelector('[data-ko-signature]');
      signature.textContent = member().nick;
      signature.style.fontSize = 'calc(' + Math.min(18,148/[...member().nick].length) + '*var(--u))';
      signature.classList.add('ko-writing');
      current.querySelector('.ko-seal').hidden = false;
      current.querySelector('.ko-seal').classList.add('ko-stamping');
      current.querySelector('.ko-close').disabled = true;
      await new Promise(resolve => setTimeout(resolve,950));
      if (current.isConnected) complete(current);
    } catch (error) {
      current.querySelector('.ko-error').textContent = error.message === 'qa-offline'
        ? '기사 모집은 앱에서 로그인한 계정으로 참여해 주세요.'
        : error.status === 403 ? '기사 모집 서버에서 서약 저장을 허용하지 않았어요. 운영 반영이 필요합니다.'
        : error.status ? '서약을 저장하지 못했어요. 연결을 확인하고 다시 눌러 주세요.' : '서약을 저장하지 못했어요. 로그인 상태를 확인하고 다시 눌러 주세요.';
      button.disabled = false; current._dismiss = true;
    } finally { signing = false; }
  }
  function complete(current) {
    const original = current.querySelector('.modal');
    const box = original.getBoundingClientRect();
    const halves = ['left','right'].map(side => {
      const half = original.cloneNode(true);
      half.classList.add('ko-half','ko-half-'+side);
      half.setAttribute('inert',''); half.setAttribute('aria-hidden','true');
      Object.assign(half.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
      return half;
    });
    lobby().closeModal(current);
    const stage = document.createElement('div');
    stage.id = 'ko-split-stage'; stage.append(...halves); document.body.appendChild(stage);
    setTimeout(() => stage.remove(),950);
    window.WDAcq.show([{img:asset('wax-seal'),name:''}],{
      kind:'knightOath',title:'서약완료!',message:'마감 후 보급품이 우편으로 지급돼요',tap:'탭하여 닫기'
    });
  }

  function tick() {
    if (!lobby()) return;
    if (member() && !recruitmentVisible() && popup?.isConnected && !signing) lobby().closeModal(popup);
    const sc = season();
    const shown = document.querySelector('[data-ko-time]');
    if (shown && !signing) {
      const same = +popup?.dataset.cohort === sc.cohort;
      shown.textContent = same ? countdown(sc.end) : '다음 기수 모집 시작';
    }
    document.querySelectorAll('[data-knight-cohort]').forEach(el => { el.textContent = member() ? member().cohort+'기' : '없음'; });
    document.querySelectorAll('.sb[data-k="knight"]').forEach(el => { el.hidden = !recruitmentVisible(); });
    if (ready && !autoShown && !member() && lobby().open && lobby()._b146.route()==='home' && lobby().state.nick && !window.WDAcq?.open && !window.WDTut?.open && !document.querySelector('.mback')) open();
  }
  window.WDKnightOath = { open, sync, season, recruitmentVisible, get ready(){return ready;} };
  setInterval(tick,1000);
  setInterval(sync,60000);
  const boot = setInterval(() => { if (lobby()?._b146.loaded() && window.WDNet?._) {clearInterval(boot);sync();}},250);
  addEventListener('online',sync);
  addEventListener('focus',sync);
})();
