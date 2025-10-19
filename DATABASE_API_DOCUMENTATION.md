# PSA Database API Documentation

## Overview

The PSA AI Co-pilot backend now includes a complete database service for storing, retrieving, and analyzing incident history. All queries are automatically saved and can be accessed for historical analysis, pattern detection, and continuous improvement.

---

## Database Schema

### Incidents Table
Stores all processed alerts with complete analysis results.

**Fields:**
- `id`: Auto-increment primary key
- `case_id`: Unique identifier (e.g., PSA-20241019-143052)
- `alert_text`: Original alert text
- `module`: CNTR, VSL, EDI/API, or Infra/SRE
- `entities`: JSON array of extracted entities
- `alert_type`, `severity`, `urgency`: Parsed metadata
- `best_sop_id`: Recommended SOP
- `problem_statement`, `resolution_summary`, `reasoning`: AI analysis
- `candidate_sops`: JSON array of candidate SOPs considered
- `status`: open, in_progress, resolved, closed
- `created_at`, `resolved_at`, `resolution_time_minutes`: Timing data
- `feedback_rating`, `feedback_text`: User feedback

### SOP Performance Table
Tracks effectiveness of each SOP.

**Fields:**
- `sop_id`: SOP identifier
- `times_suggested`, `times_helpful`, `times_used`: Usage metrics
- `success_rate`: Percentage of helpful resolutions
- `avg_resolution_time`: Average time to resolve

---

## API Endpoints

### 1. **Process Alert** (Enhanced)
**POST** `/process_alert`

Now automatically stores incidents in database.

**Request:**
```json
{
  "alert_text": "RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received"
}
```

**Response:**
```json
{
  "success": true,
  "case_id": "PSA-20241019-143052",
  "parsed_entities": {...},
  "candidate_sops": [...],
  "analysis": {...},
  "escalation_contact": {...},
  "email_content": {...}
}
```

**Note:** `case_id` is now included in response for tracking.

---

### 2. **Get History**
**GET** `/history?limit=100&offset=0&module=CNTR&severity=high`

Retrieve incident history with optional filters.

**Query Parameters:**
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `module` (optional): Filter by module (CNTR, VSL, EDI/API, Infra/SRE)
- `severity` (optional): Filter by severity (critical, high, medium, low)

**Response:**
```json
{
  "success": true,
  "total": 50,
  "incidents": [
    {
      "id": 1,
      "case_id": "PSA-20241019-143052",
      "alert_text": "...",
      "module": "CNTR",
      "severity": "high",
      "status": "resolved",
      "created_at": "2024-10-19 14:30:52",
      "resolution_time_minutes": 15,
      ...
    }
  ]
}
```

**Example Usage:**
```bash
# Get all incidents
curl http://localhost:5000/history

# Get CNTR incidents only
curl http://localhost:5000/history?module=CNTR

# Get critical severity incidents
curl http://localhost:5000/history?severity=critical

# Pagination
curl http://localhost:5000/history?limit=20&offset=20
```

---

### 3. **Get Specific Incident**
**GET** `/history/<case_id>`

Retrieve detailed information about a specific incident.

**Response:**
```json
{
  "success": true,
  "incident": {
    "case_id": "PSA-20241019-143052",
    "alert_text": "...",
    "module": "CNTR",
    "entities": ["CMAU0000020", "ALR-861600"],
    "analysis": {...},
    "candidate_sops": [...],
    "status": "resolved",
    "created_at": "2024-10-19 14:30:52",
    ...
  }
}
```

**Example:**
```bash
curl http://localhost:5000/history/PSA-20241019-143052
```

---

### 4. **Get Analytics**
**GET** `/analytics`

Retrieve system-wide analytics and metrics.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "total_cases": 150,
    "status_counts": {
      "open": 10,
      "in_progress": 5,
      "resolved": 120,
      "closed": 15
    },
    "avg_resolution_time_minutes": 12.5,
    "module_distribution": {
      "CNTR": 45,
      "VSL": 30,
      "EDI/API": 50,
      "Infra/SRE": 25
    },
    "severity_distribution": {
      "critical": 5,
      "high": 20,
      "medium": 80,
      "low": 45
    },
    "top_performing_sops": [
      {
        "sop_id": "sop_3",
        "success_rate": 0.95,
        "times_used": 20
      }
    ],
    "recent_trends": [
      {
        "date": "2024-10-19",
        "count": 12
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:5000/analytics
```

---

### 5. **Search Incidents**
**GET** `/search?q=duplicate&limit=20`

Search incidents by text query.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 20)

**Response:**
```json
{
  "success": true,
  "query": "duplicate",
  "total": 5,
  "results": [
    {
      "case_id": "PSA-20241019-143052",
      "alert_text": "Duplicate container...",
      "module": "CNTR",
      ...
    }
  ]
}
```

**Example:**
```bash
# Search for duplicate issues
curl http://localhost:5000/search?q=duplicate

# Search for vessel issues
curl http://localhost:5000/search?q=vessel
```

---

### 6. **Find Similar Incidents**
**GET** `/similar/<case_id>`

Find similar past incidents to help with resolution.

**Response:**
```json
{
  "success": true,
  "case_id": "PSA-20241019-143052",
  "similar_incidents": [
    {
      "case_id": "PSA-20241018-120030",
      "alert_text": "...",
      "similarity_score": 0.85,
      "resolution_summary": "...",
      "was_resolved": true,
      "resolution_time_minutes": 10
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5000/similar/PSA-20241019-143052
```

---

### 7. **Submit Feedback**
**POST** `/feedback`

Submit feedback on incident resolution effectiveness.

**Request:**
```json
{
  "case_id": "PSA-20241019-143052",
  "was_resolved": true,
  "was_helpful": true,
  "rating": 5,
  "feedback_text": "SOP was very effective, issue resolved quickly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "PSA-20241019-143052",
    "was_resolved": true,
    "was_helpful": true,
    "rating": 5
  }'
```

---

### 8. **Update Incident Status**
**PUT** `/history/<case_id>/status`

Update the status of an incident.

**Request:**
```json
{
  "status": "resolved"
}
```

**Valid Statuses:** `open`, `in_progress`, `resolved`, `closed`

**Response:**
```json
{
  "success": true,
  "message": "Status updated to resolved"
}
```

**Example:**
```bash
curl -X PUT http://localhost:5000/history/PSA-20241019-143052/status \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved"}'
```

---

### 9. **Delete Incident**
**DELETE** `/history/<case_id>`

Delete an incident from the database (use with caution).

**Response:**
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/history/PSA-20241019-143052
```

---

## Key Features

### ✅ **Automatic Storage**
Every alert processed is automatically stored in the database with full context.

### 📊 **Analytics Dashboard**
Real-time metrics on:
- Total cases processed
- Resolution times
- Module distribution
- SOP effectiveness
- Recent trends

### 🔍 **Smart Search**
Search through all historical incidents by keywords, modules, or severity.

### 🎯 **Similar Case Detection**
Automatically find similar past incidents to speed up resolution.

### 💡 **Learning System**
Feedback mechanism allows the system to learn which SOPs are most effective.

### 📈 **Performance Tracking**
Track which SOPs work best for which types of issues.

---

## Database File

**Location:** `psa_incidents.db` (SQLite)

The database is automatically created on first run and persists all data locally.

**Backup:** Simply copy the `psa_incidents.db` file to create a backup.

---

## Integration Examples

### Frontend Integration

```javascript
// Process alert and get case_id
const response = await axios.post('/process_alert', {
  alert_text: alertText
});

const caseId = response.data.case_id;

// Later, retrieve the incident
const incident = await axios.get(`/history/${caseId}`);

// Submit feedback
await axios.post('/feedback', {
  case_id: caseId,
  was_resolved: true,
  was_helpful: true,
  rating: 5
});

// View analytics
const analytics = await axios.get('/analytics');
```

### Python Integration

```python
import requests

# Get all incidents
response = requests.get('http://localhost:5000/history')
incidents = response.json()['incidents']

# Search for specific issues
response = requests.get('http://localhost:5000/search?q=container')
results = response.json()['results']

# Get analytics
response = requests.get('http://localhost:5000/analytics')
analytics = response.json()['analytics']
```

---

## Benefits

1. **🔄 Historical Context** - Never lose track of past incidents
2. **📚 Knowledge Base** - Build institutional knowledge over time
3. **⚡ Faster Resolution** - Learn from similar past cases
4. **📊 Data-Driven Insights** - Make decisions based on real data
5. **🎯 Continuous Improvement** - Feedback loop improves SOP recommendations
6. **🔍 Audit Trail** - Complete history for compliance and review

---

## Next Steps

1. **Start Backend:**
   ```bash
   python app.py
   ```

2. **Process Some Alerts** to populate the database

3. **View History:**
   ```bash
   curl http://localhost:5000/history
   ```

4. **Check Analytics:**
   ```bash
   curl http://localhost:5000/analytics
   ```

---

## Support

For issues or questions:
- Check the database file: `psa_incidents.db`
- Review backend logs for errors
- Verify all endpoints are accessible

**Database automatically backs up every transaction!** 🎉

