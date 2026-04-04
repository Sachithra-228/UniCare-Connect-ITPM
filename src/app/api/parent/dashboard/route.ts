import { NextRequest } from "next/server";
import { demoJobs, demoScholarships } from "@/lib/demo-data";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import {
  buildIdentityClauses,
  buildParentOwnerClauses,
  requireParentIdentity,
  toIsoDate,
  toStringId
} from "@/lib/parent-api-auth";
import { resolveParentLinkedStudent } from "@/lib/parent-link";

type AidRequestDoc = {
  _id?: unknown;
  category?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ApplicationDoc = {
  _id?: unknown;
  kind?: string;
  title?: string;
  organization?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type SessionDoc = {
  _id?: unknown;
  mentorName?: string;
  topic?: string;
  status?: string;
  scheduledTime?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type NotificationDoc = {
  _id?: unknown;
  title?: string;
  message?: string;
  type?: string;
  sectionId?: string;
  read?: boolean;
  date?: string;
  createdAt?: Date | string;
  userId?: string;
  firebaseUid?: string;
  userEmail?: string;
  audienceRoles?: string[];
};

type ResourceDoc = {
  _id?: unknown;
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type TrackerDoc = {
  _id?: unknown;
  title?: string;
  note?: string;
  tag?: string;
  isPinned?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ParentMessageDoc = {
  _id?: unknown;
  audience?: string;
  subject?: string;
  body?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ScholarshipDoc = {
  _id?: unknown;
  title?: string;
  deadline?: string;
  status?: string;
};

type JobDoc = {
  _id?: unknown;
  title?: string;
  applicationDeadline?: string;
  status?: string;
  moderationStatus?: string;
};

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isPendingStatus(value: unknown) {
  const status = normalizeStatus(value);
  return status !== "approved" && status !== "rejected" && status !== "completed" && status !== "cancelled";
}

function buildVisibleNotificationFilters(input: {
  userId?: string;
  firebaseUid?: string;
  email?: string | null;
  role?: string;
}) {
  const clauses: Record<string, unknown>[] = [];
  if (input.userId) clauses.push({ userId: input.userId });
  if (input.firebaseUid) clauses.push({ firebaseUid: input.firebaseUid });
  if (input.email) clauses.push({ userEmail: String(input.email).toLowerCase() });
  if (input.role) clauses.push({ audienceRoles: input.role });
  return clauses;
}

function notificationIsAlert(item: { type?: string; title?: string; message?: string }) {
  const text = `${item.type ?? ""} ${item.title ?? ""} ${item.message ?? ""}`.toLowerCase();
  return (
    text.includes("alert") ||
    text.includes("urgent") ||
    text.includes("warning") ||
    text.includes("deadline") ||
    text.includes("missing")
  );
}

function mapAidRequest(item: AidRequestDoc) {
  return {
    _id: toStringId(item._id),
    category: String(item.category ?? "Support request"),
    status: String(item.status ?? "pending"),
    submittedAt: String((item.submittedAt ?? toIsoDate(item.createdAt)) || "").slice(0, 10),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

function mapApplication(item: ApplicationDoc) {
  return {
    _id: toStringId(item._id),
    kind: String(item.kind ?? "application"),
    title: String(item.title ?? "Application"),
    organization: String(item.organization ?? ""),
    status: String(item.status ?? "Pending"),
    submittedAt: String((item.submittedAt ?? toIsoDate(item.createdAt)) || "").slice(0, 10),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

function mapSession(item: SessionDoc) {
  return {
    _id: toStringId(item._id),
    mentorName: String(item.mentorName ?? "Mentor"),
    topic: String(item.topic ?? "Session"),
    status: String(item.status ?? "pending"),
    scheduledTime: String(item.scheduledTime ?? ""),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

function mapNotification(item: NotificationDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Update"),
    message: String(item.message ?? ""),
    type: String(item.type ?? ""),
    sectionId: String(item.sectionId ?? ""),
    read: Boolean(item.read),
    date: String((item.date ?? toIsoDate(item.createdAt)) || "").slice(0, 10),
    createdAt: toIsoDate(item.createdAt)
  };
}

function mapResource(item: ResourceDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Resource"),
    type: String(item.type ?? "Guide"),
    description: String(item.description ?? ""),
    url: String(item.url ?? ""),
    createdAt: toIsoDate(item.createdAt),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

function mapTracker(item: TrackerDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Private note"),
    note: String(item.note ?? ""),
    tag: String(item.tag ?? "general"),
    isPinned: Boolean(item.isPinned),
    createdAt: toIsoDate(item.createdAt),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

function mapParentMessage(item: ParentMessageDoc) {
  return {
    _id: toStringId(item._id),
    audience: String(item.audience ?? "University Admin / Faculty"),
    subject: String(item.subject ?? "Message"),
    body: String(item.body ?? ""),
    status: String(item.status ?? "sent"),
    createdAt: toIsoDate(item.createdAt),
    updatedAt: toIsoDate(item.updatedAt ?? item.createdAt)
  };
}

function mapScholarship(item: ScholarshipDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Scholarship"),
    deadline: String(item.deadline ?? ""),
    status: String(item.status ?? "active")
  };
}

function mapJob(item: JobDoc) {
  return {
    _id: toStringId(item._id),
    title: String(item.title ?? "Job listing"),
    applicationDeadline: String(item.applicationDeadline ?? ""),
    status: String(item.status ?? "active"),
    moderationStatus: String(item.moderationStatus ?? "Approved")
  };
}

export async function GET(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const parentIdentity = parent.identity;

  if (isDemoMode()) {
    const now = new Date().toISOString();
    const scholarships = demoScholarships.map((item) => mapScholarship(item));
    const jobs = demoJobs.map((item) => mapJob({ ...item, status: "active", moderationStatus: "Approved" }));
    const upcomingDates = [
      ...scholarships
        .filter((item) => item.deadline)
        .map((item) => ({ id: item._id, label: item.title, date: item.deadline, source: "scholarship" })),
      ...jobs
        .filter((item) => item.applicationDeadline)
        .map((item) => ({ id: item._id, label: item.title, date: item.applicationDeadline, source: "job" }))
    ]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 12);

    return jsonResponse({
      linkedStudent: {
        _id: "u1",
        name: "Demo Student",
        email: "student@unicare.lk",
        linkSource: "name"
      },
      stats: {
        unreadAlerts: 0,
        notifications: 0,
        aidRequests: 0,
        pendingAidRequests: 0,
        applications: 0,
        pendingApplications: 0,
        mentorshipSessions: 0,
        upcomingDeadlines: upcomingDates.length,
        privateTrackingNotes: 0
      },
      notifications: [],
      alerts: [],
      aidRequests: [],
      applications: [],
      mentorshipSessions: [],
      scholarships,
      jobs,
      upcomingDates,
      resources: [],
      trackerNotes: [],
      communications: [],
      generatedAt: now
    });
  }

  try {
    const database = await getMongoDatabase();
    const linkedStudent = await resolveParentLinkedStudent(database, parentIdentity.roleDetails);

    const linkedStudentId = String(linkedStudent?._id ?? "").trim();
    const linkedStudentFirebaseUid = String(linkedStudent?.firebaseUid ?? "").trim();

    const parentNotificationFilters = buildVisibleNotificationFilters({
      userId: parentIdentity.userId,
      firebaseUid: parentIdentity.firebaseUid,
      email: parentIdentity.email,
      role: "parent"
    });

    const linkedStudentNotificationFilters = buildVisibleNotificationFilters({
      userId: linkedStudentId,
      firebaseUid: linkedStudentFirebaseUid,
      role: linkedStudent ? "student" : undefined
    });

    const aidClauses = buildIdentityClauses({
      userId: linkedStudentId,
      firebaseUid: linkedStudentFirebaseUid
    });
    const appClauses = buildIdentityClauses({
      userId: linkedStudentId,
      firebaseUid: linkedStudentFirebaseUid
    });
    const sessionsFilter = linkedStudent
      ? {
          $or: [
            ...(linkedStudentId ? [{ studentId: linkedStudentId }] : []),
            ...(linkedStudentFirebaseUid ? [{ studentFirebaseUid: linkedStudentFirebaseUid }] : [])
          ]
        }
      : { _id: { $exists: false } };

    const notificationsPromise = parentNotificationFilters.length
      ? database
          .collection<NotificationDoc>("notifications")
          .find({ $or: parentNotificationFilters })
          .sort({ createdAt: -1 })
          .limit(40)
          .toArray()
      : Promise.resolve([] as NotificationDoc[]);

    const studentNotificationsPromise = linkedStudentNotificationFilters.length
      ? database
          .collection<NotificationDoc>("notifications")
          .find({ $or: linkedStudentNotificationFilters })
          .sort({ createdAt: -1 })
          .limit(25)
          .toArray()
      : Promise.resolve([] as NotificationDoc[]);

    const aidPromise =
      aidClauses.length > 0
        ? database
            .collection<AidRequestDoc>("aid_requests")
            .find({ $or: aidClauses })
            .sort({ createdAt: -1 })
            .limit(25)
            .toArray()
        : Promise.resolve([] as AidRequestDoc[]);

    const applicationsPromise =
      appClauses.length > 0
        ? database
            .collection<ApplicationDoc>("my_applications")
            .find({ $or: appClauses })
            .sort({ createdAt: -1 })
            .limit(25)
            .toArray()
        : Promise.resolve([] as ApplicationDoc[]);

    const [notificationsRaw, studentNotificationsRaw, aidRaw, applicationsRaw, sessionsRaw, resourcesRaw, trackerRaw, communicationsRaw, scholarshipsRaw, jobsRaw] =
      await Promise.all([
        notificationsPromise,
        studentNotificationsPromise,
        aidPromise,
        applicationsPromise,
        database.collection<SessionDoc>("mentorship_sessions").find(sessionsFilter).sort({ updatedAt: -1 }).limit(25).toArray(),
        database
          .collection<ResourceDoc>("parent_resources")
          .find({
            $or: buildParentOwnerClauses({
              userId: parentIdentity.userId,
              firebaseUid: parentIdentity.firebaseUid,
              email: parentIdentity.email
            })
          })
          .sort({ updatedAt: -1 })
          .limit(50)
          .toArray(),
        database
          .collection<TrackerDoc>("parent_tracker_notes")
          .find({
            $or: buildParentOwnerClauses({
              userId: parentIdentity.userId,
              firebaseUid: parentIdentity.firebaseUid
            }),
            ...(linkedStudentId ? { linkedStudentId } : {})
          })
          .sort({ isPinned: -1, updatedAt: -1 })
          .limit(50)
          .toArray(),
        database
          .collection<ParentMessageDoc>("parent_communications")
          .find({
            $or: buildParentOwnerClauses({
              userId: parentIdentity.userId,
              firebaseUid: parentIdentity.firebaseUid
            })
          })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray(),
        database
          .collection<ScholarshipDoc>("scholarships")
          .find({})
          .sort({ deadline: 1, createdAt: -1 })
          .limit(40)
          .toArray(),
        database
          .collection<JobDoc>("jobs")
          .find({ status: "active", moderationStatus: "Approved" })
          .sort({ applicationDeadline: 1, createdAt: -1 })
          .limit(40)
          .toArray()
      ]);

    const notifications = notificationsRaw.map(mapNotification);
    const studentNotifications = studentNotificationsRaw.map((item) => ({
      ...mapNotification(item),
      title: `[Student update] ${String(item.title ?? "Update")}`
    }));

    const mergedNotificationMap = new Map<string, ReturnType<typeof mapNotification>>();
    [...notifications, ...studentNotifications].forEach((item) => {
      mergedNotificationMap.set(item._id || `${item.title}-${item.date}-${item.message}`, item);
    });
    const mergedNotifications = Array.from(mergedNotificationMap.values()).sort((a, b) =>
      (b.createdAt || b.date).localeCompare(a.createdAt || a.date)
    );

    const aidRequests = aidRaw.map(mapAidRequest);
    const applications = applicationsRaw.map(mapApplication);
    const mentorshipSessions = sessionsRaw.map(mapSession);
    const resources = resourcesRaw.map(mapResource);
    const trackerNotes = trackerRaw.map(mapTracker);
    const communications = communicationsRaw.map(mapParentMessage);

    const fallbackScholarships = scholarshipsRaw.length ? scholarshipsRaw.map(mapScholarship) : demoScholarships.map(mapScholarship);
    const fallbackJobs = jobsRaw.length
      ? jobsRaw.map(mapJob)
      : demoJobs.map((item) => mapJob({ ...item, status: "active", moderationStatus: "Approved" }));

    const today = new Date().toISOString().slice(0, 10);
    const upcomingDates = [
      ...fallbackScholarships
        .filter((item) => item.deadline && item.deadline >= today)
        .map((item) => ({ id: item._id, label: item.title, date: item.deadline, source: "scholarship" })),
      ...fallbackJobs
        .filter((item) => item.applicationDeadline && item.applicationDeadline >= today)
        .map((item) => ({ id: item._id, label: item.title, date: item.applicationDeadline, source: "job" })),
      ...aidRequests
        .filter((item) => item.submittedAt && item.submittedAt >= today)
        .map((item) => ({
          id: item._id,
          label: `${item.category} update`,
          date: item.submittedAt,
          source: "aid"
        }))
    ]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(0, 20);

    const alerts = mergedNotifications.filter((item) => notificationIsAlert(item)).slice(0, 20);

    const pendingAidRequests = aidRequests.filter((item) => isPendingStatus(item.status)).length;
    const pendingApplications = applications.filter((item) => isPendingStatus(item.status)).length;

    return jsonResponse({
      linkedStudent: linkedStudent
        ? {
            _id: linkedStudent._id,
            name: linkedStudent.name ?? "Student",
            email: linkedStudent.email ?? "",
            university: linkedStudent.university ?? "",
            linkSource: linkedStudent.linkSource
          }
        : null,
      stats: {
        unreadAlerts: mergedNotifications.filter((item) => !item.read).length,
        notifications: mergedNotifications.length,
        aidRequests: aidRequests.length,
        pendingAidRequests,
        applications: applications.length,
        pendingApplications,
        mentorshipSessions: mentorshipSessions.length,
        upcomingDeadlines: upcomingDates.length,
        privateTrackingNotes: trackerNotes.length
      },
      notifications: mergedNotifications.slice(0, 20),
      alerts,
      aidRequests,
      applications,
      mentorshipSessions,
      scholarships: fallbackScholarships.slice(0, 20),
      jobs: fallbackJobs.slice(0, 20),
      upcomingDates,
      resources,
      trackerNotes,
      communications,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        {
          message: "Database temporarily unavailable. Please try again later.",
          code: "MongoUnavailable"
        },
        503
      );
    }
    throw error;
  }
}
