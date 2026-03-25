import worldCountries from 'world-countries';

export type CountryOption = {
  code: string;
  name: string;
  geocodeName: string;
};

const PRIORITY_COUNTRIES: CountryOption[] = [
  { code: 'IE', name: 'Ireland', geocodeName: 'Ireland' },
  { code: 'GB', name: 'United Kingdom', geocodeName: 'United Kingdom' },
  { code: 'US', name: 'United States', geocodeName: 'United States' },
];

const ALL_OTHER_COUNTRIES: CountryOption[] = worldCountries
  .filter(c => !['IE', 'GB', 'US'].includes(c.cca2))
  .map(c => ({
    code: c.cca2,
    name: c.name.common,
    geocodeName: c.name.common,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRY_OPTIONS: CountryOption[] = [
  ...PRIORITY_COUNTRIES,
  ...ALL_OTHER_COUNTRIES,
];

export function detectCountryFromPostcode(postcode: string): CountryOption {
  const cleaned = postcode.trim().toUpperCase();

  // Irish eircode: letter + 2 digits + optional space + 4 alphanumerics
  const isIrish = /^[AC-FHKNPRTV-Y][0-9]{2}\s?[0-9AC-FHKNPRTV-Y]{4}$/.test(cleaned);
  if (isIrish) return PRIORITY_COUNTRIES[0];

  // UK postcode: e.g. SW1A 1AA, EC1A 1BB
  const isUK = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/.test(cleaned);
  if (isUK) return PRIORITY_COUNTRIES[1];

  // US ZIP code: 5 digits or 5+4 with hyphen
  const isUS = /^\d{5}(-\d{4})?$/.test(cleaned);
  if (isUS) return PRIORITY_COUNTRIES[2];

  return PRIORITY_COUNTRIES[0];
}

export function buildGeocodingQuery(postcode: string, country: CountryOption): string {
  if (!country.geocodeName) {
    return postcode.trim();
  }
  return postcode.trim() + ', ' + country.geocodeName;
}
