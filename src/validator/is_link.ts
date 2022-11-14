import validator from 'validator';

const isLink = (link: string) =>
  validator.isURL(link, { require_tld: false }) || validator.isEmpty(link);

export default isLink;
