# MotoMind AI

🚗 **Intelligent Vehicle Management Platform**

A modern, AI-powered vehicle management system that transforms smartphone technology into comprehensive fleet insights and maintenance tracking.

---

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

### 🏢 Enterprise Ready
- ✅ Multi-tenant architecture (solo users + fleets)
- ✅ Row-level security with tenant isolation
- ✅ Circuit breakers for API resilience
- ✅ Audit trails for DOT compliance
- ✅ Usage tracking for billing
- ✅ Comprehensive monitoring

---

## 📁 Project Structure

Our codebase follows an **elite-level organization** matching industry leaders (Vercel, Stripe, Shopify):

```
motomind-ai/
│
├── 🎯 CORE APPLICATION
│   ├── app/              # Next.js App Router (routes & API)
│   ├── components/       # Shared UI components (design system)
│   ├── features/         # Feature modules ⭐ PRIMARY CODEBASE
│   ├── lib/              # Shared utilities & infrastructure
│   ├── hooks/            # Shared React hooks
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global styles & design tokens
│
├── ⚙️  INFRASTRUCTURE
│   ├── database/         # Database migrations & Supabase config
│   ├── public/           # Static assets (images, icons, manifest)
│   └── mcp-server/       # Model Context Protocol server
│
├── 🛠️  DEVELOPMENT
│   ├── docs/             # Comprehensive documentation
│   ├── scripts/          # Development & deployment scripts
│   ├── templates/        # Code generation templates
│   └── tests/            # Unit, integration & E2E tests
│
└── 📦 LEGACY
    ├── archive/          # Archived code (safe historical reference)
    └── pages/            # Pages Router (being migrated to App Router)
```

**Key Principles:**
- **Feature-First:** Business logic organized by feature, not file type
- **Clear Boundaries:** Every folder has a single, clear purpose
- **Zero Duplicates:** Single source of truth for everything
- **Documented:** Comprehensive guides in `docs/architecture/`

> 📖 **New to the codebase?** See [FOLDER_STRUCTURE.md](docs/architecture/FOLDER_STRUCTURE.md) for complete guidance on where everything goes.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/motomind-ai.git
cd motomind-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your environment variables
# Edit .env.local with your Supabase & OpenAI credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🏗️ Tech Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Design System
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js

### AI & ML
- **LLM:** OpenAI GPT-4 (with structured outputs)
- **Vision:** Custom OCR pipeline for receipts & dashboards
- **Training:** Active learning system with human validation

### Development
- **Code Quality:** ESLint, Prettier, TypeScript strict mode
- **Testing:** Jest, Playwright, Testing Library
- **Deployment:** Vercel
- **Monitoring:** Custom analytics + error tracking

---

## 📚 Documentation

Our documentation is **world-class** and organized for maximum clarity:

| Category | Description | Link |
|----------|-------------|------|
| 🏗️ **Architecture** | System design, patterns, decisions | [docs/architecture/](docs/architecture/) |
| 🚀 **Deployment** | Production deployment guides | [docs/deployment/](docs/deployment/) |
| 💻 **Development** | Setup, workflows, tooling | [docs/development/](docs/development/) |
| 🎨 **Features** | Feature-specific documentation | [docs/features/](docs/features/) |
| 📊 **Project Management** | Roadmaps, planning, milestones | [docs/project-management/](docs/project-management/) |
| 🔍 **Audits** | Security, performance, quality reports | [docs/audits/](docs/audits/) |

### Quick Links
- [Folder Structure Guide](docs/architecture/FOLDER_STRUCTURE.md) - Where does code go?
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Refactoring Sessions](docs/refactoring/sessions/) - Our improvement journey

---

## 🛠️ Development Tools

We've built a **god-tier development system** with 102+ automated tools:

```bash
# Context generation (run before any feature work)
npm run windsurf:guide "build [feature name]"

# Code quality & validation
npm run ai-platform:enforce    # Pattern enforcement
npm run ai-platform:quality    # Quality metrics
npm run ai-platform:guardian   # Dependency checks

# Quick wrapper for common tasks
./scripts/cascade-tools.sh context "task"
./scripts/cascade-tools.sh validate
./scripts/cascade-tools.sh quality
```

> 🔧 **All tools auto-run on commit** via git hooks for zero-friction quality.

---

## 🤝 Contributing

We welcome contributions! Our codebase follows **elite-level standards**:

1. **Read the guides:** Start with [CONTRIBUTING.md](CONTRIBUTING.md)
2. **Understand structure:** Review [FOLDER_STRUCTURE.md](docs/architecture/FOLDER_STRUCTURE.md)
3. **Follow patterns:** Our tools enforce best practices automatically
4. **Write tests:** We maintain high test coverage
5. **Document changes:** Update relevant docs in your PR

### Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Generate context for your work
npm run windsurf:guide "build your feature"

# 3. Make your changes (tools validate on commit)

# 4. Run quality checks
npm run quality

# 5. Create PR with comprehensive description
```

---

## 📊 Project Status

**Current Phase:** Strategic Refactoring Complete ✅

Recent achievements:
- ✅ 62 duplicate files eliminated (15,480 lines cleaned)
- ✅ Elite-level folder organization (20 organized folders)
- ✅ Comprehensive documentation (893 docs organized)
- ✅ Zero technical debt from duplicates
- ✅ World-class structure matching top companies

**Next Phase:** Complexity hotspot refactoring
- Navigation.tsx (~2,500 lines)
- Heroes.tsx (~1,800 lines)
- DataDisplay.tsx (~1,200 lines)

---

## 📈 Quality Metrics

```
Overall Quality:    54/100
Complexity:         0/100  (improvement in progress)
Maintainability:    92/100 ✅
Testability:        57/100
Size:               77/100 ✅

Status: Actively improving through strategic refactoring
```

---

## 📝 License

[Add your license information here]

---

## 🙏 Acknowledgments

Built with modern best practices and inspired by elite engineering teams at Vercel, Stripe, and Shopify.

---

**"Fleet intelligence you can explain, audit, and trust"** 🚗✨
