export type JobResult = {
  id: string,
  title: string,
  department: string,
  team: string,
  employmentType: string,
  location: string,
  secondaryLocations: string[],
  publishedAt: string,
  isListed: boolean,
  isRemote: boolean,
  workplaceType: string,
  address: {
    postalAddress: {
      addressRegion: string,
      addressCountry: string,
      addressLocality: string
    }
  },
  jobUrl: string,
  applyUrl: string,
  descriptionHtml: string,
  descriptionPlain: string
}