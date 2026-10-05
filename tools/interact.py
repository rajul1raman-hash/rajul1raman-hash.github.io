from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={"width":1440,"height":900});errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:errs.append(m.text) if m.type=="error" else None)
    pg.goto("http://localhost:8123/",wait_until="networkidle");pg.wait_for_timeout(1000)
    pg.click("label:has-text('First visit') >> nth=0");pg.click("label:has-text('>5 days')")
    pg.wait_for_timeout(600);print("kpis:",pg.inner_text("#kpis").replace("\n"," | "))
    pg.click("#metrics button[data-m=cap]");pg.wait_for_timeout(500)
    pg.click("#sql1 .run");pg.wait_for_timeout(1200);print("sql1 rows:",pg.locator("#q1-res tbody tr").count(),pg.inner_text("#sql1 pre")[-160:].replace("\n"," / "))
    pg.click("#sql2 .run");print("sql2 rows:",pg.locator("#q2-res tbody tr").count())
    pg.click("#sql3 .run");print("sql3 rows:",pg.locator("#q3-res tbody tr").count())
    pg.click("label:has-text('After treatment')");pg.wait_for_timeout(1500);print("funnel:",pg.inner_text("#funnel").replace("\n"," "))
    pg.click("#theme");print("theme:",pg.evaluate("document.documentElement.dataset.theme"))
    pg.keyboard.press("Tab");print("focus:",pg.evaluate("document.activeElement.className+document.activeElement.tagName"))
    print("errors",errs)
    # tap target audit at 375
    pg2=b.new_page(viewport={"width":375,"height":812});pg2.goto("http://localhost:8123/",wait_until="networkidle")
    small=pg2.evaluate("""[...document.querySelectorAll('a,button,label')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<40)&&getComputedStyle(e).display!=='inline'}).map(e=>e.tagName+':'+(e.textContent||'').trim().slice(0,20)+':'+Math.round(e.getBoundingClientRect().height))""")
    print("small targets:",small)
    b.close()
