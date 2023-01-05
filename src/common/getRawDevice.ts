import { IDevice } from '../models/device';

const getRawDevice = (device: IDevice) => {
  return {
    id: device._id,
    name: device.name,
    os: device.os,
  };
};
export default getRawDevice;
