import math, json
from playwright.sync_api import sync_playwright
import json as _j
rev=[100*r[2]/r[1] for r in _j.load(open('assets/noshow.json'))['curve']]
N=500;W=1200;top=372;bot=590;ph=bot-top
def G(u,c,s,a):return a*math.exp(-((u-c)/s)**2/2)
def ecg(u):return G(u,.14,.028,-.11)+G(u,.292,.008,.13)+G(u,.325,.0125,-1)+G(u,.362,.011,.3)+G(u,.62,.05,-.22)
ys=[top+(1-v/40)*ph for v in rev];K=len(rev)-1
def cr(f):
    s=f*K;k=min(K-1,int(s));t=s-k
    p0=ys[max(0,k-1)];p1=ys[k];p2=ys[k+1];p3=ys[min(K,k+2)]
    return .5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3)
pts=[]
for i in range(N):
    f=i/(N-1);xE=f*W;xC=70+f*(W-70-60)
    u=(f*4+.25)%1;yE=top+ph*.6+ph*.5*ecg(u)*(min(1,f/.02))
    yC=cr(f);q=max(0,min(1,f*3.2-1.0));q=q*q*(3-2*q)  # left = ECG, right = chart
    pts.append((xE+(xC-xE)*q,yE+(yC-yE)*q))
d="M"+"L".join(f"{x:.1f} {y:.1f}" for x,y in pts)
grid="".join(f'<line x1="{x}" x2="{x}" y1="{top-20}" y2="{bot+10}" stroke="#C42B12" stroke-opacity=".10"/>' for x in range(0,W+1,20))+"".join(f'<line y1="{y}" y2="{y}" x1="0" x2="{W}" stroke="#C42B12" stroke-opacity=".10"/>' for y in range(top-20,bot+11,20))
html=f'''<!doctype html><meta charset=utf-8><style>
@font-face{{font-family:F;src:url(../assets/fonts/fraunces-latin-wght-normal.woff2);font-weight:100 900}}
@font-face{{font-family:F;src:url(../assets/fonts/fraunces-latin-wght-italic.woff2);font-weight:100 900;font-style:italic}}
@font-face{{font-family:M;src:url(../assets/fonts/jetbrains-mono-latin-500-normal.woff2);font-weight:500}}
body{{margin:0;width:1200px;height:630px;background:#F3EFE6;color:#15130F;position:relative;overflow:hidden}}
.m{{font:500 18px M;letter-spacing:.08em;text-transform:uppercase;position:absolute;left:60px}}
h1{{font:300 92px/.95 F;letter-spacing:-.04em;margin:0;position:absolute;left:56px;top:96px}}
h1 em{{color:#C42B12}}
svg{{position:absolute;left:0;top:0}}
</style><div class=m style="top:44px">Rajul Raman / Case file</div><div class=m style="top:44px;left:auto;right:60px;color:#5E584C">PT &rarr; BA / PGDM Analytics 2027</div>
<h1>From <em>patient</em> charts<br>to business charts.</h1>
<svg width=1200 height=630>{grid}<path d="{d}" fill="none" stroke="#15130F" stroke-width="3.2" stroke-linejoin="round"/></svg>
<div class=m style="bottom:22px;font-size:15px;color:#5E584C">Healthcare-trained business analyst. Real public data, labelled.</div>'''
open("tools/og.html","w",encoding="utf-8").write(html)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1200,"height":630})
    pg.goto("file:///C:/JobHunt/portfolio/tools/og.html");pg.wait_for_timeout(800)
    pg.screenshot(path="assets/og.png");b.close()
