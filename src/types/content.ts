export const LEVELS = ['입문', '중급', '고급'] as const
export const LINK_TYPES = [
  '문서',
  '강의',
  '영상',
  '아티클',
  '게시물',
  '저장소',
  '도구',
  '논문',
] as const
export const ACCESS_CONDITIONS = [
  '무료',
  '유료',
  '로그인 필요',
  '파트너 전용',
] as const
export const LANGUAGES = ['한국어', '영어'] as const

export type Level = (typeof LEVELS)[number]
export type LinkType = (typeof LINK_TYPES)[number]
export type AccessCondition = (typeof ACCESS_CONDITIONS)[number]
export type Language = (typeof LANGUAGES)[number]

export interface RawCourse {
  slug: string
  name: string
  order: number
  level: Level
  summary: string
  audience: string
  prerequisites: string
  published: boolean
}

export interface RawLink {
  id: string
  title: string
  url: string
  purpose: string
  category: string
  type: LinkType
  access: AccessCondition | null
  course: string | null
  order: number | null
  level: Level | null
  language: Language | null
  estimatedMinutes: number | null
  verified: boolean
  published: boolean
}

export interface RawContent {
  courses: RawCourse[]
  links: RawLink[]
}

export type CourseStep = RawLink & { order: number; level: Level }

export type SiteCourse = RawCourse & { steps: CourseStep[] }

export type LibraryLink = RawLink & {
  courseRef: { slug: string; name: string } | null
}

export interface SiteContent {
  courses: SiteCourse[]
  library: LibraryLink[]
}
