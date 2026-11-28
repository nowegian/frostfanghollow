const E=require(require('path').resolve(process.argv[2]));const N=+process.argv[3];
if(process.env.PAYS){const p=JSON.parse(process.env.PAYS);for(const k in p)Object.assign(E.PAY[k],p[k]);}
if(process.env.CFG){const c=JSON.parse(process.env.CFG);for(const k in c)Object.assign(E[k],c[k]);}
let L=0,hits=0,F=0,fn=0;const byN={3:0,4:0,5:0};
for(let i=0;i<N;i++){const g=E.spinGrid(50,false),ev=E.evaluate(g,50);const l=ev.total-ev.scatterPay;L+=l;if(ev.wins.length)hits++;ev.wins.forEach(w=>byN[w.n]+=w.amt);}
for(let i=0;i<N/4;i++){const g=E.spinGrid(50,true,{mult:1}),ev=E.evaluate(g,50);F+=ev.total-ev.scatterPay;fn++;}
console.log(JSON.stringify({base:(L/N/50*100).toFixed(2),hit:(hits/N*100).toFixed(1),byN:Object.fromEntries(Object.entries(byN).map(([k,v])=>[k,(v/N/50*100).toFixed(2)])),freeSpinLine:(F/fn/50*100).toFixed(1)}))
