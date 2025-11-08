// app/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Any, PortableText, type SanityDocument } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import ProductCarousel from "@/layout/ProductMedia";

// ─── GROQ ─────────────────────────────────────────────────────────────────────
const POST_QUERY = /* groq */ `
*[_type == "post" && slug.current == $slug][0]{
  _id, title, slug, publishedAt, body, tags, price,
  image, thumbnail,
  gallery[]{..., asset->},
  // 3D assets
  "glbUrl": model3d.asset->url,
  "usdzUrl": model3dUsdz.asset->url,
  // derived urls
  "thumbUrl": coalesce(thumbnail.asset->url, image.asset->url)
}
`;

const RELATED_QUERY = /* groq */ `
*[_type == "post" && defined(slug.current) && slug.current != $slug]
| order(publishedAt desc)[0...8]{
  _id, title, slug, "thumbUrl": coalesce(thumbnail.asset->url, image.asset->url), price
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const { projectId, dataset } = client.config();
const builder =
	projectId && dataset ? imageUrlBuilder({ projectId, dataset }) : null;
const urlFor = (src: SanityImageSource) =>
	builder ? builder.image(src) : null;

function formatPrice(n?: number) {
	if (typeof n !== "number") return null;
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(n);
}

export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const [post, related] = await Promise.all([
		client.fetch<SanityDocument>(
			POST_QUERY,
			{ slug },
			{ next: { revalidate: 30 } }
		),
		client.fetch<SanityDocument[]>(
			RELATED_QUERY,
			{ slug },
			{ next: { revalidate: 60 } }
		),
	]);

	if (!post) {
		return (
			<main className="mx-auto max-w-3xl p-8">
				<p className="text-red-600">Product not found.</p>
				<Link className="mt-4 inline-block underline" href="/">
					← Back to collection
				</Link>
			</main>
		);
	}

	const mainImageUrl =
		(post.image && urlFor(post.image)?.width(1400).height(1400).url()) ??
		(post.thumbUrl as string | undefined) ??
		null;

	const gallery: string[] = Array.isArray(post.gallery)
		? post.gallery
				.map((g: Any) => g?.asset?.url as string | undefined)
				.filter(Boolean)
		: [];

	const glbUrl: string | "" =
		typeof post.glbUrl === "string" ? post.glbUrl : "";
	const usdzUrl: string | undefined =
		typeof post.usdzUrl === "string" ? post.usdzUrl : undefined;

	const price = formatPrice(post.price);

	// pick thumbnails list (thumb + gallery previews)
	const thumbs = [
		...(mainImageUrl ? [mainImageUrl] : []),
		...gallery.slice(0, 5),
	];
	const images = [...(mainImageUrl ? [mainImageUrl] : []), ...gallery];
	return (
		<main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{/* Breadcrumb / Back */}
			<div className="mb-6 flex items-center justify-between">
				<Link
					href="/"
					className="text-sm text-neutral-500 hover:underline"
				>
					← Back to collection
				</Link>
				{post.publishedAt && (
					<span className="text-xs text-neutral-400">
						{new Date(post.publishedAt).toISOString().slice(0, 10)}
					</span>
				)}
			</div>

			{/* Product header */}
			<div className="grid gap-8 lg:grid-cols-2">
				{/* Media column */}
				<section className="space-y-3">
					{/* Thumbs row */}
					{thumbs.length > 1 && (
						<ul className="flex gap-3 overflow-x-auto pb-1">
							{thumbs.map((src, i) => (
								<li key={i} className="shrink-0">
									<div className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
										<Image
											src={src}
											alt={`${post.title} preview ${i + 1}`}
											fill
											sizes="80px"
											className="object-cover"
										/>
									</div>
								</li>
							))}
						</ul>
					)}

					{/* Photo / 3D toggle (CSS only) */}
					<ProductCarousel
						title={post.title}
						glbUrl={glbUrl || undefined} // if you’re proxying, pass the proxied URL here
						usdzUrl={usdzUrl}
						images={images}
					/>
				</section>

				{/* Details column */}
				<section className="flex flex-col justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
							{post.title}
						</h1>

						{/* Tags */}
						{Array.isArray(post.tags) && post.tags.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-2">
								{post.tags.map((t: string) => (
									<span
										key={t}
										className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600"
									>
										{t}
									</span>
								))}
							</div>
						)}

						{/* Price */}
						<div className="mt-4 flex items-center gap-3">
							{price ? (
								<span className="text-xl font-semibold">
									{price}
								</span>
							) : (
								<span className="text-sm text-neutral-500">
									Contact for price
								</span>
							)}
							{glbUrl && (
								<span className="rounded-full bg-black px-2 py-1 text-[10px] font-medium text-white">
									3D preview
								</span>
							)}
						</div>

						{/* Description */}
						<div className="prose mt-6 max-w-none text-neutral-700">
							{Array.isArray(post.body) ? (
								<PortableText value={post.body} />
							) : (
								<p>No description.</p>
							)}
						</div>
					</div>

					{/* CTAs */}
					<div className="mt-8 flex flex-wrap gap-3">
						<a
							className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
							href={`mailto:orders@yourdomain.com?subject=${encodeURIComponent(
								`Order: ${post.title}`
							)}&body=${encodeURIComponent(
								`Hi,\nI’d like to order "${post.title}".\n\nLink: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${post.slug?.current}`
							)}`}
						>
							Order via Email
						</a>
						<a
							className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
							href={`https://wa.me/212710777000?text=${encodeURIComponent(`Hi, I'm interested in ${post.title}`)}`}
							target="_blank"
						>
							Chat on WhatsApp
						</a>
					</div>
				</section>
			</div>

			{/* Related */}
			{Array.isArray(related) && related.length > 0 && (
				<section className="mt-14">
					<h2 className="mb-4 text-lg font-semibold">
						You may also like
					</h2>
					<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{related.map((r) => (
							<li key={r._id}>
								<Link
									href={`/${r.slug.current}`}
									className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg"
								>
									<div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
										{r.thumbUrl ? (
											<Image
												src={r.thumbUrl}
												alt={r.title}
												fill
												sizes="(max-width: 1024px) 50vw, 25vw"
												className="object-cover transition duration-300 group-hover:scale-105"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-neutral-400">
												No image
											</div>
										)}
									</div>
									<div className="p-3">
										<p className="line-clamp-1 text-sm font-medium">
											{r.title}
										</p>
										<p className="text-xs text-neutral-500">
											{r.price
												? formatPrice(r.price)
												: "View"}
										</p>
									</div>
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}
		</main>
	);
}
