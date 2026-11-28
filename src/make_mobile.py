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
    <div class="jp maxi" id="jpMAXI"><b>MAXI</b><i>$0</i></div>
    <div class="jp major" id="jpMAJOR"><b>MAJOR</b><i>$0</i></div>
    <div class="jp grand" id="jpGRAND"><b>GRAND</b><i>$0</i></div>
    <div class="jp minor" id="jpMINOR"><b>MINOR</b><i>$0</i></div>
    <div class="jp mini" id="jpMINI"><b>MINI</b><i>$0</i></div>
  </div>
  <div class="stage">
    <div class="frame" id="frameEl">
      <div class="banner hidden" id="banner"><span id="bannerTxt"></span></div>
      <div class="grid" id="grid"><div id="beast" class="idle"></div></div>
      <div class="peekbox" id="peekbox"></div>
      <div class="bubble" id="bubble"></div>
      <div class="msg hidden" id="msg"></div>
    </div>
    <div class="meter hidden" id="meter"></div>
  </div>
  <div class="win-line" id="winLine">3+ moons = free games. Frostfang peeking from the left + a gem = Diamond Hunt. Wilds can start the Snowball Fight.</div>
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
.cab.m .jps.art{grid-template-columns:repeat(6,1fr);gap:2px 3px;margin:0}
.cab.m .jps.art .jp{grid-column:span 2}.cab.m .jps.art .jp.minor,.cab.m .jps.art .jp.mini{grid-column:span 3}
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
.cab.m .frame.holdf:not(.moonf){height:calc(var(--W)*.98)}
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
/* ================= phone turned sideways: jackpots on the left, reels in the middle, controls on the right ================= */
@media (orientation:landscape) and (max-height:500px){
.cab.m{--side:clamp(118px,17vw,172px);--H:calc(100dvh - max(6px,env(safe-area-inset-top)) - max(6px,env(safe-area-inset-bottom)));
 width:100%;max-width:none;height:100dvh;min-height:0;display:grid;column-gap:10px;row-gap:6px;
 grid-template-columns:var(--side) minmax(0,1fr) var(--side);grid-template-rows:auto 1fr auto;
 grid-template-areas:"top stage stats" "jps stage stats" "line stage bar";
 padding:max(6px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
.cab.m .mtop{grid-area:top;gap:4px}
.cab.m h1.logo{flex:1;min-width:0}
.cab.m h1.logo img{height:auto;width:100%;max-width:100%;max-height:20dvh}
.cab.m .menubtn{position:static;transform:none;width:34px;height:34px;font-size:18px;flex:none}
.cab.m .jps.art{grid-area:jps;grid-template-columns:1fr;align-content:center;gap:4px}
.cab.m .jps.art .jp,.cab.m .jps.art .jp.minor,.cab.m .jps.art .jp.mini{grid-column:auto}
.cab.m .stage{grid-area:stage;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.cab.m .frame:not(.moonf){aspect-ratio:1600/1000;height:auto;width:min(100%,calc(var(--H)*1.6));margin:0}
.cab.m .frame:not(.moonf)::after{border:none;border-image:none;background:url(img/frame_base.webp) 0 0/100% 100% no-repeat}
.cab.m .frame:not(.moonf)>.grid{top:15.4%;bottom:21%}
.cab.m .frame.holdf:not(.moonf){aspect-ratio:1600/1250;height:auto;width:min(100%,calc(var(--H)*1.28))}
.cab.m .frame.holdf:not(.moonf)::after{background:none;border-style:solid;border-color:transparent;
 border-width:calc(var(--fwp)*.1875) calc(var(--fwp)*.21875) calc(var(--fwp)*.2) calc(var(--fwp)*.21875);
 border-image:url(img/frame_base.webp) 30% 21.875% 32% 21.875% fill stretch}
.cab.m .frame.holdf:not(.moonf)>.grid{top:calc(var(--fwp)*.096);bottom:calc(var(--fwp)*.131)}
.cab.m .stage{--fw:min(100%,calc((var(--H) - 4px)*.842))}
.cab.m .frame.moonf{width:var(--fw);margin:0}
.cab.m .stage>.meter{position:absolute;top:50%;left:min(calc(50% + var(--fw)/2 + 6px),calc(100% - 78px));transform:translateY(-50%);width:78px;margin:0;padding:5px 4px;z-index:6}
.cab.m .stage>.meter .dots{flex-wrap:wrap;max-width:80px;margin:0 auto}
.cab.m .stage>.meter .dots span{width:14px;height:14px}
.cab.m .stage>.meter small{font-size:9.5px}
.cab.m .frame>.banner span{font-size:11px;padding:2px 10px;white-space:nowrap}
.cab.m .win-line{grid-area:line;font-size:11px;min-height:0}
.cab.m .mstats{grid-area:stats;grid-template-columns:1fr;align-content:center}
.cab.m .mstats .box{padding:4px 6px}
.cab.m .mbar{grid-area:bar;grid-template-columns:1fr 1fr;gap:6px;margin:0}
.cab.m .mbar #spin{grid-column:1/-1;grid-row:1;justify-self:center;width:clamp(74px,11vw,96px);font-size:clamp(17px,2.6vw,21px)}
.cab.m .mbar .tg{padding:8px 2px;font-size:11px;white-space:nowrap}
.cab.m .msg h2{font-size:clamp(22px,9dvh,40px)}.cab.m .msg img.ttl{max-height:38%}.cab.m .msg img.ttl.ttls{max-height:24%}.cab.m .msg .big{font-size:clamp(20px,8dvh,34px)}.cab.m .msg p{font-size:13px;margin-top:4px}
.cab.m .sfgrid{width:min(96%,calc((var(--H) - 110px)*3.2));margin-top:6px}
}
"""+u[i:]
open('src/ui_mobile.html','w').write(u)
