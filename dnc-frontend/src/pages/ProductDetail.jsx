// Đây là trang chi tiết sản phẩm, nơi người dùng có thể xem thông tin chi tiết về sản phẩm, lịch sử chuỗi cung ứng và thực hiện truy xuất nguồn gốc qua Blockchain
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { connectMetaMask } from '../utils/web3';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [history, setHistory] = useState([]);
    const [verifyStatus, setVerifyStatus] = useState(null); // null | 'loading' | 'success' | 'fail'

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resProd = await api.get(`/products/${id}`);
                const resHistory = await api.get(`/supply-chain/history/${id}`);
                setProduct(resProd.data.data);
                setHistory(resHistory.data.data);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            }
        };
        fetchData();
    }, [id]);

    const addToCart = async () => {
        if (!localStorage.getItem('token')) {
            alert("Vui lòng đăng nhập để mua hàng!");
            navigate('/login');
            return;
        }
        try {
            await api.post('/cart/add', { product_id: product.id, quantity: 1 });
            alert("Đã thêm vào giỏ hàng!");
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi thêm giỏ hàng");
        }
    };

    const handleVerify = async () => {
        setVerifyStatus('loading');
        try {
            // 1. Lấy mã Hash từ Database (dữ liệu hiện tại)
            const resHash = await api.get(`/supply-chain/generate-hash/${id}`);
            const currentHash = resHash.data.hash;

            // 2. Kết nối MetaMask & Blockchain
            const { contract } = await connectMetaMask();

            // 3. So sánh Hash trên Blockchain
            const isValid = await contract.verifyHash(id, currentHash);
            setVerifyStatus(isValid ? 'success' : 'fail');

        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối Blockchain! Vui lòng kiểm tra lại MetaMask.");
            setVerifyStatus(null);
        }
    };

    if (!product) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải dữ liệu Blockchain...</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', gap: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
                <img 
                    src={product.image || "https://via.placeholder.com/300"} 
                    alt={product.name} 
                    style={{ width: '300px', height: '300px', objectFit: 'cover', borderRadius: '8px' }} 
                />
                <div>
                    <h2 style={{ margin: '0 0 10px 0' }}>{product.name}</h2>
                    <p style={{ color: '#d9534f', fontSize: '24px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                        {Number(product.price).toLocaleString()} VNĐ
                    </p>
                    <p><strong>Nguồn gốc:</strong> {product.origin}</p>
                    <p style={{ lineHeight: '1.6' }}>{product.description}</p>
                    
                    <button 
                        onClick={addToCart}
                        style={{ marginTop: '20px', padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                    >
                        🛒 Thêm vào giỏ hàng
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Truy xuất nguồn gốc (Blockchain)</h3>
                    <button 
                        onClick={handleVerify} 
                        disabled={verifyStatus === 'loading'}
                        style={{ 
                            padding: '10px 20px', 
                            background: verifyStatus === 'loading' ? '#6c757d' : '#007bff', 
                            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' 
                        }}
                    >
                        {verifyStatus === 'loading' ? '⏳ Đang kiểm tra Smart Contract...' : '🔍 Xác minh nguồn gốc'}
                    </button>
                </div>

                {verifyStatus === 'success' && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '5px', border: '1px solid #c3e6cb' }}>
                        <strong>✅ XÁC MINH THÀNH CÔNG:</strong> Dữ liệu sản phẩm và chuỗi cung ứng là chính xác, không bị chỉnh sửa so với thời điểm ghi lên Blockchain.
                    </div>
                )}
                {verifyStatus === 'fail' && (
                    <div style={{ marginTop: '15px', padding: '15px', background: '#f8d7da', color: '#721c24', borderRadius: '5px', border: '1px solid #f5c6cb' }}>
                        <strong>❌ CẢNH BÁO HÀNG GIẢ / BỊ SỬA ĐỔI:</strong> Dữ liệu hiện tại không khớp với sổ cái Blockchain!
                    </div>
                )}

                <h4 style={{ marginTop: '30px' }}>Lịch sử chuỗi cung ứng:</h4>
                {history.length === 0 ? (
                    <p style={{ color: '#888' }}>Chưa có dữ liệu hành trình cho sản phẩm này.</p>
                ) : (
                    <div style={{ borderLeft: '3px solid #007bff', paddingLeft: '20px', marginLeft: '10px', marginTop: '15px' }}>
                        {history.map((item, index) => {
                            const dataObj = JSON.parse(item.data);
                            return (
                                <div key={index} style={{ marginBottom: '25px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-29px', top: '0', background: 'white', border: '3px solid #007bff', width: '12px', height: '12px', borderRadius: '50%' }}></div>
                                    <strong style={{ fontSize: '18px', color: '#333' }}>{item.stage}</strong>
                                    <span style={{ marginLeft: '15px', fontSize: '14px', color: '#777' }}>
                                        {new Date(item.created_at).toLocaleString('vi-VN')}
                                    </span>
                                    <div style={{ marginTop: '5px', padding: '10px', background: '#f4f4f4', borderRadius: '5px', fontSize: '14px' }}>
                                        {Object.entries(dataObj).map(([key, value]) => (
                                            <div key={key}><strong>{key}:</strong> {value}</div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;