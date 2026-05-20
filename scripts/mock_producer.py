#!/usr/bin/env python3
"""
Mock POS Data Producer - Simulates real-time store transactions
Run this to generate fake sales data for your pipeline
"""

import json
import random
import time
from datetime import datetime
from kafka import KafkaProducer

# Store configurations (matches your dashboard)
STORES = [
    {"id": 1, "name": "Naivas CBD", "pos_type": "api"},
    {"id": 2, "name": "QuickMart Westlands", "pos_type": "api"},
    {"id": 3, "name": "Carrefour Junction", "pos_type": "field_agent"},
    {"id": 4, "name": "Tuskys Thika Road", "pos_type": "manual"},
    {"id": 5, "name": "Chandarana ABC", "pos_type": "field_agent"},
]

PRODUCTS = [
    {"sku": "SKU-001", "name": "Cooking Oil 2L", "price": 450},
    {"sku": "SKU-002", "name": "Maize Flour 2kg", "price": 180},
    {"sku": "SKU-003", "name": "Dish Soap 500ml", "price": 120},
    {"sku": "SKU-004", "name": "Milk 1L", "price": 65},
    {"sku": "SKU-005", "name": "Sugar 1kg", "price": 150},
]

def create_producer():
    """Create Kafka producer connection"""
    try:
        producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        print("✅ Connected to Kafka at localhost:9092")
        return producer
    except Exception as e:
        print(f"⚠️ Kafka not running: {e}")
        print("   Run: docker-compose up -d")
        return None

def generate_sale(store_id):
    """Generate a single sale transaction"""
    product = random.choice(PRODUCTS)
    quantity = random.randint(1, 5)
    
    return {
        "transaction_id": f"TXN_{int(time.time())}_{random.randint(1000,9999)}",
        "timestamp": datetime.now().isoformat(),
        "store_id": store_id,
        "store_name": next(s["name"] for s in STORES if s["id"] == store_id),
        "sku": product["sku"],
        "product_name": product["name"],
        "quantity": quantity,
        "unit_price": product["price"],
        "total": quantity * product["price"],
        "payment_method": random.choice(["mpesa", "cash", "card"]),
    }

def main():
    print("🦆 Duck Data Pipeline - Mock POS Producer")
    print("=" * 50)
    
    producer = create_producer()
    
    if not producer:
        print("\n❌ Cannot start producer. Kafka not available.")
        print("\nTo start Kafka:")
        print("1. Install Docker Desktop")
        print("2. Run: docker-compose up -d")
        return
    
    print("\n📡 Streaming mock sales data to Kafka... (Press Ctrl+C to stop)")
    print("-" * 50)
    
    try:
        while True:
            for store in STORES:
                # Generate 1-3 sales per store per cycle
                for _ in range(random.randint(1, 3)):
                    sale = generate_sale(store["id"])
                    producer.send('pos_transactions', value=sale)
                    print(f"📤 Sent: {sale['store_name']} - {sale['quantity']}x {sale['product_name']} (KES {sale['total']})")
            
            # Wait before next batch (simulate real-time)
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Producer stopped.")
        producer.close()

if __name__ == "__main__":
    main()