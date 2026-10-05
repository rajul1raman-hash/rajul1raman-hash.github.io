"""Build the aggregated cube for Case 01 from the REAL public dataset.
Source: Kaggle 'Medical Appointment No Shows' (Joni Hoppen / Aquarela Analytics), CC BY-NC-SA 4.0.
https://www.kaggle.com/datasets/joniarroba/noshowappointments
The raw CSV is mirrored on GitHub (abhirup-ghosh/medical-appointment-no-shows); it is NOT shipped here, only the aggregate."""
import csv, json, os, sqlite3, urllib.request
HERE=os.path.dirname(os.path.abspath(__file__)); DATA=os.path.join(HERE,"..","data"); os.makedirs(DATA,exist_ok=True)
RAW=os.path.join(DATA,"raw.csv"); DB=os.path.join(DATA,"ns.db")
if not os.path.exists(RAW):
    urllib.request.urlretrieve("https://raw.githubusercontent.com/abhirup-ghosh/medical-appointment-no-shows/main/data/KaggleV2-May-2016.csv",RAW)
if os.path.exists(DB): os.remove(DB)
c=sqlite3.connect(DB)
c.execute("CREATE TABLE appointments(patient_id TEXT,appointment_id INT,gender TEXT,scheduled_at TEXT,appointment_date TEXT,age INT,neighbourhood TEXT,scholarship INT,hypertension INT,diabetes INT,alcoholism INT,handicap INT,sms_received INT,no_show INT)")
rows=[(r['PatientId'],int(r['AppointmentID']),r['Gender'],r['ScheduledDay'][:19],r['AppointmentDay'][:10],int(r['Age']),r['Neighbourhood'],int(r['Scholarship']),int(r['Hipertension']),int(r['Diabetes']),int(r['Alcoholism']),int(r['Handcap']),int(r['SMS_received']),1 if r['No-show']=='Yes' else 0) for r in csv.DictReader(open(RAW,encoding='utf-8'))]
c.executemany("INSERT INTO appointments VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",rows)
BASE="""CREATE VIEW base AS SELECT no_show,sms_received,age,
 CAST(julianday(appointment_date)-julianday(substr(scheduled_at,1,10)) AS INT) AS lead_days,
 CAST(strftime('%w',appointment_date) AS INT) AS dow
 FROM appointments WHERE age>=0 AND appointment_date>=substr(scheduled_at,1,10)"""
c.execute(BASE)
AGE="CASE WHEN age<=12 THEN 0 WHEN age<=24 THEN 1 WHEN age<=39 THEN 2 WHEN age<=54 THEN 3 WHEN age<=69 THEN 4 ELSE 5 END"
LEAD="CASE WHEN lead_days=0 THEN 0 WHEN lead_days<=2 THEN 1 WHEN lead_days<=7 THEN 2 WHEN lead_days<=14 THEN 3 WHEN lead_days<=30 THEN 4 ELSE 5 END"
cube=[list(r) for r in c.execute(f"SELECT {AGE},{LEAD},sms_received,dow-1 AS wd,COUNT(*),SUM(no_show) FROM base WHERE dow BETWEEN 1 AND 6 GROUP BY 1,2,3,4 ORDER BY 1,2,3,4")]
# weekday Sunday does not occur in the data; Mon..Sat -> 0..5
CURVE=[(0,0,"0"),(1,1,"1"),(2,2,"2"),(3,3,"3"),(4,6,"4-6"),(7,7,"7"),(8,10,"8-10"),(11,14,"11-14"),(15,21,"15-21"),(22,30,"22-30"),(31,999,"31+")]
curve=[]
for lo,hi,lab in CURVE:
    n,ns=c.execute("SELECT COUNT(*),SUM(no_show) FROM base WHERE lead_days BETWEEN ? AND ?",(lo,hi)).fetchone();curve.append([lab,n,ns])
tot=c.execute("SELECT COUNT(*),SUM(no_show),COUNT(DISTINCT 1) FROM base").fetchone()
raw_n=c.execute("SELECT COUNT(*) FROM appointments").fetchone()[0]
meta={"raw_rows":raw_n,"clean_rows":tot[0],"no_shows":tot[1],"dropped":raw_n-tot[0],"first":c.execute("SELECT MIN(appointment_date) FROM appointments").fetchone()[0],"last":c.execute("SELECT MAX(appointment_date) FROM appointments").fetchone()[0]}
c.commit()
json.dump({"meta":meta,"cube":cube,"curve":curve},open(os.path.join(HERE,"..","assets","noshow.json"),"w"),separators=(",",":"))
print(meta,len(cube),"cells; curve",[(l,round(100*s/n,1)) for l,n,s in curve])
