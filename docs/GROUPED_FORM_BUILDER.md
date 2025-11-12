# Grouped Form Builder Guide

## Overview

The **Grouped Form Builder** allows you to create complex automation request bodies with organized sections and fields. It supports **two modes**:

1. **Visual Builder** - Drag-and-drop interface with grouped sections
2. **JSON Editor** - Direct JSON editing for advanced users

## 🎯 Features

### ✅ Grouped Sections
- **Instance Groups** - Configure AWX instance groups
- **Extra Variables** - Define form fields that become template variables

### ✅ Dual Mode Interface
- **Visual Mode** - User-friendly form builder
- **JSON Mode** - Direct JSON editing with syntax validation

### ✅ Live Preview
- See generated custom body in real-time
- Instant validation and error checking

---

## 🚀 Quick Start

### Try the Demo

1. **Open the demo page:**
   ```
   http://localhost:3000/form-builder-demo
   ```

2. **Create Your PowerShell Test Structure:**

   **Step 1: Add Instance Group**
   - Click "Add Group" in Instance Groups section
   - Enter: `298`

   **Step 2: Add Fields**
   - Click "Add Field" 3 times

   **Field 1:**
   - Key: `source_system`
   - Label: `Source System`
   - Check: "Is Array" ✅
   - Default: `VRT-PDC`

   **Field 2:**
   - Key: `destn_ip`
   - Label: `Destination IP`
   - Default: `10.118.234.75`

   **Field 3:**
   - Key: `ports_input`
   - Label: `Ports`
   - Default: `9419`

3. **Result:**
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

## 📋 Visual Builder Mode

### Instance Groups Section

**Purpose:** Configure which AWX instance groups execute the job.

**How to Use:**
1. Click "Add Group"
2. Enter instance group ID (e.g., `298`)
3. Add multiple groups if needed
4. Remove groups with trash icon

**Example:**
```json
{
  "instance_groups": [298, 299, 300]
}
```

### Extra Variables Section

**Purpose:** Define form fields that users will fill in.

**Field Configuration:**

| Property | Description | Example |
|----------|-------------|---------|
| **Field Key** | Variable name (required) | `source_system` |
| **Label** | Display name in UI | `Source System` |
| **Field Type** | Input type | text, number, select, textarea, checkbox |
| **Default Value** | Placeholder or default | `VRT-PDC` |
| **Required** | Make field mandatory | ✅ or ❌ |
| **Is Array** | Wrap value in array | ✅ or ❌ |

**Template Variables:**
- All fields automatically become: `{{form.fieldkey}}`
- Example: Key `source_system` → `{{form.source_system}}`

**Example Configuration:**

```javascript
{
  key: 'source_system',
  label: 'Source System',
  type: 'text',
  defaultValue: 'VRT-PDC',
  required: true,
  isArray: true  // ← Creates ["{{form.source_system}}"]
}
```

**Generates:**
```json
{
  "extra_vars": {
    "source_system": ["{{form.source_system}}"]
  }
}
```

---

## 💻 JSON Editor Mode

### Switching to JSON Mode

**Method 1: Click JSON Editor Button**
- Visual content converted to JSON automatically
- Edit directly in textarea

**Method 2: Paste Existing JSON**
- Perfect for importing existing configurations
- Validates JSON syntax automatically

### JSON Editor Features

**✅ Syntax Validation**
- Real-time JSON validation
- Error messages if invalid

**✅ Full Control**
- Edit any part of the structure
- Add custom fields not in visual builder

**✅ Apply Changes**
- Click "Apply JSON" to use the JSON
- Switches back to visual mode

### Example: Paste Your PowerShell Test

**Step 1: Click "JSON Editor" button**

**Step 2: Paste this:**
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

**Step 3: Click "Apply JSON"**

**Result:** ✅ Configuration loaded!

---

## 🎨 Advanced Examples

### Example 1: Multiple Instance Groups

**Visual Builder:**
1. Add Group: `298`
2. Add Group: `299`
3. Add Group: `300`

**Result:**
```json
{
  "instance_groups": [298, 299, 300]
}
```

### Example 2: Complex Extra Vars

**Fields:**
- `hostname` (text)
- `cpu` (number)
- `memory` (number)
- `environment` (select)
- `enable_backup` (checkbox)

**Result:**
```json
{
  "extra_vars": {
    "hostname": "{{form.hostname}}",
    "cpu": "{{form.cpu}}",
    "memory": "{{form.memory}}",
    "environment": "{{form.environment}}",
    "enable_backup": "{{form.enable_backup}}"
  }
}
```

### Example 3: Arrays and Nested Values

**Using JSON Mode:**
```json
{
  "instance_groups": [298],
  "limit": "production",
  "job_tags": "deploy,configure",
  "extra_vars": {
    "servers": ["{{form.server1}}", "{{form.server2}}"],
    "config": {
      "cpu": "{{form.cpu}}",
      "memory": "{{form.memory}}"
    },
    "static_value": "hardcoded",
    "users": ["admin", "operator"]
  }
}
```

**Mix of:**
- ✅ Template variables: `{{form.*}}`
- ✅ Static values: `"hardcoded"`
- ✅ Arrays: `[...]`
- ✅ Nested objects: `{...}`

---

## 🔄 Workflow

### Creating New Automation

**1. Start in Visual Mode**
- Add instance groups
- Define form fields
- See live preview

**2. (Optional) Switch to JSON**
- Fine-tune complex structures
- Add custom fields

**3. Save**
- Apply changes
- Custom body saved to database

**4. Users Fill Form**
- See fields you defined
- Enter values
- Template variables replaced automatically

### Modifying Existing Automation

**Option A: Visual Mode**
- Load existing configuration
- Edit fields visually
- Save changes

**Option B: JSON Mode**
- Switch to JSON
- Edit entire structure
- Apply changes

---

## 📖 Real-World Use Cases

### Use Case 1: Port Connectivity Test

**Your Requirement:**
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

**Solution:**
1. Add instance group: `298`
2. Add 3 fields (source_system, destn_ip, ports_input)
3. Mark source_system as array
4. Done! ✅

### Use Case 2: VM Provisioning

**Requirements:**
- Multiple instance groups
- Many parameters
- Some static values

**JSON Mode:**
```json
{
  "instance_groups": [100, 101],
  "inventory": "inv-cloud",
  "extra_vars": {
    "vm_name": "{{form.hostname}}",
    "cpu": "{{form.cpu}}",
    "memory": "{{form.memory}}",
    "environment": "production",
    "created_by": "automation-platform"
  }
}
```

### Use Case 3: Database Operations

**Requirements:**
- Conditional execution
- Job tags
- Credentials

**JSON Mode:**
```json
{
  "instance_groups": [200],
  "job_tags": "backup,validate",
  "credentials": [123],
  "extra_vars": {
    "database": "{{form.db_name}}",
    "action": "{{form.action}}",
    "retention_days": 30
  }
}
```

---

## 🛠️ Integration with Automation Creation

### In Catalog Creation Page

**Step 3: Integration**

Replace the existing custom body input with:

```jsx
import GroupedFormBuilder from '@/components/GroupedFormBuilder';

// In your component
<GroupedFormBuilder
  value={customBody}
  onChange={(body, groups) => {
    setCustomBody(body);
  }}
/>
```

**Benefits:**
- ✅ User-friendly interface
- ✅ Visual and JSON modes
- ✅ Live preview
- ✅ Error validation

---

## 🎯 Best Practices

### 1. Start with Visual Mode

Build basic structure visually:
- Add instance groups
- Define core fields
- Test in preview

### 2. Use JSON Mode for Advanced Features

Switch to JSON for:
- Complex nested structures
- Static values
- Advanced AWX features (tags, limits, etc.)

### 3. Consistent Field Keys

Use clear, descriptive keys:
- ✅ `source_system`
- ✅ `destination_ip`
- ❌ `sys`, `ip` (too short)

### 4. Add Helpful Defaults

Set placeholder values:
- Shows users what to enter
- Provides examples
- Reduces errors

### 5. Test Before Saving

- Check live preview
- Verify JSON syntax
- Test template variables

---

## 🐛 Troubleshooting

### Issue: JSON Validation Error

**Cause:** Invalid JSON syntax
**Solution:**
- Check for missing commas
- Ensure quotes are balanced
- Use JSON validator: `https://jsonlint.com`

### Issue: Template Variable Not Replacing

**Cause:** Key mismatch
**Solution:**
- Ensure field key matches variable
- Example: Key `hostname` → `{{form.hostname}}`

### Issue: Array Not Creating

**Cause:** "Is Array" not checked
**Solution:**
- Check "Is Array" checkbox in field config
- Or manually add brackets in JSON mode: `["{{form.key}}"]`

---

## 📚 Component API

### GroupedFormBuilder Props

```typescript
interface GroupedFormBuilderProps {
  value?: FormGroups;        // Initial value
  onChange: (
    body: object,            // Generated custom body
    groups: FormGroups       // Form groups configuration
  ) => void;
}
```

### Form Groups Structure

```typescript
interface FormGroups {
  instance_groups: {
    label: string;
    type: 'array';
    items: (string | number)[];
  };
  extra_vars: {
    label: string;
    type: 'group';
    fields: Field[];
  };
}

interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox';
  required: boolean;
  defaultValue: string;
  isArray: boolean;
}
```

---

## 🚀 Quick Reference

### Visual Mode Actions

| Action | Description |
|--------|-------------|
| **Add Group** | Add instance group |
| **Add Field** | Add extra var field |
| **Configure Field** | Set key, label, type, etc. |
| **Preview** | See generated JSON |
| **Apply** | Save changes |

### JSON Mode Actions

| Action | Description |
|--------|-------------|
| **Edit JSON** | Direct JSON editing |
| **Validate** | Auto syntax check |
| **Apply JSON** | Use JSON and switch to visual |
| **Cancel** | Discard JSON changes |

### Mode Switching

| From | To | Result |
|------|----|----|
| Visual | JSON | Structure converted to JSON |
| JSON | Visual | JSON parsed and loaded |

---

## 📋 Checklist for Your Use Case

**✅ Recreating test.txt in UI:**

- [x] Add instance group 298
- [x] Add source_system field (array)
- [x] Add destn_ip field
- [x] Add ports_input field
- [x] Preview matches PowerShell test
- [x] Template variables working
- [x] JSON mode available
- [x] Visual mode available

**Result:** ✅ Complete!

---

## 🎉 Summary

You now have:

1. **Visual Form Builder** with grouped sections
2. **JSON Editor** for direct editing
3. **Live Preview** of generated custom body
4. **Toggle between modes** anytime
5. **Your PowerShell test structure** available in UI

**Demo Page:** http://localhost:3000/form-builder-demo

**Try it now!** 🚀

---

**Version:** 1.0.0
**Last Updated:** November 11, 2025
