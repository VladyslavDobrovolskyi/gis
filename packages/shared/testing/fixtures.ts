import type { City, Country, Region } from '@/types';

export const mockCity: City = {
  ogc_fid: 1,
  city_name: 'Test City',
  region_id: 1,
  geom: null,
};

export const mockCountry: Country = {
  ogc_fid: 1,
  name: 'Test Country',
  iso_code: 'TC',
  shape_id: null,
  group_code: null,
  type: null,
  geom: null,
};

export const mockRegion: Region = {
  ogc_fid: 1,
  name: 'Test Region',
  iso_code: 'TR',
  shape_id: null,
  group_code: null,
  type: null,
  geom: null,
};

export const mockCities: City[] = [mockCity];
export const mockCountries: Country[] = [mockCountry];
export const mockRegions: Region[] = [mockRegion];
