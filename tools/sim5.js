// sim for the v2 feature set: node sim5.js N bet [engine]   env: UNIT, CFG (JSON patch: {BASE_W:{..},FREE_W:{..},FG:{..},RANDOM:{..},MOON:{..},HOLD:{..}})
const E=require(require('path').resolve(process.argv[4]||'./engine.js'));
if(process.env.UNIT)E.setUnit(+process.env.UNIT);
if(process.env.CFG){const c=JSON.parse(process.env.CFG);for(const k in c)Object.assign(E[k],c[k]);}
const N=+process.argv[2],bet=+process.argv[3];
const jp={MINI:E.JP.MINI*bet,MINOR:E.JP.MINOR*bet,MAJOR:E.JP.MAJOR*bet,GRAND:E.GRAND_SEED};
const P={L:0,Sc:0,FG:0,FGc:0,Lk:0,Hu:0,Sn:0,G:0};const C={free:0,freeSpins:0,hunt:0,huntSpins:0,link:0,linkFree:0,crack:0,snow:0,holdSpins:0,MINI:0,MINOR:0,MAJOR:0,GRAND:0};
let won=0,sq=0;
function runHold(g){const c=Array(25).fill(null);g.forEach((col,r)=>col.forEach((x,y)=>{if(x.s==='O')c[y*5+r]=Object.assign({},x.orb)}));
 let s=E.HOLD.SPINS;while(s>0&&c.some(v=>!v)){s--;C.holdSpins++;const ev=E.holdStep(c,bet);if(ev.some(x=>x.type==='orb'))s=E.HOLD.SPINS;}
 c.forEach(v=>{if(v&&v.jp)C[v.jp]++});C.link++;
 const t=E.holdTotal(c,bet,jp);const gr=c.filter(v=>v&&v.jp==='GRAND').length*jp.GRAND;P.G+=gr;P.Lk+=t-gr;return t;}
function runMoon(){const st=E.moonStart();while(st.spins>0){st.spins--;C.huntSpins++;const mg=E.moonGrid(bet);E.moonEnsure(st,mg,bet);E.moonSnow(st,mg,bet);const ev=E.moonResolve(st,mg,jp);ev.collected.forEach(c=>{if(c.jp)C[c.jp]++});}E.moonFinish(st,bet);C.hunt++;P.Hu+=st.pot;return st.pot;}
function runFree(n){const fs=E.freeStart(n);let t=0;C.free++;
 while(fs.left>0){C.freeSpins++;const o=E.freeSpin(fs,bet);t+=o.ev.total;P.FG+=o.ev.total;
  if(o.link){C.linkFree++;t+=runHold(o.g);}
  else if(o.collect){for(const c of o.collect){const v=c.orb.jp?jp[c.orb.jp]:c.orb.cash;if(c.orb.jp)C[c.orb.jp]++;t+=v;P.FGc+=v;}}
  if(fs.played>500)break;}
 return t;}
for(let i=0;i<N;i++){const g=E.spinGrid(bet,false),ev=E.evaluate(g,bet);let w=ev.total;P.L+=ev.total-ev.scatterPay;P.Sc+=ev.scatterPay;
 if(ev.freeTrigger)w+=runFree(ev.freeGames);
 if(ev.huntTrigger)w+=runMoon();
 if(!ev.freeTrigger&&!ev.huntTrigger){
  if(E.crackRoll()){C.crack++;E.crackOrbs(g,bet);w+=runHold(g);}
  else if(E.snowRoll()){C.snow++;const f=E.snowFight(bet);const v=f.prize[0]==='X'?(+f.prize[1])*bet:jp[f.prize];if(f.prize[0]!=='X')C[f.prize]++;w+=v;if(f.prize==='GRAND')P.G+=v;else P.Sn+=v;}}
 won+=w;sq+=w*w;}
console.log(JSON.stringify({N,bet,won,sq,P,C}));
