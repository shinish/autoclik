# Extra Variables Examples

This document provides examples of common extra variables used in automation playbooks.

## Standard Extra Variables

### 1. Server Name (`server_name`)
The target server hostname or IP address.

```yaml
server_name: "{{ form.server_name }}"
```

**Form Field Configuration:**
```json
{
  "key": "server_name",
  "label": "Server Name",
  "type": "text",
  "required": true,
  "placeholder": "server01.example.com",
  "description": "Target server hostname or IP address"
}
```

### 2. Email ID (`emailid`)
The email address for notifications and confirmations.

```yaml
emailid: "{{ form.emailid }}"
```

**Form Field Configuration:**
```json
{
  "key": "emailid",
  "label": "Email Address",
  "type": "email",
  "required": true,
  "placeholder": "user@example.com",
  "description": "Email address for notifications"
}
```

### 3. Request Item (RITM) Number (`ritm`)
ServiceNow Request Item number for tracking.

```yaml
ritm: "{{ form.ritm }}"
```

**Form Field Configuration:**
```json
{
  "key": "ritm",
  "label": "RITM Number",
  "type": "text",
  "required": false,
  "placeholder": "RITM0123456",
  "pattern": "RITM[0-9]{7}",
  "description": "ServiceNow Request Item number"
}
```

## Complete Example: Server Provisioning Automation

### Form Schema (Step 2 in Catalog Creation)

Add these fields in Form Builder mode:

1. **Server Name**
   - Key: `server_name`
   - Label: Server Name
   - Type: Text
   - Required: Yes
   - Placeholder: server01.example.com

2. **Email Address**
   - Key: `emailid`
   - Label: Email Address
   - Type: Email
   - Required: Yes
   - Placeholder: user@example.com

3. **RITM Number**
   - Key: `ritm`
   - Label: RITM Number
   - Type: Text
   - Required: No
   - Placeholder: RITM0123456

### Generated Extra Variables (YAML)

When using Form Builder mode, the system automatically generates:

```yaml
server_name: "{{ form.server_name }}"
emailid: "{{ form.emailid }}"
ritm: "{{ form.ritm }}"
```

### JSON Mode Custom Body Example

If using JSON mode instead, you can define the complete request body:

```json
{
  "extra_vars": {
    "server_name": "{{form.server_name}}",
    "emailid": "{{form.emailid}}",
    "ritm": "{{form.ritm}}"
  },
  "instance_group": "production",
  "inventory": "global-inventory"
}
```

## Using Instance Groups

Instance groups control where automations execute. Select an instance group in Step 3 (AWX Configuration):

- **default** - Default instance group for all automations
- **production** - Production instance group for critical automations
- **development** - Development instance group for testing

The selected instance group will be included in the AWX API request automatically.

## Best Practices

1. **Always validate required fields** - Mark critical fields like server_name as required
2. **Use appropriate input types** - Email for emails, text with patterns for RITM numbers
3. **Provide clear descriptions** - Help users understand what each field is for
4. **Include placeholders** - Show examples of valid input
5. **Set default values** - For optional fields, provide sensible defaults

## Variable Substitution

The platform supports variable substitution using the `{{form.fieldname}}` syntax:

- `{{form.server_name}}` - Replaced with the server_name form value
- `{{form.emailid}}` - Replaced with the emailid form value
- `{{form.ritm}}` - Replaced with the ritm form value

These variables are automatically substituted when the automation runs.

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
