"""Seeded synthetic generator for Case 01 (clinic operations). All data is synthetic."""
import random, json
random.seed(2027)
W=12; TH=["A","B","C","D"]; AVAIL=2800  # minutes per therapist-week
FEE={"first":1100,"follow":800}; MIN={"first":45,"follow":30}
rows=[]  # [week, therapist, visit(0 first/1 follow), lead(0 <=5d /1 >5d), booked, noshow, delivered_min, available_min, revenue_inr]
for w in range(1,W+1):
    ramp=1+0.012*(w-1)
    for ti,t in enumerate(TH):
        share=[1.08,1.0,0.96,0.96][ti]
        for v in (0,1):
            for l in (0,1):
                base={(0,0):9,(0,1):9,(1,0):20,(1,1):15}[(v,l)]*share*ramp
                booked=max(1,round(base+random.gauss(0,1.6)))
                p={(0,0):.10,(0,1):.26,(1,0):.06,(1,1):.11}[(v,l)]
                if w>=7:  # reminder + capped overbooking on far-ahead first visits
                    if (v,l)==(0,1): p=.12
                    if (v,l)==(1,1): p=.08
                ns=max(0,min(booked,round(booked*p+random.gauss(0,.7))))
                if w>=7 and (v,l)==(0,1):  # overbooked slots refill, adding attended visits
                    booked+=2
                att=booked-ns
                rows.append([w,ti,v,l,booked,ns,att*MIN["first" if v==0 else "follow"],AVAIL if (v,l)==(0,0) else 0,att*FEE["first" if v==0 else "follow"]])
json.dump({"therapists":TH,"rows":rows},open("assets/clinic.json","w"),separators=(",",":"))
def agg(rs):
    b=sum(r[4] for r in rs);n=sum(r[5] for r in rs);d=sum(r[6] for r in rs);a=sum(r[7] for r in rs);rev=sum(r[8] for r in rs);return b,n,d,a,rev
for lo,hi in((1,6),(7,12)):
    b,n,d,a,rev=agg([r for r in rows if lo<=r[0]<=hi]);k=hi-lo+1
    print(lo,hi,"booked/wk",b/k,"noshow%",100*n/b,"util%",100*d/a,"rev/wk",rev/k)
for w in range(1,13):
    b,n,d,a,rev=agg([r for r in rows if r[0]==w]);print(w,b,round(100*n/b,1),round(100*d/a,1),rev)
for v in(0,1):
  for l in(0,1):
    b,n,*_=agg([r for r in rows if r[2]==v and r[3]==l and r[0]<=6]);print("seg",v,l,round(100*n/b,1))
