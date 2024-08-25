import { query } from "../database/db.js";
import { sendMail } from "./mailer.js";

// Fungsi untuk menambah peminjaman baru
const addPeminjaman = async (req, res) => {
    const { id_user, id_kategori, id_barang, jumlah, tanggal_pinjam, tanggal_kembali, keterangan } = req.body;

    try {
        // Ambil nomor seri yang tersedia (status 'Available')
        const serialNumbers = await query("SELECT id_serial, nomor_seri FROM serial_number WHERE id_barang = ? AND status = 'Available' LIMIT ?", [id_barang, jumlah]);

        if (serialNumbers.length < jumlah) {
            return res.status(400).json({ msg: "Jumlah barang yang tersedia tidak mencukupi." });
        }

        // Update status serial number menjadi 'Loan'
        for (let serial of serialNumbers) {
            await query("UPDATE serial_number SET status = 'Loan' WHERE id_serial = ?", [serial.id_serial]);
        }

        // Simpan data peminjaman
        const result = await query(
            "INSERT INTO peminjaman (id_user, id_barang, jumlah, tanggal_pinjam, tanggal_kembali, keterangan, id_status_peminjaman, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())",
            [id_user, id_barang, jumlah, tanggal_pinjam, tanggal_kembali, keterangan]
        );

        // Kirim notifikasi email (opsional)
        await sendMail(user_email, 'Peminjaman Barang', 'Peminjaman barang berhasil diajukan.');

        return res.status(201).json({ msg: "Peminjaman berhasil diajukan dengan status Pending.", serialNumbers: serialNumbers });
    } catch (error) {
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};


// Menampilkan Peminjaman Berdasarkan User
const getPeminjamanByUser = async (req, res) => {
    const { id_user } = req.params;

    try {
        const peminjaman = await query("SELECT * FROM peminjaman WHERE id_user = ?", [id_user]);
        return res.status(200).json({ msg: "Berhasil", data: peminjaman });
    } catch (error) {
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};

// Menampilkan Semua Peminjaman di Admin
const getAllPeminjaman = async (req, res) => {
    try {
        const peminjaman = await query("SELECT * FROM peminjaman");
        return res.status(200).json({ msg: "Berhasil", data: peminjaman });
    } catch (error) {
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};

// Mengubah Status Peminjaman
const updateStatusPeminjaman = async (req, res) => {
    const { id_peminjaman } = req.params;
    const { status_peminjaman } = req.body;

    try {
        // Update status peminjaman
        await query("UPDATE peminjaman SET id_status_peminjaman = ? WHERE id_peminjaman = ?", [status_peminjaman, id_peminjaman]);

        // Dapatkan informasi peminjaman dan user terkait
        const peminjaman = await query("SELECT p.*, u.email, u.nama, p.id_barang, p.jumlah FROM peminjaman p JOIN user u ON p.id_user = u.id_user WHERE id_peminjaman = ?", [id_peminjaman]);
        const { email, nama, id_barang, jumlah, tanggal_pinjam, tanggal_kembali } = peminjaman[0];

        let subject = "";
        let text = "";
        let html = "";

        if (status_peminjaman === 2) { // Accepted
            // Update status serial number ke "Loaned"
            await query(
                "UPDATE serial_number SET status_serial = 'Loaned' WHERE id_barang = ? AND status_serial = 'Available' LIMIT ?",
                [id_barang, jumlah]
            );

            subject = "Peminjaman Barang Disetujui";
            text = `Halo ${nama},\n\nPeminjaman barang Anda telah disetujui. Barang yang Anda pinjam (ID Barang: ${id_barang}) bisa diambil.\n\nTanggal Pinjam: ${tanggal_pinjam}\nTanggal Kembali: ${tanggal_kembali}\n\nTerima kasih.`;
            html = `<p>Halo ${nama},</p><p>Peminjaman barang Anda telah disetujui. Barang yang Anda pinjam (ID Barang: ${id_barang}) bisa diambil.</p><p><strong>Tanggal Pinjam:</strong> ${tanggal_pinjam}<br/><strong>Tanggal Kembali:</strong> ${tanggal_kembali}</p><p>Terima kasih.</p>`;
        } else if (status_peminjaman === 3) { // Rejected
            subject = "Peminjaman Barang Ditolak";
            text = `Halo ${nama},\n\nMohon maaf, peminjaman barang Anda telah ditolak. Silakan hubungi admin untuk informasi lebih lanjut.\n\nTerima kasih.`;
            html = `<p>Halo ${nama},</p><p>Mohon maaf, peminjaman barang Anda telah ditolak. Silakan hubungi admin untuk informasi lebih lanjut.</p><p>Terima kasih.</p>`;
        } else if (status_peminjaman === 4) { // Completed
            // Update status serial number ke "Available" setelah barang dikembalikan
            await query(
                "UPDATE serial_number SET status_serial = 'Available' WHERE id_barang = ? AND status_serial = 'Loaned'",
                [id_barang]
            );

            subject = "Peminjaman Barang Selesai";
            text = `Halo ${nama},\n\nPeminjaman barang Anda telah selesai. Terima kasih telah mengembalikan barang tepat waktu.\n\nTerima kasih.`;
            html = `<p>Halo ${nama},</p><p>Peminjaman barang Anda telah selesai. Terima kasih telah mengembalikan barang tepat waktu.</p><p>Terima kasih.</p>`;
        }

        // Mengirimkan email
        await sendMail(email, subject, text, html);

        return res.status(200).json({ msg: "Status peminjaman berhasil diubah dan email telah dikirim." });
    } catch (error) {
        console.error("Error saat mengubah status peminjaman:", error);
        return res.status(500).json({ msg: "Terjadi kesalahan", error });
    }
};


export { addPeminjaman, getPeminjamanByUser, getAllPeminjaman, updateStatusPeminjaman };

