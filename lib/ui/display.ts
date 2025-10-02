// Vehicle Display Helpers - Safe UI rendering during migration
// Prevents regressions while database schema evolves

export function getVehicleDisplayName(v: { 
  display_name?: string; 
  label?: string; 
  year?: number; 
  make?: string; 
  model?: string; 
  trim?: string; 
}): string {
  return v.display_name
      ?? v.label
      ?? [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ')
      ?? 'Unknown Vehicle';
}

// Helper for garage display names
export function getGarageDisplayName(g: {
  name?: string;
  address?: string;
}): string {
  return g.name ?? g.address ?? 'Unknown Location';
}

// Helper for consistent date formatting
export function formatEventDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Helper for mileage display
export function formatMileage(miles?: number | null): string {
  if (miles == null) return 'No mileage';
  return `${miles.toLocaleString()} mi`;
}
