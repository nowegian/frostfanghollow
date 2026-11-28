import numpy as np
from PIL import Image, ImageDraw, ImageFilter
IMG='/home/claude/img/'
S=448;cx=cy=S/2;R=S*0.43
yy,xx=np.mgrid[0:S,0:S].astype(float)
r=np.hypot(xx-cx,yy-cy)/R
ang=np.arctan2(yy-cy,xx-cx)
light=np.clip(0.5-0.5*np.cos(ang+np.pi*0.75),0,1)   # light from top-left
def gold(v):  # v 0..1 brightness -> gold colour
    v=np.clip(v,0,1)[...,None]
    lo=np.array([110,55,5]);mid=np.array([235,165,40]);hi=np.array([255,240,170])
    return np.where(v<0.5,lo+(mid-lo)*(v/0.5),mid+(hi-mid)*((v-0.5)/0.5))
img=np.zeros((S,S,3))
face=r<=0.80
rimz=(r>0.80)&(r<=1.0)
# face: dome shading
fv=0.62+0.32*(1-r/0.8)*0.6+0.25*(light-0.5)
img[face]=gold(fv)[face]
# rim: bevel - bright on the lit side, dark on the other
t=(r-0.80)/0.20
rv=0.45+0.5*np.where(t<0.5,(light-0.5),(0.5-light))+0.15*np.sin(t*np.pi)
img[rimz]=gold(rv)[rimz]
# reeded edge ticks
tick=(np.abs(np.sin(ang*48))>0.92)&(r>0.95)&(r<=1.0)
img[tick]*=0.82
# inner ring groove
groove=(r>0.70)&(r<0.74)
img[groove]=gold(0.5-0.35*(light-0.5))[groove]
alpha=np.clip((1.0-r)*R/1.2+1,0,1)*255
im=Image.fromarray(np.dstack([np.clip(img,0,255),alpha]).astype(np.uint8))
d=ImageDraw.Draw(im)
# embossed snowflake in the upper face
fl=Image.new('RGBA',(S,S));fd=ImageDraw.Draw(fl);fx,fy,fr=cx,cy-R*0.40,R*0.17
for k in range(6):
    a=np.pi/3*k;x2=fx+np.cos(a)*fr;y2=fy+np.sin(a)*fr
    fd.line((fx,fy,x2,y2),fill=(255,245,190,255),width=7)
    for s in (0.55,):
        bx=fx+np.cos(a)*fr*s;by=fy+np.sin(a)*fr*s
        for da in (-0.6,0.6):fd.line((bx,by,bx+np.cos(a+da)*fr*0.35,by+np.sin(a+da)*fr*0.35),fill=(255,245,190,255),width=5)
sh=Image.new('RGBA',(S,S));sd=ImageDraw.Draw(sh)
sh=fl.copy();sh=Image.fromarray(np.dstack([np.zeros((S,S,3),np.uint8)+np.array([90,40,0],np.uint8),np.array(fl)[...,3]])).filter(ImageFilter.GaussianBlur(2))
im.alpha_composite(sh,(3,4));im.alpha_composite(fl)
# frost on the top-left rim
fr2=Image.new('RGBA',(S,S));f2=ImageDraw.Draw(fr2)
for k in range(26):
    a=np.pi*(1.05+0.65*k/25);x=cx+np.cos(a)*R*0.97;y=cy+np.sin(a)*R*0.97
    rr=16+8*np.sin(k*1.7);f2.ellipse((x-rr,y-rr,x+rr,y+rr),fill=(235,248,255,235))
    if k%3==0:f2.polygon([(x-7,y+6),(x+7,y+6),(x,y+30+(k%5)*5)],fill=(215,240,255,230))
im.alpha_composite(fr2.filter(ImageFilter.GaussianBlur(1)))
# sparkle
sp=Image.new('RGBA',(S,S));s2=ImageDraw.Draw(sp);px,py=cx+R*0.48,cy-R*0.52
s2.polygon([(px,py-40),(px+7,py-7),(px+40,py),(px+7,py+7),(px,py+40),(px-7,py+7),(px-40,py),(px-7,py-7)],fill=(255,255,240,230))
im.alpha_composite(sp.filter(ImageFilter.GaussianBlur(1.5)))
# drop shadow kept by CSS
im.save(IMG+'sym_gold_coin.webp',quality=90)
s=im.resize((320,320),Image.LANCZOS);c=Image.new('RGBA',(448,448));c.alpha_composite(s,(0,0));c.alpha_composite(s,(128,128));c.save(IMG+'sym_many_gold_coin.webp',quality=90)
pv=Image.new('RGBA',(896,448),(36,23,79,255));pv.alpha_composite(im);pv.alpha_composite(c,(448,0));pv.convert('RGB').resize((448,224)).save('coin_prev.png')
