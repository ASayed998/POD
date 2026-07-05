import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- Pod OS app tables ------------------------------------------------------
// This is a shared internal team workspace: every authenticated Pod member
// works from the same canonical records. Rows are not partitioned per user;
// `createdBy` records provenance for the audit trail.

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  problem: text("problem").notNull(),
  raisedBy: text("raisedBy"),
  source: text("source"),
  ideaType: text("ideaType"),
  roughValue: text("roughValue"),
  roughEffort: text("roughEffort"),
  confidence: text("confidence").default("M"), // H | M | L
  disposition: text("disposition").notNull().default("New"), // New | Promote | Drop | Parked
  dropReason: text("dropReason"),
  promoted: boolean("promoted").notNull().default(false),
  requestId: integer("requestId"),
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source"),
  bucket: text("bucket").notNull().default("Client"), // Client | Internal
  reqType: text("reqType"),
  refLinks: text("refLinks"), // JSON stringified string[]
  description: text("description"),
  neededBy: timestamp("neededBy"),
  status: text("status").notNull().default("Intake"),
  stageGate: text("stageGate").notNull().default("Not Started"), // Not Started | Draft | Passed | Sent Back
  owner: text("owner"),
  ideaId: integer("ideaId"),
  // Scoring factors (1-5). Score engine is SSOT via Triage screen.
  factorValue: integer("factorValue"),
  factorReach: integer("factorReach"),
  factorUrgency: integer("factorUrgency"),
  factorStrategic: integer("factorStrategic"),
  priorityScore: integer("priorityScore"),
  priorityBand: text("priorityBand"), // P1 | P2 | P3 | P4
  riskGate: boolean("riskGate").notNull().default(false),
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const sprintItems = pgTable("sprint_items", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId").notNull(),
  sprintName: text("sprintName").notNull(),
  boardStatus: text("boardStatus").notNull().default("Committed"), // Committed | In Progress | In Review | Done | Blocked
  percentComplete: integer("percentComplete").notNull().default(0),
  blocker: text("blocker"),
  estDays: integer("estDays").notNull().default(1),
  bucket: text("bucket").notNull().default("Client"), // Client | Internal
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type Idea = typeof ideas.$inferSelect
export type Request = typeof requests.$inferSelect
export type SprintItem = typeof sprintItems.$inferSelect
