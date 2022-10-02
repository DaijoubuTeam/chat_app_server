import validator from 'validator';

const isEmail = (email: string) =>
  validator.isEmail(email) || validator.isEmpty(email);

export default isEmail;
