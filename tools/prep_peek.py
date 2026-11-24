# prep_peek.py: trims each peek pose to its fur and saves a compact webp (game slides them in from the reel-window edges)
import numpy as np, os
from PIL import Image
for n,maxdim in [('peek_side',640),('peek_top',720),('peek_bottom',720)]:
    im=Image.open(f'incoming/{n}.png').convert('RGBA'); a=np.asarray(im)[...,3]; ys,xs=np.where(a>12)
    im=im.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)); s=min(1,maxdim/max(im.size))
    im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS); im.save(f'img/{n}.webp',quality=86,method=6)
    a=np.asarray(im)[...,3]; prof=[int((a[y]>40).sum()) for y in range(0,im.height,max(1,im.height//20))]
    print(n,im.size,os.path.getsize(f'img/{n}.webp')//1024,'KB rows',prof)
