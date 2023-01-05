import { HttpStatusCode } from 'axios';
import getRawDevice from '../../../common/getRawDevice';
import HttpException from '../../../exception';
import Device from '../../../models/device';

const getDevicesList = async (userId: string) => {
  const devices = await Device.find({
    uid: userId,
  });
  return devices.map((device) => getRawDevice(device));
};

const addToDevice = async (
  userId: string,
  deviceId: string,
  token: string,
  name: string
) => {
  let device = await Device.findById(deviceId);
  if (device) {
    device.token = token;
    device.uid = userId;
    device.name = name;
  } else {
    device = await Device.create({
      _id: deviceId,
      uid: userId,
      token: token,
      name: name,
    });
  }
  const rs = await device.save();
  return getRawDevice(rs);
};

const removeDevice = async (deviceId: string) => {
  const device = await Device.findById(deviceId);
  if (!device) {
    throw new HttpException(HttpStatusCode.NotFound, 'Device not found');
  }
  await Device.findByIdAndDelete(deviceId);
};

export default { getDevicesList, addToDevice, removeDevice };
