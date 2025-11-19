import { Schema, model, models, type Model } from "mongoose";
import type {
  AssignedProgram,
  Jury,
  LiveScore,
  Program,
  ProgramRegistration,
  RegistrationSchedule,
  ResultRecord,
  Student,
  Team,
} from "./types";

const TeamSchema = new Schema<Team>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    leader: { type: String, required: true },
    leader_photo: { type: String, required: true },
    color: { type: String, required: true },
    description: { type: String, required: true },
    contact: { type: String, required: true },
    total_points: { type: Number, default: 0 },
    portal_password: { type: String, default: "" },
  },
  { timestamps: true },
);

const StudentSchema = new Schema<Student>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    team_id: { type: String, required: true },
    chest_no: { type: String, required: true },
    avatar: { type: String },
    total_points: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ProgramSchema = new Schema<Program>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    section: { type: String, enum: ["single", "group", "general"], required: true },
    stage: { type: Boolean, default: true },
    category: { type: String, enum: ["A", "B", "C", "none"], default: "none" },
    candidateLimit: { type: Number, default: 1 },
  },
  { timestamps: true },
);

const JurySchema = new Schema<Jury>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String },
  },
  { timestamps: true },
);

const AssignedProgramSchema = new Schema<AssignedProgram>(
  {
    program_id: { type: String, required: true },
    jury_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "submitted", "completed"],
      default: "pending",
    },
  },
  { timestamps: true },
);
AssignedProgramSchema.index({ program_id: 1, jury_id: 1 }, { unique: true });

const ProgramRegistrationSchema = new Schema<ProgramRegistration>(
  {
    id: { type: String, required: true, unique: true },
    programId: { type: String, required: true },
    programName: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    studentChest: { type: String, required: true },
    teamId: { type: String, required: true },
    teamName: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { timestamps: true },
);

const RegistrationScheduleSchema = new Schema<RegistrationSchedule & { key: string }>(
  {
    key: { type: String, required: true, unique: true },
    startDateTime: { type: String, required: true },
    endDateTime: { type: String, required: true },
  },
  { timestamps: true },
);

const resultEntrySchema = new Schema(
  {
    position: { type: Number, required: true },
    student_id: { type: String },
    team_id: { type: String },
    grade: { type: String, enum: ["A", "B", "C", "none"], default: "none" },
    score: { type: Number, required: true },
  },
  { _id: false },
);

const penaltyEntrySchema = new Schema(
  {
    student_id: { type: String },
    team_id: { type: String },
    points: { type: Number, required: true },
    reason: { type: String },
  },
  { _id: false },
);

const ResultSchema = new Schema<ResultRecord>(
  {
    id: { type: String, required: true, unique: true },
    program_id: { type: String, required: true },
    jury_id: { type: String, required: true },
    submitted_by: { type: String, required: true },
    submitted_at: { type: String, required: true },
    entries: { type: [resultEntrySchema], required: true },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    notes: String,
    penalties: { type: [penaltyEntrySchema], default: [] },
  },
  { timestamps: true },
);

const LiveScoreSchema = new Schema<LiveScore>(
  {
    team_id: { type: String, required: true, unique: true },
    total_points: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const TeamModel =
  (models.Team as Model<Team>) ?? model<Team>("Team", TeamSchema);
export const StudentModel =
  (models.Student as Model<Student>) ?? model<Student>("Student", StudentSchema);
export const ProgramModel =
  (models.Program as Model<Program>) ?? model<Program>("Program", ProgramSchema);
export const JuryModel =
  (models.Jury as Model<Jury>) ?? model<Jury>("Jury", JurySchema);
export const AssignedProgramModel =
  (models.AssignedProgram as Model<AssignedProgram>) ??
  model<AssignedProgram>("AssignedProgram", AssignedProgramSchema);
export const PendingResultModel =
  (models.PendingResult as Model<ResultRecord>) ??
  model<ResultRecord>("PendingResult", ResultSchema, "results_pending");
export const ApprovedResultModel =
  (models.ApprovedResult as Model<ResultRecord>) ??
  model<ResultRecord>("ApprovedResult", ResultSchema, "results_approved");
export const LiveScoreModel =
  (models.LiveScore as Model<LiveScore>) ?? model<LiveScore>("LiveScore", LiveScoreSchema);
export const ProgramRegistrationModel =
  (models.ProgramRegistration as Model<ProgramRegistration>) ??
  model<ProgramRegistration>("ProgramRegistration", ProgramRegistrationSchema);
export const RegistrationScheduleModel =
  (models.RegistrationSchedule as Model<RegistrationSchedule & { key: string }>) ??
  model<RegistrationSchedule & { key: string }>(
    "RegistrationSchedule",
    RegistrationScheduleSchema,
  );

