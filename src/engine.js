// ===== Frostfang Hollow Link — game engine (pure logic, no DOM) =====
const ENGINE = (() => {
  const SYM = {
    W:{name:'Wild'}, F:{name:'Frostfang'}, P:{name:'Pumpkin'}, S:{name:'Skull'}, B:{name:'Bat'},
    C:{name:'Candle'}, A:{name:'A'}, K:{name:'K'}, Q:{name:'Q'}, J:{name:'J'}, T:{name:'10'},
    O:{name:'Orb'}, M:{name:'Moon'}
  };
  // pay per way, as multiple of (bet / 25)
  const PAY = {
    F:{3:51,4:172,5:642}, P:{3:35,4:107,5:342}, S:{3:25,4:78,5:257}, B:{3:21,4:51,5:172}, C:{3:17,4:44,5:128},
    A:{3:8,4:21,5:65}, K:{3:8,4:21,5:65}, Q:{3:4,4:17,5:44}, J:{3:4,4:17,5:44}, T:{3:4,4:13,5:35}
  };
  const BASE_W = {F:3,P:5,S:6,B:7,C:8,A:10,K:10,Q:12,J:12,T:12,W:3,O:13.3,M:14};
  const MOON_REELS = [0,1,2,3,4]; // moons can land on any reel
  const FREE_W = Object.assign({}, BASE_W, {W:4, M:1});
  const JP = {MINI:20, MINOR:50, MAJOR:300}; // x bet seeds (MAJOR also grows)
  const GRAND_SEED = 9000;           // dollars, same at every bet, grows from here
  const GRAND_K = 0.04;              // share of every bet paid back through the GRAND, at any bet size
  const HOLD_SPIN_RATE = 1/31.7;      // Hold & Spin spins played per base-game spin (measured; set by calibration)
  // chance a GRAND orb lands on one Hold & Spin spin: proportional to the bet, so every bet has the same payback
  const grandChance = bet => Math.min(1, GRAND_K*bet/GRAND_SEED/HOLD_SPIN_RATE);
  let rng = Math.random;
  // Hold & Spin: 5 rows x 5 reels (25 spots). The 3 reel rows bring their orbs in, 2 empty rows are added below.
  const HOLD = {ROWS:5, SPINS:3, P_LAND:0.022, INIT_K:1.0, LAND_K:1.6,
    P_SNOW:0.3, SNOW_ADD:[0.2,0.2,0.4,0.4,0.6,1,1,2]}; // Frostfang's snowballs add credits to orbs already showing numbers
  const JP_BOOST = 2;
  // orb prizes are whole credits: UNIT = the denomination (value of one credit) set by the game
  let UNIT = 0.01;
  // orb prizes come in steps of bet/5: 10 credits x the bet multiplier, so every total is a multiple of 10 credits
  const cashOf = (v, bet) => { const step = bet / 5; return Math.max(step, Math.round(v / step) * step); };
  const money = v => Math.round(v * 100) / 100;

  function pick(weights, reel){
    const skip=k=>(k==='W'&&reel===0)||(k==='M'&&!MOON_REELS.includes(reel));
    let tot=0; for(const k in weights){ if(skip(k)) continue; tot+=weights[k]; }
    let r=rng()*tot;
    for(const k in weights){ if(skip(k)) continue; r-=weights[k]; if(r<0) return k; }
    return 'T';
  }
  function orbValue(bet, allowBig){
    const r=rng();
    // MINOR and MAJOR orbs twice as common as before (JP_BOOST)
    const pMaj=allowBig?0.002*JP_BOOST:0, pMin=(allowBig?0.0096:0.0116)*JP_BOOST;
    if(r<pMaj) return {jp:'MAJOR'};
    if(r<pMaj+pMin) return {jp:'MINOR'};
    if(r<pMaj+pMin+0.02) return {jp:'MINI'};
    const mult=[0.5,0.5,1,1,1,2,2,3,5,8][Math.floor(rng()*10)]*(allowBig?HOLD.LAND_K:HOLD.INIT_K);
    return {cash:money(cashOf(mult*bet,bet))};
  }
  // grid[reel][row]
  function spinGrid(bet, free){
    const w = free?FREE_W:BASE_W, g=[];
    for(let r=0;r<5;r++){ const col=[]; for(let y=0;y<3;y++){ const s=pick(w,r); col.push(s==='O'?{s,orb:orbValue(bet,false)}:{s}); } g.push(col); }
    return g;
  }
  function evaluate(g, bet, mult){
    mult=mult||1; const unit=bet/25*mult, wins=[]; let total=0;
    for(const s in PAY){
      let ways=1, n=0; const cells=[];
      for(let r=0;r<5;r++){
        const hits=[]; g[r].forEach((c,y)=>{ if(c.s===s||c.s==='W') hits.push(y); });
        if(!hits.length) break;
        ways*=hits.length; n++; hits.forEach(y=>cells.push([r,y]));
      }
      if(n>=3 && g[0].some(c=>c.s===s)){
        const amt=PAY[s][n]*ways*unit; total+=amt; wins.push({s,n,ways,amt,cells});
      }
    }
    let orbs=0, moons=0;
    g.forEach(col=>col.forEach(c=>{ if(c.s==='O') orbs++; if(c.s==='M') moons++; }));
    // Moonrise: moons on touching reels starting from reel 1, no gaps; 4+ moons in that run trigger
    let runMoons=0; for(let r=0;r<5;r++){ const n=g[r].filter(c=>c.s==='M').length; if(!n) break; runMoons+=n; }
    const moonTrig=runMoons>=4; moons=runMoons;
    let scatterPay=0; if(moonTrig) { scatterPay=bet*(moons===4?1:moons===5?3:10); total+=scatterPay; }
    return {total:Math.round(total*100)/100, wins, orbs, moons, scatterPay,
      holdTrigger: orbs>=6, freeTrigger: moonTrig};
  }
  // Hold & Spin step: cells = 25-array (5 rows x 5) of null or {cash|jp}; returns events
  // {i,type:'orb'} = a new orb landed (resets the spins); {i,type:'snow',add} = a snowball added credits to a cash orb
  function holdStep(cells, bet){
    const events=[], N=cells.length;
    // the rare GRAND orb: more likely at bigger bets
    { const e=[]; for(let i=0;i<N;i++) if(!cells[i]) e.push(i);
      if(e.length && rng()<grandChance(bet)){ const i=e[Math.floor(rng()*e.length)]; cells[i]={jp:'GRAND'}; events.push({i,type:'orb',grand:true}); } }
    for(let i=0;i<N;i++){ if(!cells[i] && rng()<HOLD.P_LAND){ cells[i]=orbValue(bet,true); events.push({i,type:'orb'}); } }
    // Frostfang throws 1 or 2 snowballs at numbers already on the screen
    const nums=[]; for(let i=0;i<N;i++) if(cells[i] && cells[i].cash!=null) nums.push(i);
    if(nums.length && rng()<HOLD.P_SNOW){
      const n=Math.min(nums.length, rng()<0.35?2:1);
      for(let k=0;k<n;k++){ const i=nums.splice(Math.floor(rng()*nums.length),1)[0];
        const add=money(cashOf(HOLD.SNOW_ADD[Math.floor(rng()*HOLD.SNOW_ADD.length)]*bet,bet));
        cells[i].cash=money(cells[i].cash+add); events.push({i,type:'snow',add}); }
    }
    return events;
  }
  // every spot filled doubles the win (a GRAND is paid once, not doubled)
  function holdTotal(cells, bet, jpVals){
    let t=0, g=0; cells.forEach(c=>{ if(!c) return; if(c.cash) t+=c.cash; if(c.jp==='GRAND') g+=jpVals.GRAND; else if(c.jp) t+=jpVals[c.jp]; });
    if(cells.every(c=>c)) t*=2;
    return Math.round((t+g)*100)/100;
  }
  // ===== Moonrise bonus: 8 rows x 5 reels, growing collection grid =====
  const MOON = {
    ROWS: 8, START_SPINS: 3, RESET_SPINS: 3, GROW_SPINS: 0,
    STEPS: [[2,2],[3,3],[4,4],[5,5],[6,5],[7,5],[8,5]], // [rows, cols]
    NEED:  [5,5,5,5,3,3],                                // diamonds to leave each step
    P_DIAMOND: 0.016, P_ORB: 0.04, P_PLUS: 0.15, // P_PLUS: share of diamonds that also give +1 spin
    VAL: 0.25, JPS: 0.25,  // VAL scales orb cash values, JPS scales each orb's jackpot chance
    MIN_PAY: 0, GUARANTEE: 1, P_SNOW: 0.18, SNOW_VAL: 0.4, SNOW_ODDS: [0.08, 0.002, 0.008, 0.015]       // every Moonrise Bonus pays at least this many times the bet
  };
  // The grid is a moving window: st.row/st.col = its top-left cell, size from STEPS[st.level]
  const size=st=>MOON.STEPS[st.level];
  function inZone(st, r, y){
    const [R,C]=size(st);
    return y>=st.row && y<st.row+R && r>=st.col && r<st.col+C;
  }
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function moonStart(){
    const [R,C]=MOON.STEPS[0];
    return {level:0, gems:0, spins:MOON.START_SPINS, pot:0,
      row:Math.floor(rng()*(MOON.ROWS-R+1)), col:Math.floor(rng()*(5-C+1))};
  }
  // cells the grid must travel to cover (r,y): 0 if already inside
  function reach(st, r, y){
    const [R,C]=size(st);
    const dx=Math.max(st.col-r,0,r-(st.col+C-1)), dy=Math.max(st.row-y,0,y-(st.row+R-1));
    return dx+dy;
  }
  // smallest move that puts (r,y) inside the grid
  function moveTo(st, r, y){
    const [R,C]=size(st);
    if(r<st.col) st.col=r; else if(r>st.col+C-1) st.col=r-C+1;
    if(y<st.row) st.row=y; else if(y>st.row+R-1) st.row=y-R+1;
  }
  // grow in place: expand around the current window, kept on the board
  function growAround(st){
    const [R0,C0]=MOON.STEPS[st.level-1], [R,C]=size(st);
    st.row=clamp(st.row-Math.floor((R-R0)/2),0,MOON.ROWS-R);
    st.col=clamp(st.col-Math.floor((C-C0)/2),0,5-C);
  }
  function moonOrb(bet){
    const x=rng();
    const k=MOON.JPS;
    const a=0.0004*k*JP_BOOST, b=a+0.00372*k*JP_BOOST, c=b+0.0115*k;
    if(x<a) return {jp:'MAJOR'};
    if(x<b) return {jp:'MINOR'};
    if(x<c) return {jp:'MINI'};
    return {cash:money(cashOf([0.5,0.5,1,1,1,2,2,3,5,8][Math.floor(rng()*10)]*MOON.VAL*bet,bet))};
  }
  const FILL='FPSBCAKQJT';
  function moonGrid(bet){
    const g=[];
    for(let r=0;r<5;r++){ const col=[]; for(let y=0;y<MOON.ROWS;y++){
      const x=rng();
      if(x<MOON.P_DIAMOND) col.push(rng()<MOON.P_PLUS?{s:'D',plus:1}:{s:'D'});
      else if(x<MOON.P_DIAMOND+MOON.P_ORB) col.push({s:'O',orb:moonOrb(bet)});
      else col.push({s:FILL[Math.floor(rng()*FILL.length)]});
    } g.push(col); }
    return g;
  }
  // Frostfang throws prize snowballs onto empty spots inside his grid (call after moonEnsure, before showing results)
  function moonSnow(st, g, bet){
    const out=[]; if(rng()>=MOON.P_SNOW) return out;
    const spots=[]; g.forEach((col,r)=>col.forEach((c,y)=>{ if(inZone(st,r,y) && c.s!=='O' && c.s!=='D') spots.push([r,y]); }));
    const n=Math.min(spots.length, rng()<0.3?2:1);
    for(let k=0;k<n;k++){
      const [r,y]=spots.splice(Math.floor(rng()*spots.length),1)[0], was=g[r][y], x=rng(); let c;
      const [pP,pMaj,pMin,pMini]=MOON.SNOW_ODDS;
      if(x<pP) c={s:'X'};
      else if(x<pP+pMaj) c={s:'O',orb:{jp:'MAJOR'}};
      else if(x<pP+pMaj+pMin) c={s:'O',orb:{jp:'MINOR'}};
      else if(x<pP+pMaj+pMin+pMini) c={s:'O',orb:{jp:'MINI'}};
      else c={s:'O',orb:{cash:money(cashOf([1,2,2,3,5][Math.floor(rng()*5)]*MOON.SNOW_VAL*bet,bet))}};
      g[r][y]=Object.assign(c,{snow:true}); out.push({r,y,was,c});
    }
    return out;
  }
  // Every bonus spin lands at least one orb inside the grid (call before showing the spin)
  function moonEnsure(st, g, bet){
    if(!MOON.GUARANTEE) return;
    const spots=[]; let has=false;
    g.forEach((col,r)=>col.forEach((c,y)=>{ if(inZone(st,r,y)){ if(c.s==='O') has=true; else if(c.s!=='D') spots.push([r,y]); } }));
    if(has||!spots.length) return;
    const [r,y]=spots[Math.floor(rng()*spots.length)]; g[r][y]={s:'O',orb:moonOrb(bet)};
  }
  // Resolve one bonus spin. 1) orbs inside the grid (where it sits now) go to the pot.
  // 2) the grid travels to the nearest diamond, then the next nearest, gathering each one;
  //    it can grow along the way. It stays where the last diamond was for the next spin.
  function moonResolve(st, g, jpVals){
    const ev={collected:[], missed:[], path:[], full:false, start:{row:st.row,col:st.col,level:st.level}};
    g.forEach((col,r)=>col.forEach((c,y)=>{
      if(c.s==='O'){ if(inZone(st,r,y)){ const v=c.orb.jp?jpVals[c.orb.jp]:c.orb.cash; st.pot+=v; ev.collected.push({r,y,v,jp:c.orb.jp}); } else ev.missed.push({r,y}); }
    }));
    ev.plus=0; g.forEach((col,r)=>col.forEach((c,y)=>{ if(c.s==='X' && inZone(st,r,y)){ st.spins++; ev.plus++; } }));
    const left=[]; g.forEach((col,r)=>col.forEach((c,y)=>{ if(c.s==='D') left.push({r,y,plus:c.plus||0}); }));
    while(left.length){
      // nearest diamond to the grid; ties go to the one higher up, then further left
      let bi=0; for(let i=1;i<left.length;i++){
        const a=left[i], b=left[bi], da=reach(st,a.r,a.y), db=reach(st,b.r,b.y);
        if(da<db || (da===db && (a.y<b.y || (a.y===b.y && a.r<b.r)))) bi=i;
      }
      const d=left.splice(bi,1)[0];
      moveTo(st,d.r,d.y);
      // every diamond resets the spins to 3; a +1 diamond adds one more on top
      st.spins=Math.max(st.spins,MOON.RESET_SPINS)+d.plus;
      const step={r:d.r,y:d.y,row:st.row,col:st.col,level:st.level,grew:false,plus:d.plus,spins:st.spins};
      if(st.level<MOON.STEPS.length-1){
        st.gems++;
        if(st.gems>=MOON.NEED[st.level]){
          st.gems=0; st.level++; growAround(st);
          Object.assign(step,{grew:true,growRow:st.row,growCol:st.col,growLevel:st.level});
          if(st.level===MOON.STEPS.length-1){ ev.full=true; step.full=true; } // full 8x5 grid: every orb counts from here on (no GRAND)
        }
      }
      step.gems=st.gems; ev.path.push(step);
    }
    st.pot=Math.round(st.pot*100)/100;
    return ev;
  }
  // end of the bonus: top the pot up to the guaranteed minimum; returns the top-up amount
  function moonFinish(st, bet){
    const min=Math.round(MOON.MIN_PAY*bet*100)/100, add=Math.max(0, Math.round((min-st.pot)*100)/100);
    st.pot=Math.round((st.pot+add)*100)/100; return add;
  }
  return {HOLD,setUnit:u=>{UNIT=u}, moonEnsure, moonSnow, moonFinish,SYM,PAY,JP,GRAND_SEED,GRAND_K,HOLD_SPIN_RATE,grandChance,MOON,inZone,moonStart,moonGrid,moonResolve,spinGrid,evaluate,holdStep,holdTotal,orbValue,setRng:f=>rng=f};
})();
if(typeof module!=='undefined') module.exports=ENGINE;
