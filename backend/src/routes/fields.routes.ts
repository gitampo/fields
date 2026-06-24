import { Router } from 'express';
import { listFields } from '../controllers/fields.controller';

const router = Router();

router.get('/', listFields);

export default router;
