# Admin Delete Feature Testing

## Overview
The catalog page now has a delete button that's only visible to users with the `admin` role.

## Testing the Delete Functionality

### Option 1: Login as Admin User
1. Make sure you have an admin user in the database
2. Login through the normal login page
3. The user's role will be stored in localStorage
4. Navigate to the catalog page
5. You should see red delete (trash) icons next to each automation

### Option 2: Manually Set Admin Role in Browser Console

If you want to test without logging in as admin:

1. Open the browser console (F12 or Cmd+Option+I on Mac)
2. Run this command to set yourself as admin:
```javascript
localStorage.setItem('user', JSON.stringify({
  id: 'test-admin-id',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin'
}));
```
3. Refresh the page
4. You should now see the delete buttons in the catalog

### Option 3: Update Database User Role

Update a user's role in the database:
```bash
sqlite3 prisma/dev.db "UPDATE User SET role = 'admin' WHERE email = 'your-email@example.com';"
```

## Features

### Delete Button
- **Visibility**: Only shown to users with `role === 'admin'`
- **Location**: Actions column in the catalog table
- **Appearance**: Red trash icon button

### Delete Confirmation Modal
When clicking the delete button, a confirmation modal appears showing:
- Automation name
- Warning that the action cannot be undone
- List of what will be deleted:
  - All execution history
  - All scheduled runs
  - All associated data

### After Deletion
- Automation is immediately removed from the list
- Database record is deleted (cascades to runs and schedules)
- No page refresh required

## Implementation Details

### Frontend
- `isAdmin` state checks `localStorage.getItem('user').role`
- Delete button conditionally rendered with `{isAdmin && (...)}`
- Confirmation modal prevents accidental deletions

### Backend
- DELETE endpoint: `/api/automations/[id]`
- Prisma cascade delete handles related records
- No authentication check on backend (assumes frontend controls access)

## Security Note

Currently, the delete functionality relies on frontend role checking via localStorage. In a production environment, you should:
1. Implement proper session management
2. Add backend role verification before allowing deletes
3. Consider implementing soft deletes for audit trails
