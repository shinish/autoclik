# Run ID Pool Assignment System

## Overview

The unique Run ID system uses **team-based pool assignment** where each team/group gets assigned a consistent pool letter (A-E).

## Format

```
TASK{YY}{POOL}{SEQ}i
```

**Example:** `TASK25A0000000001i`

- **TASK** - Static prefix
- **YY** - 2-digit year (e.g., 25 for 2025)
- **POOL** - Team's assigned pool letter (A, B, C, D, or E)
- **SEQ** - 10-digit sequence number (increments per pool)
- **i** - Static suffix

## How Pool Assignment Works

### Team-Based Assignment

Each user's pool is determined by their **primary group/team**:

1. **If user has groups**: Pool is determined by hashing the first group name
2. **If no groups**: Pool is determined by hashing the user's ID or email
3. **Same team = Same pool**: All members of a team always use the same pool

### Pool Distribution

- **Pool A** - Team Alpha, Admins, etc.
- **Pool B** - Team Beta, Network Ops, etc.
- **Pool C** - Team Charlie, Database Team, etc.
- **Pool D** - Team Delta, Security Team, etc.
- **Pool E** - Team Echo, Cloud Ops, etc.

### Example Scenarios

#### Scenario 1: Users in Same Team
```javascript
User 1: { id: "user1", groups: ["NetworkOps"] }  → Pool B → TASK25B0000000001i
User 2: { id: "user2", groups: ["NetworkOps"] }  → Pool B → TASK25B0000000002i
User 3: { id: "user3", groups: ["NetworkOps"] }  → Pool B → TASK25B0000000003i
```
✅ All users in "NetworkOps" team get Pool B, sequence increments

#### Scenario 2: Users in Different Teams
```javascript
User A: { groups: ["SecurityTeam"] }   → Pool D → TASK25D0000000001i
User B: { groups: ["CloudOps"] }       → Pool E → TASK25E0000000001i
User C: { groups: ["DatabaseTeam"] }   → Pool C → TASK25C0000000001i
```
✅ Different teams get different pools, each has independent sequence

#### Scenario 3: Concurrent Runs from Same Team
```javascript
// 3 users from NetworkOps team run simultaneously
User 1 → TASK25B0000000001i  (at 10:00:00.100)
User 2 → TASK25B0000000002i  (at 10:00:00.150)
User 3 → TASK25B0000000003i  (at 10:00:00.200)
```
✅ Atomic counter ensures no duplicates, proper sequence

## Key Benefits

### 1. Team Accountability
- Each team has their own pool
- Easy to track which team generated which runs
- Pool letter identifies the team at a glance

### 2. Scalability
- 5 independent pools (A-E)
- Each pool can have up to 10 billion runs (10-digit sequence)
- Total capacity: 50 billion runs per year

### 3. Load Distribution
- Concurrent runs from different teams don't conflict
- Each pool has its own counter
- No bottlenecks across teams

### 4. Consistency
- Same team always gets same pool
- Predictable ID patterns per team
- Easy to filter/search by team

## Technical Implementation

### Pool Determination Algorithm

```javascript
function determinePoolForUser(userId, userGroups) {
  // Priority 1: Use primary group
  if (userGroups && userGroups.length > 0) {
    const hash = hashString(userGroups[0]);
    return POOLS[hash % 5];  // A-E
  }

  // Priority 2: Use user ID/email
  if (userId) {
    const hash = hashString(userId);
    return POOLS[hash % 5];
  }

  // Fallback: Pool A
  return 'A';
}
```

### Database Structure

```sql
RunCounter Table:
- year: 2025
- pool: 'B'
- sequence: 42
- lastUsed: 2025-11-03 10:30:15

Unique constraint: (year, pool)
```

### Atomic Operations

```javascript
// Transaction-safe increment
UPDATE RunCounter
SET sequence = sequence + 1,
    lastUsed = NOW()
WHERE year = 2025 AND pool = 'B'
RETURNING sequence;
```

## Pool Statistics Example

```
Year: 2025

Pool A: 1,234 runs (last used: 2 hours ago)
Pool B: 5,678 runs (last used: 5 minutes ago)
Pool C: 891 runs (last used: 1 day ago)
Pool D: 2,345 runs (last used: 30 minutes ago)
Pool E: 456 runs (last used: 3 hours ago)

Total: 10,604 runs
```

## Real-World Example

### Morning Operations

**8:00 AM** - Network Team starts connectivity checks
```
TASK25B0000000001i - Test Connectivity (network-server-01)
TASK25B0000000002i - Test Connectivity (network-server-02)
TASK25B0000000003i - Test Connectivity (network-server-03)
```

**8:30 AM** - Security Team runs scans
```
TASK25D0000000001i - Security Scan (web-app-01)
TASK25D0000000002i - Security Scan (api-gateway)
TASK25D0000000003i - Security Scan (database-prod)
```

**9:00 AM** - Cloud Ops deploys updates
```
TASK25E0000000001i - Deploy Application (prod-cluster)
TASK25E0000000002i - Scale Infrastructure (auto-scale-group)
```

**9:15 AM** - Network Team continues checks
```
TASK25B0000000004i - Test Connectivity (backup-server)
TASK25B0000000005i - Port Scan (firewall-01)
```

✅ Each team maintains their own sequence, no conflicts

## Migration Notes

### Existing Systems

If you have existing runs without team-based pools:
1. Old runs keep their current pool assignments
2. New runs use team-based assignment
3. No data migration required

### Testing

Test pool assignment:
```javascript
import { getUserPool } from '@/lib/runIdGenerator';

const user1 = { id: 'user1', groups: ['NetworkOps'] };
const pool = getUserPool(user1);
console.log(`User pool: ${pool}`);  // Output: B (or A-E)
```

## Summary

✅ **Team-based** - Pool determined by user's team/group
✅ **Consistent** - Same team always gets same pool
✅ **Independent** - Each pool has its own sequence counter
✅ **Atomic** - Concurrent-safe ID generation
✅ **Scalable** - 50 billion runs capacity per year
✅ **Traceable** - Pool letter identifies team

**The sequence number increments mostly, and the pool letter (A-E) depends on the team that's logged in!**
