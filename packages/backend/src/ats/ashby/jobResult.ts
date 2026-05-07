export type JobResult = {
  id: string;
  title: string;
  department: string;
  team: string;
  employmentType: string;
  location: string;
  secondaryLocations: string[];
  publishedAt: string;
  isListed: boolean;
  isRemote: boolean;
  workplaceType: string;
  address: {
    postalAddress: {
      addressRegion: string;
      addressCountry: string;
      addressLocality: string;
    };
  };
  jobUrl: string;
  applyUrl: string;
  descriptionHtml: string;
  descriptionPlain: string;
  compensation: {
    compensationTierSummary: string;
    scrapeableCompensationSalarySummary: string;
    compensationTiers: {
      id: string;
      tierSummary: string;
      title: string | null;
      additionalInformation: string | null;
      components: {
        id: string;
        summary: string;
        compensationType: string;
        interval: string;
        currencyCode: string;
        minValue: number;
        maxValue: number;
      }[];
    }[];
    summaryComponents: {
      compensationType: string;
      interval: string;
      currencyCode: string;
      minValue: number | null;
      maxValue: number | null;
    }[];
  };
};
