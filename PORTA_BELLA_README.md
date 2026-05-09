# Porta & Bella - ChatGPT-Style AI Assistant

## Overview

**Porta** is a clean, modern ChatGPT-like chatbot interface for the PSA Alert Processing System. With a simple toggle, you can switch to **Bella** mode, which provides the same functionality with a pink-themed UI.

## Features

### ✨ Core Functionality

- **ChatGPT-Style Interface**: Clean white design inspired by ChatGPT's user experience
- **Chat History**: Full conversation history with automatic saving to localStorage
- **Mode Toggle**: Seamlessly switch between Porta (blue theme) and Bella (pink theme)
- **Persistent Storage**: All chats are saved locally and persist across sessions
- **Real-time Messaging**: Smooth message sending and receiving with typing indicators

### 🎨 User Interface

- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Collapsible Sidebar**: Clean chat history sidebar that can be hidden on mobile
- **Message Bubbles**: User messages on the right (blue/pink), assistant messages on the left (gray)
- **Timestamps**: Each message includes a timestamp
- **Empty State**: Beautiful welcome screen with suggested prompts when starting a new chat

### 💬 Chat Management

- **Create New Chats**: Start fresh conversations with the "New Chat" button
- **Organized History**: Chats grouped by recency (Today, Yesterday, X days ago)
- **Delete Chats**: Remove individual chat histories
- **Auto-titling**: First message becomes the chat title
- **Smart Selection**: Current chat is highlighted in the sidebar

## Getting Started

### Running the Application

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### First Time Usage

1. The app automatically redirects to `/chat`
2. You'll see the welcome screen with Porta's introduction
3. Click any suggested prompt or type your own message
4. Use the toggle in the header to switch to Bella mode

## Mode Differences

| Feature | Porta Mode | Bella Mode |
|---------|-----------|------------|
| Primary Color | Blue (#2563eb) | Pink (#db2777) |
| Icon Style | Blue backgrounds | Pink backgrounds |
| User Message Color | Blue bubble | Pink bubble |
| Send Button | Blue | Pink |
| Branding | "Porta" | "Bella" |

Everything else remains identical - same features, same functionality, just different visual theming!

## Architecture

### File Structure

```
frontend/
├── app/
│   ├── chat/
│   │   └── page.tsx          # Main chat interface
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Redirects to /chat
├── components/
│   ├── chat-history.tsx       # Sidebar with chat list
│   ├── chat-message.tsx       # Individual message component
│   └── ui/                    # Reusable UI components
└── lib/
    └── utils.ts               # Utility functions
```

### Data Structure

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

### State Management

- **Local State**: React useState for UI state (loading, input, etc.)
- **Persistent Storage**: localStorage for chat history
- **Real-time Updates**: Automatic save on every message

## Integration Points

### Backend API Integration

Currently, the chatbot uses simulated responses. To integrate with your backend:

1. **Update the API call** in `/frontend/app/chat/page.tsx`:

```typescript
const handleSendMessage = async () => {
  // ... existing code ...

  // Replace the setTimeout with actual API call
  const response = await fetch(`${apiUrl}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: inputValue,
      chatId: chatId,
      history: currentChat.messages
    })
  });
  
  const data = await response.json();
  
  // Add assistant response
  const assistantMessage = {
    id: (Date.now() + 1).toString(),
    role: "assistant",
    content: data.response,
    timestamp: new Date(),
  };
  // ... rest of the code
};
```

2. **Environment Variables**: Set `NEXT_PUBLIC_API_URL` in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### Future Enhancements

- [ ] Connect to backend AI/RAG system
- [ ] Add file upload support
- [ ] Implement streaming responses
- [ ] Add markdown rendering for assistant messages
- [ ] Export chat history
- [ ] Search across chats
- [ ] Dark mode support
- [ ] Voice input/output
- [ ] Multi-language support

## Technical Details

### Key Components

#### ChatPage (`/app/chat/page.tsx`)
Main component managing chat state, message handling, and UI layout.

**Key Features:**
- Chat creation and management
- Message sending/receiving
- Mode switching (Porta/Bella)
- localStorage persistence

#### ChatHistory (`/components/chat-history.tsx`)
Sidebar component displaying chat history.

**Key Features:**
- Grouped chat display
- Chat selection
- Chat deletion
- Responsive collapsing

#### ChatMessage (`/components/chat-message.tsx`)
Individual message bubble component.

**Key Features:**
- Role-based styling (user vs assistant)
- Mode-aware theming
- Timestamp display
- Responsive layout

### Styling

- **Framework**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono

### Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Chats not persisting
- Check browser localStorage is enabled
- Clear localStorage: `localStorage.clear()` in browser console

### TypeScript errors
- Run `npm run build` to check for compile errors
- Restart TypeScript server in your IDE

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check `postcss.config.mjs` and `tailwind.config.ts`

## Credits

Built with:
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide Icons

---

**Note**: This is a frontend-only implementation. Backend integration is required for actual AI functionality. The current version uses simulated responses for demonstration purposes.



