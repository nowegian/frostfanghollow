// sim with real bet sizes: node sim4.js N bet [engine] [moonCfg]
const E=require(require('path').resolve(process.argv[4]||__dirname+'/../src/engine.js'));
if(process.argv[5]) Object.assign(E.MOON, JSON.parse(process.argv[5]));
const N=+process.argv[2],bet=+process.argv[3];if(process.env.UNIT)E.setUnit(+process.env.UNIT);
const jp={MINI:E.JP.MINI*bet,MINOR:E.JP.MINOR*bet,MAJOR:E.JP.MAJOR*bet,GRAND:E.GRAND_SEED};
let won=0,sq=0,cnt={MINI:0,MINOR:0,MAJOR:0,GRAND:0,FULL15:0,FULL8x5:0},holds=0,holdSpins=0,frees=0,parts={L:0,Sc:0,H:0,Mo:0,G:0};
function runHold(g){const c=Array(15).fill(null);g.forEach((col,r)=>col.forEach((x,y)=>{if(x.s==='O')c[y*5+r]=Object.assign({},x.orb)}));
 let s=3;while(s>0&&c.some(v=>!v)){s--;holdSpins++;const ev=E.holdStep(c,bet);let p=0;c.forEach(v=>{if(v&&v.plus){p++;v.plus=0;v.cash=0}});if(ev.length)s=3;s+=p;}
 c.forEach(v=>{if(v&&v.jp)cnt[v.jp]++});if(c.every(v=>v))cnt.FULL15++;holds++;
 const t=E.holdTotal(c,bet,jp);const gr=c.filter(v=>v&&v.jp==='GRAND').length*jp.GRAND;parts.G+=gr;parts.H+=t-gr;return t;}
function runMoon(){const st=E.moonStart();while(st.spins>0){st.spins--;const mg=E.moonGrid(bet);E.moonEnsure(st,mg,bet);E.moonSnow(st,mg,bet);const ev=E.moonResolve(st,mg,jp);ev.collected.forEach(c=>{if(c.jp)cnt[c.jp]++});if(ev.full)cnt.FULL8x5++;}E.moonFinish(st,bet);frees++;parts.Mo+=st.pot;return st.pot;}
for(let i=0;i<N;i++){const g=E.spinGrid(bet,false),ev=E.evaluate(g,bet);let w=ev.total;parts.L+=ev.total-ev.scatterPay;parts.Sc+=ev.scatterPay;
 if(ev.holdTrigger)w+=runHold(g); if(ev.freeTrigger)w+=runMoon(); won+=w;sq+=w*w;}
console.log(JSON.stringify({N,bet,won,sq,cnt,holds,holdSpins,frees,parts}));
