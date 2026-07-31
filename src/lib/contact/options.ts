export const ENTITY_OPTIONS = [
  { value: "individual", label: "Individual / household" },
  { value: "s-corp", label: "S corporation" },
  { value: "c-corp", label: "C corporation" },
  { value: "partnership-llc", label: "Partnership / LLC" },
  { value: "sole-proprietor", label: "Sole proprietorship" },
  { value: "trust-estate", label: "Trust or estate" },
  { value: "family-office", label: "Family office" },
  { value: "multiple", label: "Multiple entities" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "active", label: "Active — a decision or deadline is in front of us" },
  { value: "this-quarter", label: "This quarter" },
  { value: "this-year", label: "This tax year" },
  { value: "planning-ahead", label: "Planning ahead — no fixed deadline" },
  { value: "exploring", label: "Exploring options" },
] as const;

export const HEARD_OPTIONS = [
  { value: "referral", label: "Referral from an advisor or peer" },
  { value: "search", label: "Search" },
  { value: "insights", label: "A Fortress article or alert" },
  { value: "event", label: "An event or speaking engagement" },
  { value: "existing", label: "Existing relationship with Fortress" },
  { value: "other", label: "Other" },
] as const;

export type EntityType = (typeof ENTITY_OPTIONS)[number]["value"];
export type Timeline = (typeof TIMELINE_OPTIONS)[number]["value"];
export type HeardFrom = (typeof HEARD_OPTIONS)[number]["value"];

export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? "Not provided";
}
