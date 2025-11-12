# Automation Platform API Documentation

## Overview

This is the complete API documentation for the Automation Platform. The platform provides a comprehensive REST API for managing automations, users, schedules, and more.

**Base URL:** `http://localhost:3000`

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Automations](#automations)
3. [Runs](#runs)
4. [Schedules](#schedules)
5. [Users](#users)
6. [Groups](#groups)
7. [Namespaces](#namespaces)
8. [Credentials](#credentials)
9. [Settings](#settings)
10. [Dashboard](#dashboard)
11. [Activity](#activity)
12. [Notifications](#notifications)

---

## Authentication

### Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "admin",
  "password": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "firstName": "Admin",
    "lastName": "User",
    "name": "Administrator",
    "email": "admin",
    "role": "admin",
    "department": null,
    "location": "Headquarters",
    "profilePhoto": null
  },
  "message": "Login successful"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

### Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Log out a user and record the logout activity.

**Request Body (Optional):**
```json
{
  "email": "admin",
  "name": "Administrator",
  "department": "IT",
  "location": "HQ",
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Automations

### Get All Automations

**Endpoint:** `GET /api/automations`

**Description:** Retrieve all automation templates.

**Response (200 OK):**
```json
[
  {
    "id": "automation-uuid",
    "name": "Provision VM",
    "namespace": "infra",
    "description": "Creates and configures a new virtual machine",
    "keywords": ["vm", "aws", "ec2"],
    "tags": ["aws", "vm"],
    "formSchema": [...],
    "templateId": "tmpl-provision-vm",
    "inventoryId": "inv-global-01",
    "customBody": "{\"inventory\":\"inv-global-01\",\"extra_vars\":{...}}",
    "pinned": true,
    "featured": false,
    "runs": 1243,
    "createdBy": "admin@example.com",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### Get Single Automation

**Endpoint:** `GET /api/automations/:id`

**Description:** Retrieve a specific automation by ID.

**Response (200 OK):**
```json
{
  "id": "automation-uuid",
  "name": "Provision VM",
  "namespace": "infra",
  "description": "Creates and configures a new virtual machine",
  "formSchema": [...],
  "customBody": "..."
}
```

---

### Run Automation

**Endpoint:** `POST /api/automations/:id/run`

**Description:** Execute an automation with the provided parameters. The system will:
1. Launch the job in AWX
2. Poll for completion (up to 5 minutes)
3. Retrieve job artifacts AND complete job output/logs upon completion

**Request Body:**
```json
{
  "parameters": {
    "hostname": "test-server",
    "provider": "AWS",
    "cpu": 4,
    "memory": 8192
  },
  "user": {
    "email": "admin",
    "name": "Admin User"
  },
  "reservedTaskId": "TASK25A0000000001i" // Optional
}
```

**Custom Body Processing:**

The automation's `customBody` field supports template variables:
- `{{form.fieldname}}` - Replaced with parameter values
- Supports nested objects and arrays

Example customBody:
```json
{
  "inventory": "inv-global-01",
  "instance_groups": [123],
  "extra_vars": {
    "vm_name": "{{form.hostname}}",
    "provider": "{{form.provider}}",
    "cpu_cores": "{{form.cpu}}",
    "memory_mb": "{{form.memory}}",
    "source": "system"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "runId": "run-uuid",
  "uniqueId": "TASK25B0000000001i",
  "awxJobId": "9378",
  "status": "success",
  "message": "Automation completed successfully",
  "parameters": {...},
  "requestBody": {...},
  "artifacts": {
    "artifacts": {
      // Job artifacts from set_stats module (if configured in playbook)
    },
    "result_traceback": null,
    "job_explanation": "",
    "job_output": {
      // Complete job execution output and logs
      "content": "...",
      "format": "json"
    },
    "fetched_at": "2025-11-12T06:15:30.123Z"
  },
  "curlCommand": "curl -X POST '...' ..."
}
```

**Artifacts Structure:**
- `artifacts`: Job artifacts from Ansible `set_stats` module (requires playbook configuration)
- `result_traceback`: Error traceback if job failed
- `job_explanation`: AWX job explanation/error message
- `job_output`: **NEW** - Complete job execution logs and output
- `fetched_at`: **NEW** - Timestamp when artifacts were retrieved

**UI Features:**
- All execution details are displayed in collapsible sections
- Sections include: Request Body, Execution Result, Job Artifacts, and cURL Command
- Users can expand/collapse each section individually for better organization

---

### Create Automation

**Endpoint:** `POST /api/automations`

**Description:** Create a new automation template.

**Request Body:**
```json
{
  "name": "My Automation",
  "namespace": "infra",
  "description": "Description of automation",
  "keywords": ["keyword1", "keyword2"],
  "tags": ["tag1"],
  "formSchema": [...],
  "templateId": "tmpl-id",
  "inventoryId": "inv-id",
  "customBody": "{\"inventory\":\"inv-id\",\"extra_vars\":{...}}",
  "user": {
    "email": "admin"
  }
}
```

---

### Update Automation

**Endpoint:** `PUT /api/automations/:id`

**Description:** Update an existing automation.

---

### Delete Automation

**Endpoint:** `DELETE /api/automations/:id`

**Description:** Delete an automation.

---

## Runs

### Get All Runs

**Endpoint:** `GET /api/runs`

**Description:** Retrieve all automation execution history.

**Query Parameters:**
- `status` (optional): Filter by status (success, failed, running, pending)

**Response (200 OK):**
```json
[
  {
    "id": "run-uuid",
    "automationId": "automation-uuid",
    "status": "success",
    "uniqueId": "TASK25A0000000001i",
    "parameters": "{...}",
    "result": "{...}",
    "artifacts": "{...}",
    "errorMessage": null,
    "executedBy": "admin",
    "startedAt": "2025-11-11T08:00:00.000Z",
    "completedAt": "2025-11-11T08:05:00.000Z",
    "awxJobId": "12345",
    "automation": {
      "name": "Provision VM",
      "namespace": "infra"
    }
  }
]
```

---

### Reserve Run ID

**Endpoint:** `POST /api/runs/reserve-id`

**Description:** Pre-generate a unique run ID before execution.

**Request Body:**
```json
{
  "user": {
    "name": "Admin User"
  }
}
```

**Response (200 OK):**
```json
{
  "uniqueId": "TASK25A0000000001i"
}
```

---

## Schedules

### Get All Schedules

**Endpoint:** `GET /api/schedules`

**Description:** Retrieve all scheduled automations.

**Response (200 OK):**
```json
[
  {
    "id": "schedule-uuid",
    "name": "Daily Server Health Check",
    "automationId": "automation-uuid",
    "frequency": "Every day at 3:00 AM",
    "cron": "0 3 * * *",
    "parameters": "{...}",
    "status": "active",
    "nextRun": "2025-11-12T03:00:00.000Z",
    "lastRun": "2025-11-11T03:00:00.000Z",
    "automation": {
      "name": "Provision VM"
    }
  }
]
```

---

### Create Schedule

**Endpoint:** `POST /api/schedules`

**Request Body:**
```json
{
  "name": "Daily Backup",
  "automationId": "automation-uuid",
  "frequency": "Every day at 2:00 AM",
  "cron": "0 2 * * *",
  "parameters": {...}
}
```

---

### Update Schedule

**Endpoint:** `PUT /api/schedules/:id`

---

### Delete Schedule

**Endpoint:** `DELETE /api/schedules/:id`

---

## Users

### Get All Users

**Endpoint:** `GET /api/users`

**Description:** Retrieve all users in the system.

**Response (200 OK):**
```json
[
  {
    "id": "user-uuid",
    "firstName": "Admin",
    "lastName": "User",
    "name": "Administrator",
    "email": "admin",
    "role": "admin",
    "enabled": true,
    "locked": false,
    "location": "Headquarters",
    "department": null,
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### Get User by ID

**Endpoint:** `GET /api/users/:id`

---

### Create User

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "samAccountName": "jdoe",
  "role": "user",
  "enabled": true,
  "location": "New York",
  "department": "IT",
  "managerId": "manager-uuid"
}
```

---

### Update User

**Endpoint:** `PUT /api/users/:id`

---

### Delete User

**Endpoint:** `DELETE /api/users/:id`

---

### Reset User Password

**Endpoint:** `POST /api/users/:id/reset-password`

**Request Body:**
```json
{
  "newPassword": "newpassword123"
}
```

---

## Groups

### Get All Groups

**Endpoint:** `GET /api/groups`

**Response (200 OK):**
```json
[
  {
    "id": "group-uuid",
    "name": "Administrators",
    "description": "Full access to all modules",
    "isPredefined": true,
    "createdAt": "2025-11-11T08:00:00.000Z",
    "members": [...],
    "modulePermissions": [...]
  }
]
```

---

### Create Group

**Endpoint:** `POST /api/groups`

---

### Update Group

**Endpoint:** `PUT /api/groups/:id`

---

### Delete Group

**Endpoint:** `DELETE /api/groups/:id`

---

## Namespaces

### Get All Namespaces

**Endpoint:** `GET /api/namespaces`

**Response (200 OK):**
```json
[
  {
    "id": "namespace-uuid",
    "name": "infra",
    "displayName": "Infrastructure",
    "description": "Infrastructure automations",
    "color": "#3b82f6",
    "icon": null,
    "createdBy": "admin@example.com",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### Create Namespace

**Endpoint:** `POST /api/namespaces`

---

### Update Namespace

**Endpoint:** `PUT /api/namespaces/:id`

---

### Delete Namespace

**Endpoint:** `DELETE /api/namespaces/:id`

---

## Credentials

### Get All Credentials

**Endpoint:** `GET /api/credentials`

**Response (200 OK):**
```json
[
  {
    "id": "credential-uuid",
    "name": "AWS Production",
    "description": "AWS production credentials",
    "credentialType": "cloud",
    "username": "aws-user",
    "createdBy": "admin",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### Create Credential

**Endpoint:** `POST /api/credentials`

**Request Body:**
```json
{
  "name": "Production SSH Key",
  "description": "SSH key for production servers",
  "credentialType": "machine",
  "username": "ubuntu",
  "password": "encrypted-password",
  "sshPrivateKey": "encrypted-key",
  "user": {
    "email": "admin"
  }
}
```

---

## Settings

### Get All Settings

**Endpoint:** `GET /api/settings`

**Description:** Retrieve system configuration settings.

**Response (200 OK):**
```json
[
  {
    "id": "setting-uuid",
    "key": "default_api_endpoint",
    "value": "https://awx.example.com/api/v2",
    "description": "Default AWX API endpoint",
    "createdAt": "2025-11-11T08:00:00.000Z"
  },
  {
    "key": "awx_token",
    "value": "token-value",
    "description": "AWX API Token"
  },
  {
    "key": "proxy_enabled",
    "value": "false",
    "description": "Enable proxy for API requests"
  }
]
```

---

### Update Setting

**Endpoint:** `PUT /api/settings`

**Request Body:**
```json
{
  "key": "default_api_endpoint",
  "value": "https://awx.production.com/api/v2"
}
```

---

## Dashboard

### Get Dashboard Data

**Endpoint:** `GET /api/dashboard`

**Description:** Retrieve dashboard overview data.

**Response (200 OK):**
```json
{
  "totalAutomations": 3,
  "totalRuns": 31,
  "successRate": 85.5,
  "recentRuns": [...],
  "topAutomations": [...]
}
```

---

### Get Dashboard Stats

**Endpoint:** `GET /api/dashboard/stats`

**Description:** Retrieve statistics for dashboard visualizations.

**Query Parameters:**
- `range` (optional): daily, weekly, monthly

**Response (200 OK):**
```json
{
  "summary": {
    "total": 31,
    "success": 26,
    "failed": 3,
    "running": 1,
    "pending": 1
  },
  "byStatus": {
    "success": 26,
    "failed": 3,
    "running": 1,
    "pending": 1
  },
  "timeline": [...]
}
```

---

## Activity

### Get Activity Logs

**Endpoint:** `GET /api/activity`

**Description:** Retrieve system activity audit logs.

**Query Parameters:**
- `limit` (optional): Number of records to return
- `entityType` (optional): Filter by entity type

**Response (200 OK):**
```json
[
  {
    "id": "activity-uuid",
    "action": "executed",
    "entityType": "automation",
    "entityId": "automation-uuid",
    "entityName": "Provision VM",
    "description": "Executed automation Provision VM",
    "performedBy": "admin",
    "metadata": "{...}",
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

## Notifications

### Get All Notifications

**Endpoint:** `GET /api/notifications`

**Response (200 OK):**
```json
[
  {
    "id": "notification-uuid",
    "type": "error",
    "title": "Schedule failed",
    "message": "Daily Backup schedule failed to execute",
    "read": false,
    "createdAt": "2025-11-11T08:00:00.000Z"
  }
]
```

---

### Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:id`

---

### Delete Notification

**Endpoint:** `DELETE /api/notifications/:id`

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Security Features

### Authentication
- Password hashing using bcrypt (10 rounds)
- Activity logging for all login/logout events

### Input Validation
- SQL Injection protection via Prisma ORM
- XSS protection via input sanitization
- Password complexity requirements

### Database Security
- Encrypted credential storage
- Indexed queries for performance
- Cascade delete for related records

---

## Custom Body Configuration

The `customBody` field in automations allows for complete flexibility in the AWX API request body. It supports:

1. **Template Variables**: `{{form.fieldname}}`
2. **Nested Objects**: Full JSON structure
3. **Arrays**: Including instance groups, tags, etc.
4. **Dynamic Values**: Replaced at runtime

**Example:**
```json
{
  "inventory": "inv-global-01",
  "instance_groups": [123, 456],
  "extra_vars": {
    "vm_name": "{{form.hostname}}",
    "provider": "{{form.provider}}",
    "cpu_cores": "{{form.cpu}}",
    "memory_mb": "{{form.memory}}",
    "source": "system",
    "users": ["admin", "operator"]
  },
  "limit": "production",
  "job_tags": "deploy,configure"
}
```

---

## Job Polling & Artifacts

When running an automation, the system automatically:

1. **Launches the job** in AWX
2. **Polls for completion** every 5 seconds (max 5 minutes)
3. **Retrieves artifacts** upon completion
4. **Updates run record** with final status and artifacts

Artifacts are stored in the `Run.artifacts` field as JSON.

---

## Performance Considerations

- Database queries are optimized with indexes
- Concurrent requests are handled efficiently
- Connection pooling is enabled
- Typical response times: < 100ms for most endpoints

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing for production use.

---

## Default Credentials

**Username:** admin
**Password:** admin

**⚠️ Change these credentials immediately in production!**

---

## Support

For issues or questions, please contact your system administrator.

---

**Last Updated:** November 11, 2025
