export interface CardData {
  companyName: string;
  fullName: string;
  jobTitle: string;
  sector: string;
  mobile: string;
  officePhone: string;
  email: string;
  website: string;
  imageLink: string;
}

export const EMPTY_CARD: CardData = {
  companyName: 'Null',
  fullName: 'Null',
  jobTitle: 'Null',
  sector: 'Null',
  mobile: 'Null',
  officePhone: 'Null',
  email: 'Null',
  website: 'Null',
  imageLink: '',
};

export const CARD_FIELD_LABELS: Record<keyof Omit<CardData, 'imageLink'>, string> = {
  companyName: 'Company Name',
  fullName: 'Full Name',
  jobTitle: 'Job Title',
  sector: 'Sector',
  mobile: 'Mobile',
  officePhone: 'Office Phone',
  email: 'Email',
  website: 'Website',
};
