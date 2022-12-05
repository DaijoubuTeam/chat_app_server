import { IDevice } from '../models/device';

const getRawDevice = (device: IDevice) => {
  return {
    id: device._id,
    name: device.name,
  };
};
export default getRawDevice;
