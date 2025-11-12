# Audit Report Enhancements

## Overview
The audit report page has been significantly enhanced with comprehensive analytics, metrics, and detailed execution history.

## New Features

### 1. Export to CSV
- **Button Location**: Top right corner of the page, next to the time range selector
- **Functionality**: Exports the current execution trend data to a CSV file
- **File Format**: `audit-report-{timeRange}-{date}.csv`
- **Columns**: Date, Total, Success, Failed, Running, Pending

### 2. Success & Failure Rate Metrics
Three new performance metric cards display key statistics:

#### Success Rate Card
- Shows percentage of successful executions
- Green progress bar visualization
- Displays total run count
- Formula: `(successful runs / total runs) * 100`

#### Failure Rate Card
- Shows percentage of failed executions
- Red progress bar visualization
- Displays failed run count
- Formula: `(failed runs / total runs) * 100`

#### Active & Pending Card
- Shows combined count of running and pending executions
- Blue color theme
- Breakdown showing running and pending counts separately

### 3. Top Automations by Execution Count
Displays the top 5 most executed automations:

- **Ranking**: Numbered badges (#1, #2, #3, #4, #5)
- **#1 Highlight**: Gold/green background for the top automation
- **Information Shown**:
  - Automation name
  - Namespace
  - Total execution count
- **Sorting**: By `runs` field in descending order

### 4. Recent Execution History
Expandable table showing recent automation runs:

#### Default View (Collapsed)
- Shows 5 most recent runs
- Columns: Status, Automation, Started, Duration

#### Expanded View
- Shows 20 most recent runs
- Additional column: AWX Job ID
- Toggle button in header to expand/collapse

#### Table Features
- **Status Badges**: Color-coded with icons
  - Success: Green with CheckCircle icon
  - Failed: Red with XCircle icon
  - Running: Blue with Clock icon
  - Pending: Orange with AlertCircle icon
- **Duration Calculation**: Shows execution time in seconds
- **Hover Effects**: Rows highlight on hover

## Data Sources

The page now fetches from multiple API endpoints:
1. `/api/audit?range={timeRange}` - Overall statistics and chart data
2. `/api/automations` - Automation list for top rankings
3. `/api/runs?limit=10` - Recent execution history

## Technical Implementation

### State Management
```javascript
const [topAutomations, setTopAutomations] = useState([]);
const [recentRuns, setRecentRuns] = useState([]);
const [expandedView, setExpandedView] = useState(false);
```

### Key Functions

#### calculateSuccessRate()
Calculates the success percentage from total and successful runs.

#### exportData()
Generates CSV file from chart data and triggers download.

#### fetchAuditData()
Uses `Promise.all()` to fetch from multiple endpoints concurrently for better performance.

### Run Duration Calculation
```javascript
const duration = run.completedAt
  ? Math.round((new Date(run.completedAt) - new Date(run.startedAt)) / 1000)
  : null;
```

## Updated API Endpoints

### `/api/runs` Route Enhancement
- Now supports `limit` query parameter
- Default limit: 100 runs
- Maximum limit: 100 runs
- Example: `/api/runs?limit=10` returns the 10 most recent runs

## Usage Flow

1. **Navigate to Audit Page** (`/audit`)
2. **Select Time Range**: Daily, Weekly, or Monthly
3. **View Overview Metrics**:
   - Total, Success, Failed, Running, Pending counts
   - Success and failure rate percentages
4. **Analyze Charts**:
   - Status distribution pie chart
   - Execution trend bar chart
5. **Review Top Automations**: See which automations are run most frequently
6. **Check Recent History**:
   - View last 5 runs (or expand to 20)
   - See detailed status, duration, and AWX job IDs
7. **Export Data**: Click Export CSV to download trend data

## Visual Improvements

- **Consistent Styling**: Uses CSS variables for theming
- **Icon Integration**: TrendingUp, TrendingDown, Activity, Download, ChevronDown, ChevronUp
- **Responsive Grid**: Metrics cards adapt to screen size (1 column on mobile, 3 on desktop)
- **Progress Bars**: Visual representation of success/failure rates
- **Numbered Badges**: Clear ranking in top automations list
- **Hover Effects**: Interactive table rows and cards

## Files Modified

1. **`/app/audit/page.jsx`**
   - Added imports: TrendingUp, TrendingDown, Download, ChevronDown, ChevronUp, Activity
   - Enhanced fetchAuditData() with multiple API calls
   - Added exportData() function
   - Added calculateSuccessRate() function
   - Added three performance metric cards
   - Added Top Automations section
   - Added Recent Execution History table
   - Fixed executionCount → runs field mapping

2. **`/app/api/runs/route.js`**
   - Added support for `limit` query parameter
   - Validates and caps limit at 100 runs

## Bug Fixes

- Fixed incorrect field name: Changed `executionCount` to `runs` to match database schema
- Added safe array checking for runs data
- Added proper sorting for top automations

## Future Enhancements (Optional)

- Add filters to recent runs (by status, automation, date range)
- Add real-time refresh/polling
- Add drill-down to individual automation execution details
- Add more granular time range options (hourly, custom range)
- Add export options for different formats (JSON, Excel)
- Add search functionality in recent runs table
- Add pagination for runs table
