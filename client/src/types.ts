export interface Application {
  id: string;
  applicant_name: string;
  applicant_phone: string;
  surname: string;
  origin_province: string;
  origin_city: string;
  origin_district: string;
  village_clue: string;
  ancestral_hall_clue: string;
  departure_era: string;
  generation_count: number;
  known_ancestors: string;
  family_story: string;
  status: ApplicationStatus;
  volunteer_id: string | null;
  volunteer_name?: string;
  volunteer_phone?: string;
  current_step: number;
  created_at: string;
  updated_at: string;
  steps?: InvestigationStep[];
  pilgrimage?: Pilgrimage | null;
}

export type ApplicationStatus =
  | "pending"
  | "investigating"
  | "confirmed"
  | "completed"
  | "broken";

export const STATUS_TEXT: Record<ApplicationStatus, string> = {
  pending: "待匹配",
  investigating: "查访中",
  confirmed: "已确认",
  completed: "已祭祖",
  broken: "线索中断",
};

export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  pending: "default",
  investigating: "processing",
  confirmed: "warning",
  completed: "success",
  broken: "error",
};

export interface InvestigationStep {
  id: string;
  application_id: string;
  step_index: number;
  step_name: string;
  status: "pending" | "in_progress" | "completed";
  result: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const STEP_STATUS_TEXT: Record<string, string> = {
  pending: "待开始",
  in_progress: "进行中",
  completed: "已完成",
};

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  surnames: string;
  skills: string;
  status: string;
  created_at: string;
  assignments?: Application[];
}

export interface AncestralVillage {
  id: string;
  name: string;
  province: string;
  city: string;
  district: string;
  surname: string;
  ancestral_hall_name: string;
  description: string;
  created_at: string;
}

export interface Pilgrimage {
  id: string;
  application_id: string;
  village_id: string | null;
  village_name?: string;
  province?: string;
  city?: string;
  district?: string;
  ancestral_hall: string;
  pilgrimage_date: string;
  companion_name: string;
  companion_phone: string;
  status: "scheduled" | "completed" | "cancelled";
  memories: string;
  story: string;
  photos: string;
  created_at: string;
  applicant_name?: string;
  surname?: string;
  family_story?: string;
  village_description?: string;
  ancestral_hall_name?: string;
}

export interface StatisticsOverview {
  totalApplications: number;
  totalVolunteers: number;
  totalVillages: number;
  totalPilgrimages: number;
  statusBreakdown: Record<ApplicationStatus, number>;
  matchRate: number;
}

export interface RegionStat {
  region: string;
  total: number;
  matched: number;
  completed: number;
  matchRate: number;
  successRate: number;
}

export interface SurnameStat {
  surname: string;
  total: number;
  matched: number;
  completed: number;
  matchRate: number;
}

export interface MatchReason {
  field: string;
  score: number;
  reason: string;
}

export interface VolunteerMatchScore extends Volunteer {
  match_score: number;
  match_reasons: MatchReason[];
  active_assignments: number;
}

export interface RelatedApplication extends Application {
  match_score: number;
  match_reasons?: MatchReason[];
  relation_type: string;
}

export interface RelatedVillage extends AncestralVillage {
  match_score: number;
  match_reasons?: MatchReason[];
  relation_type: string;
}

export interface RelatedCluesResult {
  applications: RelatedApplication[];
  villages: RelatedVillage[];
}

export interface KinshipArchive {
  id: string;
  application_id: string;
  village_id: string | null;
  confirmed_surname: string;
  relationship_type: string;
  ancestor_name: string;
  generation_level: number | null;
  confirmation_basis: string;
  dna_verified: number;
  archive_notes: string;
  confirmer_name: string;
  confirmed_at: string;
  created_at: string;
  applicant_name?: string;
  village_name?: string;
  province?: string;
  city?: string;
  district?: string;
  ancestral_hall_name?: string;
  family_story?: string;
  village_description?: string;
}

export interface ClueRelation {
  id: string;
  source_application_id: string;
  target_application_id: string | null;
  target_village_id: string | null;
  relation_type: string;
  match_score: number;
  match_reasons: string | null;
  created_at: string;
  source_name?: string;
  target_name?: string;
  village_name?: string;
}

export interface StoryWallItem extends Pilgrimage {
  village_id?: string;
  village_name?: string;
  province?: string;
  city?: string;
  district?: string;
  ancestral_hall_name?: string;
  village_description?: string;
  is_public?: number;
  relatedStories?: StoryWallItem[];
}

export interface RegionStoryGroup {
  province: string;
  total: number;
  cities: {
    city: string;
    count: number;
    surnames: string[];
  }[];
}

export interface VillageStoryStat {
  village_id: string;
  village_name: string;
  province: string;
  city: string;
  district: string;
  surname: string;
  ancestral_hall_name: string;
  pilgrimage_count: number;
  latest_pilgrimage: string;
}

export interface StoryWallStats {
  totalStories: number;
  totalVillages: number;
  totalSurnames: number;
  monthlyTrend: { month: string; count: number }[];
}
