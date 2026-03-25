export type CountryOption = {
  code: string;
  name: string;
  geocodeName: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'IE', name: 'Ireland', geocodeName: 'Ireland' },
  { code: 'GB', name: 'United Kingdom', geocodeName: 'United Kingdom' },
  { code: 'US', name: 'United States', geocodeName: 'United States' },
  { code: 'OTHER', name: 'Other', geocodeName: '' },
];

export function detectCountryFromPostcode(postcode: string): CountryOption {
  const cleaned = postcode.trim().toUpperCase();

  // Irish eircode: letter + 2 digits + optional space + 4 alphanumerics
  const isIrish = /^[AC-FHKNPRTV-Y][0-9]{2}\s?[0-9AC-FHKNPRTV-Y]{4}$/.test(cleaned);
  if (isIrish) return COUNTRY_OPTIONS[0];

  // UK postcode: e.g. SW1A 1AA, EC1A 1BB
  const isUK = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/.test(cleaned);
  if (isUK) return COUNTRY_OPTIONS[1];

  // US ZIP code: 5 digits or 5+4 with hyphen
  const isUS = /^\d{5}(-\d{4})?$/.test(cleaned);
  if (isUS) return COUNTRY_OPTIONS[2];

  return COUNTRY_OPTIONS[0];
}

export function buildGeocodingQuery(postcode: string, country: CountryOption): string {
  if (country.code === 'OTHER' || !country.geocodeName) {
    return postcode.trim();
  }
  return postcode.trim() + ', ' + country.geocodeName;
}
