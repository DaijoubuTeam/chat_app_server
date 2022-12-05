import Device from '../models/device';
import * as admin from 'firebase-admin';
import { FirebaseError } from 'firebase-admin';

export const sendPushNotificationToDevice = async (
  deviceId: string,
  eventName: string,
  data: any
) => {
  let device;
  try {
    device = await Device.findById(deviceId);
    if (!device || !device.uid || !device.token) {
      return;
    }
    const message = {
      data: {
        eventName,
        data,
      },
      token: device.token,
    };
    await admin.messaging().send(message);
  } catch (error: any) {
    if (
      error.message == 'messaging/invalid-argument' ||
      error.message == 'messaging/invalid-registration-token'
    ) {
      if (device != null) {
        device.token == null;
        device.save().catch((err) => console.log(err));
      }
    }
    console.log(error);
  }
};
