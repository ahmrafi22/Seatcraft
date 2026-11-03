export type ExamStatus = "Draft" | "Configured" | "Allocated" | "Published" | "Archived";
export type RunStatus = "Queued" | "Running" | "Completed" | "Failed" | "Cancelled";
export type PlanStatus = "Draft" | "Published" | "Superseded";
export type Strategy = "Greedy" | "Balanced" | "Strict";
export type Role = "Operator" | "Admin";

export interface Constraints {
  preventSameInstitutionAdjacent: boolean;
  keepSubjectGroupContiguous: boolean;
  maintainRollOrder: boolean;
  allowHallSkipping: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  status: ExamStatus;
  constraints: Constraints;
  activeSeatPlanId: string | null;
  candidateCount: number;
  hallCount: number;
  createdAt: string;
  examDate: string | null;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  candidateCount: number;
}

export interface SeatPosition {
  row: number;
  column: number;
  label: string;
}

export interface Hall {
  id: string;
  name: string;
  rows: number;
  columns: number;
  capacity: number;
  usableCapacity: number;
  blockedSeats: SeatPosition[];
}

export interface Candidate {
  id: string;
  roll: string;
  fullName: string;
  subjectGroup: string;
  institutionId: string;
  institutionName: string;
  photoUrl: string | null;
  isSeatLocked: boolean;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AllocationRun {
  id: string;
  examId: string;
  strategy: Strategy;
  seed: number;
  status: RunStatus;
  progressPercent: number;
  currentPhase: string | null;
  bestViolationCount: number;
  resultSeatPlanId: string | null;
  candidateCount: number;
  hallsUsed: number;
  durationMs: number;
  failureReason: string | null;
  createdAt: string;
}

export interface SeatAssignment {
  candidateId: string;
  roll: string;
  fullName: string;
  institutionId: string;
  institutionName: string;
  hallId: string;
  hallName: string;
  row: number;
  column: number;
  seatLabel: string;
}

export interface PlanViolation {
  kind: string;
  message: string;
  candidateId: string | null;
  otherCandidateId: string | null;
}

export interface SeatPlan {
  id: string;
  examId: string;
  allocationRunId: string;
  status: PlanStatus;
  violationCount: number;
  publishedAt: string | null;
  assignmentCount: number;
  metrics: {
    hallsUsed: number;
    violationCount: number;
    capacityWastePercent: number;
    institutionSpread: number;
    rollSequenceScore: number;
  };
}

export interface SeatPlanDetail {
  id: string;
  examId: string;
  status: PlanStatus;
  violationCount: number;
  publishedAt: string | null;
  assignments: SeatAssignment[];
  violations: PlanViolation[];
}

export interface OverrideResult {
  applied: boolean;
  violationCount: number;
  violations: PlanViolation[];
  forced: boolean;
}

export interface Session {
  accessToken: string;
  expiresAt: string;
  user: {
    id: string;
    tenantId: string;
    email: string;
    displayName: string;
    role: Role;
  };
}

export interface PublicSeat {
  candidateName: string;
  roll: string;
  examTitle: string;
  hallName: string;
  seatLabel: string;
  examDate: string | null;
}

export interface SeedResult {
  examId: string;
  candidates: number;
  institutions: number;
  halls: number;
}
