export type Currency = "USD" | "MMK";

export type User = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  timezone: string;
  defaultCurrency: Currency;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  status: string;
  hourlyRateMinor: number | null;
  availability: string;
  ratingAverage: number;
  ratingCount: number;
  createdAt: string;
};

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetType: "FIXED" | "HOURLY";
  budgetMinMinor: number;
  budgetMaxMinor: number;
  currency: Currency;
  experienceLevel: string;
  locationMode: string;
  location: string | null;
  deadline: string | null;
  status: string;
  createdAt: string;
  client: Pick<User, "id" | "displayName" | "avatarUrl" | "ratingAverage" | "ratingCount">;
  skills: { skill: { id: string; name: string; slug: string }; proficiency?: string | null }[];
  _count?: { proposals: number };
};

export type Contract = {
  id: string;
  title: string;
  description: string;
  agreedAmountMinor: number;
  currency: Currency;
  status: string;
  createdAt: string;
  updatedAt: string;
  job: { id: string; title: string; category?: string };
  client: Pick<User, "id" | "displayName" | "avatarUrl">;
  freelancer: Pick<User, "id" | "displayName" | "avatarUrl">;
};
