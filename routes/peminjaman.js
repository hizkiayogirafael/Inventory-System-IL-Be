import express from 'express';
import { addPeminjaman, getPeminjamanByUser, getAllPeminjaman, updateStatusPeminjaman } from '../controller/peminjaman.js';

const router = express.Router();


router.post('/', addPeminjaman);// Route untuk menambahkan peminjaman baru
router.get('/', getAllPeminjaman);// Route untuk mendapatkan semua peminjaman (admin)
router.get('/:id_user', getPeminjamanByUser);// Route untuk mendapatkan peminjaman berdasarkan user
router.put('/status/:id_peminjaman', updateStatusPeminjaman);// Route untuk mengubah status peminjaman


export default router;
