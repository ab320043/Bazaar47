// Map form city values to display names
export const cityMap: Record<string, string> = {
  'orlando': 'Orlando',
  'south-florida': 'South Florida',
  'jacksonville': 'Jacksonville',
  'gainesville-fest': 'Gainesville | The FEST',
  'gainesville-finale': 'Gainesville',
  'tampa': 'Tampa (TBA)',
  'orlando, fl': 'Orlando',
  'south florida': 'South Florida',
  // Add more mappings as needed
}

export const getDisplayCity = (city: string | undefined): string => {
  if (!city) return 'Unknown'
  const lowerCity = city.toLowerCase().trim()
  return cityMap[lowerCity] || city
}