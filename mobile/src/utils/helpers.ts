export const generateAvatar = (name: string): string => {
  if (!name) return "CL";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0]?.substring(0, 2).toUpperCase() || "CL";
};

export const generateColor = (id: string): [string, string] => {
  const colors: [string, string][] = [
    ["#3B82F6", "#1E40AF"],
    ["#10B981", "#059669"],
    ["#F59E0B", "#D97706"],
    ["#8B5CF6", "#7C3AED"],
    ["#EF4444", "#DC2626"],
    ["#06B6D4", "#0891B2"],
    ["#EC4899", "#DB2777"],
    ["#84CC16", "#65A30D"],
  ];
  if (!id) return colors[0];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};
