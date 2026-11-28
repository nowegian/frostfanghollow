// ===== Frostfang Hollow Link — game engine (pure logic, no DOM) =====
const ENGINE = (() => {
  const SYM = {
    W:{name:'Wild'}, F:{name:'Frostfang'}, P:{name:'Pumpkin'}, S:{name:'Skull'}, B:{name:'Bat'},
    C:{name:'Candle'}, A:{name:'A'}, K:{name:'K'}, Q:{name:'Q'}, J:{name:'J'}, T:{name:'10'},
    O:{name:'Gold coin'}, M:{name:'Moon'}, G:{name:'Frostfang (bonus)'}, Z:{name:'Sapphire'}, R:{name:'Ruby'}, E:{name:'Emerald'}
  };
  // line pays in credits for one line at the 1x bet (50 lines x 1 credit), always in steps of 10, so every win is a whole number of 10-credit steps
  const PAY = {
    F:{3:60,4:250,5:1000}, P:{3:50,4:160,5:750}, S:{3:40,4:120,5:550}, B:{3:30,4:80,5:400}, C:{3:20,4:60,5:250},
    A:{3:10,4:30,5:120}, K:{3:10,4:30,5:120}, Q:{3:10,4:30,5:80}, J:{3:10,4:30,5:80}, T:{3:10,4:20,5:70}
  };
  // Regular spins: no orbs. Frostfang (F) is the top pay symbol on every reel; moons (M) are the free-games scatter, at most one per reel.
  const BASE_W = {F:2.5,P:5,S:6,B:7,C:8,A:10,K:10,Q:12,J:12,T:12,W:2.9,M:2.75, E:0.88, R:0.77, Z:0.55};
  // Diamond Hunt trigger: Frostfang peeks in from the left (RANDOM.PEEK per regular spin) and at least one gem modifier
  // (Z sapphire, R ruby, E emerald) lands on reels 2-5 (at most one gem per reel).
  const GEMS = {Z:'sapphire', R:'ruby', E:'emerald'};
  const MOON_REELS = [0,1,2,3,4];
  // Free games: the card symbols (A, K, Q, J, 10) are taken off the reels. No orbs (orbs are retired for now).
  const FREE_W = {F:4,P:5,S:6,B:7,C:8,W:4.3,M:1.2};
  const SCATTER = {3:2, 4:10, 5:50};               // moons anywhere: x total bet, paid up front
  const LINE = {K:0.75};                           // scales every line pay
  const FREE_GAMES = 6;                           // 3+ moons anywhere (or the lucky single-moon trigger) = 6 free games
  const FG = {COLLECT_STEP:4, MAX_MULT:3, ORB_K:1.8};  // every 4 collections raise the orb multiplier (x2, then x3)
  const RANDOM = {CRACK:0, LUCKY:1/400, PEEK:1/43};   // PEEK: Frostfang peeks in from the left (Diamond Hunt attempt)  // surprise features on regular spins; LUCKY: 1 or 2 moons start the free games anyway
  const JP = {MINI:20, MINOR:50, MAJOR:300}; // x bet seeds (MAJOR also grows)
  const GRAND_SEED = 9000;           // dollars, same at every bet, grows from here
  const GRAND_K = 0.04;              // share of every bet paid back through the GRAND, at any bet size
  const HOLD_SPIN_RATE = 1/33.7;      // Hold & Spin spins played per base-game spin (measured; set by calibration)
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
    const skip=k=>(k==='W'&&reel===0)||(k==='M'&&!MOON_REELS.includes(reel))||(k==='G'&&reel!==0)||(GEMS[k]&&reel===0);
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
  const FILL5='PSBCAKQJT', FILLF='PSBC';
  function spinGrid(bet, free, fs){
    const w = free?FREE_W:BASE_W, mode=free?'free':'base', fill=free?FILLF:FILL5, g=[];
    for(let r=0;r<5;r++){ const col=[]; let m=0, gb=0;
      for(let y=0;y<3;y++){ let s=pick(w,r,mode);
        if((s==='M'&&m)||((s==='G'||GEMS[s])&&gb)) s=fill[Math.floor(rng()*fill.length)];
        if(s==='M') m=1; if(s==='G'||GEMS[s]) gb=1;
        col.push(s==='O'?{s,orb:freeOrb(bet,fs)}:GEMS[s]?{s,val:gemValue(bet)}:{s}); }
      g.push(col); }
    // Diamond Hunt: on a regular spin Frostfang may peek in from the LEFT side of the reels (whatever is on reel 1)
    g.peek = !free && rng()<RANDOM.PEEK;
    return g;
  }
  // Gems on regular spins carry a credit value or a jackpot. On a regular spin they only block lines; when the
  // Diamond Hunt starts they turn into diamonds on the bonus board and keep their value (Frostfang collects them).
  const GEMVAL = {K:1.0, JPK:8};   // K scales gem credit values (like diamonds); JPK scales each jackpot's chance on a gem
  function gemValue(bet){
    const denom=UNIT, vals=Object.assign({MINI:JPF.MINI_CR*denom, MINOR:JPF.MINOR_CR*denom}, JPF.SEED);
    let y=rng(); for(const k of ['GRAND','MAJOR','MAXI','MINOR','MINI']){ if((y-=GEMVAL.JPK*JPF.SHARE[k]*bet/vals[k])<0) return {jp:k}; }
    return {cash:money(cashOf([0.5,1,1,2,2,3,5][Math.floor(rng()*7)]*MOON.DVAL*GEMVAL.K*bet,bet))};
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
  function evaluate(g, bet, mult, free){
    mult=mult||1; const unit=bet/50*mult, wins=[]; let total=0;   // bet/50 = dollars per credit (each of the 50 lines bets 1 credit)
    LINES.forEach((ln,li)=>{
      const s=g[0][ln[0]].s; if(!PAY[s]) return;
      let n=1; while(n<5){ const c=g[n][ln[n]].s; if(c===s||c==='W') n++; else break; }
      if(n<3) return;
      const amt=Math.round(PAY[s][n]*unit*100)/100; total+=amt;
      wins.push({s,n,line:li+1,amt,cells:ln.slice(0,n).map((y,r)=>[r,y])});
    });
    let orbs=0; g.forEach(col=>col.forEach(c=>{ if(c.s==='O') orbs++; }));
    // free games: moons anywhere (one per reel). 3, 4, 5 moons pay 2x, 10x, 50x the bet and start 6 free games.
    // On a regular spin, 1 or 2 moons can still start the free games by luck (no scatter pay).
    let moons=0; for(let r=0;r<5;r++) if(g[r].some(c=>c.s==='M')) moons++;
    let scatterPay=0, freeGames=0, lucky=false;
    if(moons>=3){ scatterPay=SCATTER[moons]*bet; total+=scatterPay; freeGames=FREE_GAMES; }
    else if(moons>0 && !free && rng()<RANDOM.LUCKY){ freeGames=FREE_GAMES; lucky=true; }
    // Diamond Hunt: the dancing Frostfang on reel 1 and at least one gem on reels 2-5 (each gem type is an on/off flag)
    const mods={sapphire:false, ruby:false, emerald:false}, gemVals=[];
    for(let r=1;r<5;r++) g[r].forEach((c,y)=>{ if(GEMS[c.s]){ mods[GEMS[c.s]]=true; gemVals.push({r,y,s:c.s,val:c.val||{cash:0}}); } });
    const huntTrigger=!free && !!g.peek && (mods.sapphire||mods.ruby||mods.emerald);
    return {total:Math.round(total*100)/100, wins, orbs, moons, freeGames, freeTrigger:freeGames>0, lucky, huntTrigger, mods, gemVals, scatterPay,
      holdTrigger: orbs>=6};
  }
  // ===== Moonrise Free Games =====
  function freeStart(n){ return {left:n, played:0, collects:0, mult:1, total:0}; }
  // one free game: returns the grid, its line result, extra games, Frostfang's collection, and whether Frost Link starts
  function freeSpin(fs, bet){
    fs.left--; fs.played++;
    const g=spinGrid(bet,true,fs), ev=evaluate(g,bet,1,true);
    const out={g, ev, more:ev.freeGames, link:false, collect:null, multUp:false};
    fs.left+=ev.freeGames;
    if(false){
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
  // ===== Snowball Fight jackpot feature =====
  // Any wild that lands on a regular spin can start it. MINI and MINOR are fixed credits, so their dollar value follows the
  // denomination; MAXI, MAJOR and GRAND are progressives in dollars, the same at every denomination.
  // Each prize returns a fixed share of every bet: its chance per spin is SHARE x bet / value. Bigger bets start the
  // Snowball Fight more often, and bigger denominations make the progressives more likely.
  const JPF = {MINI_CR:1000, MINOR_CR:5000, SEED:{MAXI:1000, MAJOR:6000, GRAND:12000},
    SHARE:{MINI:0.03, MINOR:0.015, MAXI:0.015, MAJOR:0.015, GRAND:0.02},
    GROW:{MAXI:0.004, MAJOR:0.003, GRAND:0.003}};   // share of every bet added to each progressive meter
  function jpOdds(denom, mult){
    const bet=50*mult*denom, v=Object.assign({MINI:JPF.MINI_CR*denom, MINOR:JPF.MINOR_CR*denom}, JPF.SEED), per={};
    let fight=0; for(const k in JPF.SHARE){ per[k]=JPF.SHARE[k]*bet/v[k]; fight+=per[k]; }
    return {per, fight};
  }
  // expected wilds per regular spin (wilds land on reels 2-5)
  const expWilds=()=>{ let t=0; for(const k in BASE_W) t+=BASE_W[k]; return 12*BASE_W.W/t; };
  function wildRoll(g, denom, mult){
    let n=0; for(let r=1;r<5;r++) g[r].forEach(c=>{ if(c.s==='W') n++; });
    if(!n) return false;
    return rng() < Math.min(1, jpOdds(denom,mult).fight*n/expWilds());
  }
  // Pick snowballs until one prize shows 3 times. Returns the prize and the order the picks reveal (15 snowballs).
  function snowFight(denom, mult){
    const o=jpOdds(denom,mult), keys=Object.keys(o.per); let x=rng()*o.fight, prize='MINI';
    for(const k of keys){ if((x-=o.per[k])<0){ prize=k; break; } }
    const others=[]; keys.forEach(k=>{ if(k!==prize){ others.push(k,k); } });
    const nOther=Math.floor(rng()*(others.length+1));
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
  // ===== Diamond Hunt: 8 rows x 5 reels, Frostfang's grid travels and grows =====
  // Started by the dancing Frostfang on reel 1 plus gems on reels 2-5. Each gem type is an on/off modifier:
  //   ruby     - the grid can grow past 5x5, up to the full 8x5
  //   emerald  - 2 extra starting spins (3 -> 5)
  //   sapphire - "many" symbols join the pool: two-diamond credits, +2 SPIN diamonds and double gold coins
  // Diamonds (credits) and +1 SPIN diamonds only land OUTSIDE the grid; Frostfang travels to collect them.
  // Gold coins land anywhere but only count inside the grid. Coins can carry jackpots.
  const MOON = {
    ROWS: 8, START_SPINS: 3, EMERALD_SPINS: 2,
    GRID_SPINS: [2,3,4], GRID_SPINS_W: [0.45,0.35,0.20],   // finishing a grid (it grows) adds 2-4 spins at random
    STEPS: [[2,2],[3,3],[4,4],[5,5],[6,5],[7,5],[8,5]], // [rows, cols]
    MAX_LEVEL: 3, RUBY_MAX_LEVEL: 6,                    // 5x5 normally, 8x5 with a ruby
    NEED:  [5,4,3,3,3,3],                                // diamonds to finish each grid: 2x2 needs 5, 3x3 needs 4, then 3 each
    P_DIAMOND: 0.035,  // chance per spot OUTSIDE the grid
    P_PLUS: 0.28,      // share of diamonds that are +1 SPIN diamonds (the rest pay credits)
    P_ORB: 0.04,       // gold coin chance per spot, anywhere
    P_CPLUS: 0.003,    // +1 SPIN gold coin chance per spot INSIDE the grid
    P_MANY: 0.25,      // with a sapphire: share of diamonds and coins that come as "many" (double) symbols
    VAL: 0.21,         // scales gold coin credit values
    DVAL: 0.22,        // scales diamond credit values
    JPK: 1.9,          // coin jackpot chances: JPK x each jackpot's share of the bet / its value (same payback at every bet)
    MIN_PAY: 0, GUARANTEE: 1,
    P_SNOW: 0.18, SNOW_VAL: 0.4, SNOW_PLUS: 0.08, SNOW_OUT: 0.5   // Frostfang's snowballs: chance per spin, coin value, +1 SPIN cube share, share thrown outside the grid
  };
  // The grid is a moving window: st.row/st.col = its top-left cell, size from STEPS[st.level]
  const size=st=>MOON.STEPS[st.level];
  function inZone(st, r, y){
    const [R,C]=size(st);
    return y>=st.row && y<st.row+R && r>=st.col && r<st.col+C;
  }
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  // mods: {sapphire, ruby, emerald} booleans (duplicates of a gem never stack); denom/mult size the coin jackpot odds
  // carry: the gems from the triggering spin [{r,y,s,val}]; they become diamonds (same reel, same row) on the
  // bonus board, keeping their credit value or jackpot, and the grid starts away from them so Frostfang goes to get them.
  function moonStart(mods, denom, mult, carry){
    mods=Object.assign({sapphire:false,ruby:false,emerald:false},mods||{});
    const [R,C]=MOON.STEPS[0];
    const st={level:0, gems:0, spins:MOON.START_SPINS+(mods.emerald?MOON.EMERALD_SPINS:0), pot:0,
      maxLevel:mods.ruby?MOON.RUBY_MAX_LEVEL:MOON.MAX_LEVEL, many:!!mods.sapphire, mods,
      denom:denom||UNIT, mult:mult||1, row:0, col:0, carryGrid:null};
    const place=()=>{ st.row=Math.floor(rng()*(MOON.ROWS-R+1)); st.col=Math.floor(rng()*(5-C+1)); };
    place();
    if(carry && carry.length){
      for(let t=0;t<60 && carry.some(c=>inZone(st,c.r,c.y));t++) place();
      if(carry.some(c=>inZone(st,c.r,c.y))){ st.row=MOON.ROWS-R; st.col=0; }   // rows 7-8 never hold a gem
      const g=[]; for(let r=0;r<5;r++){ const col=[]; for(let y=0;y<MOON.ROWS;y++) col.push({s:FILL[Math.floor(rng()*FILL.length)]}); g.push(col); }
      for(const c of carry){ const v=c.val||{}; g[c.r][c.y]=Object.assign({s:'D', from:c.s}, v.jp?{jp:v.jp}:{cash:v.cash||0}); }
      st.carryGrid=g;
    }
    return st;
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
  // one gold coin value: cash, or now and then a jackpot (chance proportional to bet / jackpot value)
  function coinValue(st, bet, cashK){
    // per-coin jackpot chance for prize k: JPK x SHARE_k x bet / value_k, so each jackpot's payback is the same at every bet
    const vals=Object.assign({MINI:JPF.MINI_CR*st.denom, MINOR:JPF.MINOR_CR*st.denom}, JPF.SEED);
    let y=rng(); for(const k of ['GRAND','MAJOR','MAXI','MINOR','MINI']){ const p=MOON.JPK*JPF.SHARE[k]*bet/vals[k]; if((y-=p)<0) return {jp:k}; }
    return {cash:money(cashOf([0.5,0.5,1,1,1,2,2,3,5,8][Math.floor(rng()*10)]*(cashK||MOON.VAL)*bet,bet))};
  }
  // a gold coin cell; "many" coins carry two independently drawn values
  function coinCell(st, bet, many){
    const c={s:'O', orb:coinValue(st,bet)};
    if(many){ c.many=true; c.orb2=coinValue(st,bet); }
    return c;
  }
  const diaCash=bet=>money(cashOf([0.5,1,1,2,2,3,5][Math.floor(rng()*7)]*MOON.DVAL*bet,bet));
  // a diamond value: credits, or now and then a jackpot (same per-value jackpot odds as gold coins)
  function diaValue(st, bet){
    const vals=Object.assign({MINI:JPF.MINI_CR*st.denom, MINOR:JPF.MINOR_CR*st.denom}, JPF.SEED);
    let y=rng(); for(const k of ['GRAND','MAJOR','MAXI','MINOR','MINI']){ if((y-=MOON.JPK*JPF.SHARE[k]*bet/vals[k])<0) return {jp:k}; }
    return {cash:diaCash(bet)};
  }
  const v2=(v,suf)=>v.jp?{['jp'+suf]:v.jp}:{['cash'+suf]:v.cash};
  // diamond cells:
  //   sym_diamond            one credit value (or jackpot)          {s:'D', cash|jp}
  //   sym_diamond_plus       +1 SPIN                                {s:'D', plus:1}
  //   sym_many_diamonds      two independent values (sapphire)      {s:'D', many, cash|jp, cash2|jp2}
  //   sym_many_diamond_plus  +1 SPIN and one value (sapphire)       {s:'D', many, plus:1, cash|jp}
  function diamondCell(st, bet, many){
    if(rng()<MOON.P_PLUS) return many?Object.assign({s:'D',plus:1,many:true},v2(diaValue(st,bet),'')):{s:'D',plus:1};
    return many?Object.assign({s:'D',many:true},v2(diaValue(st,bet),''),v2(diaValue(st,bet),'2')):Object.assign({s:'D'},v2(diaValue(st,bet),''));
  }
  // gold coin cells (inside the grid only, see moonGrid):
  //   sym_gold_coin_plus       +1 SPIN                          {s:'X'}
  //   sym_many_gold_coin_plus  +1 SPIN and one value (sapphire) {s:'O', orb, cplus:true}
  function coinPlusCell(st, bet, many){ return many?{s:'O', orb:coinValue(st,bet), cplus:true}:{s:'X'}; }
  const FILL='FPSBCAKQJT';
  // Spin the 8x5 board for the grid where it sits now. Diamonds are only drawn for spots outside the grid
  // (inside, that probability is left to the filler symbols), so no diamond is ever placed inside the grid.
  function moonGrid(st, bet){
    const g=[];
    for(let r=0;r<5;r++){ const col=[]; for(let y=0;y<MOON.ROWS;y++){
      const out=!inZone(st,r,y), x=rng(), many=()=>st.many && rng()<MOON.P_MANY;
      if(out && x<MOON.P_DIAMOND) col.push(diamondCell(st,bet,many()));
      else if(x>=MOON.P_DIAMOND && x<MOON.P_DIAMOND+MOON.P_ORB) col.push(coinCell(st,bet,many()));
      else if(!out && x>=MOON.P_DIAMOND+MOON.P_ORB && x<MOON.P_DIAMOND+MOON.P_ORB+MOON.P_CPLUS) col.push(coinPlusCell(st,bet,many()));
      else col.push({s:FILL[Math.floor(rng()*FILL.length)]});
    } g.push(col); }
    return g;
  }
  // Frostfang throws prize snowballs, inside or outside his grid (call after moonEnsure, before showing results).
  // Inside: a gold coin (cash or jackpot) or a +1 SPIN ice cube. Outside: a diamond (he goes to get it) or a gold coin.
  function moonSnow(st, g, bet){
    const out=[]; if(rng()>=MOON.P_SNOW) return out;
    const ins=[], outs=[];
    g.forEach((col,r)=>col.forEach((c,y)=>{ if(c.s!=='O'&&c.s!=='D') (inZone(st,r,y)?ins:outs).push([r,y]); }));
    const n=rng()<0.3?2:1;
    for(let k=0;k<n;k++){
      const useOut=outs.length && (!ins.length || rng()<MOON.SNOW_OUT), list=useOut?outs:ins; if(!list.length) break;
      const [r,y]=list.splice(Math.floor(rng()*list.length),1)[0], was=g[r][y]; let c;
      if(useOut) c=rng()<0.6?diamondCell(st,bet,false):{s:'O',orb:coinValue(st,bet,MOON.SNOW_VAL)};
      else c=rng()<MOON.SNOW_PLUS?coinPlusCell(st,bet,false):{s:'O',orb:coinValue(st,bet,MOON.SNOW_VAL)};
      g[r][y]=Object.assign(c,{snow:true}); out.push({r,y,was,c});
    }
    return out;
  }
  // Every bonus spin lands at least one gold coin inside the grid (call before showing the spin)
  function moonEnsure(st, g, bet){
    if(!MOON.GUARANTEE) return;
    const spots=[]; let has=false;
    g.forEach((col,r)=>col.forEach((c,y)=>{ if(inZone(st,r,y)){ if(c.s==='O') has=true; else if(c.s!=='D') spots.push([r,y]); } }));
    if(has||!spots.length) return;
    const [r,y]=spots[Math.floor(rng()*spots.length)]; g[r][y]=coinCell(st,bet,false);
  }
  const orbVal=(o,jpVals)=>o.jp?jpVals[o.jp]:o.cash;
  // Resolve one bonus spin. 1) gold coins inside the grid (where it sits now) go to the pot; a double coin pays both
  //    of its values. 2) the grid travels to the nearest diamond, then the next nearest, gathering each one;
  //    it can grow along the way (up to its maximum size). It stays where the last diamond was for the next spin.
  function moonResolve(st, g, jpVals){
    const ev={collected:[], missed:[], path:[], full:false, start:{row:st.row,col:st.col,level:st.level}};
    g.forEach((col,r)=>col.forEach((c,y)=>{
      if(c.s==='O'){
        if(inZone(st,r,y)){
          const parts=[{v:orbVal(c.orb,jpVals),jp:c.orb.jp}]; if(c.many) parts.push({v:orbVal(c.orb2,jpVals),jp:c.orb2.jp});
          for(const p of parts) st.pot+=p.v;
          ev.collected.push({r,y,parts,v:parts.reduce((a,p)=>a+p.v,0),jp:c.orb.jp,many:!!c.many});
        } else ev.missed.push({r,y});
      }
    }));
    ev.plus=0; g.forEach((col,r)=>col.forEach((c,y)=>{ if((c.s==='X'||c.cplus) && inZone(st,r,y)){ st.spins++; ev.plus++; } }));
    const left=[]; g.forEach((col,r)=>col.forEach((c,y)=>{ if(c.s==='D'){
      const parts=[]; if(c.jp||c.cash) parts.push({v:c.jp?jpVals[c.jp]:c.cash, jp:c.jp||null}); if(c.jp2||c.cash2) parts.push({v:c.jp2?jpVals[c.jp2]:c.cash2, jp:c.jp2||null});
      left.push({r,y,plus:c.plus||0,parts,many:!!c.many}); } }));
    while(left.length){
      // nearest diamond to the grid; ties go to the one higher up, then further left
      let bi=0; for(let i=1;i<left.length;i++){
        const a=left[i], b=left[bi], da=reach(st,a.r,a.y), db=reach(st,b.r,b.y);
        if(da<db || (da===db && (a.y<b.y || (a.y===b.y && a.r<b.r)))) bi=i;
      }
      const d=left.splice(bi,1)[0];
      moveTo(st,d.r,d.y);
      st.spins+=d.plus; const cash=Math.round(d.parts.reduce((a,p)=>a+p.v,0)*100)/100; if(cash) st.pot+=cash;
      const step={r:d.r,y:d.y,row:st.row,col:st.col,level:st.level,grew:false,plus:d.plus,cash,parts:d.parts,jp:(d.parts[0]||{}).jp||null,cashParts:d.parts.map(p=>p.v),many:d.many,spins:st.spins};
      if(st.level<st.maxLevel){
        st.gems++;
        if(st.gems>=MOON.NEED[st.level]){
          st.gems=0; st.level++; growAround(st);
          // finishing a grid adds 2-4 spins
          let x=rng()*MOON.GRID_SPINS_W.reduce((a,b)=>a+b,0),k=0; while(k<MOON.GRID_SPINS.length-1 && (x-=MOON.GRID_SPINS_W[k])>=0) k++;
          const add=MOON.GRID_SPINS[k]; st.spins+=add;
          Object.assign(step,{grew:true,growRow:st.row,growCol:st.col,growLevel:st.level,addSpins:add,spins:st.spins});
          if(st.level===st.maxLevel){ step.max=true; if(st.level===MOON.STEPS.length-1){ ev.full=true; step.full=true; } }
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
  return {LINES,GEMS,GEMVAL,SCATTER,LINE,BASE_W,FREE_W,HOLD,FG,RANDOM,FREE_GAMES,freeStart,freeSpin,crackRoll,crackOrbs,JPF,jpOdds,wildRoll,snowFight,setUnit:u=>{UNIT=u}, moonEnsure, moonSnow, moonFinish,SYM,PAY,JP,GRAND_SEED,GRAND_K,HOLD_SPIN_RATE,grandChance,MOON,inZone,moonStart,moonGrid,moonResolve,spinGrid,evaluate,holdStep,holdTotal,orbValue,setRng:f=>rng=f};
})();
if(typeof module!=='undefined') module.exports=ENGINE;
