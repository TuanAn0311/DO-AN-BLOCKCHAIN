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
    const { name, price, image, description, origin } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO products (name, price, image, description, origin) VALUES (?, ?, ?, ?, ?)',
            [name, price, image, description, origin]
        );
        res.json({ success: true, message: 'Thêm sản phẩm thành công!'});
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

//Cập nhật sản phẩm (Chỉ Admin)
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, image, origin } = req.body;
    try {
        await db.execute(
            'UPDATE products SET name=?, price=?, description=?, image=?, origin=? WHERE id=?',
            [name, price, description, image, origin, id]
        );
        res.json({ success: true, message: 'Cập nhật sản phẩm thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });   
    }
};

//Xóa sản phẩm (Chỉ Admin)
exports.deleteProduct = async (req, res) => {
    const {id} = req.params;
    try {
        await db.execute('DELETE FROM products WHERE id=?', [id]);
        res.json({ success: true, message: 'Xóa sản phẩm thành công!' });
    }catch(error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.activateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;// lấy số lượng thành phần từ yêu cầu

        if(!stock || stock <= 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp số lượng thành phần lớn hơn 0 để kích hoạt sản phẩm!' });
        };
        await db.execute('UPDATE products SET status=1, stock=? WHERE id=?', [stock, id]);
        res.json({ success: true, message: 'Sản phẩm đã được kích hoạt!' });
    }catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//API lấy sản phẩm đã xuất xưởng - status = 1 
exports.getPublicProducts = async (req, res) => {
    try {
        const [products] = await db.execute('SELECT * FROM products WHERE status=1');
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};