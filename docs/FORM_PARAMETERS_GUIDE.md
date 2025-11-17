# Form Parameters Guide

## How Form Fields Work in the Automation Platform

### Field Structure

When you create a form field in the **Form Designer (Step 2)**, two key properties are used:

1. **`label`** - The human-readable name displayed to users
2. **`key`** - The technical parameter name (auto-generated from label)

### Example

If you create a field with the label **"Server Name"**:

```json
{
  "type": "text",
  "label": "Server Name",
  "key": "server_name",
  "placeholder": "Enter server hostname",
  "required": true
}
```

### In the Run Window

When users run the automation:

1. **Field Label Displayed**: "Server Name"
2. **Parameter Name Used**: `server_name`
3. **User Input**: User enters "web-server-01"
4. **Sent to API**: `{ "server_name": "web-server-01" }`

### Parameter Flow

```
Form Designer → Run Window → API → AWX
─────────────────────────────────────────
label: "Server Name" → Shows as field label
key: "server_name" → Used as parameter name → Sent in request → Maps to AWX variables
```

### Complete Example

#### Form Schema (Step 2):
```json
[
  {
    "type": "text",
    "label": "opened by",
    "key": "opened_by",
    "defaultValue": "",
    "required": false
  },
  {
    "type": "text",
    "label": "computers",
    "key": "computers",
    "defaultValue": "",
    "required": false
  }
]
```

#### Run Window Display:
```
Parameters
──────────

opened by
[                    ]  (input field)

computers
[                    ]  (input field)
```

#### When User Submits:
```javascript
// User enters:
// opened by: "john.doe"
// computers: "server1,server2"

// Parameters sent to API:
{
  "opened_by": "john.doe",
  "computers": "server1,server2"
}
```

#### Mapping to AWX (Step 3):
If you configured extra_vars template like:
```yaml
user: "{{form.opened_by}}"
target_hosts: "{{form.computers}}"
```

Then AWX receives:
```json
{
  "user": "john.doe",
  "target_hosts": "server1,server2"
}
```

## Key Points

1. ✅ **Labels are user-facing** - They appear as field names in the run window
2. ✅ **Keys are technical names** - They're used as parameter names in the API
3. ✅ **Keys are auto-generated** - From labels (spaces become underscores, lowercase)
4. ✅ **Keys are used in variable mapping** - Use `{{form.key_name}}` in extraVars template
5. ✅ **Parameters display after execution** - Shows which values were sent

## Default Values and Disabled Fields

### Pre-filled Fields
Fields with `defaultValue` are automatically populated:
```json
{
  "label": "Environment",
  "key": "environment",
  "type": "select",
  "options": ["dev", "uat", "prod"],
  "defaultValue": "uat"
}
```
Run window shows "uat" pre-selected.

### Read-Only Fields
Fields with `disabled: true` cannot be edited:
```json
{
  "label": "System User",
  "key": "system_user",
  "type": "text",
  "defaultValue": "ansible",
  "disabled": true
}
```
Run window shows "ansible" but user cannot change it.

## After Execution

The run page displays three sections showing what was sent:

### 1. Parameters Used
Shows the raw form values with their keys:
```
Parameters Used
───────────────
opened_by: john.doe
computers: server1,server2
```

### 2. Extra Variables Sent to AWX
Shows the mapped variables after template substitution:
```json
{
  "user": "john.doe",
  "target_hosts": "server1,server2"
}
```

### 3. Curl Command
Shows the actual API call that was executed:
```bash
curl -X POST 'https://awx.example.com/api/v2/job_templates/123/launch/' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "inventory": "456",
  "extra_vars": {
    "user": "john.doe",
    "target_hosts": "server1,server2"
  }
}'
```

## Troubleshooting

### "Parameters showing as empty"
If parameters appear empty in the run window:

1. **Check formSchema** - Ensure fields were saved in Step 2
2. **Check defaultValue** - Fields without defaultValue start empty (expected)
3. **Check field.key** - Ensure each field has a unique key
4. **Browser console** - Check for JavaScript errors

### "Parameters not sent to AWX"
If parameters don't reach AWX:

1. **Check extraVars template** - Ensure you're using correct `{{form.key}}` syntax
2. **Check parameter names** - Keys are case-sensitive
3. **Check API logs** - Look at "Parameters Used" section after execution
4. **Check curl command** - Verify the payload structure

## Best Practices

1. **Use descriptive labels** - "Server Hostname" is better than "Server"
2. **Keep keys simple** - Auto-generated keys work well
3. **Use helpText** - Provide guidance for complex fields
4. **Set appropriate defaults** - Pre-fill common values
5. **Mark required fields** - Use `required: true` for mandatory parameters
6. **Use disabled for system fields** - Prevent user modification of fixed values
7. **Test parameter mapping** - Check "Extra Variables Sent to AWX" after first run

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
