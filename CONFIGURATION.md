# PSA Alert Processing System - Configuration Guide

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

### Required Configuration

```env
# Google Gemini API Key (default AI provider)
GEMINI_API_KEY=your_gemini_api_key_here

# Email Service - Resend API (for PDF reports and incident emails)
RESEND_API_KEY=your_resend_api_key_here
```

### Optional: OpenAI ChatGPT

If you want to use OpenAI ChatGPT models instead of Gemini:

```env
# OpenAI ChatGPT
OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** Users can switch between Gemini and ChatGPT in the frontend Settings page. API keys are securely stored in the backend only.

### Optional MySQL Database

If you have MySQL configured:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=portnet_db
```

---

## Getting API Keys

### 1. Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy the key and add to `.env`

### 2. Resend API Key (Required for Email Features)
1. Go to [Resend](https://resend.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. **Important:** Verify your domain `arnavjhajharia.com` in Resend dashboard
6. Copy the API key and add to `.env` as `RESEND_API_KEY`

### 3. OpenAI API Key (Optional - for ChatGPT models)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy and add to `.env` as `OPENAI_API_KEY`
5. Users can now select ChatGPT models from the Settings page

---

## Email Configuration for Resend

The system uses **Resend** for sending professional incident report emails.

### Sender Email Address
- Default: `psacodesprint@arnavjhajharia.com`
- This is configured in `email_service.py`

### How Email Works
1. User processes an alert
2. Clicks "Email Report" button
3. Enters recipient email address
4. Email is sent from `psacodesprint@arnavjhajharia.com`
5. Recipient's email is added to CC
6. Beautiful HTML email with incident details is delivered

### Email Features
- ✅ Professional HTML template
- ✅ Color-coded severity badges
- ✅ Module identification
- ✅ Problem statement and resolution
- ✅ Escalation contact information
- ✅ Automatic CC to recipient
- ✅ PDF attachment support (coming soon)

---

## Frontend Configuration

### API URL
The frontend can be configured to connect to different backend URLs:

1. Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

2. For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Testing Configuration

### Test Email Sending
```bash
# Make sure backend is running
cd /path/to/PSA-Code-Sprint
python app.py

# In another terminal, test the endpoint
curl -X POST http://localhost:5000/send_incident_report \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "test@example.com",
    "incident_data": {
      "case_id": "TEST-001",
      "alert_text": "Test alert",
      "parsed_entities": {"module": "CNTR", "severity": "high", "urgency": "high"},
      "analysis": {"problem_statement": "Test", "resolution_summary": "Test", "best_sop_id": "SOP-001", "reasoning": "Test"},
      "escalation_contact": {"escalation_contact": {"name": "Test", "email": "test@test.com", "phone": "123"}}
    }
  }'
```

---

## Troubleshooting

### Email Not Sending
1. **Check Resend API Key**: Make sure `RESEND_API_KEY` is set in `.env`
2. **Verify Domain**: Confirm `arnavjhajharia.com` is verified in Resend dashboard
3. **Check Backend Logs**: Look for error messages in terminal running Flask
4. **API Limits**: Free tier has sending limits, check Resend dashboard

### PDF Generation Issues
1. **Missing Dependencies**: Run `cd frontend && npm install jspdf`
2. **Browser Compatibility**: Ensure modern browser (Chrome, Firefox, Safari)
3. **Check Console**: Open browser DevTools for error messages

### AI Model Not Working
1. **API Key Missing**: Check if the API key for selected provider is in `.env`
2. **Frontend Settings**: Verify AI settings are saved in Settings page
3. **Backend Logs**: Check Flask terminal for AI client errors

---

## Production Deployment

### Backend
1. Set all required environment variables
2. Use production WSGI server (gunicorn)
3. Set up proper CORS origins
4. Enable HTTPS

### Frontend
1. Build for production: `npm run build`
2. Deploy to Vercel/Netlify
3. Set `NEXT_PUBLIC_API_URL` to production backend
4. Enable environment variables in hosting platform

### Security Notes
- ⚠️ Never commit `.env` file
- ⚠️ Use environment variables in production
- ⚠️ Rotate API keys regularly
- ⚠️ Set up proper CORS origins
- ⚠️ Use HTTPS in production

---

**Ready to go!** Make sure you have at least `GEMINI_API_KEY` and `RESEND_API_KEY` configured to use all features.

