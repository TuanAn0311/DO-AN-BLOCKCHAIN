import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/toastContext';
import api from '../services/api';

const Products = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const activeProducts = res.data.data.filter((product) => product.status === 1);
        setProducts(activeProducts || []);
      } catch (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        showToast('Không thể tải danh sách sản phẩm.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [showToast]);

  const visibleProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesKeyword =
          !keyword ||
          product.name?.toLowerCase().includes(keyword) ||
          product.origin?.toLowerCase().includes(keyword);
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'available' && product.stock > 0) ||
          (stockFilter === 'soldout' && product.stock <= 0);

        return matchesKeyword && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'stock-desc') return Number(b.stock) - Number(a.stock);
        return Number(b.id) - Number(a.id);
      });
  }, [products, searchTerm, sortBy, stockFilter]);

  const addToCart = async (productId) => {
    if (!localStorage.getItem('token')) {
      showToast('Vui lòng đăng nhập để mua hàng.', 'warning');
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart/add', { product_id: productId, quantity: 1 });
      showToast('Đã thêm sản phẩm vào giỏ hàng.', 'success');
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      showToast(error.response?.data?.message || 'Lỗi khi thêm giỏ hàng.', 'error');
    }
  };

  if (isLoading) {
    return <div className="loading-state">Đang tải danh sách cửa hàng...</div>;
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Cửa hàng DNC Trace</div>
          <h1 className="page-title">Cà phê có thể truy xuất nguồn gốc</h1>
          <p className="page-subtitle">
            Mỗi sản phẩm đều gắn với hành trình sản xuất được ghi nhận trên blockchain,
            giúp khách hàng kiểm chứng nguồn gốc và chất lượng trước khi mua.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state card">
          Hiện chưa có sản phẩm nào được bày bán.
        </div>
      ) : (
        <>
          <div className="catalog-toolbar">
            <input
              className="field"
              type="search"
              placeholder="Tìm theo tên cà phê hoặc nguồn gốc"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select className="field" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
              <option value="all">Tất cả tồn kho</option>
              <option value="available">Còn hàng</option>
              <option value="soldout">Hết hàng</option>
            </select>
            <select className="field" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="featured">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="stock-desc">Tồn kho nhiều</option>
            </select>
          </div>

          <div className="catalog-summary">
            Hiển thị {visibleProducts.length} / {products.length} sản phẩm.
          </div>

          {visibleProducts.length === 0 ? (
            <div className="empty-state card">
              Không có sản phẩm phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => {
                const isSoldOut = product.stock <= 0;

            return (
              <article className="product-card" key={product.id}>
                <div
                  className="product-card__media"
                  onClick={() => navigate(`/product/${product.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigate(`/product/${product.id}`);
                  }}
                >
                  <img
                    src={product.image || 'https://via.placeholder.com/500x375'}
                    alt={product.name}
                    style={{ filter: isSoldOut ? 'grayscale(100%)' : 'none' }}
                  />
                  {isSoldOut && <div className="sold-out">Hết hàng</div>}
                </div>

                <div className="product-card__body">
                  <h3 className="product-card__title">{product.name}</h3>
                  <div className="price">{Number(product.price).toLocaleString()} VNĐ</div>
                  <div className="product-meta">
                    <span>Nguồn gốc: {product.origin || 'Đang cập nhật'}</span>
                    <span>
                      Tồn kho:{' '}
                      <strong style={{ color: isSoldOut ? 'var(--danger)' : 'var(--success)' }}>
                        {product.stock}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="product-card__actions">
                  {isSoldOut ? (
                    <button className="btn btn-secondary" type="button" disabled style={{ width: '100%' }}>
                      Không thể mua
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => addToCart(product.id)}
                      type="button"
                      style={{ width: '100%' }}
                    >
                      Thêm vào giỏ
                    </button>
                  )}
                </div>
              </article>
            );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Products;
