export const avatarSets = {
  Emotions: [["😄", "Joy"], ["😨", "Fear"], ["😡", "Anger"], ["😢", "Sadness"], ["🤢", "Disgust"], ["😌", "Calm"]],
  Animals: [["🦊", "Fox"], ["🐼", "Panda"], ["🐸", "Frog"]],
  Flowers: [["🌻", "Sunflower"], ["🌷", "Tulip"], ["🌸", "Cherry blossom"]],
};
// Fixed backplates follow the chosen symbol across seats and rematches.
export const avatarColors: Record<string,string> = {
  "😄":"#65400e", "😨":"#392251", "😡":"#581d29",
  "😢":"#18315b", "🤢":"#254218", "😌":"#13413f",
  "🦊":"#154b65", "🐼":"#b67639", "🐸":"#552849",
  "🌻":"#253f53", "🌷":"#2d4841", "🌸":"#48394d",
};
const symbols = new Set(Object.values(avatarSets).flat().map(([symbol]) => symbol));
export function validAvatar(value: unknown) {
  return typeof value === "string" && symbols.has(value);
}
