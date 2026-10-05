"""Run the SQL text shown on the page against the real SQLite DB and compare it with the in-page result table."""
import sqlite3, itertools, random
from playwright.sync_api import sync_playwright
db=sqlite3.connect("data/ns.db");db.execute("PRAGMA query_only=1")
random.seed(1);bad=0;tests=0
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1440,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("http://localhost:8123/",wait_until="networkidle");pg.wait_for_timeout(800)
    pg.click("#sql1 .run")
    combos=[(a,l,s,m) for a in ["all",0,2,5] for l in ["all",0,3,5] for s in ["all",0,1] for m in ["lead","age","sms","dow"]]
    for a,l,s,m in random.sample(combos,40):
        pg.evaluate("""([a,l,s,m])=>{const set=(id,v)=>{const i=document.querySelector(`#${id} input[value="${v}"]`);i.checked=true;i.dispatchEvent(new Event('change',{bubbles:true}))};set('f-age',a);set('f-lead',l);set('f-sms',s);document.querySelector(`#metrics button[data-m=${m}]`).click()}""",[a,l,s,m])
        pg.wait_for_timeout(450)
        sql=pg.inner_text("#sql1 pre")
        page_rows=[[c.strip() for c in r.split("\t")] for r in pg.inner_text("#q1-res tbody").split("\n") if r.strip()]
        try: res=db.execute(sql).fetchall()
        except Exception as e: print("SQL ERROR",e,sql);bad+=1;continue
        exp=[[str(r[0]),f"{r[1]:,}",f"{r[2]:,}",f"{r[3]:.1f}"] for r in res]
        got=[[c for c in r] for r in page_rows]
        tests+=1
        if [[x.replace(",","") for x in r] for r in exp]!=[[x.replace(",","") for x in r] for r in got]:
            # sms labels: page uses names, sql returns 0/1
            if m=="sms":
                exp=[[["No SMS","SMS sent"][int(r[0])],r[1],r[2],r[3]] for r in exp]
            if [[x.replace(",","") for x in r] for r in exp]!=[[x.replace(",","") for x in r] for r in got]:
                bad+=1;print("MISMATCH",(a,l,s,m),exp[:2],got[:2])
    print("tests",tests,"mismatches",bad,"page errors",errs)
    b.close()
