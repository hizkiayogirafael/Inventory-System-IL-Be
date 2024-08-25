import express from 'express';
import { getAllBarang, addBarang, getBarangById, updateBarang, deleteBarang, updateSerialNumber, deleteSerialNumber, getSerialNumbers, addSerialNumber } from '../controller/barang.js';

const router = express.Router();

router.get('/', getAllBarang);
router.post('/', addBarang);
router.get('/:id', getBarangById);
router.put('/:id', updateBarang);
router.delete('/:id', deleteBarang);
router.get("/serial-number/:id_barang", getSerialNumbers);
router.post("/serial-number/:id", addSerialNumber);
router.put("/serial-number/:id", updateSerialNumber);
router.delete("/serial-number/:id", deleteSerialNumber);

export default router;
