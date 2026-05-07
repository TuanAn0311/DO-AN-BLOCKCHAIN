import { useState, useEffect } from 'react';
import api from '../services/api';

const AdminProduct = () => {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', stock: '', image: '', description: '', origin: '' });

    const fetchProducts = async () => {
        const res = await api.get('/admin/products'); // API riêng cho admin để thấy hết cả SP status=0
        setProducts(res.data.data);
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate đơn giản
        if (!formData.name || !formData.price || formData.stock < 0) return alert("Vui lòng nhập đúng dữ liệu!");

        if (editingId) {
            await api.put(`/admin/products/${editingId}`, formData);
        } else {
            await api.post('/admin/products', formData);
        }
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', price: '', stock: '', image: '', description: '', origin: '' });
        fetchProducts();
    };

    const handleEdit = (p) => {
        setFormData(p);
        setEditingId(p.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Xóa sản phẩm này?")) {
            await api.delete(`/admin/products/${id}`);
            fetchProducts();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} style={{ marginBottom: '20px', padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {showForm ? "✖ Đóng Form" : "➕ Thêm Sản phẩm mới"}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input placeholder="Tên SP" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <input type="number" placeholder="Giá" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                    <input type="number" placeholder="Số lượng tồn kho" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                    <input placeholder="Link ảnh" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                    <input placeholder="Nguồn gốc" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} />
                    <textarea placeholder="Mô tả" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ gridColumn: 'span 2' }} />
                    <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', background: '#007bff', color: '#fff', border: 'none' }}>
                        {editingId ? "Cập nhật Sản phẩm" : "Xác nhận Thêm"}
                    </button>
                </form>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th>Ảnh</th>
                        <th>Tên Sản phẩm</th>
                        <th>Giá</th>
                        <th>Kho</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '10px' }}>{p.id}</td>
                            <td><img src={p.image} width="50" height="50" style={{ objectFit: 'cover' }} /></td>
                            <td>{p.name}</td>
                            <td>{Number(p.price).toLocaleString()}đ</td>
                            <td><strong>{p.stock}</strong></td>
                            <td>{p.status === 1 ? "✅ Đã lên sàn" : "⏳ Đang ký duyệt"}</td>
                            <td style={{ textAlign: 'right' }}>
                                <button onClick={() => handleEdit(p)} style={{ marginRight: '10px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}>Sửa</button>
                                <button onClick={() => handleDelete(p.id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};