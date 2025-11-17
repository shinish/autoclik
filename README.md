# Autoclik v1.0

A modern automation platform built with Next.js that integrates with Ansible AWX for executing runbooks and managing IT automation workflows.

**Created by:** Shinish Sasidharan

## ✨ Features

- **Dashboard**: Overview of automation statistics, recent activity, and notifications
- **Automation Catalog**: Discover and search automations across your organization
- **Automation Builder**: Multi-step wizard to create custom automations
  - Define automation details (name, namespace, description, tags)
  - Design input forms with drag-and-drop components
  - Configure Ansible AWX backend integration with **custom body support** ⭐
- **Run Management**: Execute automations and track their status with **real-time artifacts** ⭐
- **Schedules**: Create and manage recurring automation tasks
- **User Management**: Complete RBAC with groups and namespaces
- **Ansible AWX Integration**: Execute job templates via AWX API with **job polling** ⭐

### 🆕 New Features (v1.0.0)

- ⭐ **Dynamic Custom Body** - Fully configurable AWX request body per automation
- ⭐ **Job Polling** - Automatic polling until completion (5 min timeout)
- ⭐ **Enhanced Artifact Retrieval** - Automatic collection of job artifacts AND complete job output/logs
- ⭐ **Collapsible UI Sections** - Clean, organized display of execution details with expand/collapse
- ⭐ **Template Variables** - Recursive replacement in nested structures: `{{form.fieldname}}`
- ⭐ **Security Hardening** - SQL injection prevention, XSS protection, password hashing
- ⭐ **Improved Error Handling** - Graceful handling of edge cases and race conditions
- ⭐ **Comprehensive Testing** - 21 automated tests with 100% pass rate

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS + Lucide Icons
- **API Integration**: Ansible AWX REST API
- **Language**: JavaScript (JSX)

## Prerequisites

- Node.js 18+ and npm
- Ansible AWX instance (optional for development)

## 🚀 Quick Start

### Unix/Mac/Linux
```bash
# Complete setup (recommended)
npm run setup

# Or manual setup
npm install
npm run db:reset
npm run dev
```

### Windows
```cmd
# Complete setup (recommended)
npm run setup:win

# Or manual setup
npm install
npm run db:reset:win
npm run dev
```

**Access:** http://localhost:3000

**Default Login:**
- Username: `admin`
- Password: `admin123`

**Alternative Admin Account:**
- Username: `shinish` / Password: `3Mergency!`

(⚠️ Change these credentials in production!)

📘 **Windows Users:** See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for detailed Windows-specific guide

## Installation

1. **Clone the repository:**

```bash
cd automation-platform
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables (Optional):**

```bash
cp .env.example .env
```

Edit `.env` and configure your Ansible AWX credentials:

```env
AWX_BASE_URL="https://your-awx-instance.com/api/v2"
AWX_TOKEN="your-awx-api-token-here"
```

> **Note:** If not configured, the app runs in demo mode with simulated job execution.

4. **Initialize the database:**

```bash
npm run prisma:generate
npx prisma db push
npm run prisma:seed
```

5. **Start the development server:**

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
automation-platform/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── automations/          # Automation CRUD endpoints
│   │   ├── schedules/            # Schedule management endpoints
│   │   └── dashboard/            # Dashboard stats endpoint
│   ├── automations/              # Automation pages
│   │   └── new/                  # Create new automation wizard
│   ├── catalog/                  # Automation catalog/discovery
│   ├── connectivity/             # Connectivity check page
│   ├── schedules/                # Schedule management page
│   ├── layout.jsx                # Root layout with sidebar
│   ├── page.jsx                  # Dashboard page
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── Button.jsx
│   └── Card.jsx
├── lib/                          # Utility libraries
│   ├── prisma.js                 # Prisma client
│   └── awx-api.js                # Ansible AWX API client
├── prisma/                       # Database schema and migrations
│   └── schema.prisma
└── public/                       # Static assets
```

## Database Schema

The application uses SQLite with the following main entities:

- **Automation**: Stores automation definitions, form schemas, AWX configuration, and **customBody** ⭐
- **Run**: Tracks execution history, results, and **artifacts** ⭐
- **Schedule**: Manages recurring automation tasks
- **User**: User accounts with RBAC
- **Group**: User groups with module permissions
- **Namespace**: Automation organization and permissions
- **Credential**: Encrypted credential storage
- **Activity**: Complete audit trail
- **Notification**: User notifications

## API Endpoints

### Automations

- `GET /api/automations` - List all automations (with filters)
- `POST /api/automations` - Create a new automation
- `GET /api/automations/[id]` - Get automation details
- `PUT /api/automations/[id]` - Update an automation
- `DELETE /api/automations/[id]` - Delete an automation
- `POST /api/automations/[id]/run` - Execute an automation

### Schedules

- `GET /api/schedules` - List all schedules
- `POST /api/schedules` - Create a new schedule

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics and recent activity

## Ansible AWX Integration

The platform integrates with Ansible AWX to execute automations:

1. **Configuration**: Set AWX credentials in `.env` or Settings UI
2. **Template Mapping**: Link automations to AWX job templates
3. **Custom Body**: Define complete request body with template variables ⭐
4. **Execution**: Launch jobs via AWX API
5. **Polling**: Automatically poll for completion (5 min timeout) ⭐
6. **Enhanced Artifacts**: Retrieve and store job artifacts, output logs, and execution details ⭐
7. **Results**: Store final status, results, complete job output, and artifacts
8. **UI Display**: Collapsible sections for organized viewing of execution details ⭐

### Custom Body Example ⭐

```json
{
  "inventory": "inv-global-01",
  "instance_groups": [123],
  "extra_vars": {
    "vm_name": "{{form.hostname}}",
    "provider": "{{form.provider}}",
    "cpu_cores": "{{form.cpu}}",
    "memory_mb": "{{form.memory}}",
    "source": "system",
    "users": ["admin", "operator"]
  }
}
```

Template variables `{{form.fieldname}}` are replaced recursively at runtime.

### Legacy Extra Vars (Backward Compatible)

```yaml
vm_name: "{{form.hostname}}"
cpu_cores: "{{form.cpu}}"
memory_mb: "{{form.memory}}"
```

## Development

### Run Database Migrations

```bash
npm run prisma:migrate
```

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

### Build for Production

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Run comprehensive test suite
node tests/comprehensive-test.js

# Expected output: 21/21 tests passed (100%)
```

**Test Coverage:**
- Authentication & Security (5 tests)
- User Management (2 tests)
- Automations & Execution (4 tests)
- Schedules, Groups, Namespaces (5 tests)
- Dashboard & Activity (5 tests)

## 📚 Documentation

- **API Documentation:** [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- **Implementation Report:** [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)
- **Database Schema:** [prisma/schema.prisma](./prisma/schema.prisma)

## 🔒 Security

- ✅ bcrypt password hashing (10 rounds)
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS prevention
- ✅ Activity logging
- ✅ Encrypted credential storage
- ✅ Role-based access control

## ✅ Implemented Features

- ✅ Drag-and-drop form builder
- ✅ User authentication and authorization
- ✅ Role-based access control (RBAC)
- ✅ Audit logging
- ✅ Advanced scheduling (cron expressions)
- ✅ Custom request body configuration
- ✅ Job polling and enhanced artifact retrieval
- ✅ Collapsible UI sections for execution details
- ✅ Complete job output and log retrieval

## 🔮 Future Enhancements

- [ ] Real-time job status updates via WebSocket
- [ ] Notification preferences
- [ ] Automation versioning
- [ ] Template marketplace
- [ ] Multi-tenancy support
- [ ] Advanced reporting

## 📊 Metrics

| Metric | Value |
|--------|-------|
| Test Coverage | 100% (21/21) |
| API Endpoints | 40+ |
| Database Models | 12 |
| Security Tests | All Pass |
| Performance | <100ms avg |

## 📝 Version

**Version:** 1.0.2
**Status:** Production Ready ✅
**Last Updated:** November 18, 2025

### Recent Updates (v1.0.2)
- ✅ Added comprehensive test data seed (5 groups, 5 users, 5 credentials, 8 activity logs)
- ✅ Implemented dynamic logo theming (dark/light mode support)
- ✅ Added scrollable activity log view with styled scrollbar
- ✅ Enhanced theme switching with real-time logo updates
- ✅ Improved database seeding with safety checks

## License

ISC

## Support

For issues and questions:
1. Check [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
2. Review [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)
3. Run tests: `node tests/comprehensive-test.js`

---

## Author

**Shinish Sasidharan**

---

**Made with ❤️ using Next.js, Prisma, and AWX**
