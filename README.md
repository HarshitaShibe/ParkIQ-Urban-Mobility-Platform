# ParkIQ – Urban Mobility Platform

AI-powered parking intelligence platform for identifying illegal parking hotspots, detecting abnormal violation spikes, and supporting data-driven enforcement.

## ML-3 Scope Completed

### Database & Spatial Layer

* PostgreSQL setup
* PostGIS integration
* Spatial indexing using GiST

### Data Engineering

* Dataset profiling and cleaning
* Feature engineering
* Daily violation aggregation

### Anomaly Detection

* Isolation Forest model
* 620 anomalous location-day combinations detected

### Alert Generation

* Severity classification
* Alert identifiers
* Human-readable alert messages

## Generated Outputs

| File                   | Purpose                     |
| ---------------------- | --------------------------- |
| daily_counts.csv       | Daily violation aggregation |
| anomalies_enriched.csv | Isolation Forest output     |
| anomaly_alerts.csv     | Alert dataset for APIs      |

## Technologies

* Python
* Pandas
* Scikit-learn
* PostgreSQL
* PostGIS

## Current Progress

* Database Setup ✅
* Data Pipeline ✅
* Spatial Analytics ✅
* Anomaly Detection ✅
* Alert Generation ✅
* Hotspot Detection 🔄
* Redis Optimization ⏳
