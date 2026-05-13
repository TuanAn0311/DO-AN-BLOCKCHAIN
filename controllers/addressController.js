const db = require('../config/db');

const addressSelect =
    'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC';

const validateAddress = ({ full_name, phone, address_line, city, district }) => {
    return Boolean(full_name && phone && address_line && city && district);
};

exports.getUserAddresses = async (req, res) => {
    try {
        const [addresses] = await db.execute(addressSelect, [req.user.id]);
        res.json({ success: true, data: addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone, address_line, city, district, is_default } = req.body;

        if (!validateAddress(req.body)) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin địa chỉ!' });
        }

        const [existing] = await db.execute('SELECT id FROM user_addresses WHERE user_id = ?', [userId]);
        const finalIsDefault = existing.length === 0 || Number(is_default) === 1 ? 1 : 0;

        if (finalIsDefault === 1) {
            await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        await db.execute(
            'INSERT INTO user_addresses (user_id, full_name, phone, address_line, city, district, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, full_name, phone, address_line, city, district, finalIsDefault]
        );

        const [addresses] = await db.execute(addressSelect, [userId]);
        res.json({ success: true, message: 'Thêm địa chỉ thành công!', data: addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { full_name, phone, address_line, city, district, is_default } = req.body;

        if (!validateAddress(req.body)) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin địa chỉ!' });
        }

        const [addresses] = await db.execute(
            'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (addresses.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ!' });
        }

        if (Number(is_default) === 1) {
            await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        await db.execute(
            'UPDATE user_addresses SET full_name = ?, phone = ?, address_line = ?, city = ?, district = ?, is_default = ? WHERE id = ? AND user_id = ?',
            [full_name, phone, address_line, city, district, Number(is_default) === 1 ? 1 : 0, id, userId]
        );

        const [updatedAddresses] = await db.execute(addressSelect, [userId]);
        res.json({ success: true, message: 'Cập nhật địa chỉ thành công!', data: updatedAddresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [addresses] = await db.execute(
            'SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (addresses.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ!' });
        }

        await db.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [id, userId]);

        if (Number(addresses[0].is_default) === 1) {
            const [remaining] = await db.execute(
                'SELECT id FROM user_addresses WHERE user_id = ? ORDER BY id ASC LIMIT 1',
                [userId]
            );

            if (remaining.length > 0) {
                await db.execute('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [remaining[0].id, userId]);
            }
        }

        const [updatedAddresses] = await db.execute(addressSelect, [userId]);
        res.json({ success: true, message: 'Xóa địa chỉ thành công!', data: updatedAddresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [addresses] = await db.execute(
            'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (addresses.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ!' });
        }

        await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        await db.execute('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);

        const [updatedAddresses] = await db.execute(addressSelect, [userId]);
        res.json({ success: true, message: 'Đã đặt địa chỉ mặc định!', data: updatedAddresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
