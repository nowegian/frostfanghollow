#!/bin/bash
# runmany5.sh perProc procs bet [engine]   (env CFG, UNIT passed through)
P=$1;K=$2;B=$3;E=${4:-./engine.js}
for i in $(seq 1 $K); do node sim5.js $P $B $E & done | python3 -c "
import sys,json,math
t=None
for l in sys.stdin:
  d=json.loads(l)
  if t is None: t=d; continue
  for k in ('N','won','sq'): t[k]+=d[k]
  for k,v in d['P'].items(): t['P'][k]+=v
  for k,v in d['C'].items(): t['C'][k]+=v
N=t['N'];b=t['bet'];m=t['won']/N/b;sd=math.sqrt(t['sq']/N-(t['won']/N)**2)/b;se=sd/math.sqrt(N);C=t['C']
print(f'bet \${b}: {N:,} spins  TOTAL RTP {m*100+1:.2f}% (incl 1% meter growth)  CI +/-{1.96*se*100:.2f}')
print('  split: '+'  '.join(f'{k} {v/N/b*100:.1f}%' for k,v in t['P'].items()))
f=lambda k:(f'1 in {N/C[k]:,.0f}' if C[k] else 'never')
print(f'  free games {f(\"free\")} ({C[\"freeSpins\"]/max(1,C[\"free\"]):.1f} games each) | Diamond Hunt {f(\"hunt\")} ({C[\"huntSpins\"]/max(1,C[\"hunt\"]):.1f} spins) | Frost Link {f(\"link\")} (crack {f(\"crack\")}, in free games {f(\"linkFree\")}) | Snowball {f(\"snow\")}')
print(f'  hold spins per base spin 1/{N/max(1,C[\"holdSpins\"]):.1f} | MINI {f(\"MINI\")}, MINOR {f(\"MINOR\")}, MAJOR {f(\"MAJOR\")}, GRAND {f(\"GRAND\")}')
"
