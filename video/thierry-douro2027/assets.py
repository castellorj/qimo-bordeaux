from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import numpy as np, math
R="/home/user/qimo-bordeaux/"
W,H,FPS=1080,1920,60
NAVY=(4,32,60); GOLD=(198,168,106); CREAM=(251,248,243)
# ---------- watermark ----------
lg=Image.open(R+"public/qimo-logo-full.png").convert("RGBA"); lg=lg.crop(lg.getbbox())
w=196; lg=lg.resize((w,round(lg.height*w/lg.width)),Image.LANCZOS)
wm=Image.new("RGBA",(W,H),(0,0,0,0))
x,y=W-64-w,132
sh=Image.new("L",(W,H),0); sh.paste(lg.split()[3],(x,y+2)); sh=sh.filter(ImageFilter.GaussianBlur(7)).point(lambda v:int(v*0.55))
wm.paste(Image.new("RGBA",(W,H),(0,0,0,255)),(0,0),sh)
a=lg.split()[3].point(lambda v:int(v*0.9)); lg.putalpha(a); wm.alpha_composite(lg,(x,y))
wm.save("work/watermark.png")
# ---------- end card ----------
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
d=np.sqrt(((xx-W/2)/(W*0.95))**2+((yy-H*0.47)/(H*0.62))**2)
g=np.clip(1-d,0,1)**1.6
bg=np.zeros((H,W,3),np.float32)
c0=np.array([2,18,36],np.float32); c1=np.array([10,48,86],np.float32)
bg=c0+(c1-c0)*g[...,None]
rng=np.random.default_rng(7); bg+=rng.normal(0,1.1,(H,W,1))  # fine dither against banding
BG=Image.fromarray(np.clip(bg,0,255).astype(np.uint8))
logo=Image.open(R+"logo qimo.png").convert("RGBA"); logo=logo.crop(logo.getbbox())
LW=600; LOGO=logo.resize((LW*2,round(logo.height*LW*2/logo.width)),Image.LANCZOS)  # 2x master for smooth scaling
f=ImageFont.truetype("fonts/CormorantGaramond-Italic[wght].ttf",74)
try: f.set_variation_by_axes([500])
except Exception as e: print("var",e)
TAG="Que Momento!"
tb=f.getbbox(TAG); TW,TH=tb[2]-tb[0],tb[3]-tb[1]
def ease(t): t=min(max(t,0),1); return 1-(1-t)**3
DUR=3.3; N=int(DUR*FPS)
CY=int(H*0.445)
for i in range(N):
    t=i/FPS
    im=BG.copy().convert("RGBA")
    # logo
    a=ease((t-0.35)/0.9); sc=0.955+0.045*ease((t-0.35)/1.4)+0.008*max(0,t-1.75)/1.5
    lw=round(LW*sc); lh=round(LOGO.height/2*sc)
    l=LOGO.resize((lw,lh),Image.LANCZOS)
    if a<1: l.putalpha(l.split()[3].point(lambda v:int(v*a)))
    if a>0: im.alpha_composite(l,((W-lw)//2,CY-lh//2))
    # gold hairline
    p=ease((t-1.0)/0.7)
    if p>0:
        dr=ImageDraw.Draw(im); half=int(70*p); ly=CY+170
        dr.line([(W//2-half,ly),(W//2+half,ly)],fill=GOLD+(int(255*min(1,p*1.5)),),width=2)
    # tagline
    q=ease((t-1.3)/0.8)
    if q>0:
        layer=Image.new("RGBA",(W,H),(0,0,0,0)); dl=ImageDraw.Draw(layer)
        ty=CY+205+int(10*(1-q))
        dl.text(((W-TW)//2-tb[0],ty),TAG,font=f,fill=CREAM+(int(255*q),))
        im.alpha_composite(layer)
    im=im.convert("RGB")
    fo=min(1,max(0,(DUR-t)/0.45))  # fade to black at the end
    if fo<1: im=Image.eval(im,lambda v:int(v*fo))
    im.save(f"card/c_{i:04d}.png",compress_level=1)
print("frames",N)
