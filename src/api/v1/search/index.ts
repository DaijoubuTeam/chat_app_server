import { Router } from 'express';
import controller from './search.controller';

const router = Router();

router.get('/user', controller.searchUser);
export default router;
