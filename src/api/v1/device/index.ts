import { Router } from 'express';
import controller from './device.controller';

const router = Router();

router.get('/', controller.getDeviceList); // Get devices list
router.post('/', controller.postDevice); // Add to device list
router.delete('/:deviceId', controller.deleteDevice); // Remove from device list
export default router;
