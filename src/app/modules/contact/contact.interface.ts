export interface IContact {
  locationName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  phone: string;
  email: string;

  mapUrl: string;

  businessHours: {
    mondayFriday: string;
    saturday: string;
    sunday: string;
    timezone: string;
  };
}