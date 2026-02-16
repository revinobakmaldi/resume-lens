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

export const FILTER_FIELDS = [
  { value: "total_experience", label: "Total Experience", type: "number" },
  { value: "related_experience", label: "Related Experience", type: "number" },
  { value: "age", label: "Age", type: "number" },
  { value: "score", label: "Score", type: "number" },
  { value: "last_education", label: "Education", type: "select", options: EDUCATION_LEVELS },
  { value: "gender", label: "Gender", type: "select", options: ["Male", "Female"] as const },
  { value: "source", label: "Source", type: "select", options: SOURCE_OPTIONS },
  { value: "last_company", label: "Company", type: "text" },
] as const;

export const FILTER_OPERATORS = {
  number: [
    { value: "gte", label: ">=" },
    { value: "lte", label: "<=" },
    { value: "eq", label: "=" },
  ],
  select: [
    { value: "eq", label: "is" },
  ],
  text: [
    { value: "contains", label: "contains" },
    { value: "eq", label: "is" },
  ],
} as const;
