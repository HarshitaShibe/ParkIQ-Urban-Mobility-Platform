# Data Folder

This folder contains processed datasets generated during the ML pipeline development for ParkIQ.

## Files

### daily_counts.csv

Aggregated dataset containing the number of parking violations per location per day. This dataset is used as the input for anomaly detection.

Columns:

* location
* date
* violation_count

### anomalies_enriched.csv

Output of the Isolation Forest anomaly detection model. Contains detected anomalous location-day combinations along with additional metadata and severity information.

### anomaly_alerts.csv

Final alert dataset generated from detected anomalies. This dataset can be consumed by backend APIs such as `/anomaly/alerts` and frontend dashboards.

Fields include:

* alert_id
* location
* date
* violation_count
* severity
* alert_message

## Purpose

These datasets support:

* Parking hotspot identification
* Anomaly detection
* Enforcement prioritization
* Alert generation
* Urban mobility analytics
Data files for ML pipeline.
