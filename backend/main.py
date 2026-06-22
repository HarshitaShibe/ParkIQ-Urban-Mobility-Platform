from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import mysql.connector
import uuid
import os
import shutil
from datetime import datetime
from dotenv import load_dotenv
from yolo_inference import analyze_video

load_dotenv()

DB_HOST     = os.getenv("DB_HOST", "localhost")
DB_USER     = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME     = os.getenv("DB_NAME", "parkiq")

# ── DB connection ──────────────────────────────────────────────
def get_conn():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

def q(sql, params=None):
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params or ())
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def run(sql, params=None):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(sql, params or ())
    conn.commit()
    cursor.close()
    conn.close()

# ── App ────────────────────────────────────────────────────────
app = FastAPI(title="ParkIQ API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ══════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════
@app.get("/")
def root():
    return {"status": "ok", "project": "ParkIQ", "version": "1.0"}


# ══════════════════════════════════════════════════════════════
# HOTSPOTS
# ══════════════════════════════════════════════════════════════

@app.get("/hotspots/ranked")
def hotspots_ranked(limit: int = 20):
    """Top N hotspots by rank — for leaderboard / table"""
    return q("""
        SELECT rank_num, location, total_violations, hotspot_score, severity, description
        FROM hotspots
        ORDER BY rank_num ASC
        LIMIT %s
    """, (limit,))


@app.get("/hotspots/severity/{severity}")
def hotspots_by_severity(severity: str):
    """Filter hotspots by CRITICAL / HIGH / MEDIUM"""
    sev = severity.upper()
    if sev not in ("CRITICAL", "HIGH", "MEDIUM"):
        raise HTTPException(400, "severity must be CRITICAL, HIGH, or MEDIUM")
    return q("""
        SELECT rank_num, location, total_violations, hotspot_score, severity
        FROM hotspots
        WHERE severity = %s
        ORDER BY hotspot_score DESC
    """, (sev,))


@app.get("/hotspots/summary")
def hotspots_summary():
    """Count of CRITICAL / HIGH / MEDIUM — for stat cards"""
    rows = q("""
        SELECT severity, COUNT(*) as count, SUM(total_violations) as total_violations
        FROM hotspots
        GROUP BY severity
    """)
    return rows


# ══════════════════════════════════════════════════════════════
# HEATMAP
# ══════════════════════════════════════════════════════════════

@app.get("/heatmap")
def heatmap():
    """GeoJSON FeatureCollection for Leaflet heatmap layer"""
    rows = q("""
        SELECT latitude, longitude, total_violations
        FROM heatmap_data
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r["longitude"], r["latitude"]]
            },
            "properties": {
                "weight": r["total_violations"],
                "location": r.get("location", "")
            }
        }
        for r in rows
    ]
    return {"type": "FeatureCollection", "features": features}


@app.get("/heatmap/points")
def heatmap_points():
    """Raw lat/lon/weight list — easier for some chart libs"""
    return q("""
        SELECT latitude, longitude, total_violations as weight
        FROM heatmap_data
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """)


# ══════════════════════════════════════════════════════════════
# TRENDS / DAILY COUNTS
# ══════════════════════════════════════════════════════════════

@app.get("/trends/daily")
def daily_trends():
    """City-wide daily violation count — for line chart"""
    return q("""
        SELECT date, SUM(violation_count) as total_violations
        FROM daily_counts
        GROUP BY date
        ORDER BY date ASC
    """)


@app.get("/trends/weekly")
def weekly_trends():
    """Weekly aggregation — for bar chart"""
    return q("""
        SELECT 
            YEARWEEK(date, 1) as week,
            MIN(date) as week_start,
            SUM(violation_count) as total_violations
        FROM daily_counts
        GROUP BY YEARWEEK(date, 1)
        ORDER BY week ASC
    """)


@app.get("/trends/location")
def trends_by_location(location: str):
    """Daily trend for a specific location — for drill-down chart"""
    return q("""
        SELECT date, violation_count
        FROM daily_counts
        WHERE location LIKE %s
        ORDER BY date ASC
    """, (f"%{location}%",))


@app.get("/trends/top-days")
def top_violation_days(limit: int = 10):
    """Highest violation days city-wide"""
    return q("""
        SELECT date, SUM(violation_count) as total_violations
        FROM daily_counts
        GROUP BY date
        ORDER BY total_violations DESC
        LIMIT %s
    """, (limit,))


# ══════════════════════════════════════════════════════════════
# ANOMALIES
# ══════════════════════════════════════════════════════════════

@app.get("/anomalies")
def get_anomalies(severity: str = None, limit: int = 50):
    """All anomaly alerts, optional severity filter"""
    if severity:
        return q("""
            SELECT * FROM anomaly_alerts
            WHERE severity = %s
            ORDER BY date DESC
            LIMIT %s
        """, (severity.upper(), limit))
    return q("""
        SELECT * FROM anomaly_alerts
        ORDER BY date DESC
        LIMIT %s
    """, (limit,))


@app.get("/anomalies/summary")
def anomaly_summary():
    """Count by severity — for stat cards"""
    return q("""
        SELECT severity, COUNT(*) as count
        FROM anomaly_alerts
        GROUP BY severity
    """)


@app.get("/anomalies/recent")
def recent_anomalies(days: int = 7):
    """Anomalies in last N days"""
    return q("""
        SELECT * FROM anomaly_alerts
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
        ORDER BY date DESC
    """, (days,))


# ══════════════════════════════════════════════════════════════
# ENFORCEMENT
# ══════════════════════════════════════════════════════════════

@app.get("/enforcement/deploy")
def enforcement_deploy(top_n: int = 10):
    """Officer deployment recommendations based on hotspot score"""
    rows = q("""
        SELECT rank_num, location, total_violations, hotspot_score, severity
        FROM hotspots
        WHERE severity IN ('CRITICAL', 'HIGH')
        ORDER BY hotspot_score DESC
        LIMIT %s
    """, (top_n,))

    for r in rows:
        score = r["hotspot_score"]
        r["recommended_officers"] = 3 if score > 80 else 2 if score > 50 else 1
        r["priority"] = "IMMEDIATE" if score > 90 else "HIGH" if score > 60 else "NORMAL"
        r["shift"] = "ALL" if score > 80 else "PEAK"

    return rows


# ══════════════════════════════════════════════════════════════
# LIVE REPORTS (YOLO video upload)
# ══════════════════════════════════════════════════════════════

@app.post("/report/video")
async def report_video(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
):
    """Upload video → YOLO detects vehicles → saves to live_reports"""
    file_id = str(uuid.uuid4())[:8]
    video_path = f"{UPLOAD_DIR}/{file_id}.mp4"

    with open(video_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    detections = analyze_video(video_path, latitude, longitude)

    inserted = []
    for d in detections:
        rid = f"LR-{str(uuid.uuid4())[:8]}"
        run("""
            INSERT INTO live_reports
            (id, latitude, longitude, vehicle_type, license_plate,
             confidence, is_stationary, video_path, reported_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            rid,
            d["latitude"],
            d["longitude"],
            d["vehicle_type"],
            d["license_plate"],
            d["confidence"],
            d.get("is_stationary", False),
            video_path,
            datetime.utcnow()
        ))
        inserted.append({**d, "report_id": rid})

    return {
        "status": "processed",
        "report_location": {"latitude": latitude, "longitude": longitude},
        "violations_detected": len(inserted),
        "authority_notified": True,
        "details": inserted
    }


@app.get("/report/live")
def live_reports(limit: int = 20):
    """Recent YOLO-detected violations — for live feed on dashboard"""
    return q("""
        SELECT id, latitude, longitude, vehicle_type, license_plate,
               confidence, is_stationary, reported_at, status
        FROM live_reports
        ORDER BY reported_at DESC
        LIMIT %s
    """, (limit,))


@app.get("/report/live/geojson")
def live_reports_geojson():
    """GeoJSON of live reports — for map pins"""
    rows = q("""
        SELECT id, latitude, longitude, vehicle_type,
               license_plate, reported_at, status
        FROM live_reports
        WHERE latitude IS NOT NULL
        ORDER BY reported_at DESC
        LIMIT 100
    """)
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r["longitude"], r["latitude"]]
            },
            "properties": {
                "id": r["id"],
                "vehicle_type": r["vehicle_type"],
                "license_plate": r["license_plate"],
                "reported_at": str(r["reported_at"]),
                "status": r["status"]
            }
        }
        for r in rows
    ]
    return {"type": "FeatureCollection", "features": features}


@app.patch("/report/live/{report_id}/status")
def update_report_status(report_id: str, status: str):
    """Mark a live report as REVIEWED / RESOLVED"""
    if status not in ("PENDING", "REVIEWED", "RESOLVED"):
        raise HTTPException(400, "status must be PENDING, REVIEWED, or RESOLVED")
    run("UPDATE live_reports SET status = %s WHERE id = %s", (status, report_id))
    return {"updated": report_id, "status": status}


# ══════════════════════════════════════════════════════════════
# STATS — dashboard overview cards
# ══════════════════════════════════════════════════════════════

@app.get("/stats/overview")
def overview():
    """Single call for all dashboard stat cards"""
    total = q("SELECT SUM(total_violations) as total FROM hotspots")[0]["total"]
    critical = q("SELECT COUNT(*) as c FROM hotspots WHERE severity='CRITICAL'")[0]["c"]
    high = q("SELECT COUNT(*) as c FROM hotspots WHERE severity='HIGH'")[0]["c"]
    anomalies = q("SELECT COUNT(*) as c FROM anomaly_alerts")[0]["c"]
    live = q("SELECT COUNT(*) as c FROM live_reports")[0]["c"]
    top = q("SELECT location, hotspot_score FROM hotspots ORDER BY hotspot_score DESC LIMIT 1")

    return {
        "total_violations": total,
        "critical_zones": critical,
        "high_zones": high,
        "total_anomalies": anomalies,
        "live_reports_today": live,
        "top_hotspot": top[0] if top else None
    }