import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { connectMetaMask } from '../utils/web3';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [product, setProduct] = useState(null);
    const [blockchainHistory, setBlockchainHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBlockchainData = async () => {
            try {
                // 1. Lấy thông tin sản phẩm
                const resProd = await api.get(`/products/${id}`);
                setProduct(resProd.data.data);

                // 2. Lấy lịch sử từ Smart Contract
                const { contract } = await connectMetaMask();
                const historyData = await contract.getHistory(id);
                
                const formattedHistory = historyData.map(item => ({
                    stageName: item.stageName,
                    note: item.note,
                    updatedBy: item.updatedBy,
                    timestamp: Number(item.timestamp) * 1000 
                }));

                setBlockchainHistory(formattedHistory);
            } catch (error) {
                console.error("Lỗi truy xuất Blockchain:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchBlockchainData();
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
            window.dispatchEvent(new Event("cartUpdate"));
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi thêm giỏ hàng");
        }
    };

    if (isLoading || !product) {
        return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px' }}>⏳ Đang tải dữ liệu trực tiếp từ Blockchain...</p>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/products')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '8px 15px', background: '#f0f0f0', border: 'none', borderRadius: '5px' }}>
                ← Quay lại cửa hàng
            </button>

            {/* THÔNG TIN CƠ BẢN */}
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
                        style={{ marginTop: '20px', padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        🛒 Thêm vào giỏ hàng
                    </button>
                </div>
            </div>

            {/* TIMELINE LỊCH SỬ TỪ BLOCKCHAIN */}
            <div style={{ marginTop: '40px', padding: '25px', border: '1px solid #ddd', borderRadius: '10px', background: '#fff' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🔗 Hành trình sản phẩm</h3>
                <p style={{ color: '#28a745', fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <strong>✓ Minh bạch tuyệt đối:</strong> Dữ liệu dưới đây được truy xuất trực tiếp từ sổ cái Blockchain.
                </p>

                {blockchainHistory.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Sản phẩm này hiện chưa được ghi nhận dữ liệu lịch sử trên mạng lưới Blockchain.</p>
                ) : (
                    <div style={{ borderLeft: '3px solid #28a745', paddingLeft: '25px', marginLeft: '10px' }}>
                        {blockchainHistory.map((item, index) => {
                            // Parse JSON an toàn
                            let parsedData = {};
                            try {
                                parsedData = JSON.parse(item.note);
                            } catch (e) {
                                parsedData = { details: item.note };
                            }

                            return (
                                <div key={index} style={{ marginBottom: '30px', position: 'relative' }}>
                                    {/* Dấu chấm tròn Timeline */}
                                    <div style={{ position: 'absolute', left: '-34px', top: '2px', background: 'white', border: '4px solid #28a745', width: '14px', height: '14px', borderRadius: '50%' }}></div>
                                    
                                    <strong style={{ fontSize: '18px', color: '#111' }}>{item.stageName}</strong>
                                    <span style={{ marginLeft: '15px', fontSize: '14px', color: '#666', background: '#f1f3f5', padding: '3px 8px', borderRadius: '12px' }}>
                                        🕒 {new Date(item.timestamp).toLocaleString('vi-VN')}
                                    </span>
                                    
                                    {/* Hiển thị chi tiết Data */}
                                    <div style={{ marginTop: '10px', padding: '15px', background: '#f8fff9', borderRadius: '8px', border: '1px solid #c3e6cb', fontSize: '15px', color: '#333', lineHeight: '1.6' }}>
                                        {parsedData.location && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '5px', marginBottom: '8px' }}>
                                                <strong style={{ color: '#555' }}>📍 Địa điểm:</strong>
                                                <span>{parsedData.location}</span>
                                                
                                                <strong style={{ color: '#555' }}>🌡️ Môi trường:</strong>
                                                <span>{parsedData.environment}</span>
                                                
                                                <strong style={{ color: '#555' }}>🧑‍🔬 Kiểm duyệt:</strong>
                                                <span>{parsedData.inspector}</span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: parsedData.location ? '10px' : '0', paddingTop: parsedData.location ? '10px' : '0', borderTop: parsedData.location ? '1px dashed #ccc' : 'none' }}>
                                            <strong style={{ color: '#555' }}>📝 Chi tiết:</strong>
                                            <span style={{ marginLeft: '10px' }}>{parsedData.details}</span>
                                        </div>

                                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#888' }}>
                                            <em>* Ký Blockchain bởi: {item.updatedBy}</em>
                                        </div>
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