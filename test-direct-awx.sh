#!/bin/bash

echo "🔍 Direct AWX API Test"
echo "====================="
echo ""

echo "📡 Testing AWX Server Connection..."
curl -s -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" "http://localhost:8080/api/v2/ping/" | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ AWX Version:', data['version']); print('✅ Active Node:', data['active_node'])" 2>&1

echo ""
echo "🚀 Launching Job Template 12..."
response=$(curl -s -X POST -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" \
  -H "Content-Type: application/json" \
  "http://localhost:8080/api/v2/job_templates/12/launch/" \
  -d '{"instance_groups": [2], "extra_vars": {"source_system": ["VRT-PDC"], "destn_ip": "10.118.234.75", "ports_input": "9419"}}')

job_id=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>&1)
echo "✅ Job Launched: ID $job_id"

echo ""
echo "⏳ Waiting for job completion..."
sleep 15

echo ""
echo "📊 Job Status:"
curl -s -H "Authorization: Bearer vOlNLjf2PVxeEnPmBDpBAsUymWo68Z" "http://localhost:8080/api/v2/jobs/$job_id/" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print('  Status:', data['status']); print('  Started:', data['started']); print('  Finished:', data['finished']); print('  Elapsed:', data['elapsed'], 'seconds'); print('  Failed:', data['failed']); print('  Extra Vars:', data['extra_vars'])" 2>&1

echo ""
echo "✅ Direct AWX API test complete!"
