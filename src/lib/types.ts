
export type Player = {
  id: string; // Use string for ID for more robust local state management (e.g., UUID)
  name: string;
  rebuys: number;
  blackCoins: number;
};
