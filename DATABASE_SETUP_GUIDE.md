# Database Setup Guide

## ✅ What Was Added

Your Flask backend now has a **complete database system** for storing and retrieving all alert queries!

### New Files Created:

1. **`database.py`** - Complete database service class
2. **`DATABASE_API_DOCUMENTATION.md`** - Full API documentation
3. **`test_database.py`** - Test script to verify everything works

### Modified Files:

1. **`app.py`** - Integrated database service with 9 new API endpoints

---

## 🚀 Quick Start

### 1. Test the Database

```bash
# Test database functionality
python test_database.py
```

This will create a test database and verify all functions work correctly.

### 2. Start Your Backend

```bash
python app.py
```

The database will be automatically created as `psa_incidents.db` on first run.

### 3. Process an Alert

```bash
curl -X POST http://localhost:5000/process_alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert_text": "Container CMAU0000020 - Duplicate information received"
  }'
```

**Note:** The alert is now automatically saved with a `case_id`!

### 4. View Your History

```bash
# Get all incidents
curl http://localhost:5000/history

# Get analytics
curl http://localhost:5000/analytics

# Search incidents
curl http://localhost:5000/search?q=duplicate
```

---

## 📊 New Features

### 1. **Automatic Storage**
Every alert processed is automatically saved to the database with:
- Case ID (e.g., PSA-20241019-143052)
- Full alert text
- Parsed entities
- AI analysis
- Resolution steps
- Timestamps

### 2. **History Tracking**
```bash
# View all past alerts
GET /history

# Get specific alert
GET /history/{case_id}

# Filter by module
GET /history?module=CNTR

# Filter by severity
GET /history?severity=critical
```

### 3. **Analytics Dashboard**
```bash
GET /analytics
```

Returns:
- Total cases processed
- Average resolution time
- Module distribution
- Severity breakdown
- Top performing SOPs
- Recent trends

### 4. **Smart Search**
```bash
GET /search?q=duplicate
```

Search through all historical incidents by keywords.

### 5. **Similar Incident Detection**
```bash
GET /similar/{case_id}
```

Find similar past incidents to learn from previous resolutions.

### 6. **Feedback System**
```bash
POST /feedback
{
  "case_id": "PSA-20241019-143052",
  "was_resolved": true,
  "was_helpful": true,
  "rating": 5
}
```

Track which SOPs are most effective.

### 7. **Status Management**
```bash
PUT /history/{case_id}/status
{
  "status": "resolved"
}
```

Track incident lifecycle: open → in_progress → resolved → closed

---

## 📁 Database Structure

**File:** `psa_incidents.db` (SQLite)

**Tables:**
1. **incidents** - All processed alerts with full details
2. **sop_performance** - SOP effectiveness tracking
3. **system_metrics** - Daily aggregated metrics

**No configuration needed** - SQLite is built into Python!

---

## 🎯 Use Cases

### 1. Review Past Alerts
```python
import requests

# Get last 50 alerts
response = requests.get('http://localhost:5000/history?limit=50')
incidents = response.json()['incidents']

for incident in incidents:
    print(f"{incident['case_id']}: {incident['module']} - {incident['severity']}")
```

### 2. Find Similar Issues
```python
# When processing new alert
response = requests.post('/process_alert', json={'alert_text': alert})
case_id = response.json()['case_id']

# Find similar past cases
similar = requests.get(f'/similar/{case_id}')
print("Similar past incidents:", similar.json())
```

### 3. Track Performance
```python
# Get analytics
analytics = requests.get('/analytics').json()

print(f"Total cases: {analytics['analytics']['total_cases']}")
print(f"Avg time: {analytics['analytics']['avg_resolution_time_minutes']} min")
print(f"Top SOPs: {analytics['analytics']['top_performing_sops']}")
```

### 4. Build Reports
```python
# Get all CNTR incidents
cntr_cases = requests.get('/history?module=CNTR').json()

# Get all critical severity
critical = requests.get('/history?severity=critical').json()

# Generate report
print(f"CNTR cases: {len(cntr_cases['incidents'])}")
print(f"Critical issues: {len(critical['incidents'])}")
```

---

## 🔧 API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/process_alert` | POST | Process alert (now saves to DB) |
| `/history` | GET | Get all incidents with filters |
| `/history/{case_id}` | GET | Get specific incident |
| `/analytics` | GET | Get system analytics |
| `/search` | GET | Search incidents |
| `/similar/{case_id}` | GET | Find similar incidents |
| `/feedback` | POST | Submit feedback |
| `/history/{case_id}/status` | PUT | Update status |
| `/history/{case_id}` | DELETE | Delete incident |

---

## 💡 Benefits

✅ **Never lose data** - All queries saved automatically  
✅ **Learn from history** - See what worked before  
✅ **Track performance** - Know your resolution times  
✅ **Improve over time** - Feedback makes system smarter  
✅ **Audit trail** - Complete history for compliance  
✅ **Pattern detection** - Identify recurring issues  
✅ **Data-driven decisions** - Real metrics, not guesses  

---

## 🧪 Testing

### Run Tests
```bash
python test_database.py
```

### Manual Testing
```bash
# 1. Process an alert
curl -X POST http://localhost:5000/process_alert \
  -H "Content-Type: application/json" \
  -d '{"alert_text": "Test alert"}'

# 2. View it in history
curl http://localhost:5000/history

# 3. Check analytics
curl http://localhost:5000/analytics
```

---

## 📚 Documentation

- **Full API Docs**: `DATABASE_API_DOCUMENTATION.md`
- **Database Code**: `database.py`
- **Backend Integration**: `app.py` (lines 804-976)

---

## 🎉 Ready to Use!

Your backend now has enterprise-grade historical tracking! Every alert is:
1. ✅ Automatically stored
2. ✅ Searchable
3. ✅ Trackable
4. ✅ Analyzable

Start your backend and begin processing alerts - they'll all be saved automatically!

```bash
python app.py
```

Then open your frontend and process some alerts. Check the history at:
```bash
curl http://localhost:5000/history
```

**Database file:** `psa_incidents.db` (created automatically)

🚀 **You're all set!**

