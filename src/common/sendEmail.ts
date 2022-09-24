import { StatusCodes } from 'http-status-codes';
import HttpException from '../exception';
import sgMail from '@sendgrid/mail';

import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (
  email: string,
  subject: string,
  htmlTemplate: string
) => {
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const verifiedSender = process.env.SENDGRID_VERIFIED_SENDER;
  if (!sendGridApiKey || !verifiedSender) {
    throw new HttpException(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Internal server error'
    );
  }
  sgMail.setApiKey(sendGridApiKey);
  const msg: sgMail.MailDataRequired = {
    to: email,
    from: verifiedSender,
    subject: subject,
    html: htmlTemplate,
  };
  await sgMail.send(msg);
};

export default sendEmail;
