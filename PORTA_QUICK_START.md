# Porta & Bella - Quick Start Guide 🚀

## What's New?

You now have a beautiful ChatGPT-style chatbot interface called **Porta** with the ability to toggle to **Bella** mode!

## Access the App

1. **Development Server**: The app is now running at `http://localhost:3000`
2. **Direct Access**: Open your browser and go to `http://localhost:3000`
3. **Auto-redirect**: The homepage automatically redirects to `/chat`

## Features at a Glance

### 🎯 Main Interface
- **Clean ChatGPT-like design** with white background
- **Message bubbles**: User (blue/pink) on right, Assistant (gray) on left
- **Smart input area** with send button
- **Responsive design** that works on all devices

### 🔄 Toggle Between Modes
Located in the top-right corner of the header:

```
Porta [Toggle Switch] Bella
```

- **Porta Mode** (default): Blue theme (#2563eb)
- **Bella Mode**: Pink theme (#db2777)

Toggle instantly switches:
- ✨ Icon colors
- 💬 User message bubble colors
- 🔘 Send button color
- 📱 App name in header

### 💾 Chat History
- **Sidebar**: Shows all your conversations
- **Automatic saving**: Chats persist in browser localStorage
- **Organized by date**: Today, Yesterday, X days ago
- **Quick actions**:
  - Click to open a chat
  - Hover to see delete button
  - New Chat button at the top

### 📝 Using the Chatbot

1. **Type a message** in the input box at the bottom
2. **Press Enter** or click the send button
3. **See the response** appear with typing animation
4. **Chat title** automatically set from first message

### 💡 Suggested Prompts

When you start a new chat, you'll see 4 suggested prompts:
- ✅ Check Alerts
- 📊 View History
- ❓ Get Help
- 📈 Analytics

Click any suggestion to auto-fill the input!

## File Structure

```
frontend/
├── app/
│   ├── chat/
│   │   └── page.tsx          ← Main chatbot page
│   ├── layout.tsx             ← Updated app name to "Porta"
│   └── page.tsx               ← Redirects to /chat
├── components/
│   ├── chat-history.tsx       ← Sidebar with chat list
│   ├── chat-message.tsx       ← Message bubble component
│   └── ui/                    ← Existing UI components
```

## Current State

✅ **Working**:
- Full chat interface
- History management (create, view, delete chats)
- Porta/Bella mode toggle
- Local storage persistence
- Responsive design
- ChatGPT-style UI

⏳ **Simulated**:
- AI responses (currently returns demo text)
- Backend integration ready but not connected

## Next Steps for Backend Integration

To connect to your actual AI/RAG backend, edit:

**`frontend/app/chat/page.tsx`** - Line ~105, replace the `setTimeout` with:

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const response = await fetch(`${apiUrl}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: inputValue,
    chatId: chatId,
    history: currentChat.messages,
    mode: isBellaMode ? 'bella' : 'porta'
  })
});

const data = await response.json();
const assistantMessage = {
  id: (Date.now() + 1).toString(),
  role: "assistant",
  content: data.response, // Your backend response
  timestamp: new Date(),
};
```

## Testing the Interface

1. **Create a new chat**: Click "New Chat" button
2. **Send messages**: Type and press Enter
3. **Toggle modes**: Switch between Porta and Bella
4. **Check history**: See chats organized by date
5. **Delete chat**: Hover over a chat and click trash icon
6. **Responsive**: Try resizing your browser window

## Mobile Experience

- Sidebar automatically collapses on mobile
- Hamburger menu (☰) to show/hide sidebar
- Touch-friendly message bubbles
- Optimized input area

## Data Storage

All chats are stored in **browser localStorage**:
- Persists across page refreshes
- Unique to your browser
- To clear: Open DevTools → Console → `localStorage.clear()`

## Styling

- **Design System**: ChatGPT-inspired clean white theme
- **Colors**:
  - Porta: Blue (#2563eb)
  - Bella: Pink (#db2777)
  - Background: White (#ffffff)
  - Messages: Gray (#f3f4f6)
- **Fonts**: Geist Sans (modern, clean)

## Tips & Tricks

1. **Keyboard shortcut**: Press Enter to send (Shift+Enter for new line)
2. **Quick start**: Click suggested prompts for common queries
3. **Name display**: Header shows current mode (Porta or Bella)
4. **Loading state**: Animated dots while waiting for response
5. **Timestamps**: Hover to see full message time

## Troubleshooting

**Can't see the app?**
- Check `http://localhost:3000` is accessible
- Verify the dev server is running (`npm run dev`)

**Chats not saving?**
- Check browser localStorage is enabled
- Try private/incognito mode if issues persist

**Toggle not working?**
- Refresh the page
- Clear browser cache

**TypeScript errors?**
- Run `npm install` in frontend directory
- Restart the dev server

## What's Different from Old Dashboard?

| Old Dashboard | New Porta/Bella |
|--------------|----------------|
| Analytics focus | Chat-first interface |
| Multi-page navigation | Single chat screen |
| Static cards | Dynamic conversations |
| No history | Full chat history |
| Single theme | Dual modes (Porta/Bella) |

The old dashboard is still available at `/analytics`, `/process`, etc. if you navigate directly to those routes.

## Future Enhancements

The interface is ready for:
- [ ] Real AI backend integration
- [ ] Streaming responses
- [ ] File uploads
- [ ] Voice input
- [ ] Export conversations
- [ ] Search chat history
- [ ] Dark mode
- [ ] Custom themes

---

**Enjoy your new ChatGPT-style interface! 🎉**

Switch between Porta and Bella whenever you like - same intelligence, different style!



