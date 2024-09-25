import express from 'express';
import { addPeminjaman, getPeminjamanByUser, getAllPeminjaman, approvePeminjaman, rejectPeminjaman, completePeminjaman } from '../controller/peminjaman.js';

const router = express.Router();


router.post('/', addPeminjaman);// Route untuk menambahkan peminjaman baru
router.get('/', getAllPeminjaman);// Route untuk mendapatkan semua peminjaman (admin)
router.get('/:id_user', getPeminjamanByUser);// Route untuk mendapatkan peminjaman berdasarkan user
router.put('/approve/:id_peminjaman', approvePeminjaman); // Pastikan parameter yang digunakan konsisten
router.put('/reject/:id_peminjaman', rejectPeminjaman);//reject peminjaman
router.put('/complete/:id_peminjaman', completePeminjaman);//selesaikan peminjaman 


export default router;
