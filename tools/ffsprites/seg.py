from PIL import Image;import numpy as np
from scipy import ndimage as ndi
GRID={'cheer':(3,2),'grab':(3,2),'idle':(4,2),'smash':(3,2),'throw':(3,2)}
def frames(n):
  a=np.array(Image.open(f'{n}.png').convert('RGBA'));H,W=a.shape[:2];c,r=GRID[n];out=[]
  for j in range(r):
    for i in range(c):
      x0,x1=round(i*W/c),round((i+1)*W/c);y0,y1=round(j*H/r),round((j+1)*H/r);out.append(a[y0:y1,x0:x1].copy())
  return out
def body(f):
  m=f[...,3]>160;lab,k=ndi.label(m);s=ndi.sum(m,lab,range(1,k+1));big=lab==(1+s.argmax())
  ys,xs=np.where(big);bot=ys.max();feet=xs[ys>bot-0.06*(bot-ys.min())]
  return xs.min(),ys.min(),xs.max(),bot,int(np.median(feet)),int(feet.min()),int(feet.max())
if __name__=='__main__':
  for n in GRID:
    print(n,frames(n)[0].shape[:2])
    for i,f in enumerate(frames(n)):print('  ',i,body(f))
