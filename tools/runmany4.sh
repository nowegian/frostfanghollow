#!/bin/bash
# runmany4.sh perProc procs bet [engine] [moonCfg]
P=$1;K=$2;B=$3;E=${4:-$(dirname $0)/../src/engine.js};C=$5
for i in $(seq 1 $K); do node $(dirname $0)/sim4.js $P $B $E "$C" & done | python3 -c "
import sys,json,math
t=None
for l in sys.stdin:
  d=json.loads(l)
  if t is None: t=d; continue
  for k in ('N','won','sq','holds','holdSpins','frees'): t[k]+=d[k]
  for k,v in d['cnt'].items(): t['cnt'][k]+=v
  for k,v in d['parts'].items(): t['parts'][k]+=v
N=t['N'];b=t['bet'];m=t['won']/N/b;sd=math.sqrt(t['sq']/N-(t['won']/N)**2)/b;se=sd/math.sqrt(N)
pp=t['parts']
print(f'bet \${b}: {N:,} spins  TOTAL RTP {m*100+1:.2f}% (incl 1% meter growth)  CI +/-{1.96*se*100:.2f}')
print('  split: '+'  '.join(f'{k} {v/N/b*100:.1f}%' for k,v in pp.items())+f'   hold spins per base spin 1/{N/t[\"holdSpins\"]:.1f}')
print('  1 in: '+', '.join(f'{k} {N/v:,.0f}' for k,v in t['cnt'].items() if v))
"
