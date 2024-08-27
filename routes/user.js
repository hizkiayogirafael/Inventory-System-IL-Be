import express from 'express';
import { getAllUsers, addUser, getUserById, updateUser, deleteUser, approveUser, updateProfile } from '../controller/user.js';

const router = express.Router();

router.get('/', getAllUsers);// Route untuk mendapatkan semua user
router.post('/', addUser);// Route untuk menambahkan user baru
router.get('/:id', getUserById);// Route untuk mendapatkan user berdasarkan ID
router.put('/:id', updateUser);// Route untuk memperbarui user berdasarkan ID
router.put('/profile/:id', updateProfile);// Route untuk memperbarui profile berdasarkan ID
router.put('/approve/:id', approveUser); // Pastikan parameter yang digunakan konsisten
router.delete('/:id', deleteUser);// Route untuk menghapus user berdasarkan ID


export default router;
