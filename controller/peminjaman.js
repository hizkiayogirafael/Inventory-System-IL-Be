    import { query } from "../database/db.js";
    import { sendMail } from "./mailer.js";

    // Fungsi untuk menambah peminjaman baru
    const addPeminjaman = async (req, res) => {
        const { id_user, id_kategori, id_barang, jumlah, tanggal_pinjam, tanggal_kembali, keterangan } = req.body;

        try {
            // Ambil nomor seri yang tersedia (status 'Available')
            const serialNumbers = await query("SELECT id_serial, nomor_seri FROM serial_number WHERE id_barang = ? AND status_serial = 'Available' LIMIT ?", [id_barang, jumlah]);

            if (serialNumbers.length < jumlah) {
                return res.status(400).json({ msg: "Jumlah barang yang tersedia tidak mencukupi." });
            }

            // Update status serial number menjadi 'Loan'
            for (let serial of serialNumbers) {
                await query("UPDATE serial_number SET status = 'Loan' WHERE id_serial = ?", [serial.id_serial]);
            }

            // Simpan data peminjaman
            const result = await query(
                "INSERT INTO peminjaman (id_user, id_kategori, id_barang, jumlah, tanggal_pinjam, tanggal_kembali, keterangan, id_status_peminjaman, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())",
                [id_user, id_kategori, id_barang, jumlah, tanggal_pinjam, tanggal_kembali, keterangan]
            );

            // Kirim notifikasi email ke user (opsional, jika diperlukan)
            // const user_email = ... (dapatkan email user dari database atau req.body)
            // await sendMail(user_email, 'Peminjaman Barang', 'Peminjaman barang berhasil diajukan dengan status Pending.');

            return res.status(201).json({
                msg: "Peminjaman berhasil diajukan dengan status Pending.",
                peminjaman_id: result.insertId,
                serialNumbers: serialNumbers
            }); 
        } catch (error) {
            return res.status(500).json({ msg: "Terjadi kesalahan", error });
        }
    };


    // Menampilkan Peminjaman Berdasarkan User
    const getPeminjamanByUser = async (req, res) => {
        const { id_user } = req.params;

        if (!id_user) {
            return res.status(400).json({ msg: "ID user tidak ditemukan" });
        }

        try {
            const peminjaman = await query(`
                SELECT 
                    peminjaman.*, 
                    user.nama AS nama_user, 
                    barang.nama_barang, 
                    kategori.nama_kategori,
                    status_peminjaman.status_peminjaman
                FROM 
                    peminjaman
                JOIN 
                    user ON peminjaman.id_user = user.id_user
                JOIN 
                    barang ON peminjaman.id_barang = barang.id_barang
                JOIN 
                    kategori ON barang.id_kategori = kategori.id_kategori
                JOIN
                    status_peminjaman ON peminjaman.id_status_peminjaman = status_peminjaman.id_status_peminjaman 
                WHERE peminjaman.id_user = ?
            `, [id_user]);

            if (peminjaman.length === 0) {
                return res.status(404).json({ msg: "Data peminjaman tidak ditemukan" });
            }

            return res.status(200).json({ msg: "Berhasil", data: peminjaman });
        } catch (error) {
            return res.status(500).json({ msg: "Terjadi kesalahan", error });
        }
    };


    // Menampilkan Semua Peminjaman di Admin
    const getAllPeminjaman = async (req, res) => {
        try {
            const peminjaman = await query(`
                SELECT 
                    peminjaman.*, 
                    user.nama AS nama_user, 
                    barang.nama_barang, 
                    kategori.nama_kategori,
                    status_peminjaman.status_peminjaman
                FROM 
                    peminjaman
                JOIN 
                    user ON peminjaman.id_user = user.id_user
                JOIN 
                    barang ON peminjaman.id_barang = barang.id_barang
                JOIN 
                    kategori ON barang.id_kategori = kategori.id_kategori
                JOIN
                    status_peminjaman ON peminjaman.id_status_peminjaman = status_peminjaman.id_status_peminjaman
            `);
            return res.status(200).json({ msg: "Berhasil", data: peminjaman });
        } catch (error) {
            return res.status(500).json({ msg: "Terjadi kesalahan", error });
        }
    };



    // Approve Peminjaman 
    const approvePeminjaman = async (req, res) => {
        const { id_peminjaman } = req.params;

        try {
            // Cek jumlah barang yang dipinjam dan id barang
            const peminjaman = await query("SELECT jumlah, id_barang FROM peminjaman WHERE id_peminjaman = ?", [id_peminjaman]);
            const { jumlah, id_barang } = peminjaman[0];

            // Ambil serial number yang statusnya 'Available'
            const serialNumbers = await query("SELECT id_serial FROM serial_number WHERE id_barang = ? AND status_serial = 'Available' LIMIT ?", [id_barang, jumlah]);

            // Cek apakah jumlah serial number yang tersedia cukup
            if (serialNumbers.length < jumlah) {
                return res.status(400).json({ msg: "Jumlah barang yang tersedia tidak mencukupi." });
            }

            // Update status peminjaman menjadi 'Accepted'
            await query("UPDATE peminjaman SET id_status_peminjaman = 2 WHERE id_peminjaman = ?", [id_peminjaman]);

            // Update status serial number menjadi 'Borrowed'
            for (let serial of serialNumbers) {
                await query("UPDATE serial_number SET status_serial = 'Borrowed' WHERE id_serial = ?", [serial.id_serial]);
            }

            // Kurangi jumlah barang yang tersedia di tabel barang
            await query("UPDATE barang SET jumlah = jumlah - ? WHERE id_barang = ?", [jumlah, id_barang]);

            return res.status(200).json({ msg: "Peminjaman berhasil diapprove dan status barang menjadi 'Borrowed'." });
        } catch (error) {
            return res.status(500).json({ msg: "Terjadi kesalahan", error });
        }
    };


    // Reject Peminjaman 
    const rejectPeminjaman = async (req, res) => {
        const { id_peminjaman } = req.params;

        try {
            // Update status peminjaman menjadi 'Rejected'
            await query("UPDATE peminjaman SET id_status_peminjaman = 3 WHERE id_peminjaman = ?", [id_peminjaman]);

            return res.status(200).json({ msg: "Peminjaman berhasil ditolak." });
        } catch (error) {
            return res.status(500).json({ msg: "Terjadi kesalahan", error });
        }
    };

    // Complete peminjaman
    const completePeminjaman = async (req, res) => {
        const { id_peminjaman } = req.params;

        try {
            // Ambil data peminjaman
            const peminjaman = await query("SELECT jumlah, id_barang FROM peminjaman WHERE id_peminjaman = ?", [id_peminjaman]);
            const { jumlah, id_barang } = peminjaman[0];

            // Update status peminjaman menjadi 'Completed'
            await query("UPDATE peminjaman SET id_status_peminjaman = 4 WHERE id_peminjaman = ?", [id_peminjaman]);

            // Kembalikan status serial number yang dipinjam menjadi 'Available'
            await query("UPDATE serial_number SET status_serial = 'Available' WHERE id_barang = ? AND status_serial = 'Borrowed' LIMIT ?", [id_barang, jumlah]);

            // Tambahkan kembali jumlah barang yang tersedia
            await query("UPDATE barang SET jumlah = jumlah + ? WHERE id_barang = ?", [jumlah, id_barang]);

            return res.status(200).json({ msg: "Peminjaman berhasil diselesaikan dan barang telah dikembalikan." });
        } catch (error) {
            return res.status(500).json({ msg: "Terjadi kesalahan", error });
        }
    };




    export { addPeminjaman, getPeminjamanByUser, getAllPeminjaman, rejectPeminjaman, approvePeminjaman, completePeminjaman };

