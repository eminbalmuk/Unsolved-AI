import type { Dictionary } from "@/lib/i18n";

export function translateStatus(status: string, dictionary: Dictionary["common"]) {
  const key = status.toLowerCase();

  if (key === "validated") return dictionary.status.validated;
  if (key === "rising") return dictionary.status.rising;
  if (key === "healthy") return dictionary.status.healthy;
  if (key === "warning") return dictionary.status.warning;

  return status;
}

export function translateCategory(
  category: string,
  dictionary: Dictionary["common"],
) {
  const key = category.toLowerCase();

  if (key === "experience gap") return dictionary.category.experienceGap;
  if (key === "feature request") return dictionary.category.featureRequest;
  if (key === "bug") return dictionary.category.bug;

  return category;
}
