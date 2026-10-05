import sys, os
from playwright.sync_api import sync_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else "screens/r1"
os.makedirs(OUT,exist_ok=True)
SIZES=[(375,812),(768,1024),(1440,900)]
SECTIONS=[("hero0","#top",0),("case1-problem","#case-1",0),("case1-finds",".finds",-100),("case1-dash","#dash",-80),("case1-sms","#smspairs",-200),("case1-recs",".recs",-120),("case1-outcome","#case-1 .out.real",-200),("case2-funnel","#funnel",-200),("case2-cohort","#cohort",-200),("case3-map","#pm-as",-220),("case3-to","#pm-to",-220),("timeline","#timeline",0),("toolkit","#toolkit",0),("contact","#contact",0)]
with sync_playwright() as p:
    b=p.chromium.launch()
    for scheme in("light","dark"):
        for (w,h) in SIZES:
            ctx=b.new_context(viewport={"width":w,"height":h},color_scheme=scheme,device_scale_factor=1)
            pg=ctx.new_page();errs=[]
            pg.on("console",lambda m:errs.append(m.text) if m.type in("error","warning") else None)
            pg.on("pageerror",lambda e:errs.append(str(e)))
            pg.goto("http://localhost:8123/",wait_until="networkidle")
            pg.wait_for_timeout(2800)
            # hero morph frames
            hh=pg.evaluate("document.querySelector('#top').offsetHeight-document.querySelector('.stage').offsetHeight")
            for i,f in enumerate([0,.25,.5,.75,1]):
                pg.evaluate(f"window.scrollTo(0,{int(hh*f)})");pg.wait_for_timeout(350)
                pg.screenshot(path=f"{OUT}/{scheme}_{w}_hero_{i}.png")
            for name,sel,off in SECTIONS[1:]:
                pg.evaluate(f"(()=>{{const e=document.querySelector('{sel}');window.scrollTo(0,e.getBoundingClientRect().top+scrollY+({off}))}})()")
                pg.wait_for_timeout(1500)
                pg.screenshot(path=f"{OUT}/{scheme}_{w}_{name}.png")
            ov=pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
            print(scheme,w,"hscroll overflow:",ov,"errors:",errs[:5])
            ctx.close()
    b.close()
