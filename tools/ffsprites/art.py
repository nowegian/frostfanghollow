import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
IMG='/home/claude/img/'
F=ImageFont.truetype('/usr/share/fonts/truetype/google-fonts/ofl/cardo/Cardo-Bold.ttf',64)
def label(im,txt,col):
    d=ImageDraw.Draw(im);tb=d.textbbox((0,0),txt,font=F);w=tb[2]-tb[0];x=(448-w)//2-tb[0];y=362-tb[1]
    d.rounded_rectangle((x+tb[0]-16,y+tb[1]-8,x+tb[2]+16,y+tb[3]+10),radius=18,fill=(20,10,40,225),outline=col,width=4)
    d.text((x,y),txt,font=F,fill=(255,255,255),stroke_width=3,stroke_fill=(0,0,0))
    return im
def hue(im,target,satk=1.0,valk=1.0):
    a=np.array(im);rgb=np.ascontiguousarray(a[...,:3]);hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV).astype(float)
    S=hsv[...,1];w=np.clip((S-40)/50,0,1)
    hsv[...,0]=np.where(w>0,target,hsv[...,0]);hsv[...,1]=np.clip(S*satk,0,255);hsv[...,2]=np.clip(hsv[...,2]*valk,0,255)
    out=cv2.cvtColor(hsv.astype(np.uint8),cv2.COLOR_HSV2RGB).astype(float)
    out=rgb*(1-w[...,None])+out*w[...,None]
    return Image.fromarray(np.dstack([out.astype(np.uint8),a[...,3]]))
dia=Image.open(IMG+'sym_diamond.webp').convert('RGBA')
for name,h,col,sk,vk in [('sapphire',115,(90,140,255),1.4,0.85),('ruby',178,(255,80,90),1.5,0.95),('emerald',62,(80,230,120),1.4,0.9)]:
    g=hue(dia,h,sk,vk).resize((400,400),Image.LANCZOS);c=Image.new('RGBA',(448,448));c.alpha_composite(g,(24,0))
    label(c,name.upper(),col).save(IMG+f'sym_{name}.webp',quality=90)
def two(src,out):
    s=Image.open(IMG+src).convert('RGBA').resize((330,330),Image.LANCZOS)
    c=Image.new('RGBA',(448,448));c.alpha_composite(s,(0,10));c.alpha_composite(s,(118,108));c.save(IMG+out,quality=90)
two('sym_diamond.webp','sym_many_diamonds.webp');two('sym_diamond_plus.webp','sym_many_diamond_plus.webp')
# gold coin
def coin(sz=448):
    c=Image.new('RGBA',(sz,sz));d=ImageDraw.Draw(c);cx=sz/2;R=sz*0.44
    yy,xx=np.mgrid[0:sz,0:sz];r=np.hypot(xx-cx,yy-cx)/R
    base=np.zeros((sz,sz,4),np.uint8)
    t=np.clip((yy/sz),0,1)
    gold=np.stack([255-30*t,200-80*t,60-40*t],-1)
    rim=(r>0.86)&(r<=1)
    inner=r<=0.86
    shade=np.clip(1.15-0.45*np.hypot(xx-cx*0.8,yy-cx*0.7)/R,0.55,1.2)
    col=gold*shade[...,None]
    col[rim]=col[rim]*0.78
    base[...,:3]=np.clip(col,0,255).astype(np.uint8);base[...,3]=np.where(r<=1,255,0)
    im=Image.fromarray(base)
    d=ImageDraw.Draw(im)
    d.ellipse((cx-R,cx-R,cx+R,cx+R),outline=(120,60,0,255),width=6)
    d.ellipse((cx-R*0.86,cx-R*0.86,cx+R*0.86,cx+R*0.86),outline=(255,240,170,255),width=4)
    # snowflake emblem, faint, top
    for k in range(6):
        a=np.pi/3*k;x2=cx+np.cos(a)*R*0.22;y2=cx-R*0.48+np.sin(a)*R*0.22
        d.line((cx,cx-R*0.48,x2,y2),fill=(150,80,0,200),width=5)
    # frost cap
    frost=Image.new('RGBA',im.size);fd=ImageDraw.Draw(frost)
    fd.chord((cx-R*1.0,cx-R*1.08,cx+R*1.0,cx-R*0.55),0,180,fill=(235,248,255,230))
    for k in range(9):
        x=cx-R*0.75+k*R*0.19;fd.polygon([(x-10,cx-R*0.8),(x+10,cx-R*0.8),(x,cx-R*0.8+35+(k%3)*18)],fill=(220,242,255,230))
    m=Image.new('L',im.size,0);ImageDraw.Draw(m).ellipse((cx-R*1.03,cx-R*1.03,cx+R*1.03,cx+R*1.03),fill=255)
    fa=np.array(frost);fa[...,3]=np.minimum(fa[...,3],np.array(m));im.alpha_composite(Image.fromarray(fa))
    sh=Image.new('RGBA',im.size);sh.alpha_composite(im.filter(ImageFilter.GaussianBlur(0)))
    return im
cn=coin();cn.save(IMG+'sym_gold_coin.webp',quality=90)
s=cn.resize((320,320),Image.LANCZOS);c=Image.new('RGBA',(448,448));c.alpha_composite(s,(0,0));c.alpha_composite(s,(128,128));c.save(IMG+'sym_many_gold_coin.webp',quality=90)
# preview
names=['sapphire','ruby','emerald','many_diamonds','many_diamond_plus','gold_coin','many_gold_coin']
pv=Image.new('RGBA',(448*7,448),(30,20,60,255))
for i,n in enumerate(names):pv.alpha_composite(Image.open(IMG+f'sym_{n}.webp').convert('RGBA'),(448*i,0))
pv.convert('RGB').resize((448*7//3,448//3)).save('prev.png')
