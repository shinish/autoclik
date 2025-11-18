# Playbook Setup Summary

## Available Playbooks

### 1. Basic Test Playbook
**File**: `awx-playbooks/test-playbook.yml`

**Variables:**
- `server_name` - Name of the server
- `environment` - Environment (development/staging/production)
- `action` - Action to perform (info/restart/status)

**Features:**
- Simple parameter display
- 5-second processing simulation
- Creates artifact file in `/tmp`
- Returns execution statistics

**Use Case:** Quick testing and simple demonstrations

---

### 2. Advanced Test Playbook
**File**: `awx-playbooks/advanced-catalog-test.yml`

**Variables:**
- `server_name` - Name of the server
- `environment` - Environment (development/staging/production)
- `action` - Action to perform (info/restart/status/deploy/backup)
- `cpu_cores` - Number of CPU cores (default: 4)
- `memory_gb` - Memory in GB (default: 8)

**Features:**
- Beautiful execution banners
- Parameter validation
- Different actions with specific messages
- Detailed execution report
- Professional formatting
- Extended statistics

**Use Case:** Production-ready demonstrations with detailed output

---

## How to Get Your Template ID

### Method 1: Using AWX Web Interface (Easiest)

1. **Start Docker Desktop**
   ```bash
   # Open Docker Desktop app and wait for it to start
   ```

2. **Start AWX**
   ```bash
   ./scripts/setup-awx.sh setup
   # Wait 5-10 minutes for AWX to initialize
   ```

3. **Access AWX**
   - URL: http://localhost:8080
   - Username: `admin`
   - Password: `password`

4. **Create API Token**
   - Click "admin" (top right) → "Tokens" → "Add"
   - Scope: "Write"
   - Save and copy the token

5. **Update .env**
   ```bash
   AWX_TOKEN=<your_token_here>
   ```

6. **Upload Playbook**
   ```bash
   # Basic playbook (already uploaded by setup script)
   docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/

   # Advanced playbook
   docker cp awx-playbooks/advanced-catalog-test.yml awx-web:/var/lib/awx/projects/
   ```

7. **Create Project**
   - Go to: Resources → Projects → Add
   - Name: `Catalog Test Project`
   - Source Control Type: `Manual`
   - Save

8. **Create Job Template**
   - Go to: Resources → Templates → Add → Job Template
   - Name: `Catalog Test Job` (or any name you want)
   - Inventory: `Demo Inventory`
   - Project: `Catalog Test Project`
   - Playbook: `test-playbook.yml` (or `advanced-catalog-test.yml`)
   - Save

9. **Get Template ID from URL**
   After saving, check the browser URL:
   ```
   http://localhost:8080/#/templates/job_template/7/details
                                                  ↑
                                            Template ID
   ```

### Method 2: Using AWX API

```bash
# Get list of all job templates
curl -s http://localhost:8080/api/v2/job_templates/ \
  -H "Authorization: Bearer $AWX_TOKEN" | jq '.results[] | {id, name}'

# Example output:
# {
#   "id": 7,
#   "name": "Catalog Test Job"
# }
```

---

## Catalog Configuration Examples

### Example 1: Basic Server Management

**Template ID:** `7` (use your actual ID)

**Custom Request Body:**
```json
{
  "extra_vars": {
    "server_name": "{{form.server_name}}",
    "environment": "{{form.environment}}",
    "action": "{{form.action}}"
  }
}
```

**Form Schema:**
```json
[
  {
    "name": "server_name",
    "type": "text",
    "label": "Server Name",
    "required": true,
    "placeholder": "e.g., web-server-01",
    "description": "Name of the server to manage"
  },
  {
    "name": "environment",
    "type": "select",
    "label": "Environment",
    "required": true,
    "options": [
      {"value": "development", "label": "Development"},
      {"value": "staging", "label": "Staging"},
      {"value": "production", "label": "Production"}
    ]
  },
  {
    "name": "action",
    "type": "select",
    "label": "Action",
    "required": true,
    "options": [
      {"value": "info", "label": "Get Server Info"},
      {"value": "restart", "label": "Restart Services"},
      {"value": "status", "label": "Check Status"}
    ]
  }
]
```

---

### Example 2: Advanced Server Deployment

**Template ID:** `8` (use your actual ID for advanced playbook)

**Custom Request Body:**
```json
{
  "extra_vars": {
    "server_name": "{{form.server_name}}",
    "environment": "{{form.environment}}",
    "action": "{{form.action}}",
    "cpu_cores": "{{form.cpu_cores}}",
    "memory_gb": "{{form.memory_gb}}"
  }
}
```

**Form Schema:**
```json
[
  {
    "name": "server_name",
    "type": "text",
    "label": "Server Name",
    "required": true,
    "placeholder": "e.g., app-server-prod-01"
  },
  {
    "name": "environment",
    "type": "select",
    "label": "Environment",
    "required": true,
    "options": [
      {"value": "development", "label": "Development"},
      {"value": "staging", "label": "Staging"},
      {"value": "production", "label": "Production"}
    ]
  },
  {
    "name": "action",
    "type": "select",
    "label": "Action",
    "required": true,
    "options": [
      {"value": "info", "label": "Get Info"},
      {"value": "status", "label": "Check Status"},
      {"value": "restart", "label": "Restart"},
      {"value": "deploy", "label": "Deploy Application"},
      {"value": "backup", "label": "Create Backup"}
    ]
  },
  {
    "name": "cpu_cores",
    "type": "number",
    "label": "CPU Cores",
    "required": true,
    "placeholder": "4",
    "description": "Number of CPU cores to allocate"
  },
  {
    "name": "memory_gb",
    "type": "number",
    "label": "Memory (GB)",
    "required": true,
    "placeholder": "8",
    "description": "Amount of memory in GB"
  }
]
```

---

## Quick Commands Reference

### Start AWX
```bash
# Automated setup (recommended)
./scripts/setup-awx.sh setup

# Manual start
docker-compose -f docker-compose.awx.yml up -d
```

### Upload Playbooks
```bash
# Basic playbook
docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/

# Advanced playbook
docker cp awx-playbooks/advanced-catalog-test.yml awx-web:/var/lib/awx/projects/

# Verify upload
docker exec awx-web ls -la /var/lib/awx/projects/
```

### Check AWX Status
```bash
# Container status
docker-compose -f docker-compose.awx.yml ps

# View logs
docker-compose -f docker-compose.awx.yml logs -f awx-web

# API health check
curl http://localhost:8080/api/v2/ping/
```

### Stop AWX
```bash
# Stop containers
./scripts/setup-awx.sh stop

# Or manually
docker-compose -f docker-compose.awx.yml stop
```

---

## Testing Your Catalog

1. **Create catalog item** at http://localhost:3000/catalog
2. **Fill in all fields** including Template ID
3. **Click "Create Catalog"**
4. **Click Execute button** (Play icon)
5. **Fill in form fields**
6. **Optional:** Click "Show Editor" to view/modify request body
7. **Click Execute**
8. **Watch real-time console output!**

---

## Troubleshooting

### Playbook not found in AWX
```bash
# Re-upload the playbook
docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/

# Check if file exists
docker exec awx-web ls -la /var/lib/awx/projects/
```

### Cannot find job template
- Make sure you created the template in AWX
- Check that the playbook file is uploaded
- Verify the project is created and linked to the template

### Execution fails immediately
- Check AWX_TOKEN in .env file
- Verify token has "Write" scope
- Restart Next.js dev server after updating .env

### No console output
- Make sure the job template is configured correctly
- Check AWX job logs at http://localhost:8080/#/jobs
- Verify the playbook syntax is correct

---

## Your Template IDs

Write down your template IDs here for reference:

| Playbook | Template Name | Template ID | Notes |
|----------|--------------|-------------|-------|
| test-playbook.yml | Catalog Test Job | _______ | Basic test |
| advanced-catalog-test.yml | Advanced Catalog Test | _______ | Advanced features |

---

## Next Steps

1. ✅ Start Docker Desktop
2. ✅ Run `./scripts/setup-awx.sh setup`
3. ✅ Create API token
4. ✅ Update .env file
5. ✅ Upload playbooks
6. ✅ Create job templates
7. ✅ Note down Template IDs
8. ✅ Create catalog items
9. ✅ Test execution!

Happy automating! 🚀
