# AWX Docker Setup for Catalog Testing

This guide helps you set up a local AWX instance using Docker for testing the catalog system.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available for Docker
- Ports 8080 available

## Quick Start

### 1. Start AWX Server

```bash
# Start AWX containers
docker-compose -f docker-compose.awx.yml up -d

# Check container status
docker-compose -f docker-compose.awx.yml ps

# View logs
docker-compose -f docker-compose.awx.yml logs -f awx-web
```

### 2. Wait for AWX to Initialize

AWX takes about 5-10 minutes to fully initialize. You can monitor the progress:

```bash
# Watch the logs until you see "spawned uWSGI master process"
docker-compose -f docker-compose.awx.yml logs -f awx-web
```

### 3. Access AWX Web Interface

- **URL**: http://localhost:8080
- **Username**: `admin`
- **Password**: `password`

### 4. Create API Token

1. Log into AWX at http://localhost:8080
2. Click on your username (admin) in the top right
3. Go to **Tokens**
4. Click **Add** to create a new token
5. Set **Application**: Leave blank or create one
6. Set **Scope**: Write
7. Click **Save**
8. **Copy the token** - you'll need this for the `.env` file

### 5. Update Environment Variables

Edit `.env` file and update:

```env
AWX_BASE_URL=http://localhost:8080/api/v2
AWX_TOKEN=your_token_here
```

### 6. Create a Test Job Template in AWX

1. In AWX, go to **Resources** → **Projects**
2. Click **Add** to create a new project:
   - **Name**: Test Catalog Project
   - **Source Control Type**: Manual
   - **Project Base Path**: Leave default
   - Click **Save**

3. Upload the test playbook:
```bash
# Copy playbook to AWX container
docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/test-playbook.yml
```

4. Go to **Resources** → **Templates** → **Add** → **Job Template**
   - **Name**: Test Catalog Job
   - **Job Type**: Run
   - **Inventory**: Demo Inventory (default)
   - **Project**: Test Catalog Project
   - **Playbook**: test-playbook.yml
   - **Variables**: Leave empty (will be passed from catalog)
   - Click **Save**

5. Note the **Template ID** from the URL (e.g., `/templates/job_template/7` → ID is `7`)

### 7. Create Catalog Item in Application

1. Go to your application: http://localhost:3000/catalog
2. Click **Add Catalog Item**
3. Fill in the form:
   - **Name**: Test Server Action
   - **Description**: Test catalog item for AWX integration
   - **Tags**: test, demo
   - **Namespace**: Select or create one
   - **Environment**: Select "Local AWX" or create new:
     - Name: Local AWX
     - Base URL: http://localhost:8080/api/v2
   - **Template ID**: (use the ID from step 6.5)
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
4. Click **Create Catalog**

### 8. Test Execution

1. Click the **Execute** button (Play icon) on your catalog item
2. Fill in the form:
   - Server Name: `test-server-01`
   - Environment: `development`
   - Action: `info`
3. Click **Execute**
4. Watch the real-time console output
5. Verify the job completes successfully

## Troubleshooting

### AWX not starting
```bash
# Check container logs
docker-compose -f docker-compose.awx.yml logs awx-web

# Restart containers
docker-compose -f docker-compose.awx.yml restart

# Complete reset (WARNING: deletes all data)
docker-compose -f docker-compose.awx.yml down -v
docker-compose -f docker-compose.awx.yml up -d
```

### Cannot connect to AWX API
```bash
# Check if AWX is running
curl http://localhost:8080/api/v2/ping/

# Should return: {"ha":false,"version":"23.3.1","active_node":"awx"}
```

### Token authentication fails
- Make sure the token has "Write" scope
- Verify the token is correctly copied to `.env`
- Restart your Next.js dev server after updating `.env`

### Playbook not found
```bash
# List files in AWX projects directory
docker exec awx-web ls -la /var/lib/awx/projects/

# Copy playbook again if needed
docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/
```

## Cleanup

Stop and remove AWX containers:

```bash
# Stop containers
docker-compose -f docker-compose.awx.yml stop

# Remove containers (keeps data)
docker-compose -f docker-compose.awx.yml down

# Remove containers and data (complete cleanup)
docker-compose -f docker-compose.awx.yml down -v
```

## Advanced Testing

### Test Different Scenarios

1. **Success Case**: Execute with valid inputs
2. **Different Environments**: Try staging, production
3. **Different Actions**: Test all action types
4. **Console Output**: Verify real-time output display
5. **Multiple Executions**: Run same job multiple times
6. **Execution History**: Check the execution history table

### Monitor AWX Jobs

- View jobs in AWX: http://localhost:8080/#/jobs
- Click on a job to see detailed output
- Compare AWX output with catalog console output

## Architecture

```
┌─────────────────────────────────────────────┐
│  Next.js Application (Port 3000)            │
│  ├─ Catalog Page                            │
│  ├─ Execute Form                            │
│  └─ Console Output Display                  │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTP API Calls
                 │ (with AWX_TOKEN)
                 ▼
┌─────────────────────────────────────────────┐
│  AWX Server (Port 8080)                     │
│  ├─ API Server (awx-web)                    │
│  ├─ Task Runner (awx-task)                  │
│  ├─ PostgreSQL Database                     │
│  └─ Redis Cache                             │
└─────────────────────────────────────────────┘
                 │
                 │ Executes
                 ▼
┌─────────────────────────────────────────────┐
│  Ansible Playbook                           │
│  └─ test-playbook.yml                       │
│     ├─ Receives form inputs as variables    │
│     ├─ Processes the request                │
│     └─ Returns results                      │
└─────────────────────────────────────────────┘
```

## Next Steps

1. ✅ Set up AWX using Docker
2. ✅ Create API token
3. ✅ Configure environment variables
4. ✅ Create test job template
5. ✅ Create catalog item
6. ✅ Test execution
7. 📝 Create more complex playbooks
8. 📝 Add more form field types
9. 📝 Test error scenarios
10. 📝 Implement artifact download
