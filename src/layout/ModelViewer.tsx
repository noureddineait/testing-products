"use client";

import React, { useEffect } from "react";

type Props = {
	src: string;
	iosSrc?: string;
	alt?: string;
	style?: React.CSSProperties;
	className?: string;
	// optional extras
	ar?: boolean;
	arModes?: string;
	cameraControls?: boolean;
	autoRotate?: boolean;
	crossorigin?: "anonymous" | "use-credentials" | "";
	exposure?: number | string;
	shadowIntensity?: number | string;
	poster?: string;
};

export default function ModelViewer({
	src,
	iosSrc,
	alt,
	style,
	className,
	ar = true,
	arModes = "webxr scene-viewer quick-look",
	cameraControls = true,
	autoRotate = true,
	crossorigin = "anonymous",
	exposure,
	shadowIntensity,
	poster,
}: Props) {
	// Load only on client to avoid "self is not defined"
	useEffect(() => {
		import("@google/model-viewer");
	}, []);

	// Render the custom element WITHOUT JSX typing
	return React.createElement("model-viewer", {
		src,
		alt,
		style,
		class: className,
		crossorigin,
		poster,
		exposure,
		"shadow-intensity": shadowIntensity,
		// boolean attributes are present as empty string when true
		ar: ar ? "" : undefined,
		"ar-modes": arModes,
		"camera-controls": cameraControls ? "" : undefined,
		"auto-rotate": autoRotate ? "" : undefined,
		"ios-src": iosSrc,
	});
}
