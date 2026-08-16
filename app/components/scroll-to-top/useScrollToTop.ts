import { useCallback, useRef, useState } from "react";

export function useScrollToTop() {
	const [isVisible, setIsVisible] = useState(false);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const sentinelNodeRef = useRef<HTMLElement | null>(null);

	const sentinelRef = useCallback((node: HTMLElement | null) => {
		sentinelNodeRef.current = node;

		if (observerRef.current) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}

		if (!node) return;

		const observer = new IntersectionObserver(([entry]) => {
			setIsVisible(!entry.isIntersecting);
		});

		observer.observe(node);
		observerRef.current = observer;
	}, []);

	const scrollToTop = useCallback(() => {
		if (sentinelNodeRef.current) {
			sentinelNodeRef.current.scrollIntoView({ behavior: "smooth" });
		} else {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, []);

	return {
		isVisible,
		sentinelRef,
		scrollToTop,
	};
}
