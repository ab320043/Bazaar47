
export const cityMap: Record<string, string> = {
  'orlando': 'Orlando',
  'south-florida': 'South Florida',
  'south florida': 'South Florida',
  'jacksonville': 'Jacksonville',
  'gainesville-fest': 'Gainesville | The FEST',
  'gainesville | the fest': 'Gainesville | The FEST',
  'gainesville-finale': 'Gainesville',
  'gulf-coast': 'Gulf Coast',
  'gulf coast': 'Gulf Coast',
  'tampa': 'Gulf Coast',
  // Add more mappings as needed
}

export const getDisplayCity = (city: string | undefined): string => {
  if (!city) return 'Unknown'
  const lowerCity = city.toLowerCase().trim()
  return cityMap[lowerCity] || city
}