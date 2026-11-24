# Builds the phone version (ui_mobile.html) from the desktop game (ui.html): same code and ids, phone-first layout.
u=open('src/ui.html').read()
def R(a,b):
    global u
    assert u.count(a)==1,(u.count(a),a[:70]); u=u.replace(a,b)
R('<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n<meta name="theme-color" content="#0b0720">')
i=u.index("<!--PHONE-REDIRECT-->");j=u.index("<!--/PHONE-REDIRECT-->")+len("<!--/PHONE-REDIRECT-->");u=u[:i]+u[j:]
R("<title>Frostfang Hollow Link</title>","<title>Frostfang Hollow Link (Mobile)</title>")
i=u.index('<div class="cab">'); j=u.index('<div class="modal hidden" id="soundM">')
u=u[:i]+'''<div class="cab m">
  <header class="mtop">
    <h1 class="logo"><img src="img/logo.webp" alt="Frostfang Hollow Link" draggable="false"></h1>
    <button class="menubtn" id="menuBtn" aria-label="Menu">&#9776;</button>
  </header>
  <div class="jps art">
    <div class="jp grand" id="jpGRAND"><b>GRAND</b><i>$0</i></div>
    <div class="jp major" id="jpMAJOR"><b>MAJOR</b><i>$0</i></div>
    <div class="jp minor" id="jpMINOR"><b>MINOR</b><i>$0</i></div>
    <div class="jp mini" id="jpMINI"><b>MINI</b><i>$0</i></div>
  </div>
  <div class="stage">
    <div class="frame">
      <div class="banner hidden" id="banner"><span id="bannerTxt"></span></div>
      <div class="grid" id="grid"><div id="beast" class="idle"></div></div>
      <div class="bubble" id="bubble"></div>
      <div class="msg hidden" id="msg"></div>
    </div>
    <div class="meter hidden" id="meter"></div>
  </div>
  <div class="win-line" id="winLine">6+ orbs start the Hold &amp; Spin. 4+ moons in a row from reel 1 start the Moonrise.</div>
  <div class="mstats">
    <div class="box bank" id="bankBox"><small>CREDIT <span class="unit" id="bankUnit"><b class="d">$</b><b class="c">CR</b></span></small><div id="credit">$0</div><small id="creditCr" class="cr"></small></div>
    <div class="box betbox"><div class="denoms" id="denoms"></div>
      <div class="betrow"><button class="sm" id="betDn">&minus;</button><div><div id="bet">$1</div><small id="betCr" class="cr"></small></div><button class="sm" id="betUp">+</button></div></div>
    <div class="box winb"><small>WIN</small><div id="win">$0</div></div>
  </div>
  <nav class="mbar">
    <button class="tg" id="auto">AUTO</button>
    <button id="spin" class="art">SPIN</button>
    <button class="tg" id="speed">SPEED 1</button>
  </nav>
</div>
<div class="modal hidden" id="menuM"><div class="card msheet">
  <button class="close" id="menuClose">Close</button><h3>Menu</h3>
  <div class="mgrid">
    <button class="tg" id="sound">SOUND: OFF</button>
    <button class="tg" id="info">PAYS &amp; RULES</button>
    <button class="tg cash" id="refill">ADD $100</button>
    <button class="tg" id="toDesktop">DESKTOP VERSION</button>
  </div>
  <p class="foot">Original game for fun. Play money only: nothing to buy, nothing to win.</p>
 </div></div>
<div class="rotate" id="rotate"><div>&#128241;</div><p>Turn your phone upright to play</p></div>
'''+u[j:]
R("$('refill').onclick=","""$('toDesktop').onclick=()=>{try{sessionStorage.setItem('ffh-desktop','1')}catch(e){};location.href='index.html'};
$('menuBtn').onclick=()=>{if(!busy)$('menuM').classList.remove('hidden')};
$('menuClose').onclick=()=>$('menuM').classList.add('hidden');
$('menuM').onclick=e=>{if(e.target.id==='menuM'||e.target.closest('.mgrid button'))$('menuM').classList.add('hidden')};
$('refill').onclick=""")
i=u.rindex("</style>")
u=u[:i]+"""
/* ================= phone layout ================= */
html,body{height:100%;overscroll-behavior:none}
body{background-attachment:scroll;background-image:url(img/bg_mobile.webp);align-items:stretch;touch-action:manipulation}
button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.cab.m{width:min(520px,100%);min-height:100dvh;display:flex;flex-direction:column;gap:6px;
 padding:calc(env(safe-area-inset-top) + 6px) 8px calc(env(safe-area-inset-bottom) + 8px)}
.mtop{position:relative;display:flex;justify-content:center;align-items:center}
.cab.m h1.logo{margin:0}
.cab.m h1.logo img{height:clamp(46px,7.5dvh,74px);max-width:70vw}
.menubtn{position:absolute;right:0;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:12px;font-size:22px;
 background:#24174fcc;border:2px solid #ffffff33;backdrop-filter:blur(4px)}
.menubtn.armed{background:#ff8a1f;animation:pulse .6s infinite alternate}
.cab.m .jps.art{grid-template-columns:1.1fr 1.05fr 1fr 1fr;gap:3px;margin:0}
.cab.m .jps.art .jp i{font-size:13cqw}
.cab.m .stage{flex:1;justify-content:center}
.cab.m .frame,.cab.m .frame.moonf{width:calc(100% + 14px);margin:0 -7px}
/* phones: taller regular frame so every reel spot is square and the symbols are bigger.
   9-slice: corners (skulls) keep their shape, only the stone pillars between them stretch. */
.cab.m{--W:calc(min(520px,100vw) - 2px)}
.cab.m .frame:not(.moonf){aspect-ratio:auto;height:calc(var(--W)*.711)}
.cab.m .frame:not(.moonf)::after{background:none;border-style:solid;border-color:transparent;
 border-width:calc(var(--W)*.1875) calc(var(--W)*.21875) calc(var(--W)*.2) calc(var(--W)*.21875);
 border-image:url(img/frame_base.webp) 30% 21.875% 32% 21.875% fill stretch}
.cab.m .frame:not(.moonf)>.grid{top:calc(var(--W)*.096);bottom:calc(var(--W)*.131)}
.cab.m .stage>.meter .dots span{width:15px;height:15px}
.cab.m .frame>.bubble{font-size:12px}
.cab.m .win-line{margin:0;min-height:18px;font-size:12.5px}
.mstats{display:grid;grid-template-columns:1fr 1.45fr 1fr;gap:5px}
.mstats .box{padding:2px 5px;display:flex;flex-direction:column;justify-content:center;border-radius:12px;background:#0c0828d9;backdrop-filter:blur(3px)}
.mstats .box div{font-size:clamp(13px,3.9vw,16px)}
.mstats small{font-size:9px;letter-spacing:1px}.mstats .cr{font-size:9.5px}
.mstats .denoms{display:flex;justify-content:center;gap:4px;margin-bottom:3px}
.mstats .denoms button{padding:1px 8px;font-size:11px}
.mstats .betrow{gap:6px}
.mstats .sm{width:28px;height:28px;font-size:18px}
.mbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin-top:2px}
.mbar .tg{min-width:0;padding:10px 6px;font-size:13px;border-radius:12px}
.cab.m #spin{grid-row:auto;width:clamp(94px,26vw,116px);font-size:clamp(20px,5.8vw,25px)}
.msheet{max-width:420px}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.mgrid .tg{padding:14px 6px;font-size:14px}
.mgrid #refill{grid-column:span 2}
.mgrid #toDesktop{grid-column:span 2;font-size:12px;opacity:.85}
.msheet .foot{margin-top:8px}
.modal .card{max-height:calc(100dvh - 40px)}
.rotate{display:none;position:fixed;inset:0;z-index:50;background:#0b0720f2;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:18px}
.rotate div{font-size:48px;animation:spinr 2s ease-in-out infinite}@keyframes spinr{50%{transform:rotate(-90deg)}}
@media (orientation:landscape) and (max-height:500px){.rotate{display:flex}}
"""+u[i:]
open('src/ui_mobile.html','w').write(u)
