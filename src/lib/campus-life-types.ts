export type CampusEventType = "academic" | "social" | "career";

export type CampusLifeInteractionType =
  | "event"
  | "club"
  | "announcement"
  | "discount"
  | "volunteer";

export type CampusEventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: CampusEventType;
  description: string;
  interested: boolean;
};

export type CampusClubItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  joined: boolean;
};

export type CampusAnnouncementItem = {
  id: string;
  title: string;
  date: string;
  body: string;
  read: boolean;
};

export type CampusDiscountItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  used: boolean;
};

export type CampusVolunteerItem = {
  id: string;
  title: string;
  org: string;
  hoursPerWeek: string;
  location: string;
  description: string;
  signedUp: boolean;
};

export type CampusLifePayload = {
  events: CampusEventItem[];
  clubs: CampusClubItem[];
  announcements: CampusAnnouncementItem[];
  discounts: CampusDiscountItem[];
  volunteerRoles: CampusVolunteerItem[];
};

export type CampusLifeCreateInput =
  | {
      type: "event";
      title: string;
      date: string;
      time: string;
      location: string;
      eventType: CampusEventType;
      description: string;
    }
  | {
      type: "club";
      name: string;
      category: string;
      description: string;
    }
  | {
      type: "announcement";
      title: string;
      date: string;
      body: string;
    }
  | {
      type: "discount";
      name: string;
      category: string;
      description: string;
      location: string;
    }
  | {
      type: "volunteer";
      title: string;
      org: string;
      hoursPerWeek: string;
      location: string;
      description: string;
    };
