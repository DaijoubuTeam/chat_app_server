import validator from 'validator';

const isPhone = (phone: string) =>
  validator.isMobilePhone(phone) || validator.isEmpty(phone);

export default isPhone;
