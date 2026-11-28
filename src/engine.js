// ===== Frostfang Hollow Link — game engine (pure logic, no DOM) =====
const ENGINE = (() => {
  const SYM = {
    W:{name:'Wild'}, F:{name:'Frostfang'}, P:{name:'Pumpkin'}, S:{name:'Skull'}, B:{name:'Bat'},
    C:{name:'Candle'}, A:{name:'A'}, K:{name:'K'}, Q:{name:'Q'}, J:{name:'J'}, T:{name:'10'},
    O:{name:'Orb'}, M:{name:'Moon'}
  };
  // line pays in credits for one line at the 1x bet (50 lines x 1 credit), always in steps of 10, so every win is a whole number of 10-credit steps
  const PAY = {
    P:{3:50,4:160,5:750}, S:{3:40,4:120,5:550}, B:{3:30,4:80,5:400}, C:{3:20,4:60,5:250},
    A:{3:10,4:30,5:120}, K:{3:10,4:30,5:120}, Q:{3:10,4:30,5:80}, J:{3:10,4:30,5:80}, T:{3:10,4:20,5:70}
  };
  // Regular spins: no orbs. Frostfang (F) is a bonus symbol on reels 1, 3 and 5 only; moons (M) on any reel.
  // At most one moon and one Frostfang per reel.
  const BASE_W = {F:7,P:5,S:6,B:7,C:8,A:10,K:10,Q:12,J:12,T:12,W:3,M:7};
  const MOON_REELS = [0,1,2,3,4];
  const F_REELS = {base:[0,2,4], free:[4]};    // in free games Frostfang only lands on reel 5, where he collects orbs
  const FREE_W = Object.assign({}, BASE_W, {W:6, M:3.5, O:14, F:10});
  const LINE = {K:0.75};                           // scales every line pay
  const FREE_GAMES = {3:6, 4:8, 5:10};          // moons on touching reels from reel 1
  const FG = {COLLECT_STEP:4, MAX_MULT:3, ORB_K:1.8};  // every 4 collections raise the orb multiplier (x2, then x3)
  const RANDOM = {CRACK:1/230, SNOWBALL:1/700};  // surprise features on regular spins
  const SNOWFIGHT = {MINI:0.60, X1:0.12, X2:0.10, X3:0.08, MINOR:0.08, MAJOR:0.02};
  const JP = {MINI:20, MINOR:50, MAJOR:300}; // x bet seeds (MAJOR also grows)
  const GRAND_SEED = 9000;           // dollars, same at every bet, grows from here
  const GRAND_K = 0.04;              // share of every bet paid back through the GRAND, at any bet size
  const HOLD_SPIN_RATE = 1/32.5;      // Hold & Spin spins played per base-game spin (measured; set by calibration)
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

  function pick(weights, reel, mode){
    const skip=k=>(k==='W'&&reel===0)||(k==='M'&&!MOON_REELS.includes(reel))||(k==='F'&&!F_REELS[mode||'base'].includes(reel));
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
  // grid[reel][row]; free = free games (orbs land, Frostfang only on reel 5); fs = free-game state (orb multiplier)
  const FILL5='PSBCAKQJT';
  function spinGrid(bet, free, fs){
    const w = free?FREE_W:BASE_W, mode=free?'free':'base', g=[];
    for(let r=0;r<5;r++){ const col=[]; let m=0,f=0;
      for(let y=0;y<3;y++){ let s=pick(w,r,mode);
        if((s==='M'&&m)||(s==='F'&&f)) s=FILL5[Math.floor(rng()*FILL5.length)];
        if(s==='M') m=1; if(s==='F') f=1;
        col.push(s==='O'?{s,orb:freeOrb(bet,fs)}:{s}); }
      g.push(col); }
    return g;
  }
  // orbs in free games: cash (raised by the collection multiplier) or now and then a jackpot
  function freeOrb(bet, fs){
    const r=rng(), mult=fs?fs.mult:1;
    if(r<0.0008*JP_BOOST) return {jp:'MAJOR'};
    if(r<0.0008*JP_BOOST+0.004*JP_BOOST) return {jp:'MINOR'};
    if(r<0.0008*JP_BOOST+0.004*JP_BOOST+0.012) return {jp:'MINI'};
    const v=[0.5,0.5,1,1,1,2,2,3,5,8][Math.floor(rng()*10)]*FG.ORB_K*mult;
    return {cash:money(cashOf(v*bet,bet))};
  }
  // 50 fixed paylines (row on reels 1-5; 0 = top, 1 = middle, 2 = bottom)
  const LINES = [
    [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[1,0,1,2,1],
    [1,2,1,0,1],[0,1,0,1,0],[2,1,2,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,1,1,1,0],[2,1,1,1,2],[0,0,1,0,0],[2,2,1,2,2],[0,2,0,2,0],
    [2,0,2,0,2],[1,0,2,0,1],[1,2,0,2,1],[0,2,2,2,0],[2,0,0,0,2],[0,0,2,0,0],[2,2,0,2,2],[0,1,2,2,2],[2,1,0,0,0],[1,0,0,1,2],
    [1,2,2,1,0],[0,0,0,1,2],[2,2,2,1,0],[0,1,1,1,1],[2,1,1,1,1],[1,1,1,0,0],[1,1,1,2,2],[0,0,1,1,1],[2,2,1,1,1],[1,0,1,0,1],
    [1,2,1,2,1],[0,1,0,0,0],[2,1,2,2,2],[1,1,0,0,0],[1,1,2,2,2],[0,0,0,1,1],[2,2,2,1,1],[1,0,0,0,0],[1,2,2,2,2],[0,1,2,1,2]];
  function evaluate(g, bet, mult){
    mult=mult||1; const unit=bet/50*mult, wins=[]; let total=0;   // bet/50 = dollars per credit (each of the 50 lines bets 1 credit)
    LINES.forEach((ln,li)=>{
      const s=g[0][ln[0]].s; if(!PAY[s]) return;
      let n=1; while(n<5){ const c=g[n][ln[n]].s; if(c===s||c==='W') n++; else break; }
      if(n<3) return;
      const amt=Math.round(PAY[s][n]*unit*100)/100; total+=amt;
      wins.push({s,n,line:li+1,amt,cells:ln.slice(0,n).map((y,r)=>[r,y])});
    });
    let orbs=0; g.forEach(col=>col.forEach(c=>{ if(c.s==='O') orbs++; }));
    // free games: moons on touching reels starting from reel 1 (one per reel); 3, 4, 5 reels = 6, 8, 10 free games
    let run=0; for(let r=0;r<5;r++){ if(g[r].some(c=>c.s==='M')) run++; else break; }
    const freeGames=FREE_GAMES[run]||0;
    // Diamond Hunt: Frostfang on reels 1, 3 and 5 pays 2x the bet
    const fr=[0,2,4].filter(r=>g[r].some(c=>c.s==='F')).length;
    const huntTrigger=fr===3; let scatterPay=0; if(huntTrigger){ scatterPay=bet*2; total+=scatterPay; }
    return {total:Math.round(total*100)/100, wins, orbs, moons:run, freeGames, freeTrigger:freeGames>0, huntTrigger, scatterPay,
      holdTrigger: orbs>=6};
  }
  // ===== Moonrise Free Games =====
  function freeStart(n){ return {left:n, played:0, collects:0, mult:1, total:0}; }
  // one free game: returns the grid, its line result, extra games, Frostfang's collection, and whether Frost Link starts
  function freeSpin(fs, bet){
    fs.left--; fs.played++;
    const g=spinGrid(bet,true,fs), ev=evaluate(g,bet);
    const out={g, ev, more:ev.freeGames, link:ev.orbs>=6, collect:null, multUp:false};
    fs.left+=ev.freeGames;
    if(!out.link && ev.orbs && g[4].some(c=>c.s==='F')){
      const list=[]; g.forEach((col,r)=>col.forEach((c,y)=>{ if(c.s==='O') list.push({r,y,orb:c.orb}); }));
      out.collect=list; fs.collects++;
      const m=Math.min(FG.MAX_MULT, 1+Math.floor(fs.collects/FG.COLLECT_STEP));
      if(m>fs.mult){ fs.mult=m; out.multUp=true; }
    }
    return out;
  }
  // ===== surprise features on regular spins =====
  const crackRoll=()=>rng()<RANDOM.CRACK;
  // Ice Crack: Frostfang smashes the glass and 6 to 9 orbs appear, starting Frost Link
  function crackOrbs(g, bet){
    const n=[6,6,6,7,7,8,9][Math.floor(rng()*7)], spots=[]; for(let i=0;i<15;i++) spots.push(i);
    const out=[]; for(let k=0;k<n;k++){ const i=spots.splice(Math.floor(rng()*spots.length),1)[0], r=i%5, y=Math.floor(i/5);
      g[r][y]={s:'O',orb:orbValue(bet,false)}; out.push({r,y}); }
    return out;
  }
  const snowRoll=()=>rng()<RANDOM.SNOWBALL;
  // Snowball Fight: pick snowballs until one prize shows 3 times. Returns the prize and the order the picks reveal.
  function snowFight(){
    const keys=Object.keys(SNOWFIGHT); let x=rng(), prize=keys[keys.length-1];
    for(const k of keys){ if((x-=SNOWFIGHT[k])<0){ prize=k; break; } }
    const others=[]; keys.forEach(k=>{ if(k!==prize){ others.push(k,k); } });
    const nOther=Math.floor(rng()*Math.min(9,others.length+1));
    const seq=[prize,prize]; for(let k=0;k<nOther;k++) seq.push(others.splice(Math.floor(rng()*others.length),1)[0]);
    for(let k=seq.length-1;k>0;k--){ const j=Math.floor(rng()*(k+1)); [seq[k],seq[j]]=[seq[j],seq[k]]; }
    seq.push(prize);
    return {prize, seq};
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
    ROWS: 8, START_SPINS: 5,
    GRID_SPINS: [2,3,4], GRID_SPINS_W: [0.45,0.35,0.20],   // finishing a grid (it grows) adds 2-4 spins at random
    STEPS: [[2,2],[3,3],[4,4],[5,5],[6,5],[7,5],[8,5]], // [rows, cols]
    NEED:  [5,4,3,3,3,3],                                // diamonds to finish each grid: 2x2 needs 5, 3x3 needs 4, then 3 each
    P_DIAMOND: 0.021, P_ORB: 0.04, P_PLUS: 0.22, // P_PLUS: share of diamonds that also give +1 spin
    VAL: 0.18, JPS: 0.25,  // VAL scales orb cash values, JPS scales each orb's jackpot chance
    DVAL: 0.19,            // regular diamonds carry credits too (scaled like orbs); +1 SPIN diamonds carry none
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
      if(x<MOON.P_DIAMOND) col.push(rng()<MOON.P_PLUS?{s:'D',plus:1}:{s:'D',cash:money(cashOf([0.5,1,1,2,2,3,5][Math.floor(rng()*7)]*MOON.DVAL*bet,bet))});
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
    const left=[]; g.forEach((col,r)=>col.forEach((c,y)=>{ if(c.s==='D') left.push({r,y,plus:c.plus||0,cash:c.cash||0}); }));
    while(left.length){
      // nearest diamond to the grid; ties go to the one higher up, then further left
      let bi=0; for(let i=1;i<left.length;i++){
        const a=left[i], b=left[bi], da=reach(st,a.r,a.y), db=reach(st,b.r,b.y);
        if(da<db || (da===db && (a.y<b.y || (a.y===b.y && a.r<b.r)))) bi=i;
      }
      const d=left.splice(bi,1)[0];
      moveTo(st,d.r,d.y);
      // diamonds no longer reset the spins: a +1 diamond adds one spin, the others pay their credits into the pot
      st.spins+=d.plus; if(d.cash) st.pot+=d.cash;
      const step={r:d.r,y:d.y,row:st.row,col:st.col,level:st.level,grew:false,plus:d.plus,cash:d.cash,spins:st.spins};
      if(st.level<MOON.STEPS.length-1){
        st.gems++;
        if(st.gems>=MOON.NEED[st.level]){
          st.gems=0; st.level++; growAround(st);
          // finishing a grid adds 2-4 spins
          let x=rng()*MOON.GRID_SPINS_W.reduce((a,b)=>a+b,0),k=0; while(k<MOON.GRID_SPINS.length-1 && (x-=MOON.GRID_SPINS_W[k])>=0) k++;
          const add=MOON.GRID_SPINS[k]; st.spins+=add;
          Object.assign(step,{grew:true,growRow:st.row,growCol:st.col,growLevel:st.level,addSpins:add,spins:st.spins});
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
  return {LINES,LINE,BASE_W,FREE_W,HOLD,FG,RANDOM,SNOWFIGHT,FREE_GAMES,freeStart,freeSpin,crackRoll,crackOrbs,snowRoll,snowFight,setUnit:u=>{UNIT=u}, moonEnsure, moonSnow, moonFinish,SYM,PAY,JP,GRAND_SEED,GRAND_K,HOLD_SPIN_RATE,grandChance,MOON,inZone,moonStart,moonGrid,moonResolve,spinGrid,evaluate,holdStep,holdTotal,orbValue,setRng:f=>rng=f};
})();
if(typeof module!=='undefined') module.exports=ENGINE;
