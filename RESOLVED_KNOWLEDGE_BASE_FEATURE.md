# Resolved Incident Knowledge Base Integration

## Overview
This feature allows users to mark incidents as resolved, which automatically adds the successful resolution to the knowledge base (ChromaDB) for future reference. This creates a self-learning system that improves over time.

## Key Features

### 1. **Mark as Resolved Button**
- Available in both the **Process Alert** page (after processing) and **History** page
- Visible only for open incidents
- One-click resolution marking

### 2. **Automatic Knowledge Base Addition**
When an incident is marked as resolved:
- The incident status is updated to "resolved" in the database
- The entire resolution (problem statement, solution, SOP used) is automatically added to ChromaDB
- Future similar alerts will benefit from this historical resolution

### 3. **Separated Views in History**
The History page now features **two tabs**:

#### **Open Tab**
- Shows all unresolved incidents
- Includes "Mark as Resolved" button for each incident
- Visual indicators for severity and urgency

#### **Resolved Tab**
- Shows all resolved incidents
- Green visual theme to indicate completion
- Includes checkmark badges
- No "Mark as Resolved" button (already resolved)

## Implementation Details

### Frontend Changes

#### `/frontend/app/history/page.tsx`
- Added `Tabs` component to separate open and resolved incidents
- Added `handleMarkAsResolved()` function to call the backend API
- Added visual distinction:
  - Open incidents: Standard card styling
  - Resolved incidents: Green border, checkmark icon, "RESOLVED" badge

#### `/frontend/app/process/page.tsx`
- Added "Export & Share Report" card with PDF download and email functionality
- Added "Resolution Status" card with "Mark as Resolved" button
- Integrated `handleMarkAsResolved()`, `handleDownloadPDF()`, and `handleSendIncidentReport()` functions
- Added state management for email dialog and recipient email

### Backend Changes

#### `/app.py`
New endpoint: `POST /history/<case_id>/resolve`

**What it does:**
1. Retrieves the full incident details from the database
2. Updates the incident status to "resolved"
3. Creates a comprehensive case log entry
4. Generates an embedding for the case log
5. Adds the case log to ChromaDB with rich metadata

**Case Log Format:**
```
Case ID: PSA-20250119-ABC123
Module: CNTR
Alert Type: Duplicate Container
Severity: High
Urgency: High

Original Alert:
[Full alert text]

Problem Statement:
[AI-generated problem statement]

Resolution:
[AI-generated resolution summary]

SOP Used: SOP-CNTR-001
```

**ChromaDB Metadata:**
- `case_id`: Unique incident identifier
- `module`: System module (CNTR, VSL, EDI/API, etc.)
- `severity`: Incident severity level
- `alert_type`: Type of alert
- `sop_id`: SOP used for resolution
- `resolved_at`: Timestamp of resolution

## User Workflow

### Resolving from Process Alert Page:
1. User processes a new alert
2. Reviews the analysis and recommendations
3. Downloads PDF report if needed
4. Sends email report to stakeholders if needed
5. Clicks "Mark as Resolved & Add to Knowledge Base"
6. System confirms resolution and knowledge base update
7. Incident moves to "Resolved" section in History

### Resolving from History Page:
1. User navigates to History
2. Views "Open" tab (default)
3. Selects an incident and reviews details
4. Clicks "Resolve" button on the incident card
5. System confirms resolution and knowledge base update
6. Incident immediately moves to "Resolved" tab

## Benefits

### 1. **Self-Learning System**
- Each resolved incident becomes training data for future alerts
- Similar future incidents benefit from past resolutions
- Knowledge base grows organically with real production data

### 2. **Better Recommendations Over Time**
- Retrieval Agent will find more relevant case logs
- More accurate similarity matching
- Faster resolution times for recurring issues

### 3. **Clear Status Tracking**
- Visual separation of open vs resolved incidents
- Easy to see progress at a glance
- Historical audit trail of resolutions

### 4. **Workflow Efficiency**
- Single-click resolution marking
- Automatic knowledge base update (no manual entry)
- No interruption to normal workflow

## Visual Indicators

### Open Incidents:
- Standard white card background
- Orange/red severity badges
- "View" and "Resolve" buttons
- AlertCircle icon in tab

### Resolved Incidents:
- Green-tinted card background
- Green checkmark icon
- "RESOLVED" badge in green
- Only "View" button (no resolve)
- CheckCircle icon in tab

## Statistics Dashboard
The History page shows three key metrics:
1. **Total Incidents**: All processed alerts
2. **Open Cases**: Incidents awaiting resolution
3. **Resolved**: Successfully resolved and archived

## Technical Notes

### Error Handling
- If knowledge base addition fails, the incident is still marked as resolved
- User sees success message regardless (non-blocking failure)
- Backend logs warning if ChromaDB insertion fails

### Data Persistence
- Incident status persists in SQLite database
- Knowledge base entries persist in ChromaDB
- Both are separate but synchronized operations

### API Response
```json
{
  "success": true,
  "message": "Incident marked as resolved and added to knowledge base",
  "case_id": "PSA-20250119-ABC123"
}
```

## Future Enhancements
Potential improvements for this feature:
- **Feedback mechanism**: Allow users to rate resolution quality
- **Bulk resolution**: Mark multiple incidents as resolved at once
- **Resolution notes**: Add custom notes when resolving
- **Auto-resolution**: Automatically resolve low-severity incidents after confirmation
- **Resolution analytics**: Track which SOPs lead to fastest resolutions
- **Knowledge base search**: Search through resolved cases directly
- **Version control**: Track changes to resolutions over time

## Testing
To test the feature:
1. Process a new alert in the Process Alert page
2. Mark it as resolved using the "Mark as Resolved" button
3. Navigate to History page
4. Verify the incident appears in the "Resolved" tab
5. Process a similar alert
6. Verify the Retrieval Agent finds the resolved case in similar incidents

## Configuration
No additional configuration required. The feature uses existing:
- SQLite database for incident storage
- ChromaDB for knowledge base storage
- Existing embedding model for case log embeddings

## Conclusion
This feature transforms the PSA Alert Processing System into a continuously improving platform that learns from each resolved incident, making the team more efficient over time.

