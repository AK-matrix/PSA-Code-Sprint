# PSA Alert Processing System - Frontend

A professional Next.js dashboard for the PSA (Port System Alert) Multi-Agent RAG Processing System.

## Features

- **Alert Processor**: Submit and process PSA alerts with AI-powered analysis
- **Workflow Visualization**: Interactive explanation of the multi-agent architecture
- **Processing History**: View and manage previously processed alerts
- **Settings Management**: Configure API endpoints, notifications, and preferences
- **Real-time Processing**: Live progress indicators for alert processing
- **Email Integration**: Send escalation emails directly from the dashboard

## Technology Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **Lucide React**: Beautiful icon library
- **Sonner**: Toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend Flask API running (see parent directory)

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000) (or the next available port).

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── alert-processor.tsx # Alert processing interface
│   ├── workflow-explanation.tsx # Workflow documentation
│   ├── settings.tsx        # Settings management
│   └── history.tsx         # Processing history
├── lib/
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Features Overview

### Alert Processor

- Submit alert text for AI processing
- Real-time processing progress
- Comprehensive result display:
  - Triage results (module, severity, urgency)
  - Detected entities
  - Technical analysis
  - Resolution recommendations
  - Escalation contacts
  - Email preview

### Workflow Explanation

- Step-by-step breakdown of the multi-agent system
- Supported modules documentation
- Technology stack overview

### History

- View all processed alerts
- Detailed view for each alert
- Delete individual items or clear all history
- Local storage persistence

### Settings

- Configure backend API URL
- Test connection to backend
- Manage notification preferences
- Email configuration status
- Data management options
- System information display

## Environment Variables

The `.env.local` file is configured with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Update this if your backend runs on a different port.

## Backend Integration

The frontend connects to the Flask backend API with the following endpoints:

- `POST /process_alert`: Process an alert through the multi-agent system
- `POST /send_email`: Send escalation email

Ensure the backend is running before using the application.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Test all features before committing
4. Keep components modular and reusable
