export const avatarSets = {
  Emotions: [["😄", "Joy"], ["😨", "Fear"], ["😡", "Anger"], ["😢", "Sadness"], ["🤢", "Disgust"], ["😌", "Calm"]],
  Animals: [["🦊", "Fox"], ["🐼", "Panda"], ["🐯", "Tiger"], ["🐸", "Frog"], ["🐧", "Penguin"], ["🐨", "Koala"]],
  Flowers: [["🌻", "Sunflower"], ["🌷", "Tulip"], ["🌸", "Cherry blossom"], ["🌹", "Rose"], ["🌺", "Hibiscus"], ["🪻", "Hyacinth"]],
};
const symbols = new Set(Object.values(avatarSets).flat().map(([symbol]) => symbol));
export function validAvatar(value: unknown) {
  return typeof value === "string" && symbols.has(value);
}
