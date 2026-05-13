import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // BƯỚC 1: Đã xóa 'stock' ra khỏi formData khởi tạo
    const [formData, setFormData] = useState({
        name: '', price: '', image: '', description: '', origin: ''
    });

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data.data || []);
        } catch (error) {
            console.error("Lỗi lấy SP:", error);
            setProducts([]);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // BƯỚC 2: Chỉ còn validate giá tiền (Đã xóa validate stock)
        if (Number(formData.price) <= 0) return alert("Giá sản phẩm phải lớn hơn 0!");

        setIsLoading(true);
        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, formData);
                alert("Cập nhật thành công!");
            } else {
                await api.post('/products', formData);
                alert("Thêm hồ sơ sản phẩm thành công! (Kho hiện tại: 0)");
            }
            
            setShowForm(false);
            setEditingId(null);
            // BƯỚC 3: Cập nhật lại form rỗng không có stock
            setFormData({ name: '', price: '', image: '', description: '', origin: '' });
            fetchProducts(); 
        } catch (error) {
            console.error("Lỗi lưu sản phẩm:", error);
            alert("Có lỗi xảy ra, vui lòng kiểm tra lại Backend!");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (product) => {
        // Load thông tin lên form để sửa (không load stock vì Admin không được sửa tay ở đây)
        setFormData({
            name: product.name, price: product.price, 
            image: product.image, description: product.description, origin: product.origin
        });
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này vĩnh viễn?")) return;
        try {
            await api.delete(`/products/${id}`);
            alert("Đã xóa sản phẩm!");
            fetchProducts();
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error);
            alert("Lỗi khi xóa sản phẩm!");
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>📦 Quản lý Hồ sơ Sản phẩm</h2>
                <button 
                    onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({name:'', price:'', image:'', description:'', origin:''}); }}
                    style={{ padding: '10px 20px', background: showForm ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {showForm ? '✖ Hủy bỏ' : '➕ Thêm hồ sơ mới'}
                </button>
            </div>

            {/* FORM THÊM / SỬA SẢN PHẨM */}
            {showForm && (
                <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0, color: '#333' }}>{editingId ? "Sửa thông tin sản phẩm" : "Khởi tạo hồ sơ sản phẩm mới"}</h3>
                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>*Số lượng tồn kho sẽ được tự động cập nhật khi hoàn tất bước Đóng gói trên Blockchain.</p>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Tên sản phẩm *</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Giá bán (VNĐ) *</label>
                            <input name="price" type="number" value={formData.price} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        {/* BƯỚC 4: Đã xóa input nhập Stock ở vị trí này */}
                        <div>
                            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Nguồn gốc</label>
                            <input name="origin" value={formData.origin} onChange={handleInputChange} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Link Ảnh (URL)</label>
                            <input name="image" value={formData.image} onChange={handleInputChange} style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Mô tả sản phẩm</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                            <button type="submit" disabled={isLoading} style={{ padding: '12px 25px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                                {isLoading ? '⏳ Đang xử lý...' : (editingId ? '💾 Lưu thay đổi' : '✅ Tạo hồ sơ sản phẩm')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* BẢNG HIỂN THỊ DANH SÁCH */}
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f1f3f5' }}>
                        <tr>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>ID</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Ảnh</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Tên Sản phẩm</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Giá</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Tồn kho</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Trạng thái</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Chưa có dữ liệu sản phẩm</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>#{p.id}</td>
                                    <td style={{ padding: '10px' }}>
                                        <img src={p.image || "https://via.placeholder.com/50"} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} />
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#333' }}>{p.name}</td>
                                    <td style={{ padding: '10px', color: '#d9534f' }}>{Number(p.price).toLocaleString()}đ</td>
                                    <td style={{ padding: '10px' }}>
                                        {/* Hiển thị số lượng kho, nếu là 0 thì báo Đang xử lý hoặc Hết */}
                                        {p.stock > 0 ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>{p.stock}</span> : <span style={{ color: '#856404', fontWeight: 'bold' }}>0 (Đang SX)</span>}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {p.status === 1 ? <span style={{ background: '#d4edda', color: '#155724', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>Lên sàn</span> : <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>Nháp</span>}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        <button onClick={() => handleEdit(p)} style={{ marginRight: '10px', background: '#ffc107', color: '#212529', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sửa</button>
                                        <button onClick={() => handleDelete(p.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProducts;
