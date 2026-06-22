# SQL Folder

This folder contains database schema definitions used by the ParkIQ platform.

## schema.sql

Creates the PostgreSQL/PostGIS database structure required for storing parking violation records.

Features:

* Violations table creation
* PostGIS spatial support
* Geometry column for geospatial analysis
* Spatial indexing using GiST

The schema is designed to support:

* Hotspot detection
* Spatial clustering
* Heatmap generation
* Geospatial querying
