"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ModelViewer from "@/layout/ModelViewer"; // your client wrapper (loads @google/model-viewer in useEffect)

type Slide =
	| { type: "3d"; src: string; ios?: string }
	| { type: "img"; src: string };

export default function ProductCarousel({
	title,
	glbUrl,
	usdzUrl,
	images = [],
	className,
}: {
	title: string;
	glbUrl?: string | null;
	usdzUrl?: string | null;
	images?: string[];
	className?: string;
}) {
	const slides: Slide[] = useMemo(
		() => [
			...(glbUrl
				? [{ type: "3d", src: glbUrl, ios: usdzUrl || undefined }]
				: []),
			...images.filter(Boolean).map((src) => ({ type: "img", src })),
		],
		[glbUrl, usdzUrl, images]
	);

	const [i, setI] = useState(0);
	const wrap = (n: number) => (n + slides.length) % slides.length;
	const prev = () => setI((v) => wrap(v - 1));
	const next = () => setI((v) => wrap(v + 1));

	// keyboard arrows
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") prev();
			if (e.key === "ArrowRight") next();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// swipe
	const startX = useRef<number | null>(null);
	const onTouchStart = (e: React.TouchEvent) =>
		(startX.current = e.touches[0].clientX);
	const onTouchEnd = (e: React.TouchEvent) => {
		if (startX.current == null) return;
		const dx = e.changedTouches[0].clientX - startX.current;
		if (Math.abs(dx) > 40) dx > 0 ? prev() : next();
		startX.current = null;
	};

	if (slides.length === 0) {
		return (
			<div className="relative aspect-square w-full rounded-2xl border border-neutral-200 bg-neutral-50" />
		);
	}

	return (
		<div
			className={["relative select-none", className]
				.filter(Boolean)
				.join(" ")}
		>
			{/* Stage */}
			<div
				className="relative aspect-square w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
				onTouchStart={onTouchStart}
				onTouchEnd={onTouchEnd}
			>
				{slides[i].type === "3d" ? (
					<ModelViewer
						key={(slides[i] as any).src}
						src={(slides[i] as any).src}
						iosSrc={(slides[i] as any).ios}
						alt={`${title} 3D model`}
						style={{ width: "100%", height: "100%" }}
					/>
				) : (
					<Image
						key={(slides[i] as any).src}
						alt={`${title} image ${i + 1}`}
						src={(slides[i] as any).src}
						fill
						sizes="(max-width:1024px) 100vw, 50vw"
						className="object-cover"
						priority
					/>
				)}
			</div>

			{/* Arrows */}
			{slides.length > 1 && (
				<>
					<button
						aria-label="Previous"
						onClick={prev}
						className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl bg-black/65 px-3 py-2 text-white backdrop-blur transition hover:bg-black"
					>
						‹
					</button>
					<button
						aria-label="Next"
						onClick={next}
						className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-black/65 px-3 py-2 text-white backdrop-blur transition hover:bg-black"
					>
						›
					</button>
				</>
			)}

			{/* Dots */}
			{slides.length > 1 && (
				<div className="mt-3 flex justify-center gap-2">
					{slides.map((_, idx) => (
						<button
							key={idx}
							onClick={() => setI(idx)}
							aria-label={`Go to slide ${idx + 1}`}
							className={`h-2.5 w-2.5 rounded-full transition ${
								idx === i
									? "bg-black"
									: "bg-neutral-300 hover:bg-neutral-400"
							}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
