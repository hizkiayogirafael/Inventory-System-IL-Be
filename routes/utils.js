import express from 'express';
import { getOptions } from '../controller/utils.js';

const router = express.Router();

router.get('/options', getOptions);


export default router;
