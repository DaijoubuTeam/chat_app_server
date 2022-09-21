import validator from 'validator';

const isPhone = (phone: string) => validator.isMobilePhone(phone);

export default isPhone;
