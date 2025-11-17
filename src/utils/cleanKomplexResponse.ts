export const cleanKomplexResponse = (
  aiResult: string,
  responseType: string
): string => {
  if (typeof aiResult !== "string" || responseType !== "komplex") {
    return aiResult;
  }

  const trimmed = aiResult.trim();
  if (!trimmed.toLowerCase().startsWith("```json")) {
    return aiResult;
  }

  const fenceMatch = trimmed.match(/^```json\s*([\s\S]*?)```$/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  const withoutFence = trimmed.replace(/^```json/i, "").trim();
  const closingFenceIndex = withoutFence.lastIndexOf("```");
  const content =
    closingFenceIndex >= 0
      ? withoutFence.slice(0, closingFenceIndex)
      : withoutFence;

  return content.trim();
};
