#!/bin/bash

echo "Testing AWX Automation Run..."
echo ""

curl -s -X POST "http://localhost:3000/api/automations/8cd0bfc2-ed33-4828-bb38-1149b22af081/run" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "source_system": "VRT-PDC",
      "destn_ip": "10.118.234.75",
      "ports_input": "9419"
    },
    "user": {
      "name": "Test User",
      "email": "test@example.com"
    },
    "reservedTaskId": "TASK25A-TEST-001"
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data, indent=2))"

echo ""
echo "---"
echo "Run complete!"
