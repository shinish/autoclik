# AWX Playbooks

Collection of Ansible playbooks for AWX automation.

## Playbooks

### connectivity-check.yml
Network connectivity testing playbook that checks reachability of specified hosts and returns JSON artifacts.

**Usage:**
```yaml
extra_vars:
  check_hosts:
    - google.com
    - 8.8.8.8
    - github.com
```

**Output Artifacts:**
```json
{
  "connectivity_check": {
    "google.com": "Success",
    "8.8.8.8": "Success",
    "github.com": "Success"
  }
}
```
