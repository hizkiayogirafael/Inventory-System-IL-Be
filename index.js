import express from "express"
import dotenv from "dotenv"
import { connection } from "./database/db.js";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import barangRoutes from "./routes/barang.js";
import userRoutes from "./routes/user.js";
import peminjamanRoutes from "./routes/peminjaman.js";
import './scheduler.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);  // Semua route auth akan memiliki prefix /api/auth
app.use('/api/barang', barangRoutes); // Semua route barang akan memiliki prefix /api/barang
app.use('/api/users', userRoutes);  // Semua route user akan memiliki prefix /api/users
app.use('/api/peminjaman', peminjamanRoutes);  // Semua route peminjaman akan memiliki prefix /api/peminjaman

app.listen(process.env.PORT, async() => {
    await connection();
    console.log(`https:localhost:${process.env.PORT}`)
});

