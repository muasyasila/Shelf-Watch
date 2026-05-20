#!/usr/bin/env python3
"""
ETL Consumer - Reads from Kafka, transforms data, loads to PostgreSQL
"""

import json
import psycopg2
from psycopg2.extras import execute_values
from kafka import KafkaConsumer
from datetime import datetime

# Database connection
DB_CONFIG = {
    "host": "localhost",
    "database": "duck_warehouse",
    "user": "duck",
    "password": "duck123"
}

def init_database():
    """Create tables if they don't exist"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Create fact_transactions table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS fact_transactions (
            transaction_id VARCHAR(50) PRIMARY KEY,
            timestamp TIMESTAMP,
            store_id INTEGER,
            store_name VARCHAR(100),
            sku VARCHAR(20),
            product_name VARCHAR(100),
            quantity INTEGER,
            unit_price DECIMAL(10,2),
            total DECIMAL(10,2),
            payment_method VARCHAR(20),
            ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create aggregated store_stats table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS agg_store_stats (
            store_id INTEGER PRIMARY KEY,
            store_name VARCHAR(100),
            total_sales DECIMAL(10,2),
            transaction_count INTEGER,
            last_transaction TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database tables ready")

def update_store_stats(conn, store_id, store_name, total):
    """Update aggregated store statistics"""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO agg_store_stats (store_id, store_name, total_sales, transaction_count, last_transaction)
        VALUES (%s, %s, %s, 1, %s)
        ON CONFLICT (store_id) DO UPDATE SET
            total_sales = agg_store_stats.total_sales + EXCLUDED.total_sales,
            transaction_count = agg_store_stats.transaction_count + 1,
            last_transaction = EXCLUDED.last_transaction,
            updated_at = CURRENT_TIMESTAMP
    """, (store_id, store_name, total, datetime.now()))
    cur.close()

def process_message(message):
    """Process a single Kafka message"""
    try:
        data = json.loads(message.value.decode('utf-8'))
        
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Insert transaction
        cur.execute("""
            INSERT INTO fact_transactions 
            (transaction_id, timestamp, store_id, store_name, sku, product_name, 
             quantity, unit_price, total, payment_method)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (transaction_id) DO NOTHING
        """, (
            data['transaction_id'], data['timestamp'], data['store_id'],
            data['store_name'], data['sku'], data['product_name'],
            data['quantity'], data['unit_price'], data['total'], data['payment_method']
        ))
        
        # Update store stats
        update_store_stats(conn, data['store_id'], data['store_name'], data['total'])
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"💾 Stored: {data['transaction_id']} - {data['store_name']}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing message: {e}")
        return False

def main():
    print("🦆 Duck ETL Consumer")
    print("=" * 50)
    
    # Initialize database
    init_database()
    
    # Create Kafka consumer
    consumer = KafkaConsumer(
        'pos_transactions',
        bootstrap_servers=['localhost:9092'],
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        value_deserializer=lambda x: x  # Keep as bytes, we'll decode manually
    )
    
    print("📡 Listening for transactions... (Press Ctrl+C to stop)")
    print("-" * 50)
    
    try:
        for message in consumer:
            process_message(message)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Consumer stopped.")
        consumer.close()

if __name__ == "__main__":
    main()