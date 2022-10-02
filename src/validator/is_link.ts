import validator from 'validator';

const isLink = (link: string) =>
  validator.isURL(link) || validator.isEmpty(link);

export default isLink;
