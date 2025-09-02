// --------------------------- UTIL & STORAGE ---------------------------
    const $ = (id) => document.getElementById(id);
    const storage = {
      get: (k, d=null) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
      set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
      del: (k) => localStorage.removeItem(k)
    };
    const formatMoney = (n) => new Intl.NumberFormat(undefined, { style:'currency', currency: guessCurrency() }).format(n||0);
    function guessCurrency(){ try { return (Intl.NumberFormat().resolvedOptions().locale.includes('US')) ? 'USD' : 'USD'; } catch { return 'USD' } }

    // --------------------------- TABS ---------------------------
    function switchTab(name){
      document.querySelectorAll('.tab').forEach(el=>el.classList.add('hidden'));
      document.querySelector('#tab-'+name).classList.remove('hidden');
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('bg-slate-900','text-white'));
      document.querySelectorAll(`.tab-btn[data-tab="${name}"]`).forEach(b=>b.classList.add('bg-slate-900','text-white'));
    }
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click', ()=>switchTab(btn.dataset.tab)));

    // --------------------------- PROFILE & STATS ---------------------------
    function saveProfile() {
      const data = {
        quitDate: $('quitDate').value,
        cigsPerDay: $('cigsPerDay').value,
        packPrice: $('packPrice').value,
        perPack: $('perPack').value
      };
      fetch('http://localhost:5000/profile', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(response => {
        alert('Profile saved!');
        loadProfile();
      });
    }

    function resetProfile(){
      fetch('http://localhost:5000/profile', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          quitDate: '',
          cigsPerDay: '',
          packPrice: '',
          perPack: ''
        })
      })
      .then(res => res.json())
      .then(() => {
        renderStats();
      });
    }

    function renderStats(){
      fetch('http://localhost:5000/profile')
        .then(res => res.json())
        .then(p => {
          const since = p.quit_date ? new Date(p.quit_date) : null;
          let days = 0;
          if(since){
            const now = new Date();
            days = Math.max(0, Math.floor((now - since) / (1000*60*60*24)));
          }
          $('streakDays').textContent = days;
          $('quitStatus').textContent = p.quit_date ? `Since ${new Date(p.quit_date).toLocaleDateString()}` : 'Not set';
          const milestones = [1,3,7,30,90];
          const next = milestones.find(m=>days < m) || null;
          $('nextMilestone').textContent = next ? `${next} day${next>1?'s':''}` : 'Keep going!';
          const pct = Math.min(100, (days % (next||30)) / (next||30) * 100);
          $('streakRing').style.setProperty('--p', pct);

          // Money + cigs avoided estimates
          const cigsAvoided = days * (p.cigs_per_day || 0);
          const costPerCig = (p.pack_price||0) / (p.per_pack||20);
          const moneySaved = cigsAvoided * costPerCig;
          $('cigsAvoided').textContent = cigsAvoided.toLocaleString();
          $('moneySaved').textContent = formatMoney(moneySaved);

          // Prefill settings UI
          $('quitDate').value = p.quit_date || '';
          $('cigsPerDay').value = p.cigs_per_day || '';
          $('packPrice').value = p.pack_price || '';
          $('perPack').value = p.per_pack || '';
        });
    }

    // --------------------------- PLAN ---------------------------
    function addPlan(){
      const val = $('planInput').value.trim();
      if(!val) return;
      fetch('http://localhost:5000/plans', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ strategy: val })
      })
      .then(res => res.json())
      .then(() => {
        $('planInput').value='';
        renderPlan();
      });
    }

    function renderPlan(){
      fetch('http://localhost:5000/plans')
        .then(res => res.json())
        .then(plan => {
          $('planList').innerHTML = plan.map(x=>
            `<li class="flex items-center gap-2">
              <span>${x.strategy}</span>
            </li>`
          ).join('') || '<p class="text-slate-500">No strategies yet. Add one above or ask the AI Coach.</p>';
        });
    }

    // --------------------------- CRAVINGS ---------------------------
    function renderCravingsFromBackend(data) {
      $('cravingList').innerHTML = data.map(c =>
        `<li class="p-3 rounded-xl bg-white border">
          <div class="flex justify-between text-xs text-slate-500">
            <span>${new Date(c.created_at).toLocaleString()}</span>
            <span>Intensity ${c.intensity}/10</span>
          </div>
          <div class="text-sm mt-1">
            <span class="chip">${c.trigger}</span>
            <span class="chip">${c.mood}</span>
            ${c.notes ? `<div class='mt-1 text-slate-700'>${escapeHtml(c.notes)}</div>` : ''}
          </div>
        </li>`
      ).join('') || '<p class="text-slate-500">No cravings logged yet.</p>';
    }

    function loadCravings() {
      fetch('http://localhost:5000/cravings')
        .then(res => res.json())
        .then(data => {
          renderCravingsFromBackend(data);
        });
    }

    function addCraving() {
      const data = {
        intensity: document.getElementById('intensity').value,
        trigg: document.getElementById('trigger').value, // <-- use 'trigg'
        mood: document.getElementById('mood').value,
        notes: document.getElementById('notes').value
      };
      fetch('http://localhost:5000/cravings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(response => {
        loadCravings();
      });
    }

    // --------------------------- AI COACH ---------------------------
    const systemPrompt = `You are an empathetic quit‑smoking coach. Use motivational interviewing and practical, evidence‑informed steps. Keep replies under 180 words. Never shame. If a user mentions feeling unsafe, advise contacting local emergency services.`;

    function saveAI(){
      const cfg = { url: $('aiUrl').value.trim(), key: $('aiKey').value.trim(), model: $('aiModel').value.trim() };
      storage.set('ai', cfg); alert('AI settings saved to your browser.');
    }

    async function sendMessage(e){
      e.preventDefault();
      const input = $('message'); const text = input.value.trim(); if(!text) return;
      addChat('user', text);
      input.value='';
      const cfg = storage.get('ai', {});
      // If configured, try provider-compatible Chat Completions
      if(cfg.url && cfg.key && cfg.model){
        try{
          const res = await fetch(cfg.url.replace(/\/$/, '') + '/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + cfg.key },
            body: JSON.stringify({ model: cfg.model, messages: [ {role:'system', content: systemPrompt}, ...getChatHistory(), {role:'user', content: text} ], temperature: 0.7, max_tokens: 300 })
          });
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if(reply) { addChat('ai', reply); return; }
          throw new Error('No reply');
        }catch(err){ addChat('ai', offlineCoach(text) + "\n\n(Offline Coach: AI service unavailable.)"); }
      } else {
        // Offline fallback
        addChat('ai', offlineCoach(text));
      }
    }

    function getChatHistory(){
      const nodes = document.querySelectorAll('#chat .msg');
      const history = [];
      nodes.forEach(n=>{
        const role = n.classList.contains('user') ? 'user' : 'assistant';
        history.push({ role, content: n.dataset.raw || n.textContent });
      });
      return history;
    }

    function addChat(role, text){
      const el = document.createElement('div');
      el.className = `msg ${role} fade-in`;
      el.dataset.raw = text;
      el.innerHTML = role==='user' ? escapeHtml(text) : renderAI(text);
      $('chat').appendChild(el);
      $('chat').scrollTop = $('chat').scrollHeight;
    }

    function renderAI(text){
      // Basic markdown-ish formatting for bullets and bold
      return escapeHtml(text)
        .replace(/^\* (.*)$/gm,'• $1')
        .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
        .replace(/\n/g,'<br>');
    }

    function offlineCoach(input){
      // Lightweight rule-based suggestions using MI-style reflections and action steps
      const lower = input.toLowerCase();
      let reflection = 'It sounds like you\'re working hard on this.';
      if(lower.includes('stress')) reflection = 'It sounds like stress is triggering the urge.';
      if(lower.includes('after') && lower.includes('dinner')) reflection = 'After‑meal cravings are super common.';
      if(lower.includes('relapse')||lower.includes('slip')) reflection = 'A slip doesn\'t erase progress—you can restart now.';

      const steps = [
        'Start a 5‑minute urge timer and ride the wave.',
        'Do 4‑7‑8 breathing for 4 cycles.',
        'Change location for 5 minutes; grab water or brush teeth.',
        'Text someone supportive or post in a quit community.',
      ];

      const plan = storage.get('plan', []);
      const planLine = plan.length ? `One of your strategies: “${plan[0].text}”.` : 'Add a strategy to your plan for quick access.';

      return `${reflection}\n\nTry one of these now:\n• ${steps.join('\n• ')}\n\n${planLine}`;
    }

    // --------------------------- TOOLS: BREATHING & URGE TIMER ---------------------------
    function guideBreathing(){
      const seq = [ ['Inhale', 4], ['Hold', 7], ['Exhale', 8] ];
      let cycles = 0; speak('Starting 4 7 8 breathing.');
      const loop = () => {
        if(cycles>=4){ speak('Great job. Breathing complete.'); return; }
        let i=0;
        const step = () => {
          const [label, seconds] = seq[i];
          speak(label);
          countdown(seconds, label, () => { i=(i+1)%seq.length; if(i===0) cycles++; step(); });
        };
        step();
      };
      loop();
    }
    function openBreathing(){ switchTab('tools'); setTimeout(()=>guideBreathing(), 200); }

    let urgeInterval, urgeRemain = 300; // 5 minutes
    function startUrgeTimer(){
      switchTab('tools');
      resetUrgeTimer();
      const tips = [
        'Name the urge: “This is a craving. It will pass.”',
        'Sip cold water or chew gum.',
        'Walk for 2 minutes or stretch.',
        'Open your quit plan and pick one action.',
        'Slow inhale for 4s, exhale for 6s.'
      ];
      let tipIndex = 0;
      $('urgeTips').textContent = tips[tipIndex];
      urgeInterval = setInterval(()=>{
        urgeRemain--; updateUrgeUI();
        if(urgeRemain % 60 === 0 && tipIndex < tips.length-1){ tipIndex++; $('urgeTips').textContent = tips[tipIndex]; }
        if(urgeRemain<=0){ clearInterval(urgeInterval); $('urgeTips').textContent = 'Craving complete. How do you feel? Log it and celebrate.'; speak('Nice work. The wave passed.'); }
      }, 1000);
    }
    function resetUrgeTimer(){ clearInterval(urgeInterval); urgeRemain = 300; updateUrgeUI(); }
    function updateUrgeUI(){
      const m = Math.floor(urgeRemain/60).toString().padStart(1,'0');
      const s = (urgeRemain%60).toString().padStart(2,'0');
      $('urgeTime').textContent = `${m}:${s}`;
      $('urgeRing').style.setProperty('--p', (1 - urgeRemain/300)*100);
    }

    // --------------------------- QUOTES & SPEECH ---------------------------
    const quotes = [
      'Cravings are like waves—ride them, they pass.',
      'Not lighting up is your superpower today.',
      'One urge at a time. One hour at a time.',
      'Each smoke‑free day rebuilds your future.',
      'A slip is a step, not the story.'
    ];
    $('newQuote').addEventListener('click', ()=>{ $('dailyQuote').textContent = quotes[Math.floor(Math.random()*quotes.length)]; });
    $('speakQuote').addEventListener('click', ()=>{ speak($('dailyQuote').textContent); });

    function speak(text){
      try{
        const u = new SpeechSynthesisUtterance(text); u.rate = 1; u.pitch = 1; window.speechSynthesis.speak(u);
      }catch{}
    }
    function stopSpeech(){ try{ window.speechSynthesis.cancel(); }catch{} }

    // --------------------------- NOTIFICATIONS ---------------------------
    async function enableNotifs(){
      if(!('Notification' in window)) return alert('Notifications not supported in this browser.');
      const perm = await Notification.requestPermission();
      if(perm==='granted') alert('Notifications enabled. We\'ll keep it gentle.');
    }
    function sendTestNotif(){ if('Notification' in window && Notification.permission==='granted'){ new Notification('Breathe Better', { body: 'Quick check‑in: how are you feeling? Try a 2‑minute walk or 4‑7‑8 breathing.' }); } }

    // --------------------------- HELPERS ---------------------------
    function escapeHtml(str){ return str.replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;' }[m])); }

    // --------------------------- INIT ---------------------------
    function init(){
      renderStats(); 
      renderPlan();      // Uses backend
      loadCravings();    // Use backend for cravings
      renderRecentCravings();
      switchTab('dashboard');
      // AI settings preload
      const ai = storage.get('ai', {}); $('aiUrl').value = ai.url || ''; $('aiKey').value = ai.key || ''; $('aiModel').value = ai.model || '';
      // Daily greeting
      const hour = new Date().getHours();
      if(hour<12) $('dailyQuote').textContent = 'Morning check‑in: What will help you stay smoke‑free today?';
    }
    init();
    function loadTriggers() {
      fetch('http://localhost:5000/triggers')
        .then(res => res.json())
        .then(triggers => {
          const select = document.getElementById('trigger');
          select.innerHTML = triggers.map(t => `<option>${t}</option>`).join('');
        });
    }

    document.addEventListener('DOMContentLoaded', loadTriggers);
    function renderRecentCravings() {
      fetch('http://localhost:5000/cravings')
        .then(res => res.json())
        .then(list => {
          $('recentCravings').innerHTML = list.slice(0,5).map(c =>
            `<li class="flex items-center justify-between text-sm">
              <span>${new Date(c.created_at).toLocaleDateString()} • ${c.trigger}</span>
              <span class="text-slate-500">${c.intensity}/10</span>
            </li>`
          ).join('') || '<p class="text-slate-500">No data yet.</p>';
        });
    }

// --------------------------- SUPPORT/DONATION ---------------------------


async function supportApp() {
  // If using static payment links (one per amount)
  const paymentLinks = {
    5: "https://payment.intasend.com/pay/link-for-5",
    10: "https://payment.intasend.com/pay/link-for-10",
    20: "https://payment.intasend.com/pay/link-for-20",
  };

  if (paymentLinks[selectedDonation]) {
    window.open(paymentLinks[selectedDonation], "_blank");
  } else {
    alert("Donation option not available yet.");
  }
} 


/*function supportApp() {
  // Replace with your actual IntaSend Payment Link
  const paymentLink = "https://payment.intasend.com/pay/your-business-id";
  window.open(paymentLink, "_blank");
}*/
