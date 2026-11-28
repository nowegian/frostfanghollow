// Diamond Hunt by gem combination: node huntsim.js N [engine]   env CFG (JSON patch), UNIT (denom), BET
const E=require(require('path').resolve(process.argv[3]||'./engine.js'));
if(process.env.CFG){const c=JSON.parse(process.env.CFG);for(const k in c)Object.assign(E[k],c[k]);}
const N=+process.argv[2],DEN=+(process.env.UNIT||0.02),bet=+(process.env.BET||3),MULT=Math.round(bet/50/DEN);E.setUnit(DEN);
const jp=Object.assign({MINI:E.JPF.MINI_CR*DEN,MINOR:E.JPF.MINOR_CR*DEN},E.JPF.SEED);
const combos={};for(let m=1;m<8;m++){const mods={sapphire:!!(m&1),ruby:!!(m&2),emerald:!!(m&4)};combos[Object.keys(mods).filter(k=>mods[k]).join('+')]=mods;}
// how often each combination triggers (from real base spins)
const freq={},pool={};let trig=0;const S=+(process.env.S||4e6);for(let i=0;i<S;i++){const g=E.spinGrid(bet,false),ev=E.evaluate(g,bet);if(ev.huntTrigger){trig++;const k=Object.keys(ev.mods).filter(x=>ev.mods[x]).join('+');freq[k]=(freq[k]||0)+1;(pool[k]=pool[k]||[]).push(ev.gemVals);}}
console.log(`hunt triggers 1 in ${(S/trig).toFixed(0)} spins`);
const rows=[];let wsum=0,wpay=0;
for(const [name,mods] of Object.entries(combos)){
 let pay=0,sq=0,spins=0,lvl=0,maxHit=0,jps=0,zero=0;const pays=[];
 for(let i=0;i<N;i++){const P=pool[name]||[[]];const st=E.moonStart(mods,DEN,MULT,P[i%P.length]);let n=0;if(st.carryGrid){const ev=E.moonResolve(st,st.carryGrid,jp);ev.path.forEach(p=>{if(p.jp)jps++});st.carryGrid=null;}
  while(st.spins>0){st.spins--;n++;const g=E.moonGrid(st,bet);E.moonEnsure(st,g,bet);E.moonSnow(st,g,bet);const ev=E.moonResolve(st,g,jp);ev.collected.forEach(c=>c.parts.forEach(p=>{if(p.jp)jps++}));if(n>2000)break;}
  E.moonFinish(st,bet);const x=st.pot/bet;pay+=x;sq+=x*x;spins+=n;lvl+=st.level;if(st.level>=st.maxLevel)maxHit++;pays.push(x);}
 pays.sort((a,b)=>a-b);const m=pay/N,sd=Math.sqrt(sq/N-m*m),q=p=>pays[Math.floor(p*(N-1))].toFixed(1);
 const f=(freq[name]||0)/trig;wsum+=f;wpay+=f*m;
 rows.push({combo:name,share:(f*100).toFixed(1)+'%',spins:(spins/N).toFixed(1),grid:E.MOON.STEPS[Math.round(lvl/N)].join('x')+` (lvl ${(lvl/N).toFixed(2)})`,maxGrid:(maxHit/N*100).toFixed(1)+'%',avgPayX:m.toFixed(1),sdX:sd.toFixed(1),median:q(.5),p90:q(.9),p99:q(.99),jpPerBonus:(jps/N).toFixed(3)});}
console.table(rows);
console.log(`weighted average pay ${ (wpay/wsum).toFixed(1)}x bet -> Diamond Hunt payback ${(wpay/wsum/(S/trig)*100).toFixed(1)}%`);
