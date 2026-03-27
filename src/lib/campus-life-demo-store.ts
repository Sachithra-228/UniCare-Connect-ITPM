import {
  CampusLifeCreateInput,
  CampusLifeInteractionType,
  CampusLifePayload,
  CampusEventType
} from "@/lib/campus-life-types";

type DemoCampusEvent = {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: CampusEventType;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoCampusClub = {
  _id: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoCampusAnnouncement = {
  _id: string;
  title: string;
  date: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoCampusDiscount = {
  _id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoCampusVolunteerRole = {
  _id: string;
  title: string;
  org: string;
  hoursPerWeek: string;
  location: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DemoCampusInteraction = {
  _id: string;
  itemType: CampusLifeInteractionType;
  itemId: string;
  value: boolean;
  userId?: string;
  firebaseUid?: string;
  createdAt: string;
  updatedAt: string;
};

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

let events: DemoCampusEvent[] = [
  {
    _id: "ce1",
    title: "Career Fair - Tech and Startups",
    date: "2026-04-10",
    time: "10:00-16:00",
    location: "Main Hall",
    type: "career",
    description: "Meet startups and employers offering internships and graduate roles.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    _id: "ce2",
    title: "Mindfulness Evening",
    date: "2026-04-05",
    time: "17:30-19:00",
    location: "Counseling Centre",
    type: "social",
    description: "Guided meditation and breathing sessions with the university wellness team.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

let clubs: DemoCampusClub[] = [
  {
    _id: "cc1",
    name: "Developer Student Club",
    category: "Tech",
    description: "Workshops on web, mobile, cloud, and hackathon projects.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    _id: "cc2",
    name: "Rotaract - Community Service",
    category: "Community",
    description: "Community and environmental service programs around campus.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

let announcements: DemoCampusAnnouncement[] = [
  {
    _id: "ca1",
    title: "Library Opening Hours - Mid-term",
    date: "2026-03-30",
    body: "Library will be open 8:00 AM to 9:00 PM, Monday to Friday, during mid-term.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    _id: "ca2",
    title: "New Shuttle Route to Campus",
    date: "2026-03-28",
    body: "A new shuttle route from Fort to campus via Town Hall starts next week.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

let discounts: DemoCampusDiscount[] = [
  {
    _id: "cd1",
    name: "Cafe Colombo",
    category: "Food and Drink",
    description: "15% off hot drinks with your student ID.",
    location: "Near main gate",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    _id: "cd2",
    name: "BookNest",
    category: "Books",
    description: "10% off textbooks and stationery.",
    location: "Opposite science faculty",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

let volunteerRoles: DemoCampusVolunteerRole[] = [
  {
    _id: "cv1",
    title: "Peer Mentor - First-year Students",
    org: "Student Affairs",
    hoursPerWeek: "2-3 hours",
    location: "On campus",
    description: "Help first-year students with settling in and finding key support services.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    _id: "cv2",
    title: "Community Tutoring - Mathematics",
    org: "Community Outreach Unit",
    hoursPerWeek: "3 hours",
    location: "Online / nearby schools",
    description: "Tutor O/L or A/L students in mathematics once a week.",
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
];

let interactions: DemoCampusInteraction[] = [];

function matchesUser(
  interaction: DemoCampusInteraction,
  userId?: string,
  firebaseUid?: string
) {
  if (userId && interaction.userId === userId) return true;
  if (firebaseUid && interaction.firebaseUid === firebaseUid) return true;
  return false;
}

function buildInteractionMap(userId?: string, firebaseUid?: string) {
  const map = new Map<string, boolean>();
  interactions
    .filter((item) => matchesUser(item, userId, firebaseUid))
    .forEach((item) => {
      map.set(`${item.itemType}:${item.itemId}`, item.value);
    });
  return map;
}

function sortByDateDesc<T extends { createdAt?: string; date?: string }>(list: T[]) {
  return list
    .slice()
    .sort((a, b) => {
      const first = Date.parse(a.date ?? a.createdAt ?? "");
      const second = Date.parse(b.date ?? b.createdAt ?? "");
      return (Number.isNaN(second) ? 0 : second) - (Number.isNaN(first) ? 0 : first);
    });
}

export function getDemoCampusLife(userId?: string, firebaseUid?: string): CampusLifePayload {
  const interactionMap = buildInteractionMap(userId, firebaseUid);
  return {
    events: sortByDateDesc(events)
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        id: item._id,
        title: item.title,
        date: item.date,
        time: item.time,
        location: item.location,
        type: item.type,
        description: item.description,
        interested: Boolean(interactionMap.get(`event:${item._id}`))
      })),
    clubs: sortByDateDesc(clubs)
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        description: item.description,
        joined: Boolean(interactionMap.get(`club:${item._id}`))
      })),
    announcements: sortByDateDesc(announcements)
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        id: item._id,
        title: item.title,
        date: item.date,
        body: item.body,
        read: Boolean(interactionMap.get(`announcement:${item._id}`))
      })),
    discounts: sortByDateDesc(discounts)
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        id: item._id,
        name: item.name,
        category: item.category,
        description: item.description,
        location: item.location,
        used: Boolean(interactionMap.get(`discount:${item._id}`))
      })),
    volunteerRoles: sortByDateDesc(volunteerRoles)
      .filter((item) => item.isActive !== false)
      .map((item) => ({
        id: item._id,
        title: item.title,
        org: item.org,
        hoursPerWeek: item.hoursPerWeek,
        location: item.location,
        description: item.description,
        signedUp: Boolean(interactionMap.get(`volunteer:${item._id}`))
      }))
  };
}

export function upsertDemoCampusInteraction(input: {
  itemType: CampusLifeInteractionType;
  itemId: string;
  value: boolean;
  userId?: string;
  firebaseUid?: string;
}) {
  const index = interactions.findIndex((item) => {
    if (item.itemType !== input.itemType || item.itemId !== input.itemId) return false;
    if (input.userId && item.userId === input.userId) return true;
    if (input.firebaseUid && item.firebaseUid === input.firebaseUid) return true;
    return false;
  });
  const timestamp = nowIso();
  if (index === -1) {
    interactions = [
      {
        _id: newId("cint"),
        itemType: input.itemType,
        itemId: input.itemId,
        value: input.value,
        userId: input.userId,
        firebaseUid: input.firebaseUid,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      ...interactions
    ];
    return;
  }
  interactions = interactions.slice();
  interactions[index] = {
    ...interactions[index],
    value: input.value,
    updatedAt: timestamp
  };
}

export function addDemoCampusLifeItem(input: CampusLifeCreateInput) {
  const timestamp = nowIso();
  if (input.type === "event") {
    const item: DemoCampusEvent = {
      _id: newId("ce"),
      title: input.title,
      date: input.date,
      time: input.time,
      location: input.location,
      type: input.eventType,
      description: input.description,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    events = [item, ...events];
    return { type: input.type, item };
  }

  if (input.type === "club") {
    const item: DemoCampusClub = {
      _id: newId("cc"),
      name: input.name,
      category: input.category,
      description: input.description,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    clubs = [item, ...clubs];
    return { type: input.type, item };
  }

  if (input.type === "announcement") {
    const item: DemoCampusAnnouncement = {
      _id: newId("ca"),
      title: input.title,
      date: input.date,
      body: input.body,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    announcements = [item, ...announcements];
    return { type: input.type, item };
  }

  if (input.type === "discount") {
    const item: DemoCampusDiscount = {
      _id: newId("cd"),
      name: input.name,
      category: input.category,
      description: input.description,
      location: input.location,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    discounts = [item, ...discounts];
    return { type: input.type, item };
  }

  const item: DemoCampusVolunteerRole = {
    _id: newId("cv"),
    title: input.title,
    org: input.org,
    hoursPerWeek: input.hoursPerWeek,
    location: input.location,
    description: input.description,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  volunteerRoles = [item, ...volunteerRoles];
  return { type: input.type, item };
}
