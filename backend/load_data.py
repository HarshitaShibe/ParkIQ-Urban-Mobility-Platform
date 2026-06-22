import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "parkiq")
DB_PORT = os.getenv("DB_PORT", 3306)

engine = create_engine(
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# project_root/data
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

files = {
    "hotspot_details.csv": "hotspots",
    "anomaly_alerts.csv": "anomaly_alerts",
    "daily_counts.csv": "daily_counts",
    "heatmap_data.csv": "heatmap_data",
}

for csv_file, table_name in files.items():

    file_path = os.path.join(DATA_DIR, csv_file)
    df = pd.read_csv(file_path)

    if table_name == "hotspots" and "rank" in df.columns:
        df = df.rename(columns={"rank": "rank_num"})

    df.to_sql(table_name, engine, if_exists="append", index=False)

    print(f"{table_name} done")

print("ALL DONE")