-- schema.sql
CREATE DATABASE IF NOT EXISTS parkiq;
USE parkiq;

-- Main violations table (from organizer data)
CREATE TABLE IF NOT EXISTS violations (
    id VARCHAR(100) PRIMARY KEY,
    latitude DOUBLE,
    longitude DOUBLE,
    location TEXT,
    vehicle_number VARCHAR(50),
    vehicle_type VARCHAR(50),
    violation_type VARCHAR(100),
    offence_code VARCHAR(50),
    created_datetime DATETIME,
    modified_datetime DATETIME,
    device_id VARCHAR(100),
    created_by_id VARCHAR(100),
    center_code DOUBLE,
    police_station VARCHAR(200),
    data_sent_to_scita BOOLEAN,
    junction_name VARCHAR(200),
    data_sent_to_scita_timestamp DATETIME,
    updated_vehicle_number VARCHAR(50),
    updated_vehicle_type VARCHAR(50),
    validation_status VARCHAR(50),
    validation_timestamp DATETIME,
    hour DOUBLE,
    day_of_week VARCHAR(20),
    month DOUBLE,
    weekend BOOLEAN,
    peak_hour BOOLEAN
);

-- Hotspots (from Member 3's CSV)
CREATE TABLE IF NOT EXISTS hotspots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rank_num INT,
    location TEXT,
    total_violations INT,
    hotspot_score DOUBLE,
    severity VARCHAR(20),
    description TEXT
);

-- Anomaly alerts
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(50),
    location TEXT,
    date DATE,
    violation_count INT,
    severity VARCHAR(20),
    alert_message TEXT
);

-- Daily counts
CREATE TABLE IF NOT EXISTS daily_counts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location TEXT,
    date DATE,
    violation_count INT,
    anomaly INT
);

-- Heatmap data
CREATE TABLE IF NOT EXISTS heatmap_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location TEXT,
    latitude DOUBLE,
    longitude DOUBLE,
    total_violations INT
);

-- Live reports from video upload (YOLO detections)
CREATE TABLE IF NOT EXISTS live_reports (
    id VARCHAR(100) PRIMARY KEY,
    latitude DOUBLE,
    longitude DOUBLE,
    vehicle_type VARCHAR(50),
    license_plate VARCHAR(50),
    confidence DOUBLE,
    is_stationary BOOLEAN DEFAULT FALSE,
    violation_type VARCHAR(100) DEFAULT 'Illegal Parking',
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    video_path TEXT,
    status VARCHAR(50) DEFAULT 'PENDING'
);