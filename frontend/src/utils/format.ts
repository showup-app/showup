/** "Friday, October 2, 2026" */
export function formatLongDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

/** "Fri, Oct 2" */
export function formatShortDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

/** "4:00 PM" */
export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

/** "4:00 PM – 5:30 PM" */
export function formatTimeRange(iso: string, durationMinutes: number): string {
	const end = new Date(new Date(iso).getTime() + durationMinutes * 60_000);
	return `${formatTime(iso)} – ${formatTime(end.toISOString())}`;
}

/** "$5.00 per player", or "Free" */
export function formatCost(cost: number): string {
	return cost === 0 ? "Free" : `$${cost.toFixed(2)} per player`;
}

/** "soccer" → "Soccer" */
export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}