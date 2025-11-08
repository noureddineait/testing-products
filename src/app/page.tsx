// app/page.tsx (or app/(site)/page.tsx)
import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/client";

type Card = {
	_id: string;
	title: string;
	slug: { current: string };
	publishedAt?: string;
	thumbUrl?: string | null;
	price?: number | null;
	tags?: string[] | null;
	has3d?: boolean;
};

const POSTS_QUERY = /* groq */ `
*[_type == "post" && defined(slug.current)]
| order(publishedAt desc)[0...24]{
  _id,
  title,
  slug,
  publishedAt,
  "thumbUrl": coalesce(thumbnail.asset->url, image.asset->url),
  price,
  tags,
  // show a badge when a 3D model exists
  "has3d": defined(model3d.asset->_id)
}
`;

const options = { next: { revalidate: 30 } };

function formatDateISO(d?: string) {
	return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function formatPrice(n?: number | null) {
	if (typeof n !== "number") return null;
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		maximumFractionDigits: 0,
	}).format(n);
}

export default async function IndexPage() {
	const posts = await client.fetch<Card[]>(POSTS_QUERY, {}, options);

	return (
		<main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			{/* Top bar */}
			<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Collection
					</h1>
					<p className="mt-1 text-sm text-neutral-500">
						Hand-picked items — updated automatically from Sanity.
					</p>
				</div>
			</div>

			<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{posts.map((p) => (
					<li key={p._id}>
						<Link
							href={`/${p.slug.current}`}
							className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg"
						>
							<div className="relative aspect-4/3 w-full overflow-hidden bg-linear-to-br from-neutral-50 to-neutral-100">
								{p.thumbUrl ? (
									<Image
										src={p.thumbUrl}
										alt={p.title}
										fill
										sizes="(max-width: 768px) 100vw, 25vw"
										className="object-cover transition duration-300 group-hover:scale-105"
										priority={true}
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-neutral-400">
										No image
									</div>
								)}

								<div className="pointer-events-none absolute left-3 top-3 flex gap-2">
									{p.has3d && (
										<span className="rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
											3D
										</span>
									)}
									{Array.isArray(p.tags) &&
										p.tags.slice(0, 1).map((t) => (
											<span
												key={t}
												className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-neutral-700 backdrop-blur"
											>
												{t}
											</span>
										))}
								</div>
							</div>

							<div className="space-y-1 p-4">
								<h2 className="line-clamp-1 text-base font-semibold leading-6">
									{p.title}
								</h2>

								<div className="flex items-center justify-between">
									<p className="text-xs text-neutral-500">
										{formatDateISO(p.publishedAt)}
									</p>
									{formatPrice(p.price) ? (
										<p className="text-sm font-semibold">
											{formatPrice(p.price)}
										</p>
									) : (
										<span className="text-xs text-neutral-400">
											View
										</span>
									)}
								</div>
							</div>

							<div className="h-1 w-0 bg-black transition-all duration-300 group-hover:w-full" />
						</Link>
					</li>
				))}
			</ul>
		</main>
	);
}
