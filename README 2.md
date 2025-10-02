# MotoMind AI

🚗 **Intelligent Vehicle Management Platform**

A modern, AI-powered vehicle management system that transforms smartphone technology into comprehensive fleet insights and maintenance tracking.

## ✨ Features

### 🔧 Core Functionality
- **Vehicle Onboarding** - VIN scanning and automatic vehicle data enrichment
- **Photo Management** - Multi-image system with categorization and primary image selection
- **Smart Dashboard** - Beautiful garage view with responsive grid layouts
- **Receipt Processing** - OCR-powered fuel receipt capture and analysis

### 🤖 AI-Powered Insights
- **Intelligent Explanations** - AI-driven vehicle performance analysis
- **Maintenance Predictions** - Proactive maintenance recommendations
- **Fleet Analytics** - Comprehensive vehicle metrics and reporting

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   # Configure your Supabase and OpenAI credentials
   ```

3. **Database setup:**
   ```bash
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open application:**
   Navigate to [http://localhost:3005](http://localhost:3005)

## 📁 Project Structure

```
├── pages/
│   ├── dashboard/          # Main garage dashboard
│   ├── vehicles/           # Vehicle management
│   │   ├── [id]/          # Individual vehicle pages
│   │   └── onboard.tsx    # Vehicle onboarding flow
│   ├── capture/           # Photo/receipt capture
│   └── api/               # API routes
│       ├── core/          # Core business logic APIs
│       ├── integrations/  # External service integrations
│       └── utilities/     # Utility and helper APIs
├── components/
│   ├── vehicle/           # Vehicle-related components
│   ├── capture/           # Photo/receipt capture components
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── backend/              # Backend utilities and services
├── migrations/           # Database migrations
└── docs/                # Documentation
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4
- **Image Processing:** Supabase Storage
- **OCR:** Vision API integration

## 🎯 Key Pages

- **`/dashboard`** - Main garage dashboard with vehicle grid
- **`/vehicles/onboard`** - Vehicle onboarding flow
- **`/vehicles/[id]`** - Individual vehicle details
- **`/vehicles/[id]/photos`** - Vehicle photo gallery
- **`/capture`** - Receipt and photo capture

## 🔧 Development

### Database Migrations
```bash
npm run db:migrate
```

### Type Checking
```bash
npm run type-check
```

### Testing
```bash
npm test
```

## 📝 License

Private - MotoMind AI Platform
