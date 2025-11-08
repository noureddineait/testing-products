import { createClient } from "next-sanity";

export const client = createClient({
	projectId: "do149o7m",
	dataset: "production",
	apiVersion: "2024-01-01",
	useCdn: false,
});
