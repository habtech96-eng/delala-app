export interface Listing {
  id: string;
  title: string;
  price: string;
  location: string;
  category: 'House' | 'Car' | 'Land' | 'Other';
  images?: string[];
  phone: string;
  ownerName: string;
}
