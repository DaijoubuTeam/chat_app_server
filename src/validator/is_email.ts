import validator from 'validator';

const isEmail = (email: string) => validator.isEmail(email);

export default isEmail;
