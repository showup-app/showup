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

/** "$5.00", or "Free" */
export function formatCost(cost: number): string {
	return cost === 0 ? "Free" : `$${cost.toFixed(2)}`;
}

/** "6550 Bonsor Ave, Burnaby" → "Burnaby" (the last part of the address) */
export function cityFromAddress(address: string): string {
	const parts = address.split(",");
	return parts[parts.length - 1].trim();
}

/** "8 spots left", "1 spot left", or "Full" */
export function formatSpotsLeft(spotsLeft: number): string {
	if (spotsLeft <= 0) return "Full";
	return `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`;
}

/** "soccer" → "Soccer" */
export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Gets the text of the join game button depending on the conditions of that game */
export function getJoinButtonText(userJoinedGame: boolean, isFull: boolean, userHostingGame: boolean): string {
	if (userJoinedGame) return "Joined";
	if (isFull) return "Full";
	if (userHostingGame) return "Hosting";
	return "Join";
}
