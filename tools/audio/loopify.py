import librosa,numpy as np,soundfile as sf,json
NOM={'music_base':112,'music_free':128,'music_hunt':132,'music_snow':140}
out={}
def flux(loop,sr):
  y=loop.mean(1);z=np.concatenate([y[-sr*2:],y[:sr*2]])
  M=librosa.power_to_db(librosa.feature.melspectrogram(y=z,sr=sr,hop_length=256,n_mels=64))
  d=np.sqrt(((np.diff(M,axis=1))**2).mean(0));c=int(2*sr/256);return d[c-3:c+3].max(),np.percentile(d,99)
for n,T in NOM.items():
  x,sr=sf.read(n+'.wav');y=x.mean(1);dur=len(y)/sr
  hop=512
  M=librosa.power_to_db(librosa.feature.melspectrogram(y=y,sr=sr,hop_length=hop,n_mels=64));C=librosa.feature.chroma_stft(y=y,sr=sr,hop_length=hop)
  F=np.vstack([(M-M.mean())/M.std(),3*(C-C.mean())/C.std()]);fr=lambda t:int(round(t*sr/hop))
  onset=librosa.onset.onset_detect(y=y,sr=sr,units='time');s=float(onset[0]) if onset[0]<0.5 else 0.0
  bar=240/T;W=fr(2*bar);ref=F[:,fr(s):fr(s)+W].ravel()
  cands=[]
  for k in range(4,int((dur-s-1.0)/bar)+1):
    e=s+k*bar
    for dt in np.arange(-0.08,0.081,0.01):
      seg=F[:,fr(e+dt):fr(e+dt)+W]
      if seg.shape[1]<W:continue
      sc=np.dot(ref,seg.ravel())/np.linalg.norm(ref)/np.linalg.norm(seg);cands.append((sc,e+dt,k))
  cands.sort(reverse=True);seen=set();cands=[c for c in cands if not (c[2] in seen or seen.add(c[2]))];res=[]
  for sc,e,k in [c for c in cands if c[0]>0.6][:60]:
    si,ei=int(s*sr),int(e*sr)
    a=y[si:si+int(0.4*sr)];bk=0;bv=-1e9
    for q in range(-int(0.02*sr),int(0.02*sr),4):
      v=np.dot(a,y[ei+q:ei+q+len(a)])
      if v>bv:bv=v;bk=q
    ei+=bk;Fd=int(0.04*sr);loop=x[si:ei].copy();tail=x[ei:ei+Fd];fi=np.linspace(0,1,Fd)[:,None];loop[:Fd]=loop[:Fd]*fi+tail*(1-fi)
    f,p99=flux(loop,sr);res.append((f,sc,k,ei/sr,loop,p99))
  # longest loop whose seam is no rougher than the track's own normal beat hits (below its 99th percentile)
  good=[r for r in res if r[0]<=0.85*r[5]];r=max(good,key=lambda r:r[3]) if good else min(res,key=lambda r:r[0]);p99=r[5]
  sf.write(n+'_loop.wav',r[4],sr);out[n]=round(len(r[4])/sr,6)
  print(n,'bars',r[2],'len',round(len(r[4])/sr,2),'match',round(r[1],3),'seam',round(r[0],2),'p99',round(p99,2))
json.dump(out,open('loops.json','w'))
