import json,numpy as np
from PIL import Image
from seg import frames, body, GRID
def smooth(x,a,b):
  t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
REF={'cheer':1,'idle':0,'grab':0,'throw':0}
CLEAN={'cheer':(4,30),'grab':(4,30),'idle':(4,30),'throw':(45,150),'smash':(45,150)}
CW,CH=720,780; BX,BY=80,160; FOOT=BY+613; OUTK=0.75
def clean(f,n):
  a=f[...,3].astype(float);lo,hi=CLEAN[n];f=f.copy();f[...,3]=np.round(255*smooth(a,lo,hi)).astype(np.uint8);return f
info={}
for n in ['cheer','idle','grab','throw']:
  fr=[clean(f,n) for f in frames(n)];bd=[body(f) for f in fr];c,r=GRID[n]
  ref=bd[REF[n]];s=590/(ref[3]-ref[1])
  rowbase={j:max(bd[j*c+i][3] for i in range(c)) for j in range(r)}
  tiles=[];pts=[]
  for k,(f,b) in enumerate(zip(fr,bd)):
    j=k//c;base=rowbase[j];bot=b[3]
    yref=bot if base-bot<14 else base
    feetc=(b[5]+b[6])/2 if n!='cheer' or k!=5 else b[4]
    im=Image.fromarray(f).convert('RGBa');h,w=f.shape[:2]
    sc=s*OUTK;im=im.resize((round(w*sc),round(h*sc)),Image.LANCZOS).convert('RGBA')
    ox=round((CW/2)*OUTK-feetc*sc);oy=round(FOOT*OUTK-yref*sc)
    t=Image.new('RGBA',(round(CW*OUTK),round(CH*OUTK)),(0,0,0,0));t.paste(im,(ox,oy),im);tiles.append(t)
    pts.append((ox,oy,sc))
  W,H=tiles[0].size;strip=Image.new('RGBA',(W*len(tiles),H))
  for i,t in enumerate(tiles):strip.paste(t,(i*W,0))
  strip.save(f'/home/claude/img/ff_{n}.webp',quality=84,method=6)
  def tobase(k,x,y):
    ox,oy,sc=pts[k];X=(ox+x*sc)/OUTK;Y=(oy+y*sc)/OUTK;return round((X-BX)/560,3),round((Y-BY)/620,3)
  info[n]=dict(n=len(tiles),s=round(s,3),pts=pts)
  if n=='grab':info['grab_gem']=tobase(2,187,215);info['grab_hold']=tobase(4,180,520)
  if n=='throw':
    info['throw_ball']=tobase(2,466,30)
  cs=Image.new('RGBA',(W*len(tiles)//2,H//2),(40,25,80,255));cs.alpha_composite(strip.resize((W*len(tiles)//2,H//2)))
  d=Image.new('RGBA',cs.size,(0,0,0,0))
  cs.convert('RGB').save(f'cs_{n}.png')
# smash: native cells, cleaned
fr=[clean(f,'smash') for f in frames('smash')];W=512
strip=Image.new('RGBA',(W*6,W))
from make_win_ramp import ramp
for i,f in enumerate(fr):
  f=f.copy();f[...,3]=(f[...,3]*ramp(*f.shape[:2],18)).astype(np.uint8);strip.paste(Image.fromarray(f),(i*W,0))
strip.save('/home/claude/img/ff_smash.webp',quality=84,method=6)
cs=Image.new('RGBA',strip.size,(40,25,80,255));cs.alpha_composite(strip);cs.convert('RGB').resize((W*3,W//2)).save('cs_smash.png')
print(json.dumps({k:v for k,v in info.items() if k not in('cheer','idle','grab','throw')}),{k:(info[k]['n'],info[k]['s']) for k in ['cheer','idle','grab','throw']})
