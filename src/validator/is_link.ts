import validator from 'validator';

const isLink = (link: string) => validator.isURL(link);

export default isLink;
