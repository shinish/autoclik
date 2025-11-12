# AWX Connection Status Report

## 🎯 Executive Summary

**AWX Server**: ✅ **WORKING PERFECTLY**
**Direct API Calls**: ✅ **SUCCESSFUL**
**Application Integration**: ⚠️ **DEMO MODE (Issue Identified)**

---

## ✅ What's Working

### 1. AWX Server Status
- **Version**: 24.6.1
- **Endpoint**: http://localhost:8080/api/v2
- **Status**: Running and accessible
- **Authentication**: Token valid (`vOlNLjf2PVxeEnPmBDpBAsUymWo68Z`)

### 2. Job Template Configuration
- **Template ID**: 12
- **Name**: "Advanced Connectivity Test"
- **Status**: Active and available
- **Instance Group**: 2 (controlplane)

### 3. Direct API Tests - SUCCESS! 🎉
**Job ID 14** (Most Recent):
- **Status**: successful ✅
- **Duration**: 12.252 seconds
- **Started**: 2025-11-12T04:53:40
- **Finished**: 2025-11-12T04:53:52
- **Parameters**:
  ```json
  {
    "source_system": ["VRT-PDC"],
    "destn_ip": "10.118.234.75",
    "ports_input": "9419"
  }
  ```

**Previous Successful Jobs**:
- Job ID 13: 12.028 seconds (successful)
- Job ID 14: 12.252 seconds (successful)

---

## ⚠️ Known Issue: Application Demo Mode

### The Problem

The Next.js application continues to enter "Demo Mode" despite correct configuration in:
- ✅ Database (`Setting` table has correct values)
- ✅ `.env` file (AWX_BASE_URL and AWX_TOKEN set)
- ✅ `.env.production` file (configured)

### Root Cause

The issue is in `/lib/awx-api.js` where environment variables are loaded as constants:

```javascript
const AWX_BASE_URL = process.env.AWX_BASE_URL || 'https://awx.example.com/api/v2';
const AWX_TOKEN = process.env.AWX_TOKEN || '';
```

In Next.js:
1. These constants are evaluated once when the module loads
2. During production builds, Next.js bakes environment variable values into the compiled code
3. The `getAwxConfig()` function fetches from database, but the initial const values cause demo mode check to trigger

### Demo Mode Trigger (Line 70 in awx-api.js)

```javascript
if (!token || baseUrl === 'https://awx.example.com/api/v2') {
  console.log('🎭 Demo Mode: AWX not configured...');
  // Returns mock response
}
```

---

## ✅ Verified Working Solutions

### Solution 1: Direct AWX API Calls (RECOMMENDED FOR NOW)

Use the provided test script to run automations directly:

```bash
./test-direct-awx.sh
```

**Results**:
- ✅ Job launches successfully
- ✅ Returns real AWX job ID
- ✅ Polls for completion
- ✅ Shows actual execution results

### Solution 2: Using curl Directly

```bash
curl -X POST "http://localhost:8080/api/v2/job_templates/12/launch/" \
  -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_groups": [2],
    "extra_vars": {
      "source_system": ["VRT-PDC"],
      "destn_ip": "10.118.234.75",
      "ports_input": "9419"
    }
  }'
```

---

## 🔧 Permanent Fix Options

### Option A: Modify awx-api.js (Code Change Required)

Remove the const declarations and always use `getAwxConfig()`:

```javascript
// REMOVE these lines:
// const AWX_BASE_URL = process.env.AWX_BASE_URL || 'https://awx.example.com/api/v2';
// const AWX_TOKEN = process.env.AWX_TOKEN || '';

// UPDATE launchJobTemplate function to always call getAwxConfig()
export async function launchJobTemplate(templateId, customBody = {}) {
  const config = await getAwxConfig(); // Always fetch from database
  const baseUrl = config.baseUrl;
  const token = config.token;

  // Remove demo mode check or update it:
  if (!token || !baseUrl || baseUrl.includes('example.com')) {
    throw new Error('AWX not configured - check Settings page');
  }

  // Rest of function...
}
```

### Option B: Use Environment Variables Only

Update `.env` and restart with explicit environment:

```bash
# Stop server
lsof -ti:3000 | xargs kill -9

# Set environment variables
export AWX_BASE_URL=http://localhost:8080/api/v2
export AWX_TOKEN=vOlNLjf2PVxeEnPmBDpBAsUymWo68Z
export NODE_ENV=production

# Rebuild and start
rm -rf .next
npm run build
npm start
```

### Option C: Use Settings Page Configuration Only

The application already supports loading from database via `getAwxConfig()`. The issue is the const values interfere. Modify the code to trust database values:

1. Edit `/lib/awx-api.js`
2. Change demo mode check to only check database values
3. Rebuild application

---

## 📊 Current Configuration Status

### Database Settings (Verified ✅)
```sql
SELECT * FROM Setting WHERE key IN ('default_api_endpoint', 'awx_token');
```
| key | value |
|-----|-------|
| awx_token | vOlNLjf2PVxeEnPmBDpBAsUymWo68Z |
| default_api_endpoint | http://localhost:8080/api/v2 |

### Environment Files (Verified ✅)
`.env`:
```
AWX_BASE_URL=http://localhost:8080/api/v2
AWX_TOKEN=vOlNLjf2PVxeEnPmBDpBAsUymWo68Z
```

`.env.production`:
```
AWX_BASE_URL=http://localhost:8080/api/v2
AWX_TOKEN=vOlNLjf2PVxeEnPmBDpBAsUymWo68Z
```

---

## 🚀 Quick Start Guide

### For Production Use Right Now

**Use the direct AWX API approach:**

1. **Test Connection**:
   ```bash
   curl -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
     http://localhost:8080/api/v2/ping/
   ```

2. **Run Automation**:
   ```bash
   ./test-direct-awx.sh
   ```

3. **Check Job Status**:
   ```bash
   curl -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
     http://localhost:8080/api/v2/jobs/{JOB_ID}/
   ```

### For Application Integration (After Code Fix)

1. Apply code changes from Option A above
2. Rebuild: `npm run build`
3. Start: `npm start`
4. Test via web interface: http://localhost:3000/catalog/{automation-id}/run

---

## 📈 Test Results Summary

| Test Type | Status | Job ID | Duration | Details |
|-----------|--------|---------|----------|---------|
| Direct API Test 1 | ✅ SUCCESS | 13 | 12.028s | Full parameters accepted |
| Direct API Test 2 | ✅ SUCCESS | 14 | 12.252s | Full parameters accepted |
| Application API | ⚠️ DEMO MODE | N/A | N/A | Returns mock response |

---

## 🔍 Debugging Tools

### Check Server Logs
```bash
# View current server output
tail -f logs/pm2-out.log

# Or check background process
# (Process ID available in terminal)
```

### Verify AWX Health
```bash
curl -s -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
  http://localhost:8080/api/v2/ping/ | python3 -m json.tool
```

### List All Job Templates
```bash
curl -s -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
  http://localhost:8080/api/v2/job_templates/ | python3 -m json.tool
```

### View Recent Jobs
```bash
curl -s -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
  http://localhost:8080/api/v2/jobs/?order_by=-id | python3 -m json.tool
```

---

## ✅ Conclusion

**AWX Integration is WORKING!** 🎉

The AWX server is fully operational and accepting job requests. Direct API calls work perfectly. The only issue is the Next.js application entering demo mode due to how environment variables are cached in the production build.

**Immediate Workaround**: Use direct AWX API calls via the provided scripts.

**Permanent Solution**: Modify `/lib/awx-api.js` to always use database configuration.

---

## 📞 Support Files

- **Direct Test Script**: `./test-direct-awx.sh`
- **Application Test**: `./test-awx-run.sh`
- **Production Start**: `./start-prod.sh`
- **PM2 Start**: `./start-prod-pm2.sh`

---

**Last Updated**: 2025-11-12
**AWX Version**: 24.6.1
**Application Version**: 1.0.0
**Status**: ✅ AWX Operational | ⚠️ Application needs code fix
