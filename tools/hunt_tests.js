// Diamond Hunt acceptance tests (engine level): node hunt_tests.js [engine]
const E=require(require('path').resolve(process.argv[2]||'../src/engine.js'));
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
const bet=3,DEN=0.02,MULT=3,jp=Object.assign({MINI:1000*DEN,MINOR:5000*DEN},E.JPF.SEED);
const col=(...s)=>s.map(x=>({s:x}));
const grid=(r0,r1,r2,r3,r4)=>[col(...r0),col(...r1),col(...r2),col(...r3),col(...r4)];
const T=['T','J','Q'];
// --- trigger
ok(!E.evaluate(grid(['G','A','K'],T,T,T,T),bet).huntTrigger,'Frostfang without a gem does not trigger');
ok(!E.evaluate(grid(['A','K','Q'],['Z','J','Q'],['R','J','Q'],['E','J','Q'],T),bet).huntTrigger,'gems without Frostfang do not trigger');
for(const [s,k] of [['Z','sapphire'],['R','ruby'],['E','emerald']]){const ev=E.evaluate(grid(['G','A','K'],T,[s,'J','Q'],T,T),bet);ok(ev.huntTrigger&&ev.mods[k]&&Object.values(ev.mods).filter(Boolean).length===1,`Frostfang + ${k} triggers with only ${k} on`);}
for(let m=1;m<8;m++){const want={sapphire:!!(m&1),ruby:!!(m&2),emerald:!!(m&4)};const reels=[T,T,T,T];let i=0;for(const [k,s] of [['sapphire','Z'],['ruby','R'],['emerald','E']])if(want[k])reels[i++]=[s,'J','Q'];
 const ev=E.evaluate(grid(['G','A','K'],...reels),bet);ok(ev.huntTrigger&&JSON.stringify(ev.mods)===JSON.stringify(want),'combination '+Object.keys(want).filter(k=>want[k]).join('+'));}
{const ev=E.evaluate(grid(['G','A','K'],['E','J','Q'],['E','J','Q'],['E','J','Q'],['E','J','Q']),bet);const st=E.moonStart(ev.mods,DEN,MULT);ok(st.spins===5,'four emeralds still give 5 starting spins');}
{const st=E.moonStart({ruby:true},DEN,MULT);ok(st.maxLevel===6&&st.spins===3,'two rubies: max 8x5, 3 spins');}
// reel placement over many spins
{let g0=0,gBad=0,gemBad=0,dupe=0;for(let i=0;i<300000;i++){const g=E.spinGrid(bet,false);g.forEach((c,r)=>{let n=0;c.forEach(x=>{if(x.s==='G'){if(r)gBad++;else g0++;n++}if(E.GEMS[x.s]){if(r===0)gemBad++;n++}});if(n>1)dupe++;});}
 ok(g0>0&&gBad===0,'Frostfang bonus symbol only on reel 1');ok(gemBad===0,'gems only on reels 2-5');ok(dupe===0,'at most one bonus symbol per reel');}
{let bad=0;for(let i=0;i<50000;i++){const g=E.spinGrid(bet,true,{mult:1});g.forEach(c=>c.forEach(x=>{if(x.s==='G'||E.GEMS[x.s])bad++}));}ok(bad===0,'no Frostfang bonus symbol or gems in free games');}
// --- grid
for(let m=0;m<8;m++){const st=E.moonStart({sapphire:!!(m&1),ruby:!!(m&2),emerald:!!(m&4)},DEN,MULT);const [R,C]=E.MOON.STEPS[st.level];if(!(R===2&&C===2)){ok(false,'starts at 2x2');}}
ok(true,'every combination starts at 2x2');
function runMany(mods,n,patch){const keep={...E.MOON};Object.assign(E.MOON,patch||{});let maxLv=0,insideD=0,manyNoS=0,coinsIn=0,coinsOut=0,twoDiff=0,two=0,potOk=true,fullNoD=true,diamondsSeen=0;
 for(let i=0;i<n;i++){const st=E.moonStart(mods,DEN,MULT);let guard=0;while(st.spins>0&&guard++<300){st.spins--;const g=E.moonGrid(st,bet);
   g.forEach((c,r)=>c.forEach((x,y)=>{if(x.s==='D'){diamondsSeen++;if(E.inZone(st,r,y))insideD++;}if(x.many&&!st.many)manyNoS++;if(x.s==='O'){if(E.inZone(st,r,y))coinsIn++;else coinsOut++;if(x.many){two++;if(x.orb.cash!==x.orb2.cash||x.orb.jp!==x.orb2.jp)twoDiff++;}}}));
   if(st.level===6&&g.some(c=>c.some(x=>x.s==='D')))fullNoD=false;
   E.moonEnsure(st,g,bet);E.moonSnow(st,g,bet);
   g.forEach((c,r)=>c.forEach((x,y)=>{if(x.s==='D'&&E.inZone(st,r,y))insideD++;}));
   const pot0=st.pot,ev=E.moonResolve(st,g,jp);
   const exp=ev.collected.reduce((a,c)=>a+c.parts.reduce((b,p)=>b+p.v,0),0)+ev.path.reduce((a,p)=>a+p.cash,0);
   if(Math.abs(st.pot-pot0-exp)>0.011)potOk=false;
   // coins outside the grid were not collected
   ev.collected.forEach(c=>{if(!E.inZone(ev.start,c.r,c.y))potOk=false;});}
  maxLv=Math.max(maxLv,st.level);}
 Object.assign(E.MOON,keep);return {maxLv,insideD,manyNoS,coinsIn,coinsOut,two,twoDiff,potOk,fullNoD,diamondsSeen};}
let r=runMany({},3000,{P_DIAMOND:0.2});ok(r.maxLv===3,'without ruby the grid never passes 5x5 (max '+E.MOON.STEPS[r.maxLv].join('x')+')');
ok(r.insideD===0&&r.diamondsSeen>0,'diamonds never land inside the grid (incl. snowballs)');ok(r.manyNoS===0,'no double symbols without sapphire');
ok(r.coinsIn>0&&r.coinsOut>0,'gold coins land inside and outside the grid');ok(r.potOk,'pot = coins inside the grid + diamonds, each counted once; outside coins not collected');
r=runMany({ruby:true},3000,{P_DIAMOND:0.2});ok(r.maxLv===6,'with ruby the grid reaches 8x5');ok(r.fullNoD,'no diamonds while the grid fills the 8x5 board');ok(r.insideD===0,'ruby: diamonds never inside the grid');
r=runMany({sapphire:true},3000);ok(r.two>0&&r.twoDiff/r.two>0.5,`double gold coins carry two independent values (${(r.twoDiff/r.two*100).toFixed(0)}% differ)`);ok(r.potOk,'sapphire: both values paid exactly once');
{let plus2=0,cash2=0,std=0;const st=E.moonStart({sapphire:true},DEN,MULT);for(let i=0;i<20000;i++){const g=E.moonGrid(st,bet);g.forEach(c=>c.forEach(x=>{if(x.s==='D'){if(x.plus===2)plus2++;else if(x.cash2)cash2++;else std++;}}));}
 ok(plus2>0&&cash2>0&&std>plus2+cash2,'sapphire adds +2 SPIN and double diamonds and keeps the standard ones');}
{const st=E.moonStart({},DEN,MULT);const g=E.moonGrid(st,bet);for(let r=0;r<5;r++)for(let y=0;y<8;y++)g[r][y]={s:'T'};g[4][7]={s:'D',plus:2,many:true};const s0=st.spins;const ev=E.moonResolve(st,g,jp);ok(st.spins-s0>=2,'+2 SPIN diamond adds 2 spins');}
{const st=E.moonStart({},DEN,MULT);const g=E.moonGrid(st,bet);for(let r=0;r<5;r++)for(let y=0;y<8;y++)g[r][y]={s:'T'};g[st.col][st.row]={s:'O',many:true,orb:{cash:1},orb2:{cash:2.5}};const ev=E.moonResolve(st,g,jp);ok(st.pot===3.5&&ev.collected[0].parts.length===2,'double gold coin pays 1.00 + 2.50 = 3.50 as two parts');}
console.log(fails?fails+' FAILED':'all passed');process.exit(fails?1:0);
