# AI Model Configuration - Simplified

## 🎯 Changes Made

### **Before (Complex)**
- ❌ Users had to input API keys in the frontend
- ❌ Supported 4 providers (Gemini, OpenAI, Claude, Groq)
- ❌ API keys stored in browser localStorage
- ❌ Security concern: exposing API keys to frontend

### **After (Simple & Secure)**
- ✅ API keys stored securely in backend `.env` only
- ✅ Only 2 providers: **Gemini** and **OpenAI ChatGPT**
- ✅ Users just select the model from Settings
- ✅ No API key input fields in frontend
- ✅ More secure architecture

---

## 🔧 How It Works Now

### **Frontend (User Experience)**
1. User goes to **Settings** page
2. Sees "AI Model Selection" card
3. Selects AI Provider:
   - Google Gemini
   - OpenAI ChatGPT
4. Selects specific model from dropdown
5. Clicks "Save All Settings"
6. **No API key input required!**

### **Backend (Secure)**
1. Backend reads API keys from environment variables:
   - `GEMINI_API_KEY` for Gemini models
   - `OPENAI_API_KEY` for ChatGPT models
2. Frontend sends only: `aiProvider` and `aiModel`
3. Backend uses appropriate API key from `.env`
4. AI client initialized with environment credentials

---

## 📁 Files Modified

### **Frontend**

#### `frontend/app/settings/page.tsx`
**Changes:**
- Removed `apiKey` from state
- Removed API key input field
- Removed Anthropic and Groq options
- Only shows Gemini and OpenAI (ChatGPT)
- Added info box explaining backend configuration
- Updated "AI Models" badge to "Gemini & ChatGPT"

#### `frontend/components/alert-processor.tsx`
**Changes:**
- Removed API key from `aiSettings` object
- Only sends `aiProvider` and `aiModel` to backend
- Added comment: "Only send provider and model preferences, API keys are on backend"

### **Backend**

#### `ai_client.py`
**Changes:**
- Always uses environment variables for API keys
- Removed support for Anthropic and Groq
- Only supports "gemini" and "openai"
- Updated error messages to be clearer
- `create_ai_client()` no longer accepts API keys

#### `app.py`
**Changes:**
- Updated to not expect `apiKey` from frontend
- Creates AI client with only provider and model
- Sets `apiKey: None` (uses env variables)
- Better logging for which provider is being used

### **Documentation**

#### `CONFIGURATION.md`
**Changes:**
- Simplified API key configuration section
- Removed Claude and Groq setup instructions
- Emphasized that API keys are backend-only
- Updated notes about user model selection

---

## 🔐 Security Improvements

### **Before:**
```javascript
// Frontend stored API keys in localStorage
{
  "apiKey": "sk-proj-xxxxx", // ❌ Exposed to browser
  "aiProvider": "openai"
}

// Sent to backend
POST /process_alert
{
  "ai_settings": {
    "apiKey": "sk-proj-xxxxx", // ❌ Transmitted over network
    "aiProvider": "openai"
  }
}
```

### **After:**
```javascript
// Frontend only stores preferences
{
  "aiProvider": "openai",  // ✅ Just a preference
  "aiModel": "gpt-4o"      // ✅ Just a preference
}

// Sent to backend
POST /process_alert
{
  "ai_settings": {
    "aiProvider": "openai",  // ✅ No sensitive data
    "aiModel": "gpt-4o"      // ✅ No sensitive data
  }
}

// Backend uses secure env variables
OPENAI_API_KEY=sk-proj-xxxxx  // ✅ Never exposed to frontend
```

---

## 🎨 UI Changes

### Settings Page - Before vs After

**Before:**
```
┌─────────────────────────────────┐
│ AI Model Configuration          │
│                                 │
│ AI Provider: [Select ▼]        │
│ - Gemini                        │
│ - OpenAI                        │
│ - Anthropic Claude              │
│ - Groq                          │
│                                 │
│ Model: [Select ▼]              │
│                                 │
│ API Key: [**********]          │  ← ❌ REMOVED
│                                 │
│ ℹ️ How to get API keys:         │
│ • Gemini: link                  │
│ • OpenAI: link                  │
│ • Anthropic: link               │
│ • Groq: link                    │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│ AI Model Selection              │
│ API keys configured in backend  │
│                                 │
│ AI Provider: [Select ▼]        │
│ - Google Gemini                 │
│ - OpenAI ChatGPT                │  ← ✅ Simplified
│                                 │
│ Model: [Select ▼]              │
│                                 │
│ ℹ️ API Keys Configuration        │
│ API keys are securely stored   │
│ in backend environment vars.   │
│ Contact admin to configure      │
│ GEMINI_API_KEY or              │
│ OPENAI_API_KEY in .env file    │
└─────────────────────────────────┘
```

---

## 🚀 Usage Guide

### **For End Users**
1. Go to **Settings**
2. Find "AI Model Selection" card
3. Choose provider: Gemini or ChatGPT
4. Select specific model
5. Click "Save All Settings"
6. Done! No API keys needed

### **For System Administrators**
1. Set up `.env` file in backend:
```env
# Required: At least one of these
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here

# Required: For email features
RESEND_API_KEY=your_resend_key_here
```

2. Restart Flask backend
3. Users can now switch between configured models

---

## 📋 Supported Models

### **Google Gemini**
- ✅ Gemini 2.0 Flash (Experimental) - `gemini-2.0-flash-exp`
- ✅ Gemini 2.0 Flash Thinking - `gemini-2.0-flash-thinking-exp-01-21`
- ✅ Gemini 1.5 Pro - `gemini-1.5-pro`
- ✅ Gemini 1.5 Flash - `gemini-1.5-flash`

### **OpenAI ChatGPT**
- ✅ GPT-4o (Latest) - `gpt-4o`
- ✅ GPT-4o Mini - `gpt-4o-mini`
- ✅ GPT-4 Turbo - `gpt-4-turbo`
- ✅ GPT-3.5 Turbo - `gpt-3.5-turbo`

---

## 🔄 Migration Notes

If you had the old system with API keys in frontend:

1. **Clear browser settings:**
```javascript
// In browser console:
localStorage.removeItem("app_settings");
```

2. **Configure backend `.env`:**
```env
GEMINI_API_KEY=your_actual_key
OPENAI_API_KEY=your_actual_key  # if using ChatGPT
```

3. **Restart backend:**
```bash
python app.py
```

4. **Refresh frontend and select model in Settings**

---

## ✅ Benefits

1. **🔐 More Secure** - API keys never leave the server
2. **👥 Easier for Users** - No need to manage API keys
3. **🎯 Simpler UI** - Cleaner settings interface
4. **⚡ Better Architecture** - Follows best practices
5. **📊 Centralized Control** - Admins manage API keys centrally
6. **🛡️ No Exposure Risk** - Keys can't be extracted from browser

---

## 🐛 Troubleshooting

### **Error: "GEMINI_API_KEY not found in environment variables"**
**Solution:** Add `GEMINI_API_KEY=your_key` to `.env` file in backend root

### **Error: "OPENAI_API_KEY not found in environment variables"**
**Solution:** 
- If using ChatGPT models, add `OPENAI_API_KEY=your_key` to `.env`
- Or switch back to Gemini models in Settings

### **Models not changing**
**Solution:** 
1. Check that you saved settings in Settings page
2. Clear browser cache
3. Refresh page
4. Check backend logs for errors

---

**System is now simpler, more secure, and easier to use! 🎉**

