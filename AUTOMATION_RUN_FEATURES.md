# Automation Run Features

## Overview
The automation run page now displays comprehensive information about executed automations, including form parameters, extra variables sent to AWX, and the equivalent curl command.

## New Features

### 1. Auto-Populate Default Values
When you open the run page for an automation, any fields that have `defaultValue` specified in the form schema are automatically pre-populated.

**Implementation:**
- Fields with `defaultValue` property are loaded into the form on page load
- Pre-filled values can still be edited unless the field is marked as `disabled`
- Disabled fields (e.g., predefined parameters) show with grey background and cannot be modified

### 2. Parameters Display
After successfully running an automation, the page displays all parameters that were submitted:

**Display Format:**
```
Parameters Used
─────────────────
server_name: web-server-01
port: 8080
environment: production
```

### 3. Extra Variables Display
Shows the extra variables that were sent to AWX after template variable substitution:

**Display Format:**
```json
Extra Variables Sent to AWX
{
  "server_hostname": "web-server-01",
  "target_port": "8080",
  "deployment_env": "production"
}
```

This shows how the form values were mapped to AWX job template extra_vars through the variable mapping defined in Step 3 of automation creation.

### 4. Curl Command Display
The equivalent curl command that was executed is shown in a terminal-style code block:

**Features:**
- Syntax-highlighted display (green on dark background)
- Copy button to easily copy the command
- Shows the actual API endpoint, headers, and payload
- Useful for debugging or manual execution

**Example:**
```bash
curl -X POST 'https://awx.uat.fiscloudservices.com/api/v2/job_templates/123/launch/' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "inventory": "456",
  "extra_vars": {
    "server_hostname": "web-server-01",
    "target_port": "8080"
  }
}'
```

## Form Field Properties

When creating automations in the Form Designer (Step 2), you can use these properties:

### Standard Properties
- `label`: Display name of the field
- `key`: Variable name (auto-generated from label)
- `type`: Field type (text, number, select, textarea, etc.)
- `placeholder`: Hint text shown in empty field
- `required`: Whether the field must be filled
- `helpText`: Additional guidance shown below the field

### Special Properties
- **`defaultValue`**: Pre-fills the field with this value when the run page loads
  - Example: `defaultValue: "production"`
  - User can still edit unless field is disabled

- **`predefinedValue`**: Automatically populates field with dynamic values
  - Example: `predefinedValue: "{{current_user.username}}"`
  - Supports placeholders:
    - `{{current_user.username}}` - Current user's name
    - `{{current_user.email}}` - Current user's email
    - `{{current_user.id}}` - Current user's ID
  - Values are replaced when the run page loads
  - User can still edit unless field is disabled
  - Takes priority over `defaultValue`

- **`disabled`**: Makes the field read-only (cannot be edited)
  - Example: `disabled: true`
  - Useful for predefined/system parameters
  - Shows with grey background to indicate it's not editable
  - Often combined with `defaultValue` or `predefinedValue` for system-provided values

### Example Form Schema
```json
[
  {
    "label": "Environment",
    "key": "environment",
    "type": "select",
    "options": ["dev", "uat", "prod"],
    "defaultValue": "uat",
    "required": true
  },
  {
    "label": "Opened By",
    "key": "opened_by",
    "type": "text",
    "predefinedValue": "{{current_user.username}}",
    "helpText": "Automatically populated with your username"
  },
  {
    "label": "System User",
    "key": "system_user",
    "type": "text",
    "defaultValue": "ansible",
    "disabled": true,
    "helpText": "This is automatically set by the system"
  },
  {
    "label": "Server Name",
    "key": "server_name",
    "type": "text",
    "placeholder": "Enter server hostname",
    "required": true
  }
]
```

**What happens when user "shinish" opens the run page:**
- Environment: Pre-selected to "uat" (can be changed)
- Opened By: Auto-filled with "shinish" (can be changed)
- System User: Shows "ansible" (cannot be changed - disabled)
- Server Name: Empty, waiting for user input

## Usage Flow

1. **Navigate to Run Page**
   - From catalog: Click the Play icon on any automation
   - From detail modal: Click "Run Automation" button
   - URL: `/automations/[id]/run`

2. **Fill Parameters**
   - Fields with default values are pre-populated
   - Disabled fields cannot be modified
   - Fill in any remaining required fields
   - Optional fields can be left empty

3. **Execute**
   - Click "Run Now" button
   - System validates required fields
   - Submits parameters to API

4. **View Results**
   - Success/Error message displayed
   - AWX Job ID shown (if successful)
   - Parameters Used section shows what was submitted
   - Extra Variables shows AWX payload
   - Curl Command shows equivalent API call
   - Copy button available for the curl command

## Technical Details

### API Response Structure
```json
{
  "success": true,
  "runId": "run-uuid",
  "awxJobId": "12345",
  "message": "Automation started successfully",
  "parameters": {
    "server_name": "web-server-01",
    "port": "8080"
  },
  "extraVars": {
    "server_hostname": "web-server-01",
    "target_port": "8080"
  },
  "curlCommand": "curl -X POST..."
}
```

### Files Modified
1. **`/app/automations/[id]/run/page.jsx`**
   - Added auto-population of default values
   - Added disabled field support
   - Enhanced result display with 3 new sections

2. **`/app/api/automations/[id]/run/route.js`**
   - Added `generateCurlCommand()` function
   - Modified response to include parameters, extraVars, and curlCommand
   - Generates curl command before executing AWX call

### Variable Mapping Flow
1. User fills form with values (e.g., `server_name: "web-server-01"`)
2. Form values submitted as `parameters`
3. Backend reads `extraVars` template from automation (e.g., `server_hostname: "{{form.server_name}}"`)
4. Template variables replaced with actual values (e.g., `server_hostname: "web-server-01"`)
5. Replaced values sent to AWX as `extra_vars`
6. All this information displayed to user after execution

## Benefits

1. **Transparency**: Users can see exactly what was sent to AWX
2. **Debugging**: Curl command allows manual testing and troubleshooting
3. **Reproducibility**: Parameters display helps recreate executions
4. **Learning**: Users can understand how form values map to AWX variables
5. **Convenience**: Pre-filled defaults speed up common operations
6. **Documentation**: Output serves as execution audit trail
