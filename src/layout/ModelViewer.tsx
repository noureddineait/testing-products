// src/layout/ModelViewer.tsx
"use client";
import { useEffect, useRef } from "react";

export default function ModelViewer(props: {
	src: string;
	iosSrc?: string;
	alt: string;
	style?: React.CSSProperties;
	className?: string;
}) {
	const ref = useRef<any>(null);
	console.log(ref);

	useEffect(() => {
		import("@google/model-viewer");
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onError = (e: any) => {
			// will log detailed error messages from <model-viewer>
			console.error("model-viewer error:", e?.detail ?? e);
		};
		el.addEventListener("error", onError);
		return () => el.removeEventListener("error", onError);
	}, []);

	const { src, iosSrc, alt, style, className } = props;
	return (
		<model-viewer
			ref={ref}
			src={src}
			ios-src={iosSrc}
			crossorigin="anonymous"
			ar
			ar-modes="webxr scene-viewer quick-look"
			camera-controls
			auto-rotate
			style={
				style ?? {
					width: "100%",
					height: 500,
					background: "transparent",
				}
			}
			class={className}
			alt={alt}
		/>
	);
}
