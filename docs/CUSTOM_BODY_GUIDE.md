# Custom Body Configuration Guide

## Overview

The Custom Body feature allows you to define the **exact AWX API request body** for each automation, with dynamic template variables that are replaced with user input from the UI form.

## ✅ Your Test Case - Working!

### PowerShell Test Body (test.txt)
```json
{
    "instance_groups": [298],
    "extra_vars": {
        "source_system": ["VRT-PDC"],
        "destn_ip": "10.118.234.75",
        "ports_input": "9419"
    }
}
```

### ✨ Now Available in UI!

**Automation:** "Port Connectivity Check"
- **Location:** http://localhost:3000/catalog
- **Form Fields:** Source System, Destination IP, Ports
- **Result:** Exact same request body sent to AWX

---

## How It Works

### 1. Define Form Schema

The form schema defines what fields users see in the UI:

```json
[
  {
    "type": "text",
    "label": "Source System",
    "key": "source_system",
    "required": true,
    "placeholder": "VRT-PDC"
  },
  {
    "type": "text",
    "label": "Destination IP",
    "key": "destn_ip",
    "required": true,
    "placeholder": "10.118.234.75"
  },
  {
    "type": "text",
    "label": "Ports",
    "key": "ports_input",
    "required": true,
    "placeholder": "9419"
  }
]
```

### 2. Define Custom Body Template

The custom body defines the **exact structure** sent to AWX, with template variables:

```json
{
  "instance_groups": [298],
  "extra_vars": {
    "source_system": ["{{form.source_system}}"],
    "destn_ip": "{{form.destn_ip}}",
    "ports_input": "{{form.ports_input}}"
  }
}
```

### 3. User Fills Form

User inputs values in the UI:
- Source System: `VRT-PDC`
- Destination IP: `10.118.234.75`
- Ports: `9419`

### 4. Template Variables Replaced

The system automatically replaces variables:

| Template Variable | User Input | Result |
|-------------------|------------|--------|
| `{{form.source_system}}` | `VRT-PDC` | `"VRT-PDC"` |
| `{{form.destn_ip}}` | `10.118.234.75` | `"10.118.234.75"` |
| `{{form.ports_input}}` | `9419` | `"9419"` |

### 5. Final Request to AWX

```json
{
  "instance_groups": [298],
  "extra_vars": {
    "source_system": ["VRT-PDC"],
    "destn_ip": "10.118.234.75",
    "ports_input": "9419"
  }
}
```

**Result:** ✅ Exact match with your PowerShell test!

---

## Adding New Automations with Custom Body

### Method 1: Using the UI (Coming Soon)

1. Go to Catalog → Create Catalog
2. Fill in basic details
3. Design form (Step 2)
4. In Step 3 (Integration), add Custom Body JSON

### Method 2: Using a Script (Current)

Create a script like this:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.automation.create({
    data: {
      name: 'Your Automation Name',
      namespace: 'infra',
      description: 'Description',
      keywords: JSON.stringify(['keyword1', 'keyword2']),
      tags: JSON.stringify(['tag1']),

      // Form fields
      formSchema: JSON.stringify([
        {
          type: 'text',
          label: 'Field Label',
          key: 'field_key',
          required: true,
          placeholder: 'Example'
        }
      ]),

      templateId: 'your-awx-template-id',

      // Custom body with template variables
      customBody: JSON.stringify({
        instance_groups: [298],
        extra_vars: {
          field_name: '{{form.field_key}}'
        }
      }),

      createdBy: 'admin@example.com',
    },
  });
}

main();
```

### Method 3: Direct Database Insert

```bash
# Use Prisma Studio
npm run prisma:studio

# Navigate to Automation table
# Add new record with customBody field
```

---

## Template Variable Syntax

### Basic Replacement

```json
{
  "field": "{{form.fieldname}}"
}
```

User input: `value123`
Result: `{"field": "value123"}`

### Arrays

```json
{
  "servers": ["{{form.server1}}", "{{form.server2}}"]
}
```

User inputs: `web-01`, `web-02`
Result: `{"servers": ["web-01", "web-02"]}`

### Nested Objects

```json
{
  "config": {
    "cpu": "{{form.cpu}}",
    "memory": "{{form.memory}}",
    "nested": {
      "value": "{{form.nested_value}}"
    }
  }
}
```

All `{{form.*}}` variables replaced recursively!

### Mixed Static & Dynamic

```json
{
  "instance_groups": [298],
  "limit": "production",
  "extra_vars": {
    "hostname": "{{form.hostname}}",
    "environment": "prod",
    "cpu": "{{form.cpu}}"
  }
}
```

Static values (298, "production", "prod") stay as-is.
Dynamic values get replaced from form input.

---

## Real-World Examples

### Example 1: VM Provisioning

**Form Fields:**
```json
[
  {"type": "text", "label": "Hostname", "key": "hostname"},
  {"type": "select", "label": "Provider", "key": "provider", "options": ["AWS", "Azure"]},
  {"type": "number", "label": "CPU Cores", "key": "cpu"},
  {"type": "number", "label": "Memory (GB)", "key": "memory"}
]
```

**Custom Body:**
```json
{
  "instance_groups": [100],
  "inventory": "inv-cloud",
  "extra_vars": {
    "vm_name": "{{form.hostname}}",
    "cloud_provider": "{{form.provider}}",
    "cpu_cores": "{{form.cpu}}",
    "memory_gb": "{{form.memory}}",
    "environment": "production",
    "owner": "IT-Team"
  }
}
```

### Example 2: Database Backup

**Form Fields:**
```json
[
  {"type": "text", "label": "Database Name", "key": "db_name"},
  {"type": "text", "label": "Backup Path", "key": "backup_path"},
  {"type": "checkbox", "label": "Compress", "key": "compress"}
]
```

**Custom Body:**
```json
{
  "instance_groups": [200],
  "inventory": "inv-databases",
  "extra_vars": {
    "database": "{{form.db_name}}",
    "backup_location": "{{form.backup_path}}",
    "compression": "{{form.compress}}",
    "retention_days": 30
  }
}
```

### Example 3: Port Connectivity (Your Use Case)

**Form Fields:**
```json
[
  {"type": "text", "label": "Source System", "key": "source_system"},
  {"type": "text", "label": "Destination IP", "key": "destn_ip"},
  {"type": "text", "label": "Ports", "key": "ports_input"}
]
```

**Custom Body:**
```json
{
  "instance_groups": [298],
  "extra_vars": {
    "source_system": ["{{form.source_system}}"],
    "destn_ip": "{{form.destn_ip}}",
    "ports_input": "{{form.ports_input}}"
  }
}
```

---

## Testing Your Custom Body

### 1. Create Test Script

Use the provided script:
```bash
node scripts/test-connectivity-automation.js
```

### 2. Check Request Body

The script shows:
- Form values entered
- Template variables
- Final request body sent to AWX

### 3. Verify in Database

```bash
npm run prisma:studio
# Check Run table → artifacts field
```

---

## Advanced Features

### Multiple Instance Groups

```json
{
  "instance_groups": [298, 299, 300],
  "extra_vars": {
    "param": "{{form.value}}"
  }
}
```

### Job Tags

```json
{
  "instance_groups": [298],
  "job_tags": "deploy,configure,validate",
  "extra_vars": {
    "app": "{{form.app_name}}"
  }
}
```

### Limit Hosts

```json
{
  "instance_groups": [298],
  "limit": "web_servers",
  "extra_vars": {
    "action": "{{form.action}}"
  }
}
```

### Credentials

```json
{
  "instance_groups": [298],
  "credentials": [123, 456],
  "extra_vars": {
    "target": "{{form.target}}"
  }
}
```

---

## Troubleshooting

### Issue: Template variables not replaced

**Cause:** Incorrect variable name
**Solution:** Ensure `{{form.key}}` matches the field `key` in formSchema

Example:
```json
// Form Schema
{"key": "hostname"}  // ← This key

// Custom Body
"name": "{{form.hostname}}"  // ← Must match
```

### Issue: Request fails in AWX

**Cause:** Invalid JSON structure
**Solution:** Validate JSON before saving

```bash
# Test JSON validity
echo '{"instance_groups": [298]}' | jq .
```

### Issue: Arrays not working

**Cause:** Template variable in array not properly quoted
**Solution:**

```json
// ❌ Wrong
{"servers": [{{form.server}}]}

// ✅ Correct
{"servers": ["{{form.server}}"]}
```

---

## Best Practices

### 1. Always Use Placeholders

```json
{
  "type": "text",
  "placeholder": "example-value"  // Shows user what to enter
}
```

### 2. Add Help Text

```json
{
  "type": "text",
  "helpText": "Enter the server hostname (e.g., web-01)"
}
```

### 3. Use Validation

```json
{
  "type": "text",
  "required": true,  // Field is mandatory
  "pattern": "^[0-9.]+$"  // Regex validation (for IP addresses)
}
```

### 4. Test Before Production

Always test with demo mode first:
1. Create automation
2. Run test script
3. Verify request body
4. Configure real AWX
5. Test end-to-end

### 5. Document Your Automations

Add clear descriptions:
```json
{
  "description": "Tests port connectivity from source to destination. Requires source system name, target IP, and port numbers."
}
```

---

## Quick Reference

### Supported Form Field Types

- `text` - Single-line text input
- `textarea` - Multi-line text
- `number` - Numeric input
- `select` - Dropdown menu
- `checkbox` - True/false toggle
- `date` - Date picker
- `file` - File upload

### Template Variable Format

```
{{form.fieldkey}}
```

Where `fieldkey` matches the `key` in formSchema.

### Custom Body Structure

Any valid JSON, including:
- Objects: `{}`
- Arrays: `[]`
- Strings: `"value"`
- Numbers: `123`
- Booleans: `true`/`false`
- Nested: unlimited depth

---

## Next Steps

### 1. View Your Automation

```bash
# Open browser
open http://localhost:3000/catalog

# Find "Port Connectivity Check"
# Click to run it
```

### 2. Add More Automations

```bash
# Create new script
cp scripts/add-connectivity-automation.js scripts/add-my-automation.js

# Edit and customize
# Run: node scripts/add-my-automation.js
```

### 3. Configure Real AWX

```bash
# Update settings
# Go to: http://localhost:3000/settings

# Update:
# - AWX Base URL
# - AWX Token
# - Template IDs
```

---

## Examples Repository

All example scripts are in `/scripts/`:

```
scripts/
├── add-connectivity-automation.js    # Your use case
├── test-connectivity-automation.js   # Test script
└── (add more here)
```

---

## Support

**Documentation:**
- API Docs: `/docs/API_DOCUMENTATION.md`
- Implementation Report: `/IMPLEMENTATION_REPORT.md`

**Testing:**
```bash
node tests/comprehensive-test.js
```

**Questions:**
Check the code in `/app/api/automations/[id]/run/route.js:14-31` for the template replacement logic.

---

**Version:** 1.0.0
**Last Updated:** November 11, 2025

✨ **Your PowerShell test now works from the UI!**
