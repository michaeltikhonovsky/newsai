import type { Character } from "@/types/video";

export const hosts: Character[] = [
  {
    id: "lh",
    name: "Lester Holt",
    initials: "LH",
    avatar: "/avatars/LH-headshot.jpg",
  },
  {
    id: "AC",
    name: "Anderson Cooper",
    initials: "AC",
    avatar: "/avatars/AC-headshot.png",
  },
  {
    id: "TC",
    name: "Tucker Carlson",
    initials: "TC",
    avatar: "/avatars/TC-headshot.webp",
  },
  {
    id: "DM",
    name: "David Muir",
    initials: "DM",
    avatar: "/avatars/DM-headshot.webp",
  },
];

export const guests: Character[] = [
  {
    id: "RE",
    name: "Richard Engel",
    initials: "RE",
    avatar: "/avatars/RE-headshot.webp",
  },
  {
    id: "HW",
    name: "Holly Williams",
    initials: "HW",
    avatar: "/avatars/HW-headshot.webp",
  },
  {
    id: "AM",
    name: "Andrea Mitchell",
    initials: "AM",
    avatar: "/avatars/AM-headshot.webp",
  },
];

export const getHostById = (hostId: string): Character | undefined => {
  return hosts.find((h) => h.id === hostId);
};

export const getGuestById = (guestId: string): Character | undefined => {
  return guests.find((g) => g.id === guestId);
};

export const getHostName = (hostId: string): string => {
  const host = getHostById(hostId);
  return host ? host.name : hostId;
};

export const getGuestName = (guestId: string): string => {
  const guest = getGuestById(guestId);
  return guest ? guest.name : guestId;
};
