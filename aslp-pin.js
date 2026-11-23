/* ASLP PIN sign-in, shared by the main website, the Calendar and CD Strategies. No emails are sent.
   ASLPPin.mount(box, supabaseClient, { onSignedIn })  the sign-in form: registered email + PIN.
     - Admins, CWG leads and view-only accounts: their own PIN (first time: choose one; an admin approves it).
     - CWG members and territory contact persons: their CWG's PIN, which the CWG lead sets and shares with the group.
       It opens only their own territory (profile and CD Strategy).
     - Forgot PIN: an admin resets it in the console (own PIN), or the CWG lead gives the CWG PIN again.
   ASLPPin.setMyPin(db, pin)   change your own PIN, from the console.
   ASLPPin.altPrompt(db)       kept so older pages don't break; does nothing now. */
(function () {
  if (window.ASLPPin) return;
  var css = '.pin{font-family:inherit;color:inherit}.pin *{box-sizing:border-box}' +
    '.pin label{display:block;font-size:14px;font-weight:700;margin:10px 0 4px}' +
    '.pin input{width:100%;font:inherit;font-size:16px;padding:10px 12px;border:1.5px solid rgba(127,127,127,.45);border-radius:10px;background:transparent;color:inherit}' +
    '.pin input:focus{outline:2px solid #005fc0;outline-offset:1px}' +
    '.pin .pin-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}@media(max-width:520px){.pin .pin-row{grid-template-columns:1fr}}' +
    '.pin .pin-go{margin-top:14px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}' +
    '.pin button.pin-btn{font:inherit;font-weight:700;font-size:15px;border-radius:999px;padding:9px 20px;cursor:pointer;border:1.5px solid #000;background:#000;color:#fff}' +
    '.pin button.pin-btn:disabled{opacity:.55;cursor:default}' +
    '.pin button.pin-link{font:inherit;font-size:14.5px;background:none;border:0;padding:4px 0;color:#005fc0;text-decoration:underline;cursor:pointer}' +
    '.pin .pin-msg{margin-top:10px;font-size:14.5px;line-height:1.45;min-height:1em}.pin .pin-msg.err{color:#b3261e}.pin .pin-msg.ok{color:#1b6e3a}' +
    '.pin .pin-note{font-size:14px;opacity:.85;line-height:1.5;margin:6px 0 0}.pin .pin-k{font-size:12.5px;font-weight:800;color:#e14b1e;margin:0 0 4px}' +
    '.pin ul.pin-list{margin:8px 0 0 18px;padding:0;font-size:14.5px;line-height:1.5}.pin ul.pin-list li{margin-bottom:6px}' +
    'html.dark .pin button.pin-btn,[data-theme=dark] .pin button.pin-btn{background:#f5c400;color:#000;border-color:#f5c400}html.dark .pin button.pin-link,[data-theme=dark] .pin button.pin-link{color:#7db7ff}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .pin button.pin-btn{background:#f5c400;color:#000;border-color:#f5c400}:root:not([data-theme=light]) .pin button.pin-link{color:#7db7ff}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var norm = function (e) { return String(e || '').trim().toLowerCase(); };
  var okEmail = function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); };
  var weak = function (a) { return /^(\d)\1+$/.test(a) || /^(012345|123456|234567|345678|456789|654321|password|qwerty)/i.test(a); };
  var REMEMBER = 'aslp-pin-email';
  var NOT_REG = 'This email isn’t registered. CWG members and contact persons: ask your CWG lead to add your email for your territory. Others: please contact the ASLP team.';
  var fn = function (db, name, body) { return db.functions.invoke(name, { body: body }).then(function (r) { return r; }, function (e) { return { error: e }; }); };
  async function fnErr(r) { var m = (r && r.data && r.data.error) || ''; try { if (!m && r && r.error && r.error.context) m = (await r.error.context.json()).error; } catch (e) {} return m; }
  async function setMyPin(db, pin) {
    var r = await fn(db, 'aslp-pin', { action: 'set_my_pin', pin: pin });
    if (r.error || (r.data && r.data.error)) return { ok: false, message: (await fnErr(r)) || 'That didn’t work. Please try again.' };
    return { ok: true };
  }
  function pinCheck(a, b) { return a.length < 6 ? 'Your PIN needs at least 6 characters.' : weak(a) ? 'That PIN is too easy to guess. Please choose another.' : a !== b ? 'The two PINs don’t match.' : ''; }

  function mount(box, db, opts) {
    opts = opts || {}; if (!box) return;
    var email = opts.email || ''; try { email = email || localStorage.getItem(REMEMBER) || ''; } catch (e) {}
    var remember = function () { try { localStorage.setItem(REMEMBER, email); } catch (e) {} };
    var grab = function () { var i = box.querySelector('#pin-email'); if (i) email = norm(i.value) || email; };
    var emailField = function () { return '<label for="pin-email">Your registered email</label><input type="email" id="pin-email" autocomplete="username" value="' + esc(email) + '" placeholder="name@salvationarmy.org">'; };
    function wire(ids) { for (var k in ids) { var b = box.querySelector('#' + k); if (b) b.onclick = (function (f) { return function () { grab(); f(); }; })(ids[k]); } }
    function say(t, cls, html) { var m = box.querySelector('#pin-msg'); if (!m) return; m.className = 'pin-msg ' + (cls || ''); if (html) m.innerHTML = t; else m.textContent = t; }

    function signInView(msg, cls) {
      box.innerHTML = '<form class="pin" novalidate>' + emailField() +
        '<label for="pin-pin">Your PIN or your CWG’s PIN</label><input type="password" id="pin-pin" autocomplete="current-password" placeholder="PIN">' +
        '<div class="pin-go"><button type="submit" class="pin-btn" id="pin-in">Sign in</button><button type="button" class="pin-link" id="pin-first">First time? Set up your PIN</button><button type="button" class="pin-link" id="pin-forgot">Forgot your PIN?</button></div>' +
        '<div class="pin-msg ' + (cls || '') + '" role="status" id="pin-msg">' + (msg || '') + '</div></form>';
      wire({ 'pin-first': function () { setView(); }, 'pin-forgot': function () { forgotView(); } });
      box.querySelector('form').onsubmit = async function (ev) {
        ev.preventDefault(); grab();
        var pin = box.querySelector('#pin-pin').value;
        if (!okEmail(email)) return say('Please enter your registered email.', 'err');
        if (!pin) return say('Please enter your PIN.', 'err');
        var b = box.querySelector('#pin-in'); b.disabled = true; say('Signing in…'); remember();
        var r = await db.auth.signInWithPassword({ email: email, password: pin });          // own PIN
        if (!r.error) { say('Signed in.', 'ok'); if (opts.onSignedIn) opts.onSignedIn(email); return; }
        var c = await fn(db, 'aslp-signin', { action: 'cwg_signin', email: email, pin: pin }); // the CWG's PIN
        var d = (c && c.data) || {};
        if (d.ok && d.session) { var s2 = await db.auth.setSession(d.session); if (!s2.error) { say('Signed in.', 'ok'); if (opts.onSignedIn) opts.onSignedIn(email); return; } }
        b.disabled = false;
        if (d.reason === 'locked') return say('Too many wrong PINs. Please wait 30 minutes and try again, or ask your CWG lead for the CWG’s PIN.', 'err');
        var s = {}; try { s = (await db.rpc('aslp_pin_status', { p_email: email })).data || {}; } catch (e) {}
        if (s.registered === false && !d.member) say(NOT_REG, 'err');
        else if (d.member) say('That isn’t your CWG’s PIN. Please check it with your CWG lead.', 'err');
        else if (!s.has_pin && s.request === 'pending') say('Your PIN is waiting for approval by an admin. You can sign in once it’s approved.', 'err');
        else if (!s.has_pin && s.request === 'declined') say('Your PIN request wasn’t approved. Please contact the ASLP team.', 'err');
        else if (!s.has_pin) say('You don’t have a PIN yet. Choose <b>First time? Set up your PIN</b>.', 'err', true);
        else if (/rate|many/i.test((r.error && r.error.message) || '')) say('Too many tries. Please wait a few minutes and try again.', 'err');
        else say('That PIN isn’t right. Try again, or choose <b>Forgot your PIN?</b>', 'err', true);
      };
    }
    function setView() {
      box.innerHTML = '<form class="pin" novalidate><p class="pin-k">First time: set up your PIN</p>' +
        '<p class="pin-note"><b>CWG members and contact persons</b> don’t need their own PIN: sign in with your registered email and the PIN your CWG lead gave you.</p>' +
        '<p class="pin-note"><b>Admins, CWG leads and view-only accounts:</b> choose your PIN here. An admin approves it, then you sign in with your email and this PIN.</p>' + emailField() +
        '<div class="pin-row"><div><label for="pin-a">Choose a PIN</label><input type="password" id="pin-a" autocomplete="new-password" placeholder="At least 6 characters"></div>' +
        '<div><label for="pin-b">Type it again</label><input type="password" id="pin-b" autocomplete="new-password"></div></div>' +
        '<div class="pin-go"><button type="submit" class="pin-btn" id="pin-send">Send for approval</button><button type="button" class="pin-link" id="pin-back">Back to sign in</button></div>' +
        '<div class="pin-msg" role="status" id="pin-msg"></div></form>';
      wire({ 'pin-back': function () { signInView(); } });
      box.querySelector('form').onsubmit = async function (ev) {
        ev.preventDefault(); grab();
        var a = box.querySelector('#pin-a').value, b2 = box.querySelector('#pin-b').value;
        if (!okEmail(email)) return say('Please enter your email.', 'err');
        var bad = pinCheck(a, b2); if (bad) return say(bad, 'err');
        var btn = box.querySelector('#pin-send'); btn.disabled = true; say('Sending…');
        var r = await fn(db, 'aslp-signin', { action: 'pin_request', email: email, pin: a }); btn.disabled = false;
        var d = (r && r.data) || {};
        if (r.error || !d.ok) return say(d.reason === 'member' ? 'You’re registered as a CWG member or contact person: sign in with your email and your CWG’s PIN (ask your CWG lead for it).' :
          d.reason === 'not_registered' ? NOT_REG : d.reason === 'too_many' ? 'You’ve asked several times today. Please contact the ASLP team.' : 'That didn’t work. Please try again.', 'err');
        remember();
        signInView('<b>Sent for approval.</b> An admin will see it in their console. Once it’s approved, sign in here with your email and new PIN.', 'ok');
      };
    }
    function forgotView() {
      box.innerHTML = '<div class="pin"><p class="pin-k">Forgot your PIN?</p><ul class="pin-list">' +
        '<li><b>CWG members and contact persons:</b> ask your CWG lead for your CWG’s PIN.</li>' +
        '<li><b>Admins, CWG leads and view-only accounts:</b> ask an ASLP admin to reset your PIN in the console. Then choose <b>First time? Set up your PIN</b> to pick a new one.</li></ul>' +
        '<div class="pin-go"><button type="button" class="pin-btn" id="pin-back">Back to sign in</button></div></div>';
      wire({ 'pin-back': function () { signInView(); } });
    }
    signInView();
  }
  window.ASLPPin = { mount: mount, setMyPin: setMyPin, altPrompt: function () {} };
})();
