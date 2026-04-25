const db = require('../config/db');

// [GET] /api/products - Lấy danh sách toàn bộ sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] /api/products - Thêm sản phẩm mới (Chỉ Admin)
exports.createProduct = async (req, res) => {
    try {
        const { name, price, image, description, origin } = req.body;
        const [result] = await db.execute(
            'INSERT INTO products (name, price, image, description, origin) VALUES (?, ?, ?, ?, ?)',
            [name, price, image, description, origin]
        );
        res.status(201).json({ 
            success: true, 
            message: 'Thêm sản phẩm thành công!', 
            productId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/products/:id - Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
        try {
            const { id } = req.params;
            const [products] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
            
            if (products.length === 0) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
            }
            res.json({ success: true, data: products[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
};