# Porta & Bella - Visual Interface Guide

## Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ☰  Porta                              Porta [⚫] Bella          │  ← Header
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│  [New Chat] │                    ✨ Porta                        │
│             │          Your intelligent assistant                │
│   TODAY     │                                                     │
│  💬 Chat 1  │  ┌─────────────────────────────────────────┐      │
│  💬 Chat 2  │  │  Check Alerts                            │      │
│             │  │  What alerts need attention?             │      │
│  YESTERDAY  │  └─────────────────────────────────────────┘      │
│  💬 Chat 3  │                                                     │
│  💬 Chat 4  │  ┌─────────────────────────────────────────┐      │
│             │  │  View History                            │      │
│  3 DAYS AGO │  │  Show recent incidents                   │      │
│  💬 Chat 5  │  └─────────────────────────────────────────┘      │
│             │                                                     │
│             │                                                     │
│  Powered by │                                                     │
│    Porta    │                                                     │
├─────────────┴───────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Message Porta...                                       [→] │ │  ← Input
│  └────────────────────────────────────────────────────────────┘ │
│  Porta can make mistakes. Consider checking important info.     │
└─────────────────────────────────────────────────────────────────┘
```

## Porta Mode (Blue Theme)

### Header
- **Left**: ☰ Menu icon (mobile) + "Porta" title
- **Right**: Toggle switch "Porta [⚫────] Bella"

### Colors
- Primary: Blue (#2563eb)
- User messages: Blue bubble with white text
- Assistant messages: Gray bubble with black text
- Send button: Blue background
- Icons: Blue accent

### Welcome Screen
```
        ✨ (Blue circle icon)
           Porta
    Your intelligent assistant for PSA
    alert processing and queries

    [Suggested Prompts in 2x2 grid]
```

## Bella Mode (Pink Theme)

### Header
- **Left**: ☰ Menu icon (mobile) + "Bella" title
- **Right**: Toggle switch "Porta [────⚫] Bella"

### Colors
- Primary: Pink (#db2777)
- User messages: Pink bubble with white text
- Assistant messages: Gray bubble with black text
- Send button: Pink background
- Icons: Pink accent

### Welcome Screen
```
        ✨ (Pink circle icon)
           Bella
    Your intelligent assistant for PSA
    alert processing and queries

    [Suggested Prompts in 2x2 grid]
```

## Chat Conversation View

```
┌─────────────────────────────────────────────────────────────────┐
│  ☰  Porta                              Porta [⚫] Bella          │
├─────────────┬───────────────────────────────────────────────────┤
│  [New Chat] │                                                     │
│             │  ✨  Hello! I'm Porta, your AI assistant.          │
│   TODAY     │      This is a demo response...                    │
│  💬 How ca..│      10:30 AM                                      │
│  💬 What al.│                                                     │
│             │                              What alerts need  👤  │
│  YESTERDAY  │                              my attention?         │
│  💬 Show me.│                              10:29 AM              │
│             │                                                     │
│             │  ✨  I'm analyzing current alerts...               │
│             │      Let me check the system...                    │
│             │      10:30 AM                                      │
│             │                                                     │
│             │                              Generate a report 👤  │
│             │                              for today             │
│             │                              10:31 AM              │
│             │                                                     │
│             │  ⚫ ⚫ ⚫  (typing indicator)                        │
│             │                                                     │
├─────────────┴───────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Message Porta...                                       [→] │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Message Styles

### User Messages (Right-aligned)
```
                                    Hello! How are you?  👤
                                    10:30 AM
```
- **Porta Mode**: Blue background (#2563eb), white text
- **Bella Mode**: Pink background (#db2777), white text
- Avatar: Gray circle with user icon

### Assistant Messages (Left-aligned)
```
✨  I'm doing well, thank you! How can I help?
    10:30 AM
```
- **Both Modes**: Gray background (#f3f4f6), black text
- Avatar: Blue/Pink circle with sparkles icon (depends on mode)

## Sidebar States

### Expanded (Desktop)
```
┌─────────────────┐
│   [New Chat]    │
│                 │
│     TODAY       │
│  💬 Chat title  │
│  💬 Chat title  │
│                 │
│   YESTERDAY     │
│  💬 Chat title  │
│                 │
│  Powered by     │
│     Porta       │
└─────────────────┘
```

### Collapsed (Mobile)
```
│  (Hidden off-screen)
```

## Interactive Elements

### Toggle Switch
```
Porta  ⚫────────  Bella    (Porta active - blue)
Porta  ────────⚫  Bella    (Bella active - pink)
```

### Send Button
```
┌────────────────────────────────┐
│ Type your message...       [→] │  ← Blue (Porta) or Pink (Bella)
└────────────────────────────────┘
```

### Chat Item (Hover State)
```
💬  Chat title here              [🗑]  ← Trash appears on hover
```

### Suggested Prompts (4-card grid)
```
┌─────────────────────┐  ┌─────────────────────┐
│ ✓ Check Alerts      │  │ 📊 View History     │
│ What alerts need    │  │ Show me recent      │
│ my attention?       │  │ incident history    │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│ ❓ Get Help         │  │ 📈 Analytics        │
│ Explain the vessel  │  │ Generate analytics  │
│ registry process    │  │ report              │
└─────────────────────┘  └─────────────────────┘
```

## Responsive Breakpoints

### Desktop (lg: 1024px+)
- Sidebar always visible
- Full 3-column message layout
- 2x2 prompt grid

### Tablet (md: 768px - 1023px)
- Sidebar collapsible
- Full message layout
- 2x2 prompt grid

### Mobile (< 768px)
- Sidebar overlay with backdrop
- Stacked message bubbles
- 1-column prompt grid
- Hamburger menu visible

## Color Palette

### Porta Mode
| Element | Color Code | Usage |
|---------|-----------|--------|
| Primary | #2563eb | User bubbles, buttons, icons |
| Background | #ffffff | Main background |
| Gray | #f3f4f6 | Assistant bubbles |
| Text | #111827 | Main text |
| Border | #e5e7eb | Dividers, borders |

### Bella Mode
| Element | Color Code | Usage |
|---------|-----------|--------|
| Primary | #db2777 | User bubbles, buttons, icons |
| Background | #ffffff | Main background |
| Gray | #f3f4f6 | Assistant bubbles |
| Text | #111827 | Main text |
| Border | #e5e7eb | Dividers, borders |

## Typography

- **Headers**: Geist Sans, Bold, 24-30px
- **Body**: Geist Sans, Regular, 14-16px
- **Small text**: Geist Sans, Regular, 12px
- **Timestamps**: Geist Sans, Regular, 11px, gray

## Animations

1. **Typing Indicator**: 3 dots bouncing (staggered)
2. **Message Appear**: Smooth fade-in from bottom
3. **Sidebar Toggle**: 200ms slide transition
4. **Hover Effects**: Subtle background color change

## Empty States

### No Chats
```
        💬
    No chats yet
  Start a new conversation
```

### No Messages in Chat
```
        ✨
       Porta
  Your intelligent assistant...
  
  [4 suggested prompts]
```

---

**Access the live interface at: http://localhost:3000**

The interface automatically loads in your default browser!



