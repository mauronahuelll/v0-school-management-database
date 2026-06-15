import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS — Lógica de negocio del ERP educativo
// ============================================================================

export const roleEnum = pgEnum("role", [
  "ADMIN",
  "DOCENTE",
  "PRECEPTOR",
  "FAMILIA",
]);

export const levelNameEnum = pgEnum("level_name", [
  "INICIAL",
  "PRIMARIO",
  "SECUNDARIO",
]);

export const assignmentTypeEnum = pgEnum("assignment_type", [
  "TITULAR",
  "PROVISORIO",
  "SUPLENTE",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "PENDING",
  "REVIEW",
  "APPROVED",
  "REJECTED",
]);

// Discrimina el dueño polimórfico de un documento (alumno o usuario/personal)
export const documentOwnerTypeEnum = pgEnum("document_owner_type", [
  "STUDENT",
  "USER",
]);

// ============================================================================
// 1. JERARQUÍA INSTITUCIONAL (MULTITENANT)
// ============================================================================

export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  // CUE: Código Único de Establecimiento (identificador oficial, único por institución)
  cue: varchar("cue", { length: 32 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const levels = pgTable(
  "levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    name: levelNameEnum("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("levels_institution_idx").on(table.institutionId)],
);

// ============================================================================
// 2. IDENTIDAD Y ROLES (IAM)
// ============================================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }).notNull(),
    lastName: varchar("last_name", { length: 128 }).notNull(),
    email: varchar("email", { length: 256 }).notNull(),
    role: roleEnum("role").notNull().default("FAMILIA"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // El email es único dentro de cada institución (aislamiento multitenant)
    uniqueIndex("users_institution_email_idx").on(
      table.institutionId,
      table.email,
    ),
    index("users_institution_idx").on(table.institutionId),
    index("users_role_idx").on(table.role),
  ],
);

// ============================================================================
// 3. ESTRUCTURA ACADÉMICA
// ============================================================================

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    division: varchar("division", { length: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("courses_level_idx").on(table.levelId),
    // Evita duplicar el mismo año/división dentro de un nivel (Ej: 1° "A")
    uniqueIndex("courses_level_year_division_idx").on(
      table.levelId,
      table.year,
      table.division,
    ),
  ],
);

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    isExtraCurricular: boolean("is_extra_curricular")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("subjects_level_idx").on(table.levelId)],
);

// Relación N:M vital: un docente dicta una materia en un curso con cierto tipo de cargo
export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    assignmentType: assignmentTypeEnum("assignment_type")
      .notNull()
      .default("TITULAR"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("teacher_assignments_user_idx").on(table.userId),
    index("teacher_assignments_course_idx").on(table.courseId),
    index("teacher_assignments_subject_idx").on(table.subjectId),
    // Un mismo docente no se asigna dos veces a la misma materia/curso
    uniqueIndex("teacher_assignments_unique_idx").on(
      table.userId,
      table.courseId,
      table.subjectId,
    ),
  ],
);

// ============================================================================
// 4. PADRÓN DE ALUMNADO
// ============================================================================

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 128 }).notNull(),
    lastName: varchar("last_name", { length: 128 }).notNull(),
    documentNumber: varchar("document_number", { length: 32 }).notNull(),
    birthDate: date("birth_date").notNull(),
    // Curso actual del alumno; nullable para egresados o aún sin asignar
    currentCourseId: uuid("current_course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("students_institution_idx").on(table.institutionId),
    index("students_current_course_idx").on(table.currentCourseId),
    // El documento es único dentro de cada institución
    uniqueIndex("students_institution_document_idx").on(
      table.institutionId,
      table.documentNumber,
    ),
  ],
);

export const familyRelations = pgTable(
  "family_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    // Tutor/responsable: usuario con rol FAMILIA
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relationshipType: varchar("relationship_type", { length: 64 }).notNull(),
    isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("family_relations_student_idx").on(table.studentId),
    index("family_relations_user_idx").on(table.userId),
    // Evita vincular dos veces al mismo tutor con el mismo alumno
    uniqueIndex("family_relations_student_user_idx").on(
      table.studentId,
      table.userId,
    ),
  ],
);

// ============================================================================
// 5. COMPLIANCE (LEGAJO RRHH Y ALUMNOS)
// ============================================================================

// Documento polimórfico: el dueño puede ser un alumno (students) o un usuario/personal (users).
// `ownerType` discrimina la entidad referida por `ownerId`.
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerType: documentOwnerTypeEnum("owner_type").notNull(),
    ownerId: uuid("owner_id").notNull(),
    documentType: varchar("document_type", { length: 128 }).notNull(),
    fileUrl: varchar("file_url", { length: 1024 }),
    status: documentStatusEnum("status").notNull().default("PENDING"),
    isRequired: boolean("is_required").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_owner_idx").on(table.ownerType, table.ownerId),
    index("documents_status_idx").on(table.status),
  ],
);

// ============================================================================
// RELACIONES (Drizzle relations API)
// ============================================================================

export const institutionsRelations = relations(institutions, ({ many }) => ({
  levels: many(levels),
  users: many(users),
  students: many(students),
}));

export const levelsRelations = relations(levels, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [levels.institutionId],
    references: [institutions.id],
  }),
  courses: many(courses),
  subjects: many(subjects),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  teacherAssignments: many(teacherAssignments),
  familyRelations: many(familyRelations),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  level: one(levels, {
    fields: [courses.levelId],
    references: [levels.id],
  }),
  teacherAssignments: many(teacherAssignments),
  students: many(students),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  level: one(levels, {
    fields: [subjects.levelId],
    references: [levels.id],
  }),
  teacherAssignments: many(teacherAssignments),
}));

export const teacherAssignmentsRelations = relations(
  teacherAssignments,
  ({ one }) => ({
    teacher: one(users, {
      fields: [teacherAssignments.userId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [teacherAssignments.courseId],
      references: [courses.id],
    }),
    subject: one(subjects, {
      fields: [teacherAssignments.subjectId],
      references: [subjects.id],
    }),
  }),
);

export const studentsRelations = relations(students, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [students.institutionId],
    references: [institutions.id],
  }),
  currentCourse: one(courses, {
    fields: [students.currentCourseId],
    references: [courses.id],
  }),
  familyRelations: many(familyRelations),
}));

export const familyRelationsRelations = relations(
  familyRelations,
  ({ one }) => ({
    student: one(students, {
      fields: [familyRelations.studentId],
      references: [students.id],
    }),
    tutor: one(users, {
      fields: [familyRelations.userId],
      references: [users.id],
    }),
  }),
);

// ============================================================================
// TIPOS INFERIDOS (helpers para la capa de aplicación)
// ============================================================================

export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;
export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type NewTeacherAssignment = typeof teacherAssignments.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type FamilyRelation = typeof familyRelations.$inferSelect;
export type NewFamilyRelation = typeof familyRelations.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
