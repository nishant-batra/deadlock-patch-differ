import clsx from "clsx";
import { renderHtmlDiff } from "#/lib/htmlDiff";
import styles from "./styles.module.css";

/**
 * The game's own description HTML (keyword spans, inline icons), coloured the
 * way the in-game card colours it. Given a `previous` version it renders the
 * word-level diff in place instead, so a rewrite reads as a marked-up
 * sentence rather than a separate before/after block.
 */
export default function GameText({
	html,
	previous,
	className,
}: {
	html: string;
	previous?: string;
	className?: string;
}) {
	return (
		<div
			className={clsx(styles.text, className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: first-party API copy
			dangerouslySetInnerHTML={{
				__html: previous === undefined ? html : renderHtmlDiff(previous, html),
			}}
		/>
	);
}
