import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from db_config import get_db_connection
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Backend is running!"

@app.route('/cravings', methods=['GET', 'POST'])
def cravings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'POST':
        data = request.json
        cursor.execute(
            "INSERT INTO cravings (intensity, trigg, mood, notes) VALUES (%s, %s, %s, %s)",
            (data['intensity'], data['trigg'], data['mood'], data['notes'])
        )
        conn.commit()
        return jsonify({'status': 'saved'})
    else:
        cursor.execute("SELECT * FROM cravings ORDER BY created_at DESC LIMIT 10")
        cravings = cursor.fetchall()
        # Rename 'trigg' to 'trigger' for frontend compatibility
        for c in cravings:
            c['trigger'] = c.pop('trigg')
        return jsonify(cravings)

@app.route('/plans', methods=['GET', 'POST'])
def plans():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'POST':
        data = request.json
        cursor.execute(
            "INSERT INTO plans (strategy) VALUES (%s)",
            (data['strategy'],)
        )
        conn.commit()
        return jsonify({'status': 'saved'})
    else:
        cursor.execute("SELECT * FROM plans ORDER BY created_at DESC LIMIT 10")
        plans = cursor.fetchall()
        return jsonify(plans)

@app.route('/triggers', methods=['GET'])
def get_triggers():
    # Example: static list, or fetch from DB if you have a triggers table
    triggers = ["After meal", "Stress", "Social", "Boredom", "Commute", "Morning coffee"]
    return jsonify(triggers)

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'POST':
        data = request.json
        # Clear previous profile (single user app)
        cursor.execute("DELETE FROM profile")
        cursor.execute(
            "INSERT INTO profile (quit_date, cigs_per_day, pack_price, per_pack) VALUES (%s, %s, %s, %s)",
            (data['quitDate'], data['cigsPerDay'], data['packPrice'], data['perPack'])
        )
        conn.commit()
        return jsonify({'status': 'saved'})
    else:
        cursor.execute("SELECT * FROM profile LIMIT 1")
        profile = cursor.fetchone()
        return jsonify(profile if profile else {})
    

@app.route('/donate', methods=['POST'])
def donate():
    data = request.json
    amount = data.get("amount", 5)
    email = data.get("email", "guest@breathebetter.app")

    headers = {
        "Authorization": f"Bearer {INTASEND_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "amount": float(amount),   # ensure number
        "currency": "USD",         # or "KES" if your account is Kenya-based
        "narration": "Support Breathe Better",
        "redirect_url": "http://localhost:5000/thank-you",
        "customer": {"email": email}
    }

    try:
        resp = requests.post(API_URL, json=payload, headers=headers)
        print("IntaSend response:", resp.text)  # 👈 log the full response
        resp.raise_for_status()
        return jsonify(resp.json())
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": str(e),
            "body": resp.text if 'resp' in locals() else None
        }), 400

# 🔑 Use the correct key depending on sandbox vs live
INTASEND_SECRET_KEY = "ISSecretKey_test_cabd9faa-0a03-4224-a493-c188df395dc0"  # Replace with YOUR secret key
API_URL = "https://sandbox.intasend.com/api/v1/checkout/"  # Or payment.intasend.com for live



if __name__ == '__main__':
    app.run(debug=True)

