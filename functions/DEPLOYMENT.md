# Sequency Cloud Functions - Deployment Guide

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project** created in the Firebase Console with:
   - Firestore Database enabled
   - Firebase Authentication enabled
   - Cloud Messaging enabled

3. **Authenticated** with Firebase:
   ```bash
   firebase login
   ```

## Local Development

### 1. Install dependencies
```bash
cd functions
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Run emulators for local testing
```bash
# From project root
firebase emulators:start
```

Access the Emulator UI at `http://localhost:4000`

## Deployment

### Deploy all functions
```bash
firebase deploy --only functions
```

### Deploy specific function
```bash
firebase deploy --only functions:syncAttendanceStats
firebase deploy --only functions:notifyAttendance
```

### Deploy Firestore rules and indexes
```bash
firebase deploy --only firestore
```

## Functions Overview

### 1. `syncAttendanceStats`
- **Trigger:** `onDocumentWritten` on `/schools/{schoolId}/attendance/{attendanceId}`
- **Purpose:** Keeps student statistics in sync when attendance records change
- **Updates:**
  - `student.stats.totalAbsences`
  - `student.stats.totalTardies`
  - `student.stats.absencesByPeriod`

### 2. `notifyAttendance`
- **Trigger:** `onDocumentCreated` on `/schools/{schoolId}/attendance/{attendanceId}`
- **Purpose:** Sends push notifications to tutors when students are marked absent
- **Features:**
  - Respects `licenseMode` (silences notifications)
  - Finds tutors via `tutorRelations` collection
  - Logs notifications for audit trail
  - Cleans up invalid FCM tokens

## Monitoring

### View function logs
```bash
firebase functions:log
```

### View specific function logs
```bash
firebase functions:log --only syncAttendanceStats
```

## Testing

### Trigger functions manually (Emulator)
```javascript
// In the Firestore Emulator, create an attendance document:
{
  "studentId": "student123",
  "schoolId": "school456",
  "status": "ABSENT",
  "absenceValue": 1,
  "tardyValue": 0,
  "periodId": "T1",
  "studentName": "Juan García",
  "courseName": "3° A",
  "date": "2024-03-15",
  "dateString": "2024-03-15",
  "createdAt": "2024-03-15T08:00:00Z",
  "updatedAt": "2024-03-15T08:00:00Z",
  "createdBy": "preceptor123",
  "notificationSent": false,
  "isUnderLicense": false
}
```

## Environment Variables

No environment variables required for basic operation.
Firebase Admin SDK uses default service account in Cloud Functions.

## Scaling Considerations

- Functions use `us-central1` region by default
- Idempotency tracking prevents duplicate processing
- FCM tokens are batched for efficient sending
- Invalid tokens are automatically cleaned up

## Cost Optimization

- Functions trigger only on relevant changes
- Idempotency collection auto-cleans after 24 hours
- Batch reads for tutor FCM tokens (max 30 per query)
