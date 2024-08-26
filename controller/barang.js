import { query } from "../database/db.js";

// Mendapatkan semua barang
const getAllBarang = async (req, res) => {
    try {
        const barang = await query(`
            SELECT 
                b.id_barang, 
                b.nama_barang, 
                s.nama_supplier, 
                p.nama_perusahaan,
                b.jumlah, 
                b.tanggal_pembelian_barang, 
                b.lokasi_barang, 
                k.nama_kategori, 
                sn.id_serial, 
                sn.nomor_seri, 
                sn.status_serial 
            FROM 
                barang b 
            INNER JOIN 
                serial_number sn ON b.id_barang = sn.id_barang 
            INNER JOIN 
                supplier s ON s.id_supplier = b.id_supplier 
            INNER JOIN 
                perusahaan p ON p.id_perusahaan = b.id_perusahaan 
            INNER JOIN 
                kategori k ON k.id_kategori = b.id_kategori
        `);

        const result = barang.reduce((acc, curr) => {
            const item = acc.find(i => i.id_barang === curr.id_barang);
            if (item) {
                item.serial_numbers.push({
                    id_serial: curr.id_serial,
                    nomor_seri: curr.nomor_seri,
                    status_serial: curr.status_serial
                });
            } else {
                acc.push({
                    id_barang: curr.id_barang,
                    nama_barang: curr.nama_barang,
                    nama_supplier: curr.nama_supplier,
                    nama_perusahaan: curr.nama_perusahaan,
                    jumlah: curr.jumlah,
                    tanggal_pembelian_barang: curr.tanggal_pembelian_barang,
                    lokasi_barang: curr.lokasi_barang,
                    nama_kategori: curr.nama_kategori,
                    serial_numbers: [{
                        id_serial: curr.id_serial,
                        nomor_seri: curr.nomor_seri,
                        status_serial: curr.status_serial
                    }]
                });
            }
            return acc;
        }, []);

        return res.status(200).json({ msg: "Berhasil", data: result });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};




// Menambahkan barang baru  
const addBarang = async (req, res) => {
    const { nama_barang, jumlah, id_supplier, id_perusahaan, tanggal_pembelian_barang, lokasi_barang, id_kategori, nomor_seri } = req.body;

    try {
        // Tambahkan barang baru ke tabel barang
        const result = await query(
            "INSERT INTO barang (nama_barang, jumlah, id_supplier, id_perusahaan, tanggal_pembelian_barang, lokasi_barang, id_kategori, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [nama_barang, jumlah, id_supplier, id_perusahaan, tanggal_pembelian_barang, lokasi_barang, id_kategori]
        );

        const id_barang = result.insertId;

        // Tambahkan nomor seri ke tabel serial_number dengan status 'Available'
        for (let i = 0; i < jumlah; i++) {
            await query(
                "INSERT INTO serial_number (id_barang, nomor_seri, status_serial) VALUES (?, ?, 'Available')",
                [id_barang, nomor_seri[i]]
            );
        }

        return res.status(201).json({ msg: "Barang dan nomor seri berhasil ditambahkan." });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal menambahkan barang", error });
    }
};


// Mendapatkan barang berdasarkan ID
const getBarangById = async (req, res) => {
    const { id } = req.params;
    try {
        const barang = await query(`
            SELECT b.id_barang, b.nama_barang, b.jumlah, b.id_supplier, b.id_perusahaan,
                   b.tanggal_pembelian_barang, b.lokasi_barang, b.id_kategori,
                   sn.id_serial, sn.nomor_seri, sn.status_serial
            FROM barang b
            LEFT JOIN serial_number sn ON b.id_barang = sn.id_barang
            WHERE b.id_barang = ?
        `, [id]);

        if (barang.length === 0) {
            return res.status(404).json({ msg: "Barang tidak ditemukan" });
        }

        const result = {
            id_barang: barang[0].id_barang,
            nama_barang: barang[0].nama_barang,
            jumlah: barang[0].jumlah,
            id_supplier: barang[0].id_supplier,
            id_perusahaan: barang[0].id_perusahaan,
            tanggal_pembelian_barang: barang[0].tanggal_pembelian_barang,
            lokasi_barang: barang[0].lokasi_barang,
            id_kategori: barang[0].id_kategori,
            serial_numbers: barang.map(sn => ({
                id_serial: sn.id_serial,
                nomor_seri: sn.nomor_seri,
                status_serial: sn.status_serial
            }))
        };

        return res.status(200).json({ msg: "Berhasil", data: result });
    } catch (error) {
        return res.status(400).json({ msg: "Terjadi kesalahan", error });
    }
};



// Memperbarui barang berdasarkan ID
const updateBarang = async (req, res) => {
    const { id } = req.params;
    const { nama_barang, id_supplier, id_perusahaan, tanggal_pembelian_barang, lokasi_barang, id_kategori } = req.body;

    try {
        // Dapatkan data lama dari database
        const [currentData] = await query("SELECT * FROM barang WHERE id_barang = ?", [id]);

        if (!currentData) {
            return res.status(404).json({ msg: "Barang tidak ditemukan" });
        }

        // Gunakan nilai lama jika field baru tidak dikirim
        const updatedNamaBarang = nama_barang || currentData.nama_barang;
        const updatedIdSupplier = id_supplier || currentData.id_supplier;
        const updatedIdPerusahaan = id_perusahaan || currentData.id_perusahaan;
        const updatedTanggalPembelianBarang = tanggal_pembelian_barang || currentData.tanggal_pembelian_barang;
        const updatedLokasiBarang = lokasi_barang || currentData.lokasi_barang;
        const updatedIdKategori = id_kategori || currentData.id_kategori;

        // Perbarui data barang di tabel barang
        const result = await query(
            "UPDATE barang SET nama_barang = ?, id_supplier = ?, id_perusahaan = ?, tanggal_pembelian_barang = ?, lokasi_barang = ?, id_kategori = ? WHERE id_barang = ?",
            [updatedNamaBarang, updatedIdSupplier, updatedIdPerusahaan, updatedTanggalPembelianBarang, updatedLokasiBarang, updatedIdKategori, id]
        );

        return res.status(200).json({ msg: "Barang berhasil diubah" });
    } catch (error) {
        console.log("Error saat mengupdate:", error);
        return res.status(400).json({ msg: "Gagal mengubah barang", error });
    }
};

// Get Serial Numbers for a specific Barang
const getSerialNumbers = async (req, res) => {
    const { id_barang } = req.params;

    try {
        if (!id_barang) {
            return res.status(400).json({ msg: "ID barang tidak ditemukan" });
        }

        const serialNumbers = await query(
            "SELECT id_serial, nomor_seri, status_serial FROM serial_number WHERE id_barang = ?",
            [id_barang]
        );

        if (serialNumbers.length === 0) {
            return res.status(404).json({ msg: "Serial numbers tidak ditemukan untuk ID barang ini" });
        }

        return res.status(200).json({ serialNumbers });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ msg: "Gagal mengambil serial numbers", error });
    }
};



// Add Serial Number to a specific Barang
const addSerialNumber = async (req, res) => {
    const { id } = req.params; // Mengambil id_barang dari URL parameter
    const { nomor_seri } = req.body; // Mengambil array nomor_seri dari body request

    try {
        // Validasi bahwa id_barang ada di tabel barang
        const barang = await query("SELECT * FROM barang WHERE id_barang = ?", [id]);
        if (barang.length === 0) {
            return res.status(404).json({ msg: "Barang tidak ditemukan" });
        }

        // Validasi nomor_seri harus array
        if (!nomor_seri || !Array.isArray(nomor_seri)) {
            return res.status(400).json({ msg: "Nomor seri tidak valid." });
        }

        // Tambahkan nomor seri ke tabel serial_number dengan status 'Available'
        for (let i = 0; i < nomor_seri.length; i++) {
            await query(
                "INSERT INTO serial_number (id_barang, nomor_seri, status_serial) VALUES (?, ?, 'Available')",
                [id, nomor_seri[i]]
            );
        }

        // Update jumlah barang di tabel barang
        await query(
            "UPDATE barang SET jumlah = jumlah + ? WHERE id_barang = ?",
            [nomor_seri.length, id]
        );

        return res.status(201).json({ msg: "Serial numbers berhasil ditambahkan." });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ msg: "Gagal menambahkan serial numbers", error });
    }
};


//Update Serial Number
const updateSerialNumber = async (req, res) => {
    const { id } = req.params;
    const { nomor_seri, status_serial } = req.body;

    try {
        // Update data serial number dan status_serial
        await query(
            "UPDATE serial_number SET nomor_seri = ?, status_serial = ? WHERE id_serial = ?",
            [nomor_seri, status_serial, id]
        );

        return res.status(200).json({ msg: "Serial number berhasil diubah" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal mengubah serial number", error });
    }
};


const deleteSerialNumber = async (req, res) => {
    const { id } = req.params;

    try {
        // Dapatkan id_barang dari serial number yang akan dihapus
        const serial = await query("SELECT id_barang FROM serial_number WHERE id_serial = ?", [id]);

        if (serial.length === 0) {
            return res.status(404).json({ msg: "Serial number tidak ditemukan" });
        }

        const id_barang = serial[0].id_barang;

        // Hapus serial number dari tabel serial_number
        await query("DELETE FROM serial_number WHERE id_serial = ?", [id]);

        // Kurangi jumlah barang pada tabel barang
        await query("UPDATE barang SET jumlah = jumlah - 1 WHERE id_barang = ?", [id_barang]);

        return res.status(200).json({ msg: "Serial number berhasil dihapus dan jumlah barang diperbarui." });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal menghapus serial number", error });
    }
};



// Menghapus barang berdasarkan ID
const deleteBarang = async (req, res) => {
    const { id } = req.params;
    try {
        // Hapus data dari tabel serial_number terlebih dahulu
        await query("DELETE FROM serial_number WHERE id_barang = ?", [id]);

        // Kemudian hapus data dari tabel barang
        await query("DELETE FROM barang WHERE id_barang = ?", [id]);

        return res.status(200).json({ msg: "Barang berhasil dihapus" });
    } catch (error) {
        return res.status(400).json({ msg: "Gagal menghapus barang", error });
    }
};


export { getAllBarang, addBarang, getBarangById, updateBarang, deleteBarang, updateSerialNumber, deleteSerialNumber, getSerialNumbers, addSerialNumber };
