import { Db, ObjectId } from "mongodb";
import { NextRequest } from "next/server";
import {
  isDemoMode,
  isMongoConnectionError,
  jsonResponse
} from "@/lib/api";
import {
  addDemoCampusLifeItem,
  deleteDemoCampusLifeItem,
  getDemoCampusLife,
  setDemoCampusLifeItemActive,
  updateDemoCampusLifeItem
} from "@/lib/campus-life-demo-store";
import {
  CampusEventType,
  CampusLifeCreateInput
} from "@/lib/campus-life-types";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

const CAMPUS_COLLECTIONS = {
  event: "campus_events",
  club: "campus_clubs",
  announcement: "campus_announcements",
  discount: "campus_discounts",
  volunteer: "campus_volunteer_roles"
} as const;

const VALID_EVENT_TYPES: CampusEventType[] = ["academic", "social", "career"];

type CampusDocument = {
  _id?: { toString: () => string };
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  type?: string;
  description?: string;
  name?: string;
  category?: string;
  body?: string;
  org?: string;
  hoursPerWeek?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type InteractionDocument = {
  itemType?: string;
  itemId?: string;
  value?: boolean;
};

type CampusContentType = keyof typeof CAMPUS_COLLECTIONS;

function safeText(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function isCampusContentType(value: string): value is CampusContentType {
  return value in CAMPUS_COLLECTIONS;
}

function parseCampusUpdate(type: CampusContentType, payload: Record<string, unknown>) {
  if (type === "announcement") {
    const nextTitle = payload.title !== undefined ? safeText(payload.title, 180) : undefined;
    const nextDate = payload.date !== undefined ? safeText(payload.date, 20) : undefined;
    const nextBody = payload.body !== undefined ? safeText(payload.body, 600) : undefined;
    if (nextTitle === "" || nextDate === "" || nextBody === "") return null;

    const set: Record<string, unknown> = {};
    if (nextTitle !== undefined) set.title = nextTitle;
    if (nextDate !== undefined) set.date = nextDate;
    if (nextBody !== undefined) set.body = nextBody;
    return Object.keys(set).length ? set : null;
  }

  if (type === "event") {
    const nextTitle = payload.title !== undefined ? safeText(payload.title, 180) : undefined;
    const nextDate = payload.date !== undefined ? safeText(payload.date, 20) : undefined;
    const nextTime = payload.time !== undefined ? safeText(payload.time, 40) : undefined;
    const nextLocation = payload.location !== undefined ? safeText(payload.location, 120) : undefined;
    const nextDescription = payload.description !== undefined ? safeText(payload.description, 500) : undefined;
    const nextEventTypeRaw =
      payload.eventType !== undefined ? safeText(payload.eventType, 32).toLowerCase() : undefined;
    const nextEventType =
      nextEventTypeRaw && VALID_EVENT_TYPES.includes(nextEventTypeRaw as CampusEventType)
        ? (nextEventTypeRaw as CampusEventType)
        : undefined;

    if (
      nextTitle === "" ||
      nextDate === "" ||
      nextTime === "" ||
      nextLocation === "" ||
      nextDescription === "" ||
      (nextEventTypeRaw !== undefined && !nextEventType)
    ) {
      return null;
    }

    const set: Record<string, unknown> = {};
    if (nextTitle !== undefined) set.title = nextTitle;
    if (nextDate !== undefined) set.date = nextDate;
    if (nextTime !== undefined) set.time = nextTime;
    if (nextLocation !== undefined) set.location = nextLocation;
    if (nextDescription !== undefined) set.description = nextDescription;
    if (nextEventType !== undefined) set.type = nextEventType;
    return Object.keys(set).length ? set : null;
  }

  return null;
}

function parseCreateInput(payload: Record<string, unknown>) {
  const type = safeText(payload.type, 32).toLowerCase();
  if (type === "event") {
    const eventTypeRaw = safeText(payload.eventType, 32).toLowerCase();
    const eventType = VALID_EVENT_TYPES.includes(eventTypeRaw as CampusEventType)
      ? (eventTypeRaw as CampusEventType)
      : "social";
    const title = safeText(payload.title, 180);
    const date = safeText(payload.date, 20);
    const time = safeText(payload.time, 40);
    const location = safeText(payload.location, 120);
    const description = safeText(payload.description, 500);
    if (!title || !date || !time || !location || !description) return null;
    const input: CampusLifeCreateInput = {
      type: "event",
      title,
      date,
      time,
      location,
      eventType,
      description
    };
    return input;
  }

  if (type === "club") {
    const name = safeText(payload.name, 140);
    const category = safeText(payload.category, 80);
    const description = safeText(payload.description, 500);
    if (!name || !category || !description) return null;
    const input: CampusLifeCreateInput = { type: "club", name, category, description };
    return input;
  }

  if (type === "announcement") {
    const title = safeText(payload.title, 180);
    const date = safeText(payload.date, 20);
    const body = safeText(payload.body, 600);
    if (!title || !date || !body) return null;
    const input: CampusLifeCreateInput = { type: "announcement", title, date, body };
    return input;
  }

  if (type === "discount") {
    const name = safeText(payload.name, 140);
    const category = safeText(payload.category, 80);
    const description = safeText(payload.description, 500);
    const location = safeText(payload.location, 120);
    if (!name || !category || !description || !location) return null;
    const input: CampusLifeCreateInput = {
      type: "discount",
      name,
      category,
      description,
      location
    };
    return input;
  }

  if (type === "volunteer") {
    const title = safeText(payload.title, 180);
    const org = safeText(payload.org, 140);
    const hoursPerWeek = safeText(payload.hoursPerWeek, 80);
    const location = safeText(payload.location, 120);
    const description = safeText(payload.description, 500);
    if (!title || !org || !hoursPerWeek || !location || !description) return null;
    const input: CampusLifeCreateInput = {
      type: "volunteer",
      title,
      org,
      hoursPerWeek,
      location,
      description
    };
    return input;
  }

  return null;
}

async function seedCollectionIfEmpty(database: Db, collectionName: string, docs: Record<string, unknown>[]) {
  const collection = database.collection(collectionName);
  const exists = await collection.findOne({}, { projection: { _id: 1 } });
  if (exists || !docs.length) return;
  await collection.insertMany(docs);
}

async function ensureCampusSeedData(database: Db) {
  const now = new Date();
  await Promise.all([
    seedCollectionIfEmpty(database, CAMPUS_COLLECTIONS.event, [
      {
        title: "Career Fair - Tech and Startups",
        date: "2026-04-10",
        time: "10:00-16:00",
        location: "Main Hall",
        type: "career",
        description: "Meet startups and employers offering internships and graduate roles.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        title: "Mindfulness Evening",
        date: "2026-04-05",
        time: "17:30-19:00",
        location: "Counseling Centre",
        type: "social",
        description: "Guided meditation and breathing sessions with the university wellness team.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]),
    seedCollectionIfEmpty(database, CAMPUS_COLLECTIONS.club, [
      {
        name: "Developer Student Club",
        category: "Tech",
        description: "Workshops on web, mobile, cloud, and hackathon projects.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Rotaract - Community Service",
        category: "Community",
        description: "Community and environmental service programs around campus.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]),
    seedCollectionIfEmpty(database, CAMPUS_COLLECTIONS.announcement, [
      {
        title: "Library Opening Hours - Mid-term",
        date: "2026-03-30",
        body: "Library will be open 8:00 AM to 9:00 PM, Monday to Friday, during mid-term.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        title: "New Shuttle Route to Campus",
        date: "2026-03-28",
        body: "A new shuttle route from Fort to campus via Town Hall starts next week.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]),
    seedCollectionIfEmpty(database, CAMPUS_COLLECTIONS.discount, [
      {
        name: "Cafe Colombo",
        category: "Food and Drink",
        description: "15% off hot drinks with your student ID.",
        location: "Near main gate",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: "BookNest",
        category: "Books",
        description: "10% off textbooks and stationery.",
        location: "Opposite science faculty",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]),
    seedCollectionIfEmpty(database, CAMPUS_COLLECTIONS.volunteer, [
      {
        title: "Peer Mentor - First-year Students",
        org: "Student Affairs",
        hoursPerWeek: "2-3 hours",
        location: "On campus",
        description: "Help first-year students with settling in and finding key support services.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        title: "Community Tutoring - Mathematics",
        org: "Community Outreach Unit",
        hoursPerWeek: "3 hours",
        location: "Online / nearby schools",
        description: "Tutor O/L or A/L students in mathematics once a week.",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ])
  ]);
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const scope = request.nextUrl.searchParams.get("scope");
  const isAdmin = ["admin", "super_admin"].includes(authResult.session.user?.role ?? "");
  if (scope === "admin" && !isAdmin) {
    const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
    if (roleCheck) return roleCheck;
  }

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const includeInactive = scope === "admin" && isAdmin;

  if (isDemoMode()) {
    return jsonResponse(getDemoCampusLife(userId, firebaseUid, includeInactive));
  }

  try {
    const database = await getMongoDatabase();
    await ensureCampusSeedData(database);

    const [events, clubs, announcements, discounts, volunteerRoles, interactions] = await Promise.all([
      database
        .collection(CAMPUS_COLLECTIONS.event)
        .find(includeInactive ? {} : { isActive: { $ne: false } })
        .sort({ date: -1, createdAt: -1 })
        .toArray(),
      database
        .collection(CAMPUS_COLLECTIONS.club)
        .find(includeInactive ? {} : { isActive: { $ne: false } })
        .sort({ createdAt: -1 })
        .toArray(),
      database
        .collection(CAMPUS_COLLECTIONS.announcement)
        .find(includeInactive ? {} : { isActive: { $ne: false } })
        .sort({ date: -1, createdAt: -1 })
        .toArray(),
      database
        .collection(CAMPUS_COLLECTIONS.discount)
        .find(includeInactive ? {} : { isActive: { $ne: false } })
        .sort({ createdAt: -1 })
        .toArray(),
      database
        .collection(CAMPUS_COLLECTIONS.volunteer)
        .find(includeInactive ? {} : { isActive: { $ne: false } })
        .sort({ createdAt: -1 })
        .toArray(),
      database
        .collection("campus_life_interactions")
        .find({
          $or: [...(userId ? [{ userId }] : []), ...(firebaseUid ? [{ firebaseUid }] : [])]
        })
        .toArray()
    ]);

    const interactionMap = new Map<string, boolean>();
    interactions.forEach((item) => {
      const row = item as InteractionDocument;
      const interactionType = String(row.itemType ?? "").trim();
      const itemId = String(row.itemId ?? "").trim();
      if (!interactionType || !itemId) return;
      interactionMap.set(`${interactionType}:${itemId}`, Boolean(row.value));
    });

    return jsonResponse({
      events: events.map((item: CampusDocument) => {
        const id = item._id?.toString?.() ?? "";
        return {
          id,
          title: String(item.title ?? ""),
          date: String(item.date ?? ""),
          time: String(item.time ?? ""),
          location: String(item.location ?? ""),
          type: VALID_EVENT_TYPES.includes(String(item.type ?? "") as CampusEventType)
            ? String(item.type ?? "")
            : "social",
          description: String(item.description ?? ""),
          interested: Boolean(interactionMap.get(`event:${id}`)),
          isActive: item.isActive !== false
        };
      }),
      clubs: clubs.map((item: CampusDocument) => {
        const id = item._id?.toString?.() ?? "";
        return {
          id,
          name: String(item.name ?? ""),
          category: String(item.category ?? ""),
          description: String(item.description ?? ""),
          joined: Boolean(interactionMap.get(`club:${id}`)),
          isActive: item.isActive !== false
        };
      }),
      announcements: announcements.map((item: CampusDocument) => {
        const id = item._id?.toString?.() ?? "";
        return {
          id,
          title: String(item.title ?? ""),
          date: String(item.date ?? ""),
          body: String(item.body ?? ""),
          read: Boolean(interactionMap.get(`announcement:${id}`)),
          isActive: item.isActive !== false
        };
      }),
      discounts: discounts.map((item: CampusDocument) => {
        const id = item._id?.toString?.() ?? "";
        return {
          id,
          name: String(item.name ?? ""),
          category: String(item.category ?? ""),
          description: String(item.description ?? ""),
          location: String(item.location ?? ""),
          used: Boolean(interactionMap.get(`discount:${id}`)),
          isActive: item.isActive !== false
        };
      }),
      volunteerRoles: volunteerRoles.map((item: CampusDocument) => {
        const id = item._id?.toString?.() ?? "";
        return {
          id,
          title: String(item.title ?? ""),
          org: String(item.org ?? ""),
          hoursPerWeek: String(item.hoursPerWeek ?? ""),
          location: String(item.location ?? ""),
          description: String(item.description ?? ""),
          signedUp: Boolean(interactionMap.get(`volunteer:${id}`)),
          isActive: item.isActive !== false
        };
      })
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(getDemoCampusLife(userId, firebaseUid, includeInactive));
    }
    throw error;
  }
}

function buildInsertDocument(
  input: CampusLifeCreateInput,
  createdBy?: string
) {
  const now = new Date();
  if (input.type === "event") {
    return {
      collection: CAMPUS_COLLECTIONS.event,
      document: {
        title: input.title,
        date: input.date,
        time: input.time,
        location: input.location,
        type: input.eventType,
        description: input.description,
        isActive: true,
        createdBy,
        createdAt: now,
        updatedAt: now
      }
    };
  }
  if (input.type === "club") {
    return {
      collection: CAMPUS_COLLECTIONS.club,
      document: {
        name: input.name,
        category: input.category,
        description: input.description,
        isActive: true,
        createdBy,
        createdAt: now,
        updatedAt: now
      }
    };
  }
  if (input.type === "announcement") {
    return {
      collection: CAMPUS_COLLECTIONS.announcement,
      document: {
        title: input.title,
        date: input.date,
        body: input.body,
        isActive: true,
        createdBy,
        createdAt: now,
        updatedAt: now
      }
    };
  }
  if (input.type === "discount") {
    return {
      collection: CAMPUS_COLLECTIONS.discount,
      document: {
        name: input.name,
        category: input.category,
        description: input.description,
        location: input.location,
        isActive: true,
        createdBy,
        createdAt: now,
        updatedAt: now
      }
    };
  }
  return {
    collection: CAMPUS_COLLECTIONS.volunteer,
    document: {
      title: input.title,
      org: input.org,
      hoursPerWeek: input.hoursPerWeek,
      location: input.location,
      description: input.description,
      isActive: true,
      createdBy,
      createdAt: now,
      updatedAt: now
    }
  };
}

async function createCampusNotifications(database: Db, input: CampusLifeCreateInput) {
  const primaryTitle =
    input.type === "event"
      ? "New campus event"
      : input.type === "club"
        ? "New club available"
        : input.type === "announcement"
          ? "New campus announcement"
          : input.type === "discount"
            ? "New student discount"
            : "New volunteer opportunity";
  const primaryMessage =
    input.type === "event"
      ? `${input.title} was added to Campus Life.`
      : input.type === "club"
        ? `${input.name} was added to Clubs and Societies.`
        : input.type === "announcement"
          ? input.title
          : input.type === "discount"
            ? `${input.name} student offer is now available.`
            : `${input.title} is open for student sign-up.`;

  await Promise.allSettled([
    createNotification(database, {
      audienceRoles: ["student"],
      title: primaryTitle,
      message: primaryMessage,
      type: "campus-life",
      sectionId: "campus-life"
    }),
    ...(input.type === "event" || input.type === "announcement" || input.type === "volunteer"
      ? [
          createNotification(database, {
            audienceRoles: ["parent"],
            title: "Campus Life update",
            message: primaryMessage,
            type: "campus-life",
            sectionId: input.type === "announcement" ? "communications" : "important-dates"
          })
        ]
      : []),
    ...(input.type === "event" && input.eventType === "career"
      ? [
          createNotification(database, {
            audienceRoles: ["employer"],
            title: "New campus recruitment event",
            message: `${input.title} has been added to the campus events feed.`,
            type: "campus-life",
            sectionId: "campus-connect"
          })
        ]
      : [])
  ]);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const parsedInput = parseCreateInput(payload);
  if (!parsedInput) {
    return jsonResponse({ message: "Invalid campus content payload." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    const created = addDemoCampusLifeItem(parsedInput);
    return jsonResponse({ message: "Campus content created", data: created }, 201);
  }

  const database = await getMongoDatabase();
  const createdBy = authResult.session.user?._id ?? authResult.session.firebase.uid;
  const insert = buildInsertDocument(parsedInput, createdBy);
  const result = await database.collection(insert.collection).insertOne(insert.document);
  await createCampusNotifications(database, parsedInput);

  return jsonResponse(
    {
      message: "Campus content created",
      data: {
        ...insert.document,
        _id: result.insertedId.toString(),
        type: parsedInput.type
      }
    },
    201
  );
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const action = safeText(payload.action, 24).toLowerCase();
  const type = safeText(payload.type, 32).toLowerCase();
  const id = safeText(payload.id, 64);

  if (!isCampusContentType(type)) {
    return jsonResponse({ message: "Invalid campus content type." }, 400);
  }
  if (!id) {
    return jsonResponse({ message: "Content id is required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (action === "update") {
    const updates = parseCampusUpdate(type, payload);
    if (!updates) {
      return jsonResponse({ message: "Invalid campus content update payload." }, 400);
    }

    if (isDemoMode()) {
      const updated = updateDemoCampusLifeItem(type, id, updates);
      if (!updated) {
        return jsonResponse({ message: "Campus content not found." }, 404);
      }
      return jsonResponse({ message: "Campus content updated." });
    }

    if (!ObjectId.isValid(id)) {
      return jsonResponse({ message: "Invalid campus content id." }, 400);
    }

    const database = await getMongoDatabase();
    const collection = database.collection(CAMPUS_COLLECTIONS[type]);
    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!updated) {
      return jsonResponse({ message: "Campus content not found." }, 404);
    }

    const contentTitle =
      type === "announcement"
        ? String((updated as { title?: string }).title ?? "Campus announcement")
        : String((updated as { title?: string }).title ?? "Campus event");

    await createNotification(database, {
      audienceRoles: ["student"],
      title: "Campus update edited",
      message: `${contentTitle} has been updated by admin.`,
      type: "campus-life",
      sectionId: "campus-life"
    });

    return jsonResponse({ message: "Campus content updated." });
  }

  const nextActive = payload.isActive;
  if (typeof nextActive !== "boolean") {
    return jsonResponse({ message: "isActive must be true or false." }, 400);
  }

  if (isDemoMode()) {
    const updated = setDemoCampusLifeItemActive(type, id, nextActive);
    if (!updated) {
      return jsonResponse({ message: "Campus content not found." }, 404);
    }
    return jsonResponse({
      message: nextActive ? "Campus content restored." : "Campus content archived."
    });
  }

  if (!ObjectId.isValid(id)) {
    return jsonResponse({ message: "Invalid campus content id." }, 400);
  }

  const database = await getMongoDatabase();
  const collection = database.collection(CAMPUS_COLLECTIONS[type]);
  const updateResult = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isActive: nextActive, updatedAt: new Date() } }
  );

  if (!updateResult.matchedCount) {
    return jsonResponse({ message: "Campus content not found." }, 404);
  }

  if (nextActive) {
    await createNotification(database, {
      audienceRoles: ["student"],
      title: "Campus update restored",
      message: "A campus update has been restored in your Campus Life feed.",
      type: "campus-life",
      sectionId: "campus-life"
    });
  }

  return jsonResponse({
    message: nextActive ? "Campus content restored." : "Campus content archived."
  });
}

export async function DELETE(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const type = safeText(payload.type, 32).toLowerCase();
  const id = safeText(payload.id, 64);

  if (!isCampusContentType(type)) {
    return jsonResponse({ message: "Invalid campus content type." }, 400);
  }
  if (!id) {
    return jsonResponse({ message: "Content id is required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    const deleted = deleteDemoCampusLifeItem(type, id);
    if (!deleted) {
      return jsonResponse(
        { message: "Item not found or still active. Archive it first before permanent deletion." },
        409
      );
    }
    return jsonResponse({ message: "Campus content permanently deleted." });
  }

  if (!ObjectId.isValid(id)) {
    return jsonResponse({ message: "Invalid campus content id." }, 400);
  }

  const database = await getMongoDatabase();
  const collection = database.collection(CAMPUS_COLLECTIONS[type]);
  const objectId = new ObjectId(id);
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) {
    return jsonResponse({ message: "Campus content not found." }, 404);
  }

  if ((existing as { isActive?: boolean }).isActive !== false) {
    return jsonResponse(
      { message: "Only archived items can be permanently deleted." },
      409
    );
  }

  const [contentDeleteResult] = await Promise.all([
    collection.deleteOne({ _id: objectId }),
    database.collection("campus_life_interactions").deleteMany({ itemType: type, itemId: id })
  ]);

  if (!contentDeleteResult.deletedCount) {
    return jsonResponse({ message: "Campus content not found." }, 404);
  }

  return jsonResponse({ message: "Campus content permanently deleted." });
}
