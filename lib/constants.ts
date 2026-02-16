export const CANDIDATE_FIELDS = [
  { value: "total_experience", label: "Total Experience (years)" },
  { value: "related_experience", label: "Related Experience (years)" },
  { value: "age", label: "Age" },
  { value: "last_education", label: "Last Education" },
  { value: "gender", label: "Gender" },
] as const;

export const OPERATORS = [
  { value: "gte", label: ">= (at least)" },
  { value: "lte", label: "<= (at most)" },
  { value: "eq", label: "= (equals)" },
  { value: "contains", label: "contains" },
] as const;

export const EDUCATION_LEVELS = [
  "High School",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
] as const;

export const SOURCE_OPTIONS = [
  "LinkedIn",
  "JobStreet",
  "Glints",
  "Referral",
  "Company Website",
  "Other",
] as const;
