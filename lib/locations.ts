/**
 * US States and Cities data using country-state-city package
 * Contains ~30,000+ US cities from offline data
 */

import { State, City } from 'country-state-city';

// Get all US states
const usStates = State.getStatesOfCountry('US');

export const US_STATES = usStates.map(state => ({
    code: state.isoCode,
    name: state.name,
})).sort((a, b) => a.name.localeCompare(b.name));

/**
 * Get all cities for a given state code
 * @param stateCode - Two letter state code (e.g., 'TX', 'CA')
 * @returns Array of city names sorted alphabetically
 */
export function getCitiesForState(stateCode: string): string[] {
    const cities = City.getCitiesOfState('US', stateCode);
    return cities
        .map(city => city.name)
        .sort((a, b) => a.localeCompare(b));
}

/**
 * Get state name by code
 */
export function getStateByCode(code: string): string | undefined {
    return usStates.find(s => s.isoCode === code)?.name;
}

/**
 * Search cities across all states (for autocomplete)
 */
export function searchCities(query: string, limit = 20): { city: string; state: string }[] {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results: { city: string; state: string }[] = [];

    for (const state of usStates) {
        const cities = City.getCitiesOfState('US', state.isoCode);
        for (const city of cities) {
            if (city.name.toLowerCase().startsWith(lowerQuery)) {
                results.push({ city: city.name, state: state.isoCode });
                if (results.length >= limit) return results;
            }
        }
    }

    return results;
}
