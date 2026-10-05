(function(){
"use strict";
var $=function(s,r){return(r||document).querySelector(s)};
var RM=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var NS="http://www.w3.org/2000/svg";
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var lerp=function(a,b,t){return a+(b-a)*t};
var sstep=function(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
var fmt=function(n,d){return n.toLocaleString("en-US",{minimumFractionDigits:d||0,maximumFractionDigits:d||0})};
function h(tag,attrs,html){var e=document.createElement(tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e}

/* ---------- theme ---------- */
(function(){
  var b=$("#theme"),root=document.documentElement;
  function cur(){var t=root.getAttribute("data-theme");if(t)return t;return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
  function label(){b.innerHTML=cur()==="dark"?"Light":"Dark"}
  label();
  b.addEventListener("click",function(){var n=cur()==="dark"?"light":"dark";root.setAttribute("data-theme",n);try{localStorage.setItem("rr-theme",n)}catch(e){}label();window.dispatchEvent(new Event("themechange"))});
})();

/* ---------- reveal ---------- */
(function(){
  var els=document.querySelectorAll(".rv");
  if(!("IntersectionObserver" in window)||RM){els.forEach(function(e){e.classList.add("in")});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
  els.forEach(function(e){io.observe(e)});
})();

/* ---------- SQL panel ---------- */
var KW=/\b(SELECT|FROM|WHERE|AND|JOIN|LEFT|ON|GROUP|BY|ORDER|AS|WITH|COUNT|SUM|ROUND|FILTER|DISTINCT|OVER|LAG|DATE_TRUNC|DATE_PART|AGE|MIN|CASE|WHEN|THEN|END|USING|NULLIF|ASC)\b/g;
function hl(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").split("\n").map(function(line){
    var ci=line.indexOf("--"),c="";if(ci>-1){c='<span class="c">'+line.slice(ci)+"</span>";line=line.slice(0,ci)}
    line=line.replace(/('[^']*')/g,'\u0001$1\u0002').replace(KW,'<span class="k">$1</span>').replace(/\b(\d+(\.\d+)?)\b(?![^<]*>)/g,'<span class="n">$1</span>').replace(/\u0001/g,'<span class="n">').replace(/\u0002/g,"</span>");
    return line+c}).join("\n")}
function sqlPanel(box,opt){
  var id=opt.id;
  box.innerHTML='<div class="sql-top mono"><span>'+opt.title+'</span><button class="run" type="button" aria-expanded="false" aria-controls="'+id+'-res">Run query</button></div><pre tabindex="0" aria-label="'+opt.title+' SQL"></pre><div class="res" id="'+id+'-res"></div>';
  var pre=$("pre",box),res=$(".res",box),btn=$(".run",box),open=false,timer=null;
  function renderSql(){pre.innerHTML=hl(opt.sql())}
  function renderRes(animate){
    var r=opt.run(),html='<table><thead><tr>'+r.cols.map(function(c){return"<th>"+c+"</th>"}).join("")+'</tr></thead><tbody>'+r.rows.map(function(row,i){return'<tr'+(animate&&!RM?' class="row-in" style="animation-delay:'+Math.min(i*55,700)+'ms"':"")+">"+row.map(function(c){return"<td>"+c+"</td>"}).join("")+"</tr>"}).join("")+'</tbody></table><div class="st">'+r.rows.length+" rows &middot; synthetic data &middot; computed in your browser</div>";
    res.innerHTML=html}
  btn.addEventListener("click",function(){
    open=!open;btn.setAttribute("aria-expanded",open);btn.textContent=open?"Hide result":"Run query";res.classList.toggle("on",open);
    if(open)renderRes(true)});
  renderSql();
  return{update:function(){renderSql();if(open)renderRes(false)}}}

/* ---------- Case 01: real public dataset, aggregated cube ---------- */
var D=null;
var AGES=["0-12","13-24","25-39","40-54","55-69","70+"],LEADS=["Same day","1-2 d","3-7 d","8-14 d","15-30 d","31+ d"],DAYS=["Mon","Tue","Wed","Thu","Fri","Sat"],SMSL=["No SMS","SMS sent"];
var DIMS={
  lead:{i:1,labels:LEADS,name:"Booked ahead",tab:"Booked ahead",alias:"lead_band",
    expr:"CASE WHEN lead_days = 0 THEN 'Same day'\n            WHEN lead_days <= 2 THEN '1-2 d'\n            WHEN lead_days <= 7 THEN '3-7 d'\n            WHEN lead_days <= 14 THEN '8-14 d'\n            WHEN lead_days <= 30 THEN '15-30 d'\n            ELSE '31+ d' END",
    where:["lead_days = 0","lead_days BETWEEN 1 AND 2","lead_days BETWEEN 3 AND 7","lead_days BETWEEN 8 AND 14","lead_days BETWEEN 15 AND 30","lead_days >= 31"],order:"MIN(lead_days)"},
  age:{i:0,labels:AGES,name:"Age band",tab:"Age",alias:"age_band",
    expr:"CASE WHEN age <= 12 THEN '0-12'\n            WHEN age <= 24 THEN '13-24'\n            WHEN age <= 39 THEN '25-39'\n            WHEN age <= 54 THEN '40-54'\n            WHEN age <= 69 THEN '55-69'\n            ELSE '70+' END",
    where:["age BETWEEN 0 AND 12","age BETWEEN 13 AND 24","age BETWEEN 25 AND 39","age BETWEEN 40 AND 54","age BETWEEN 55 AND 69","age >= 70"],order:"MIN(age)"},
  sms:{i:2,labels:SMSL,name:"SMS reminder",tab:"SMS",alias:"sms_sent",expr:"sms_received",where:["sms_received = 0","sms_received = 1"],order:"1"},
  dow:{i:3,labels:DAYS,name:"Weekday",tab:"Weekday",alias:"weekday",
    expr:"CASE dow WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed'\n                 WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri' ELSE 'Sat' END",where:null,order:"MIN(dow)"}};
var ORDER=["lead","age","sms","dow"],F={age:"all",lead:"all",sms:"all"},BREAK="lead",shown=null,raf=0,sql1=null;
function cells(skip){return D.cube.filter(function(r){return(skip==="age"||F.age==="all"||r[0]===F.age)&&(skip==="lead"||F.lead==="all"||r[1]===F.lead)&&(skip==="sms"||F.sms==="all"||r[2]===F.sms)})}
function group(dim){var d=DIMS[dim],n=d.labels.map(function(){return 0}),ns=n.slice();cells(dim).forEach(function(r){n[r[d.i]]+=r[4];ns[r[d.i]]+=r[5]});return{n:n,ns:ns}}
function totals(){var n=0,ns=0;cells().forEach(function(r){n+=r[4];ns+=r[5]});return{n:n,ns:ns}}
var ALLN=0,ALLNS=0;
function niceMax(v){var s=[10,20,25,30,35,40,50,60,80,100];for(var i=0;i<s.length;i++)if(s[i]>=v*1.12)return s[i];return 100}
function seg1(id,labels,key,all){
  var box=$("#"+id);box.setAttribute("role","radiogroup");
  box.innerHTML='<label><input type="radio" name="'+id+'" value="all" checked><span>'+all+"</span></label>"+labels.map(function(l,i){return'<label><input type="radio" name="'+id+'" value="'+i+'"><span>'+l+"</span></label>"}).join("");
  box.addEventListener("change",function(e){var v=e.target.value;F[key]=v==="all"?"all":+v;refresh()})}
function kpis(){
  var t=totals();
  $("#kpis").innerHTML=[[fmt(t.n),"Appointments"],[t.n?(100*t.ns/t.n).toFixed(1)+"%":"n/a","No-show rate"],[fmt(t.ns),"No-shows"],[(100*t.ns/ALLNS).toFixed(0)+"%","Of all no-shows"]].map(function(k){return'<div class="kpi"><b>'+k[0]+'</b><span class="mono">'+k[1]+"</span></div>"}).join("")}
function filterText(){var p=[];p.push(F.age==="all"?"all ages":"age "+AGES[F.age]);p.push(F.lead==="all"?"any lead time":"booked "+LEADS[F.lead]+" ahead");p.push(F.sms==="all"?"SMS sent or not":SMSL[F.sms].toLowerCase());return p.join(" / ")}
function drawChart(rates,g){
  var d=DIMS[BREAK],box=$("#chart1"),W=Math.max(300,box.clientWidth),Ht=Math.round(clamp(W*.5,260,400)),pl=W<520?34:46,pr=8,pt=30,pb=48,k=rates.length,sm=W<520;
  var mx=niceMax(Math.max.apply(null,rates.concat([ALLNS/ALLN*100]))),pw=W-pl-pr,ph=Ht-pt-pb,bw=pw/k,Y=function(v){return pt+(1-v/mx)*ph},avg=100*ALLNS/ALLN;
  var s='<svg viewBox="0 0 '+W+" "+Ht+'" role="img" aria-label="No-show rate by '+d.name.toLowerCase()+" for "+filterText()+'. The query result table below has the exact values.">';
  for(var t=0;t<=4;t++){var tv=mx*t/4,y=Y(tv);s+='<line class="ax" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(pl-6)+'" y="'+(y+4)+'" text-anchor="end">'+Math.round(tv)+"%</text>"}
  var maxI=rates.indexOf(Math.max.apply(null,rates.filter(function(v,i){return g.n[i]>=300})));
  rates.forEach(function(v,i){
    var x=pl+i*bw+bw*.14,w=bw*.72,small=g.n[i]<300,sel=(F[BREAK]!==undefined&&F[BREAK]!=="all"&&F[BREAK]===i),y=Y(v);
    s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(0,pt+ph-y).toFixed(1)+'" fill="'+(i===maxI?"var(--acc)":"var(--ink)")+'" opacity="'+(small?.3:1)+'"/>';
    if(sel)s+='<rect x="'+(x-3).toFixed(1)+'" y="'+(y-3).toFixed(1)+'" width="'+(w+6).toFixed(1)+'" height="'+(pt+ph-y+6).toFixed(1)+'" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 3"/>';
    s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(y-6).toFixed(1)+'" text-anchor="middle" style="fill:var(--ink);font-weight:500">'+(g.n[i]?v.toFixed(1)+"%":"")+"</text>";
    s+='<text x="'+(x+w/2).toFixed(1)+'" y="'+(Ht-28)+'" text-anchor="middle" style="fill:var(--ink)">'+(sm?d.labels[i].replace(" d","").replace("Same day","Same"):d.labels[i])+'</text><text x="'+(x+w/2).toFixed(1)+'" y="'+(Ht-12)+'" text-anchor="middle">'+(sm?"":"n=")+(g.n[i]>=10000?(g.n[i]/1000).toFixed(1)+"k":fmt(g.n[i]))+"</text>";
    s+='<rect class="hit" data-i="'+i+'" x="'+(pl+i*bw).toFixed(1)+'" y="'+pt+'" width="'+bw.toFixed(1)+'" height="'+ph+'"/>'});
  var ay=Y(avg);s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+ay+'" y2="'+ay+'" stroke="var(--acc)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="'+pl+'" y="14" style="fill:var(--acc)">- - all appointments '+avg.toFixed(1)+"%</text></svg>";
  box.innerHTML=s+'<div class="tip" role="presentation"></div>';
  var tip=$(".tip",box);
  function show(e){var r=e.target;if(!r.dataset||r.dataset.i==null)return;var i=+r.dataset.i;
    tip.innerHTML=d.labels[i]+" &middot; "+(g.n[i]?rates[i].toFixed(1)+"% no-show":"no data")+"<br>"+fmt(g.ns[i])+" of "+fmt(g.n[i])+" appointments";
    tip.style.left=clamp(pl+i*bw+bw/2,80,W-80)+"px";tip.style.top=Y(rates[i])+"px";tip.classList.add("on")}
  box.onpointermove=show;box.onpointerdown=show;box.onpointerleave=function(){tip.classList.remove("on")}}
function refresh(){
  var g=group(BREAK),rates=g.n.map(function(n,i){return n?100*g.ns[i]/n:0});
  kpis();$("#chart1-note").textContent="No-show rate by "+DIMS[BREAK].name.toLowerCase()+" for "+filterText()+(BREAK!=="dow"?". Dashed outline marks your filter selection.":". Saturday has only 39 appointments (faded).");
  if(sql1)sql1.update();
  var from=shown&&shown.length===rates.length&&shown.brk===BREAK?shown.slice():rates.slice();
  cancelAnimationFrame(raf);var t0=performance.now(),dur=RM?0:350;
  (function step(now){var k=dur?clamp((now-t0)/dur,0,1):1,e=1-Math.pow(1-k,3),v=from.map(function(a,i){return lerp(a,rates[i],e)});shown=v;shown.brk=BREAK;drawChart(v,g);if(k<1)raf=requestAnimationFrame(step)})(t0)}
function filtersSql(skip){var w=[];["age","lead","sms"].forEach(function(k){if(k!==skip&&F[k]!=="all")w.push("  AND "+DIMS[k].where[F[k]])});return w}
function sql1Text(){
  var d=DIMS[BREAK],w=filtersSql(BREAK);
  return "-- no-show rate by "+d.name.toLowerCase()+"; SQLite; real public dataset\nWITH base AS (\n  SELECT no_show, sms_received, age,\n         CAST(julianday(appointment_date)\n            - julianday(substr(scheduled_at, 1, 10)) AS INT) AS lead_days,\n         CAST(strftime('%w', appointment_date) AS INT)       AS dow\n  FROM   appointments\n  WHERE  age >= 0                                   -- 1 impossible age dropped\n    AND  appointment_date >= substr(scheduled_at, 1, 10))  -- 5 booked after visit dropped\nSELECT "+d.expr+"\n         AS "+d.alias+",\n       COUNT(*)                       AS appointments,\n       SUM(no_show)                   AS no_shows,\n       ROUND(100.0 * AVG(no_show), 1) AS no_show_pct\nFROM   base\nWHERE  1 = 1"+(w.length?"\n"+w.join("\n"):"")+"\nGROUP  BY 1\nORDER  BY "+d.order+";"}
function sql1Run(){
  var d=DIMS[BREAK],g=group(BREAK),rows=[];
  g.n.forEach(function(n,i){if(n)rows.push([d.labels[i],fmt(n),fmt(g.ns[i]),(100*g.ns[i]/n).toFixed(1)])});
  return{cols:[d.alias,"appointments","no_shows","no_show_pct"],rows:rows}}
function pairs(){
  var rows=[["3-7 d",2],["8-14 d",3],["15-30 d",4],["31+ d",5]],h2="";
  function rate(l,s){var n=0,ns=0;D.cube.forEach(function(r){if(r[1]===l&&r[2]===s){n+=r[4];ns+=r[5]}});return 100*ns/n}
  var c0=0,c1=0,n0=0,n1=0;D.cube.forEach(function(r){if(r[2]===0){n0+=r[4];c0+=r[5]}else{n1+=r[4];c1+=r[5]}});
  h2+='<div class="pr crude"><span class="pl mono">All bookings (crude)</span><span class="pb"><i style="width:'+(100*c0/n0/40*100)+'%" class="b0"></i><em>'+(100*c0/n0).toFixed(1)+'% no SMS</em></span><span class="pb"><i style="width:'+(100*c1/n1/40*100)+'%" class="b1"></i><em>'+(100*c1/n1).toFixed(1)+'% SMS</em></span><span class="pd mono">looks backwards</span></div>';
  rows.forEach(function(r){var a=rate(r[1],0),b=rate(r[1],1);h2+='<div class="pr"><span class="pl mono">Booked '+r[0]+' ahead</span><span class="pb"><i style="width:'+(a/40*100)+'%" class="b0"></i><em>'+a.toFixed(1)+'% no SMS</em></span><span class="pb"><i style="width:'+(b/40*100)+'%" class="b1"></i><em>'+b.toFixed(1)+'% SMS</em></span><span class="pd mono">'+(Math.round(b*10)/10-Math.round(a*10)/10).toFixed(1).replace("-","−")+" pts</span></div>"});
  $("#smspairs").innerHTML=h2}
function initCase1(){
  D.cube.forEach(function(r){ALLN+=r[4];ALLNS+=r[5]});
  seg1("f-age",AGES,"age","All");seg1("f-lead",LEADS,"lead","All");seg1("f-sms",SMSL,"sms","Any");
  $("#metrics").innerHTML=ORDER.map(function(k){return'<button type="button" data-m="'+k+'" aria-pressed="'+(k===BREAK)+'">'+DIMS[k].tab+"</button>"}).join("");
  $("#metrics").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;BREAK=b.dataset.m;[].forEach.call($("#metrics").children,function(x){x.setAttribute("aria-pressed",x===b)});refresh()});
  sql1=sqlPanel($("#sql1"),{id:"q1",title:"no_shows.sql",sql:sql1Text,run:sql1Run});
  pairs();refresh();
  var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){var g=group(BREAK);drawChart(shown,g)},120)})}

function onView(el,fn,thr){
  if(!("IntersectionObserver" in window)||RM){fn();return}
  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();fn()}},{threshold:thr||.25});io.observe(el)}

/* ---------- Case 02 funnel ---------- */
(function(){
  var names=["Visits","Product view","Add to cart","Checkout","Order"],now=[10000,5200,1900,720,610],after=[10000,5200,1900,912,772],mode=0,inview=false;
  var box=$("#funnel");
  box.innerHTML=names.map(function(n,i){return'<div class="fn'+(i===3?" leak":"")+'"><span class="nm mono">'+n+'<small class="dl"></small></span><div class="bar2"><i></i><b></b><span class="drop mono"></span></div></div>'}).join("");
  $("#f-fn").setAttribute("role","radiogroup");
  $("#f-fn").innerHTML='<label><input type="radio" name="fn" value="0" checked><span>Today</span></label><label><input type="radio" name="fn" value="1"><span>After treatment (scenario)</span></label>';
  $("#f-fn").addEventListener("change",function(e){mode=+e.target.value;paint()});
  function paint(){
    var v=mode?after:now;
    [].forEach.call(box.children,function(row,i){
      var bar=$("i",row),lab=$("b",row),dr=$(".drop",row),w=inview?v[i]/10000*100:0;
      bar.style.width=w+"%";lab.textContent=fmt(v[i]);
      lab.className=w<22?"out-of-bar":"";lab.style.left=w<22?"calc("+w+"% + 8px)":"10px";
      dr.innerHTML="";$(".dl",row).textContent=i?"−"+(100-100*v[i]/v[i-1]).toFixed(0)+"% vs step above":"";
    });
    $("#fn-leak").innerHTML=mode?"Of 1,900 carts, 988 would still not reach checkout (52%), against 1,180 today (62%): the same step, narrower leak.":"Browsing drop-off is expected. <strong>Among shoppers with intent, 1,180 of 1,900 carts (62%) never reach checkout</strong>: the steepest fall after the product page, and the step where shipping cost and prescription upload first appear.";
    $("#fn-note").textContent=mode?"Cart → checkout 48% (assumed), checkout → order rate unchanged. Orders 772.":"Cart → checkout 38%. Orders 610 from 10,000 visits."}
  paint();onView(box,function(){inview=true;setTimeout(paint,60)},.3);
  $("#funnel").setAttribute("aria-label","Funnel: visits, product views, add to cart, checkout, orders");
  sqlPanel($("#sql2"),{id:"q2",title:"funnel.sql",sql:function(){return"-- funnel from raw events, synthetic dataset\nSELECT stage,\n       COUNT(DISTINCT session_id)      AS users,\n       ROUND(100.0 * COUNT(DISTINCT session_id)\n           / LAG(COUNT(DISTINCT session_id)) OVER (ORDER BY ord), 1) AS step_conv_pct\nFROM (\n  SELECT session_id, event AS stage,\n         CASE event WHEN 'visit' THEN 1 WHEN 'product_view' THEN 2\n                    WHEN 'add_to_cart' THEN 3 WHEN 'checkout' THEN 4\n                    WHEN 'order' THEN 5 END AS ord\n  FROM events) e\nGROUP BY stage, ord\nORDER BY ord;"},run:function(){return{cols:["stage","users","step_conv_pct"],rows:names.map(function(n,i){return[n.toLowerCase().replace(" ","_"),fmt(now[i]),i?(100*now[i]/now[i-1]).toFixed(1):"-"]})}}});
  var co=[["Jan",[100,24,17,14]],["Feb",[100,27,19,15]],["Mar",[100,31,22,null]]];
  $("#cohort").innerHTML='<thead><tr><th scope="col">Cohort</th><th scope="col">M0</th><th scope="col">M1</th><th scope="col">M2</th><th scope="col">M3</th></tr></thead><tbody>'+co.map(function(r){return'<tr><td>'+r[0]+"</td>"+r[1].map(function(v){if(v==null)return'<td class="mut">&ndash;</td>';var a=Math.round(v*.9);return'<td style="background:color-mix(in srgb,var(--acc) '+a+'%,var(--paper2));color:var('+(v>=50?"--acc-ink":"--ink")+')">'+v+"%</td>"}).join("")+"</tr>"}).join("")+"</tbody>";
  sqlPanel($("#sql3"),{id:"q3",title:"cohorts.sql",sql:function(){return"-- monthly retention by first-order cohort, synthetic dataset\nWITH first_order AS (\n  SELECT user_id,\n         DATE_TRUNC('month', MIN(ordered_at)) AS cohort\n  FROM   orders GROUP BY 1)\nSELECT TO_CHAR(f.cohort, 'Mon')                         AS cohort,\n       DATE_PART('month', AGE(DATE_TRUNC('month', o.ordered_at), f.cohort)) AS m,\n       ROUND(100.0 * COUNT(DISTINCT o.user_id)\n           / COUNT(DISTINCT f.user_id), 0)               AS retention_pct\nFROM   first_order f\nJOIN   orders o USING (user_id)\nGROUP  BY 1, 2\nORDER  BY MIN(f.cohort), 2;"},run:function(){var r=[];co.forEach(function(c){c[1].forEach(function(v,m){if(v!=null)r.push([c[0],m,v])})});return{cols:["cohort","m","retention_pct"],rows:r}}});
})();

/* ---------- Case 03 process maps ---------- */
(function(){
  var STEPS={as:[["Customer uploads|documents","b"],["Ops re-keys|the data","bh"],["Manual|verification","bh"],["Valid?","d"],["Account|activated","b"]],
             to:[["Customer uploads|ID once","b"],["OCR extracts|and pre-fills","b"],["Rule checks|run automatically","b"],["Pass?","d"],["Account|activated","b"]]};
  function build(box){
    var mode=box.dataset.mode,st=STEPS[mode],vertical=box.clientWidth<640,W=vertical?340:960,items=[],cx=[],cy=[],bw=vertical?220:150,bh=vertical?54:64,s="";
    var n=5,gap=vertical?34:(W-40-n*bw)/(n-1);
    st.forEach(function(x,i){if(vertical){cx[i]=170;cy[i]=38+bh/2+i*(bh+gap)}else{cx[i]=20+bw/2+i*(bw+gap);cy[i]=100}});
    var H=vertical?(38+5*bh+4*gap+(mode==="to"?bh+gap:0)+70):(mode==="to"?300:270);
    function add(type,svg,ord){items.push({t:type,s:svg,o:ord})}
    var o=0;
    st.forEach(function(x,i){
      var lines=x[0].split("|"),hot=x[1]==="bh",dec=x[1]==="d",x0=cx[i]-bw/2,y0=cy[i]-bh/2,g='<g class="'+(hot?"hot":"")+'">';
      if(dec){var dw=bw/2+(vertical?0:8),dh=vertical?38:48;g+='<polygon class="box dr" points="'+cx[i]+","+(cy[i]-dh)+" "+(cx[i]+dw)+","+cy[i]+" "+cx[i]+","+(cy[i]+dh)+" "+(cx[i]-dw)+","+cy[i]+'"/>'}
      else g+='<rect class="box dr" x="'+x0+'" y="'+y0+'" width="'+bw+'" height="'+bh+'" rx="3"/>';
      g+='<text class="fd" x="'+cx[i]+'" y="'+(lines.length>1?cy[i]-3:cy[i]+4)+'" text-anchor="middle">'+lines[0]+"</text>"+(lines[1]?'<text class="fd" x="'+cx[i]+'" y="'+(cy[i]+13)+'" text-anchor="middle">'+lines[1]+"</text>":"")+"</g>";
      add("g",g,o++);
      if(i<4){
        var ax,ay,bx,by,hd;
        if(vertical){ax=cx[i];ay=cy[i]+(st[i][1]==="d"?38:bh/2);bx=cx[i+1];by=cy[i+1]-bh/2;hd='<polygon class="fd" points="'+bx+","+by+" "+(bx-5)+","+(by-9)+" "+(bx+5)+","+(by-9)+'" fill="var(--ink)"/>'}
        else{ax=cx[i]+(st[i][1]==="d"?bw/2+8:bw/2);ay=100;bx=cx[i+1]-(st[i+1][1]==="d"?bw/2+8:bw/2);by=100;hd='<polygon class="fd" points="'+bx+","+by+" "+(bx-9)+","+(by-5)+" "+(bx-9)+","+(by+5)+'" fill="var(--ink)"/>'}
        var lab="";if(mode==="as"&&i<3){var bx0=vertical?ax:(ax+bx)/2,by0=vertical?(ay+by)/2:ay-16;lab='<circle class="fd" cx="'+bx0+'" cy="'+by0+'" r="9" fill="var(--acc)"/><text class="fd" x="'+bx0+'" y="'+(by0+4)+'" text-anchor="middle" style="fill:var(--acc-ink);font-size:11px;font-weight:500">'+(i+1)+"</text>"}
        if(i===3)lab+='<text class="fd" x="'+(vertical?ax+10:(ax+bx)/2)+'" y="'+(vertical?(ay+by)/2+4:ay-10)+'" '+(vertical?"":'text-anchor="middle"')+' style="font-size:11px">'+(mode==="as"?"yes":"yes")+"</text>";
        add("g",'<path class="flow dr" d="M'+ax+" "+ay+"L"+bx+" "+by+'"/>'+hd+lab,o++)}
    });
    /* branch: rework loop (as) or exception queue (to) */
    if(mode==="as"){
      var dpx=vertical?cx[3]+bw/2:cx[3],dpy=vertical?cy[3]:cy[3]+48,tx=vertical?cx[0]+bw/2:cx[0],ty=vertical?cy[0]:cy[0]+bh/2,path;
      if(vertical)path="M"+(cx[3]+bw/2)+" "+cy[3]+"L326 "+cy[3]+"L326 "+cy[0]+"L"+tx+" "+ty;
      else path="M"+dpx+" "+dpy+"L"+dpx+" 200L"+tx+" 200L"+tx+" "+ty;
      var hd2=vertical?'<polygon class="fd" points="'+tx+","+ty+" "+(tx+9)+","+(ty-5)+" "+(tx+9)+","+(ty+5)+'" fill="var(--acc)"/>':'<polygon class="fd" points="'+tx+","+ty+" "+(tx-5)+","+(ty+9)+" "+(tx+5)+","+(ty+9)+'" fill="var(--acc)"/>';
      add("g",'<path class="flow dr" style="stroke:var(--acc)" stroke-dasharray="0" d="'+path+'"/>'+hd2+(vertical?'<text class="fd" x="322" y="'+(cy[3]+(cy[0]-cy[3])/2)+'" text-anchor="middle" transform="rotate(-90 322 '+(cy[3]+(cy[0]-cy[3])/2)+')" style="fill:var(--acc);font-size:11px">no: customer starts again</text>':'<text class="fd" x="'+((dpx+tx)/2)+'" y="218" text-anchor="middle" style="fill:var(--acc);font-size:11px">no: the customer starts again (rework loop)</text>'),o++);
    }else{
      var ex=vertical?cx[3]:cx[3],ey=vertical?14+5*bh+5*gap-gap+bh/2+gap:215,exw=vertical?bw:190;
      var exCx=vertical?170:cx[3];var exCy=vertical?38+bh/2+5*(bh+gap):222;
      var p2=vertical?"M"+(cx[3]+bw/2)+" "+cy[3]+"L326 "+cy[3]+"L326 "+exCy+"L"+(170+bw/2)+" "+exCy:"M"+cx[3]+" "+(cy[3]+48)+"L"+cx[3]+" "+(exCy-27);
      var eh=vertical?'<polygon class="fd" points="'+(170+bw/2)+","+exCy+" "+(170+bw/2+9)+","+(exCy-5)+" "+(170+bw/2+9)+","+(exCy+5)+'" fill="var(--acc)"/>':'<polygon class="fd" points="'+cx[3]+","+(exCy-27)+" "+(cx[3]-5)+","+(exCy-36)+" "+(cx[3]+5)+","+(exCy-36)+'" fill="var(--acc)"/>';
      if(!vertical)eh='<polygon class="fd" points="'+cx[3]+","+(exCy-27)+" "+(cx[3]-5)+","+(exCy-36)+" "+(cx[3]+5)+","+(exCy-36)+'" fill="var(--acc)"/>';
      add("g",'<path class="flow dr" style="stroke:var(--acc)" d="'+p2+'"/><text class="fd" x="'+(vertical?322:cx[3]+12)+'" y="'+(vertical?(cy[3]+exCy)/2:(cy[3]+48+exCy-27)/2+4)+'" '+(vertical?'text-anchor="middle" transform="rotate(-90 322 '+((cy[3]+exCy)/2)+')"':"")+' style="fill:var(--acc);font-size:11px">no: mismatch only</text>',o++);
      add("g",'<g class="hot"><rect class="box dr" x="'+(exCx-exw/2)+'" y="'+(exCy-27)+'" width="'+exw+'" height="54" rx="3"/><text class="fd" x="'+exCx+'" y="'+(exCy-3)+'" text-anchor="middle">Exception queue</text><text class="fd" x="'+exCx+'" y="'+(exCy+13)+'" text-anchor="middle">with reason code</text></g>',o++);
    }
    var clock=mode==="as"?"≈ 3 days":"same day",sub=mode==="as"?"time to activation (assumed)":"time to activation (assumed)";
    var kx=vertical?170:W-10,ky=vertical?H-30:30,anc=vertical?"middle":"end";
    add("g",'<text class="fd mono" x="'+kx+'" y="'+ky+'" text-anchor="'+anc+'" style="font-size:12px;fill:var(--acc)">'+clock+'</text><text class="fd mono" x="'+kx+'" y="'+(vertical?ky+18:ky+16)+'" text-anchor="'+anc+'" style="font-size:11px;fill:var(--mut)">'+sub+"</text>",o++);
    s='<svg viewBox="0 0 '+W+" "+H+'" role="img" aria-label="'+(mode==="as"?"As-is KYC process: customer uploads documents, ops re-keys the data, manual verification, valid? (if no, the customer starts again), account activated. About 3 days (assumed).":"To-be KYC process: customer uploads ID once, OCR extracts and pre-fills, rule checks run automatically, pass? (if no, exception queue with reason code), account activated. Same day (assumed target).")+'"><text class="lane" x="0" y="10" style="font:500 11px var(--mono);letter-spacing:.08em;fill:var(--mut)">'+(mode==="as"?"AS-IS / MANUAL / numbered circles = hand-offs":"TO-BE / ASSISTED")+"</text>"+items.map(function(i){return i.s}).join("")+"</svg>";
    box.innerHTML=s;
    var groups=[].slice.call(box.querySelectorAll("svg > g"));
    groups.forEach(function(g){g.__d=[].slice.call(g.querySelectorAll(".dr"));g.__d.forEach(function(e){var L=e.getTotalLength?e.getTotalLength():300;e.__L=L;e.style.strokeDasharray=L;e.style.strokeDashoffset=L});g.__f=[].slice.call(g.querySelectorAll(".fd"))});
    box.__g=groups;draw(box)}
  function draw(box){
    var gs=box.__g;if(!gs)return;
    var r=box.getBoundingClientRect(),vh=window.innerHeight,p=RM?1:clamp((vh*.97-r.top)/Math.min(r.height*.7,vh*.4),0,1),K=gs.length;
    gs.forEach(function(g,k){var t=clamp(p*(K+.8)-k,0,1);
      g.__d.forEach(function(e){e.style.strokeDashoffset=e.__L*(1-t)});
      g.__f.forEach(function(e){e.style.opacity=clamp((t-.55)*2.2,0,1)})})}
  var maps=[$("#pm-as"),$("#pm-to")],last=0;
  function all(){maps.forEach(build)}
  all();var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){maps.forEach(function(m){var v=m.clientWidth<640;if(m.__v!==v){m.__v=v;build(m)}})},150)});
  maps.forEach(function(m){m.__v=m.clientWidth<640});
  function onScroll(){maps.forEach(draw)}
  window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("themechange",onScroll);
  document.fonts&&document.fonts.ready.then(onScroll);onScroll();
})();

/* ---------- HERO morph ---------- */
var weeklyRev=[4.6,21.4,23.8,23.5,24.6,26.7,29.1,31.6,32.2,33.0,33.0],curveLabels=["0","1","2","3","4-6","7","8-10","11-14","15-21","22-30","31+"],curveAvg=20.2;
function initHero(){
  var hero=$("#top"),stage=$(".stage",hero),wrap=$("#ecgwrap"),svg=$("#ecg"),N=600,W,H,xE=[],xC=[],yE=[],yC=[],g={},p=0,intro=RM?1:0,t0=performance.now(),running=false;
  function ecgShape(u){
    function G(c,s,a){return a*Math.exp(-Math.pow((u-c)/s,2)/2)}
    return G(.14,.028,-.11)+G(.292,.008,.13)+G(.325,.0125,-1)+G(.362,.011,.3)+G(.62,.05,-.22)}
  function layout(){
    W=wrap.clientWidth;H=wrap.clientHeight;
    var small=W<600,pl=small?40:60,pr=small?14:32,top=Math.min(small?92:92,H*.42),bot=small?24:30,ph=H-top-bot,base=top+ph*.6,A=ph*.5,nb=small?3:5;
    var vmin=0,vmax=40,K=weeklyRev.length-1;
    var ys=weeklyRev.map(function(v){return top+(1-(v-vmin)/(vmax-vmin))*ph});
    xE=[];xC=[];yE=[];yC=[];
    for(var i=0;i<N;i++){
      var f=i/(N-1);xE.push(f*W);xC.push(pl+f*(W-pl-pr));
      var u=(f*nb+.25)%1;yE.push(base+A*ecgShape(u)*(f<.02?f/.02:1));
      var s=f*K,k=Math.min(K-1,Math.floor(s)),tt=s-k,p1=ys[k],p2=ys[k+1];
      yC.push(p1+(p2-p1)*tt)}
    var s='<g id="gE">',x,y;
    for(x=0;x<=W;x+=small?12:15)s+='<line x1="'+x+'" x2="'+x+'" y1="0" y2="'+H+'" stroke="var(--grid)" stroke-width="'+(x%(small?60:75)===0?1:.5)+'"/>';
    for(y=0;y<=H;y+=small?12:15)s+='<line x1="0" x2="'+W+'" y1="'+y+'" y2="'+y+'" stroke="var(--grid)" stroke-width="'+(y%(small?60:75)===0?1:.5)+'"/>';
    s+='</g><g id="gC" opacity="0">';
    [10,20,30,40].forEach(function(v){var yy=top+(1-(v-vmin)/(vmax-vmin))*ph;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'" stroke="var(--rule2)" stroke-width="1"/><text x="'+(pl-8)+'" y="'+(yy+4)+'" text-anchor="end">'+v+"%</text>"});
    for(var w=0;w<=K;w++)if(!small||w%2===0)s+='<text x="'+(pl+w/K*(W-pl-pr))+'" y="'+(H-8)+'" text-anchor="middle">'+curveLabels[w]+(w===11?"":"")+"</text>";
    var ay=top+(1-curveAvg/(vmax-vmin))*ph;
    s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+ay+'" y2="'+ay+'" stroke="var(--acc)" stroke-dasharray="4 4"/><text x="'+(W-pr)+'" y="'+(ay-6)+'" text-anchor="end" style="fill:var(--acc)">all appointments '+curveAvg.toFixed(1)+'%</text>';
    s+='<text id="lE" text-anchor="end" x="'+(W-pr)+'" y="'+(ys[K]+24)+'" style="fill:var(--ink);font-weight:500">31+ days: '+weeklyRev[K].toFixed(1)+'%</text>';
    if(!small)s+='<text id="lS" x="'+(pl+18)+'" y="'+(ys[0]+20)+'" style="fill:var(--ink);font-weight:500">same day: '+weeklyRev[0].toFixed(1)+'%</text>';
    s+='<text x="'+(W-pr)+'" y="'+(top-12)+'" text-anchor="end">'+(small?"days ahead, bins not to scale":"days booked ahead (bins not to scale)")+'</text>';
        s+='</g>';
    s+='<path id="area" d="" fill="var(--acc)" opacity="0"/><path id="ghost" d="" fill="none" stroke="var(--acc)" stroke-width="1.5" opacity="0"/><path id="line" d="" fill="none" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle id="dot" r="5" fill="var(--acc)"/>';
    svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.innerHTML=s;
    g.gE=$("#gE");g.gC=$("#gC");g.line=$("#line");g.area=$("#area");g.dot=$("#dot");g.ghost=$("#ghost");g.bot=H-bot;
    
    frame(performance.now())}
  var userScrolled=window.scrollY>10;window.addEventListener("scroll",function(){if(window.scrollY>10)userScrolled=true},{passive:true});
  function autoP(now){if(RM||userScrolled)return 0;var t=now-t0-2900;if(t<0)return 0;if(t<2300)return sstep(0,1,t/2300);if(t<3700)return 1;if(t<5500)return 1-sstep(0,1,(t-3700)/1800);return 0}
  function readP(now){
    var max=hero.offsetHeight-stage.offsetHeight;p=RM||max<=0?1:Math.max(autoP(now),clamp((window.scrollY-(hero.offsetTop-48))/max,0,1))}
  function frame(now){
    readP(now);var pm=Math.pow(p,.55);
    if(!RM){intro=clamp((now-t0-250)/2200,0,1)}
    var lim=Math.max(2,Math.round(N*(1-Math.pow(1-intro,3)))),d="",last=0,lx=0,ly=0,ds=Math.pow(1,1);
    var loopI=Math.floor(((now/5200)%1)*(N-1));
    for(var i=0;i<lim;i++){
      var q=sstep(0,1,clamp(pm*1.5-(i/(N-1))*.5,0,1)),x=lerp(xE[i],xC[i],q),y=lerp(yE[i],yC[i],q);
      d+=(i?"L":"M")+x.toFixed(1)+" "+y.toFixed(1);lx=x;ly=y;
      if(i===loopI&&intro>=1){g.dx=x;g.dy=y}}
    var tcol=sstep(.5,.98,p);
    g.line.setAttribute("d",d);g.line.style.stroke="var(--acc)";
    g.area.setAttribute("d",d+"L"+lx.toFixed(1)+" "+g.bot+"L"+lerp(xE[0],xC[0],sstep(0,1,clamp(pm*1.5,0,1))).toFixed(1)+" "+g.bot+"Z");g.area.setAttribute("opacity",(.09*sstep(.6,1,p)).toFixed(3));
    g.gE.setAttribute("opacity",RM?0:(1-sstep(.2,.75,p)).toFixed(3));g.gC.setAttribute("opacity",sstep(.55,.95,p).toFixed(3));var lE=document.getElementById("lE");if(lE)lE.setAttribute("opacity",sstep(.96,1,p).toFixed(3));
    var dx=intro<1?lx:(g.dx==null?lx:g.dx),dy=intro<1?ly:(g.dy==null?ly:g.dy);
    g.dot.setAttribute("cx",dx);g.dot.setAttribute("cy",dy);g.dot.setAttribute("opacity",RM?0:(1-sstep(.05,.3,p)).toFixed(3));
    var c1=1-sstep(.28,.5,p),c2=sstep(.4,.62,p);
    $("#cap1").style.opacity=c1;$("#sm1").style.opacity=c1;$("#cap2").style.opacity=c2;$("#sm2").style.opacity=c2;
    $("#cap2").innerHTML='<span style="color:var(--mut)">From patient charts </span>to business charts';
    if(RM){$("#cap1").style.opacity=0;$("#sm1").style.opacity=0;$("#cap2").style.opacity=1;$("#sm2").style.opacity=1;}
  }
  function loop(now){frame(now);if(running)requestAnimationFrame(loop)}
  function start(){if(running||RM)return;running=true;requestAnimationFrame(loop)}
  function stop(){running=false}
  layout();
  if("IntersectionObserver" in window){new IntersectionObserver(function(es){es[0].isIntersecting?start():stop()},{rootMargin:"50px"}).observe(hero)}else start();
  var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(layout,120)});
  window.addEventListener("scroll",function(){if(RM)frame(performance.now())},{passive:true});
  if(document.fonts)document.fonts.ready.then(layout);
}

fetch("assets/noshow.json").then(function(r){return r.json()}).then(function(x){D=x;
  weeklyRev=x.curve.map(function(r){return 100*r[2]/r[1]});curveLabels=x.curve.map(function(r){return r[0]});
  initHero();initCase1()}).catch(function(){initHero()});
})();
