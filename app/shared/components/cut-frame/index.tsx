import clsx from "clsx";
import type { CSSProperties, ReactNode, Ref } from "react";
import styles from "./styles.module.css";

type CutSize = "lg" | "md" | "sm" | "xs";

/**
 * Draws a border around its single child that follows the child's cut
 * corners. The shape comes from the child's own class (`cut-double`,
 * `cut-corner`, or neither for a plain rectangle); the frame only needs to
 * know the colour, thickness and - if not the shape's default - the slice
 * size. See styles.module.css for how the ring is drawn.
 */
export default function CutFrame({
	color,
	width = 1,
	cut,
	className = "inline-flex",
	ref,
	children,
}: {
	color: string;
	/** Border thickness in px. 0 draws nothing but keeps the same geometry. */
	width?: number;
	/** Slice size - a `--cut-*` step or any CSS length. Defaults to the
	 * shape's own default (lg for cut-double, xs for cut-corner). */
	cut?: CutSize | (string & {});
	/** Layout only (display, margin, sizing) - never the shape. */
	className?: string;
	ref?: Ref<HTMLSpanElement>;
	children: ReactNode;
}) {
	const style = {
		"--frame-color": color,
		"--frame-width": `${width}px`,
		...(cut && {
			"--frame-cut": ["lg", "md", "sm", "xs"].includes(cut)
				? `var(--cut-${cut})`
				: cut,
		}),
	} as CSSProperties;

	return (
		<span ref={ref} className={clsx(styles.frame, className)} style={style}>
			{children}
		</span>
	);
}
