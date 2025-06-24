type AssetAlias = "player";

export const ASSETS: Record<
  Uppercase<AssetAlias>,
  { alias: AssetAlias; src: string }
> = {
  PLAYER: {
    src: "/assets/bunny.png",
    alias: "player",
  },
};
