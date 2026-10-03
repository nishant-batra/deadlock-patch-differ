import { PRIMARY_STATS } from "./constants";

export const isPrimaryStat = (
	key: string,
): key is (typeof PRIMARY_STATS)[number] =>
	(PRIMARY_STATS as readonly string[]).includes(key);
