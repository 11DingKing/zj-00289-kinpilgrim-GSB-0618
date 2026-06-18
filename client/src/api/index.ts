import axios from "axios";
import type {
  Application,
  Volunteer,
  AncestralVillage,
  Pilgrimage,
  StatisticsOverview,
  RegionStat,
  SurnameStat,
  KinshipArchive,
  RelatedCluesResult,
  VolunteerMatchScore,
  StoryWallItem,
  RegionStoryGroup,
  VillageStoryStat,
  StoryWallStats,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return { success: true, data: response.data };
  },
  (error) => {
    console.error("API Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "请求失败",
    };
  },
);

export const applicationApi = {
  list: (params?: { status?: string; surname?: string; keyword?: string }) =>
    api.get<any, { success: boolean; data: Application[]; message?: string }>(
      "/applications",
      { params },
    ),

  get: (id: string) =>
    api.get<any, { success: boolean; data: Application; message?: string }>(
      `/applications/${id}`,
    ),

  create: (data: Partial<Application>) =>
    api.post<any, { success: boolean; data: { id: string }; message?: string }>(
      "/applications",
      data,
    ),

  updateStatus: (
    id: string,
    data: {
      status?: string;
      step_index?: number;
      step_result?: string;
      step_notes?: string;
    },
  ) =>
    api.put<any, { success: boolean; message?: string }>(
      `/applications/${id}/status`,
      data,
    ),

  matchVolunteer: (id: string, volunteer_id: string) =>
    api.put<any, { success: boolean; message?: string }>(
      `/applications/${id}/match`,
      { volunteer_id },
    ),

  getSteps: (id: string) =>
    api.get<any, { success: boolean; data: any[]; message?: string }>(
      `/applications/${id}/steps`,
    ),

  getRelatedClues: (id: string) =>
    api.get<
      any,
      { success: boolean; data: RelatedCluesResult; message?: string }
    >(`/applications/${id}/related-clues`),

  getKinshipArchives: (id: string) =>
    api.get<
      any,
      { success: boolean; data: KinshipArchive[]; message?: string }
    >(`/applications/${id}/kinship`),
};

export const volunteerApi = {
  list: (params?: { status?: string; surname?: string; keyword?: string }) =>
    api.get<any, { success: boolean; data: Volunteer[]; message?: string }>(
      "/volunteers",
      { params },
    ),

  get: (id: string) =>
    api.get<any, { success: boolean; data: Volunteer; message?: string }>(
      `/volunteers/${id}`,
    ),

  create: (data: Partial<Volunteer>) =>
    api.post<any, { success: boolean; data: { id: string }; message?: string }>(
      "/volunteers",
      data,
    ),

  update: (id: string, data: Partial<Volunteer>) =>
    api.put<any, { success: boolean; message?: string }>(
      `/volunteers/${id}`,
      data,
    ),

  delete: (id: string) =>
    api.delete<any, { success: boolean; message?: string }>(
      `/volunteers/${id}`,
    ),
};

export const villageApi = {
  list: (params?: {
    province?: string;
    city?: string;
    surname?: string;
    keyword?: string;
  }) =>
    api.get<
      any,
      { success: boolean; data: AncestralVillage[]; message?: string }
    >("/villages", { params }),

  get: (id: string) =>
    api.get<
      any,
      { success: boolean; data: AncestralVillage; message?: string }
    >(`/villages/${id}`),

  create: (data: Partial<AncestralVillage>) =>
    api.post<any, { success: boolean; data: { id: string }; message?: string }>(
      "/villages",
      data,
    ),

  update: (id: string, data: Partial<AncestralVillage>) =>
    api.put<any, { success: boolean; message?: string }>(
      `/villages/${id}`,
      data,
    ),

  delete: (id: string) =>
    api.delete<any, { success: boolean; message?: string }>(`/villages/${id}`),
};

export const pilgrimageApi = {
  list: (params?: { status?: string; application_id?: string }) =>
    api.get<any, { success: boolean; data: Pilgrimage[]; message?: string }>(
      "/pilgrimages",
      { params },
    ),

  get: (id: string) =>
    api.get<any, { success: boolean; data: Pilgrimage; message?: string }>(
      `/pilgrimages/${id}`,
    ),

  create: (data: Partial<Pilgrimage>) =>
    api.post<any, { success: boolean; data: { id: string }; message?: string }>(
      "/pilgrimages",
      data,
    ),

  update: (id: string, data: Partial<Pilgrimage>) =>
    api.put<any, { success: boolean; message?: string }>(
      `/pilgrimages/${id}`,
      data,
    ),

  complete: (
    id: string,
    data: { memories?: string; story?: string; photos?: string },
  ) =>
    api.put<any, { success: boolean; message?: string }>(
      `/pilgrimages/${id}/complete`,
      data,
    ),

  delete: (id: string) =>
    api.delete<any, { success: boolean; message?: string }>(
      `/pilgrimages/${id}`,
    ),

  togglePublic: (id: string, is_public: boolean) =>
    api.put<any, { success: boolean; message?: string }>(
      `/pilgrimages/${id}/toggle-public`,
      { is_public },
    ),
};

export const kinshipApi = {
  list: (params?: {
    application_id?: string;
    village_id?: string;
    surname?: string;
  }) =>
    api.get<
      any,
      { success: boolean; data: KinshipArchive[]; message?: string }
    >("/kinship", { params }),

  get: (id: string) =>
    api.get<any, { success: boolean; data: KinshipArchive; message?: string }>(
      `/kinship/${id}`,
    ),

  create: (data: Partial<KinshipArchive>) =>
    api.post<any, { success: boolean; data: { id: string }; message?: string }>(
      "/kinship",
      data,
    ),

  update: (id: string, data: Partial<KinshipArchive>) =>
    api.put<any, { success: boolean; message?: string }>(
      `/kinship/${id}`,
      data,
    ),

  delete: (id: string) =>
    api.delete<any, { success: boolean; message?: string }>(`/kinship/${id}`),

  getByVillage: (villageId: string) =>
    api.get<
      any,
      { success: boolean; data: KinshipArchive[]; message?: string }
    >(`/kinship/by-village/${villageId}`),
};

export const matchingApi = {
  getRelatedClues: (applicationId: string) =>
    api.get<
      any,
      { success: boolean; data: RelatedCluesResult; message?: string }
    >(`/matching/application/${applicationId}/related`),

  recommendVolunteers: (applicationId: string) =>
    api.get<
      any,
      { success: boolean; data: VolunteerMatchScore[]; message?: string }
    >(`/matching/application/${applicationId}/recommend-volunteers`),

  createRelation: (data: {
    source_application_id: string;
    target_application_id?: string;
    target_village_id?: string;
    relation_type: string;
    match_score?: number;
    match_reasons?: any;
  }) =>
    api.post<any, { success: boolean; data: { id: string }; message?: string }>(
      "/matching/relations",
      data,
    ),

  getRelations: (applicationId: string) =>
    api.get<any, { success: boolean; data: any[]; message?: string }>(
      `/matching/relations/${applicationId}`,
    ),

  deleteRelation: (id: string) =>
    api.delete<any, { success: boolean; message?: string }>(
      `/matching/relations/${id}`,
    ),
};

export const storiesApi = {
  getWall: (params?: {
    province?: string;
    surname?: string;
    keyword?: string;
  }) =>
    api.get<any, { success: boolean; data: StoryWallItem[]; message?: string }>(
      "/stories/wall",
      { params },
    ),

  getByRegion: () =>
    api.get<
      any,
      { success: boolean; data: RegionStoryGroup[]; message?: string }
    >("/stories/by-region"),

  getByVillage: (limit?: number) =>
    api.get<
      any,
      { success: boolean; data: VillageStoryStat[]; message?: string }
    >("/stories/by-village", { params: limit ? { limit } : undefined }),

  getStats: () =>
    api.get<any, { success: boolean; data: StoryWallStats; message?: string }>(
      "/stories/stats",
    ),

  getDetail: (id: string) =>
    api.get<any, { success: boolean; data: StoryWallItem; message?: string }>(
      `/stories/${id}`,
    ),
};

export const statisticsApi = {
  overview: () =>
    api.get<
      any,
      { success: boolean; data: StatisticsOverview; message?: string }
    >("/statistics/overview"),

  byRegion: (type = "province") =>
    api.get<any, { success: boolean; data: RegionStat[]; message?: string }>(
      "/statistics/by-region",
      {
        params: { type },
      },
    ),

  bySurname: () =>
    api.get<any, { success: boolean; data: SurnameStat[]; message?: string }>(
      "/statistics/by-surname",
    ),

  byMonth: () =>
    api.get<any, { success: boolean; data: any[]; message?: string }>(
      "/statistics/pilgrimages-by-month",
    ),

  byVillage: () =>
    api.get<any, { success: boolean; data: any[]; message?: string }>(
      "/statistics/pilgrimages-by-village",
    ),
};
