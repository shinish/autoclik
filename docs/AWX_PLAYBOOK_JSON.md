# AWX Playbook Execution JSON

This document shows the JSON structure for executing playbooks in AWX/Ansible Tower from the Automation Platform.

## Complete Request Structure

When the Automation Platform executes an automation, it sends a POST request to the AWX API with the following structure:

### POST `/api/v2/job_templates/{templateId}/launch/`

```json
{
  "instance_groups": ["production"],
  "extra_vars": {
    "server_name": "server01.example.com",
    "emailid": "user@example.com",
    "ritm": "RITM0123456"
  }
}
```

## Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `instance_groups` | array | List of instance group names for job execution | No |
| `extra_vars` | object | Variables passed to the playbook | No |

## Extra Vars Examples

### Example 1: Basic Server Configuration

```json
{
  "instance_groups": ["production"],
  "extra_vars": {
    "server_name": "webapp01.company.com",
    "emailid": "admin@company.com",
    "ritm": "RITM0123456"
  }
}
```

### Example 2: Multiple Servers

```json
{
  "instance_groups": ["production"],
  "extra_vars": {
    "server_name": "webapp01.company.com,webapp02.company.com",
    "emailid": "devops@company.com",
    "ritm": "RITM0123457"
  }
}
```

### Example 3: Development Environment

```json
{
  "instance_groups": ["development"],
  "extra_vars": {
    "server_name": "devserver01.company.com",
    "emailid": "developer@company.com",
    "ritm": "RITM0123458"
  }
}
```

### Example 4: With Additional Variables

```json
{
  "instance_groups": ["production"],
  "extra_vars": {
    "server_name": "database01.company.com",
    "emailid": "dba@company.com",
    "ritm": "RITM0123459",
    "backup_enabled": true,
    "retention_days": 7,
    "notification_enabled": true
  }
}
```

## How the Automation Platform Constructs This JSON

The platform builds this JSON from the automation configuration stored in the database:

```javascript
// Example from automation execution
const requestBody = {
  instance_groups: automation.instanceGroupId ? [instanceGroupName] : [],
  extra_vars: {
    // Values from user-submitted form
    server_name: formData.server_name,
    emailid: formData.emailid,
    ritm: formData.ritm,
    // Additional vars from automation.extraVars if specified
    ...JSON.parse(automation.extraVars || '{}')
  }
};

// POST to AWX
const response = await fetch(`${awxUrl}/api/v2/job_templates/${automation.templateId}/launch/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${awxToken}`
  },
  body: JSON.stringify(requestBody)
});
```

## AWX API Response

When the job is successfully launched, AWX returns:

```json
{
  "id": 12345,
  "type": "job",
  "url": "/api/v2/jobs/12345/",
  "status": "pending",
  "job_template": 101,
  "inventory": 5,
  "project": 10,
  "playbook": "site.yml",
  "scm_branch": "main",
  "extra_vars": "{\"server_name\":\"server01.example.com\",\"emailid\":\"user@example.com\",\"ritm\":\"RITM0123456\"}",
  "created": "2025-11-17T18:30:00.123Z",
  "started": null,
  "finished": null,
  "elapsed": 0.0,
  "job_args": "",
  "job_cwd": "",
  "job_env": {},
  "result_traceback": "",
  "launch_type": "manual",
  "canceled_on": null,
  "execution_node": "",
  "controller_node": "",
  "instance_group": "production"
}
```

## Monitoring Job Status

After launching, poll the job status endpoint:

### GET `/api/v2/jobs/{job_id}/`

```json
{
  "id": 12345,
  "status": "successful",
  "started": "2025-11-17T18:30:05.123Z",
  "finished": "2025-11-17T18:32:15.456Z",
  "elapsed": 130.333,
  "failed": false
}
```

### Possible Status Values
- `pending` - Job is waiting to start
- `waiting` - Job is waiting for resources
- `running` - Job is currently executing
- `successful` - Job completed successfully
- `failed` - Job failed
- `error` - Job encountered an error
- `canceled` - Job was canceled

## Instance Group Selection

Instance groups control where the job executes. The platform allows selecting from configured groups:

```javascript
// From database
{
  instanceGroupId: "uuid-here",
  instanceGroupName: "production"
}

// In AWX request
{
  "instance_groups": ["production"]
}
```

If no instance group is specified, AWX uses its default instance group.

## Full Integration Example

Here's a complete example of how an automation execution flows from form submission to AWX:

### 1. User Submits Form
```json
{
  "server_name": "webapp01.company.com",
  "emailid": "admin@company.com",
  "ritm": "RITM0123456"
}
```

### 2. Platform Loads Automation Config
```javascript
const automation = await prisma.automation.findUnique({
  where: { id: automationId },
  include: { instanceGroup: true }
});
```

### 3. Platform Constructs AWX Request
```json
{
  "instance_groups": ["production"],
  "extra_vars": {
    "server_name": "webapp01.company.com",
    "emailid": "admin@company.com",
    "ritm": "RITM0123456"
  }
}
```

### 4. Platform Sends to AWX
```javascript
POST https://awx.company.com/api/v2/job_templates/101/launch/
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "instance_groups": ["production"],
  "extra_vars": {
    "server_name": "webapp01.company.com",
    "emailid": "admin@company.com",
    "ritm": "RITM0123456"
  }
}
```

### 5. Platform Records Execution
```javascript
const run = await prisma.run.create({
  data: {
    automationId: automation.id,
    status: 'running',
    awxJobId: awxResponse.id,
    executedBy: userEmail,
    startedAt: new Date(),
    extraVars: JSON.stringify(formData)
  }
});
```

## Error Handling

If AWX returns an error:

```json
{
  "detail": "Invalid template configuration",
  "status": 400
}
```

The platform should:
1. Log the error
2. Update run status to 'failed'
3. Create a notification
4. Return error to user

## Security Considerations

1. **Authentication**: Always use API tokens, never hardcode credentials
2. **Validation**: Validate all extra_vars before sending to AWX
3. **Secrets**: Never log or expose sensitive extra_vars
4. **Authorization**: Verify user has permission to execute the automation
5. **Rate Limiting**: Implement rate limiting to prevent API abuse

## Related Documentation

- [Extra Vars Examples](./EXTRA_VARS_EXAMPLES.md)
- [Instance Groups Guide](./INSTANCE_GROUPS.md)
- [AWX API Documentation](https://docs.ansible.com/ansible-tower/latest/html/towerapi/)
