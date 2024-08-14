import express from 'express';
import { getAllBarang, addBarang, getBarangById, updateBarang, deleteBarang } from '../controller/barang.js';

const router = express.Router();

router.get('/', getAllBarang);
router.post('/', addBarang);
router.get('/:id', getBarangById);
router.put('/:id', updateBarang);
router.delete('/:id', deleteBarang);

export default router;
