# AWX Quick Start - Get Job Template ID

Follow these steps to start AWX, create a job template, and get the template ID for your catalog.

## Step 1: Start Docker Desktop

1. Open **Docker Desktop** application on your Mac
2. Wait for Docker to fully start (whale icon in menu bar should be steady)

## Step 2: Start AWX Containers

```bash
# Run the automated setup script
chmod +x scripts/setup-awx.sh
./scripts/setup-awx.sh setup
```

This will:
- Start PostgreSQL, Redis, and AWX containers
- Wait for AWX to initialize (takes 5-10 minutes)
- Copy the test playbook to AWX
- Show you the next steps

**Alternative manual start:**
```bash
docker-compose -f docker-compose.awx.yml up -d
```

## Step 3: Access AWX Web Interface

Once AWX is ready, access it at:
- **URL**: http://localhost:8080
- **Username**: `admin`
- **Password**: `password`

## Step 4: Create API Token

1. Click on **"admin"** in the top-right corner
2. Go to **"Tokens"**
3. Click **"Add"** button
4. Set **Scope** to **"Write"**
5. Click **"Save"**
6. **IMPORTANT**: Copy the token immediately (shown only once!)

Example token: `vOlNLjf2PVxeEnPmBDpBAsUymWo68Z`

## Step 5: Update Environment Variable

Edit your `.env` file:

```bash
AWX_TOKEN=<paste_your_token_here>
```

Then restart your dev server:
```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

## Step 6: Create Project in AWX

1. In AWX, go to **Resources** → **Projects**
2. Click **"Add"** button
3. Fill in the form:
   - **Name**: `Catalog Test Project`
   - **Organization**: Default
   - **Source Control Type**: `Manual`
   - **Project Base Path**: `/var/lib/awx/projects` (default)
4. Click **"Save"**

## Step 7: Upload Playbook to AWX

The setup script already copied the playbook. To verify or re-upload:

```bash
docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/
```

Verify the file is there:
```bash
docker exec awx-web ls -la /var/lib/awx/projects/
```

## Step 8: Create Job Template

1. In AWX, go to **Resources** → **Templates**
2. Click **"Add"** → **"Job Template"**
3. Fill in the form:
   - **Name**: `Catalog Test Job`
   - **Job Type**: `Run`
   - **Inventory**: Select `Demo Inventory` (default inventory)
   - **Project**: Select `Catalog Test Project`
   - **Playbook**: Select `test-playbook.yml` from dropdown
   - **Credentials**: Leave empty (localhost doesn't need credentials)
   - **Variables**: Leave empty (will be passed from catalog)
   - **Options**:
     - Check ✓ **"Enable Privilege Escalation"** (optional)
     - Check ✓ **"Enable Concurrent Jobs"** (optional)
4. Click **"Save"**

## Step 9: Get the Job Template ID

After saving, look at the browser URL. It will look like:

```
http://localhost:8080/#/templates/job_template/7/details
                                              ↑
                                        This is your ID
```

The number after `job_template/` is your **Template ID**.

Example: If URL is `.../job_template/7/details`, your Template ID is **7**

## Step 10: Test the Job Template (Optional)

Before using it in the catalog:

1. Click the **"Launch"** button (rocket icon) on the template
2. In the survey/variables prompt, you can add test values:
   ```json
   {
     "server_name": "test-server",
     "environment": "development",
     "action": "info"
   }
   ```
3. Click **"Next"** → **"Launch"**
4. Watch the job run and verify it completes successfully

## Step 11: Create Catalog Item in Application

Now create your catalog item with the Template ID:

1. Go to http://localhost:3000/catalog
2. Click **"Add Catalog Item"**
3. Fill in the form:
   - **Name**: `Test Server Action`
   - **Description**: `Test catalog for AWX integration`
   - **Tags**: `test`, `demo`
   - **Namespace**: Select your namespace
   - **Environment**: Select your AWX environment
   - **Template ID**: **Enter the ID from Step 9** (e.g., `7`)
   - **Custom Request Body**:
     ```json
     {
       "extra_vars": {
         "server_name": "{{form.server_name}}",
         "environment": "{{form.environment}}",
         "action": "{{form.action}}"
       }
     }
     ```
   - **Form Schema**:
     ```json
     [
       {
         "name": "server_name",
         "type": "text",
         "label": "Server Name",
         "required": true,
         "placeholder": "e.g., web-server-01"
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
           {"value": "restart", "label": "Restart Service"},
           {"value": "status", "label": "Check Status"}
         ]
       }
     ]
     ```
4. Click **"Create Catalog"**

## Step 12: Execute Your Catalog

1. Click the **"Execute"** button (Play icon) on your catalog item
2. Fill in the form fields
3. **Optional**: Click "Show Editor" to view/modify the request body
4. Click **"Execute"**
5. Watch the real-time console output!

## Quick Reference

### AWX URLs
- Web Interface: http://localhost:8080
- API: http://localhost:8080/api/v2
- Jobs: http://localhost:8080/#/jobs

### Common Commands
```bash
# Start AWX
./scripts/setup-awx.sh start

# Stop AWX
./scripts/setup-awx.sh stop

# View logs
./scripts/setup-awx.sh logs

# Check status
./scripts/setup-awx.sh status

# Clean up (removes all data)
./scripts/setup-awx.sh cleanup
```

### Troubleshooting

**AWX not responding:**
```bash
# Check container status
docker-compose -f docker-compose.awx.yml ps

# Restart containers
docker-compose -f docker-compose.awx.yml restart
```

**Playbook not found:**
```bash
# Re-copy playbook
docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/

# List files in AWX
docker exec awx-web ls -la /var/lib/awx/projects/
```

**Token authentication fails:**
- Make sure you copied the full token
- Verify it's set in `.env` file
- Restart your Next.js dev server after updating `.env`

## Your Template ID

Once you complete steps 1-9, write your Template ID here:

```
Template ID: _______
```

Use this ID when creating catalog items in your application!
