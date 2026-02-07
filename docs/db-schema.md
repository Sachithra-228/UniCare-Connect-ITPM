# Database Schema (MongoDB)

## Users

- `_id` (ObjectId)
- `email` (string)
- `name` (string)
- `role` (student | mentor | donor | admin | super_admin)
- `university` (string)
- `contact` (string)
- `profilePic` (string)
- `financialNeedLevel` (low | medium | high)
- `healthPreferences` (array)
- `careerInterests` (array)

## Scholarships

- `_id`
- `title`
- `provider`
- `amount`
- `deadline`
- `eligibilityCriteria`
- `applicationLink`
- `tags`
- `status` (active | expired)

## Job Listings

- `_id`
- `title`
- `company`
- `location`
- `salary`
- `type` (part-time | full-time | internship)
- `requirements` (array)
- `applicationDeadline`
- `contactEmail`

## Health Logs

- `_id`
- `userId`
- `mood`
- `stressLevel`
- `sleepHours`
- `notes`
- `date`
- `recommendations`

## Mentorship Sessions

- `_id`
- `mentorId`
- `studentId`
- `topic`
- `scheduledTime`
- `status` (pending | confirmed | completed)
- `feedback`
