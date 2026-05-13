import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/toastContext';
import api from '../services/api';
import { connectMetaMask } from '../utils/web3';

const STANDARD_WORKFLOW = [
  '1. Thu hoạch & Phân loại',
  '2. Sơ chế & Lên men',
  '3. Phơi khô & Lưu kho',
  '4. Rang xay & Phối trộn',
  '5. Kiểm định chất lượng (QC)',
  '6. Đóng gói & Xuất xưởng',
];

const FIELD_CONFIG = [
  {
    title: 'Thông số thu hoạch',
    fields: [
      { key: 'location', label: 'Nông trại / Vùng trồng', placeholder: 'VD: Cầu Đất, Đà Lạt' },
      { key: 'environment', label: 'Giống cà phê', placeholder: 'VD: Arabica Typica' },
      { key: 'extraNote', label: 'Tỷ lệ quả chín (%)', type: 'select-percent' },
    ],
  },
  {
    title: 'Thông số sơ chế',
    fields: [
      { key: 'location', label: 'Phương pháp', placeholder: 'VD: Washed, Honey, Natural' },
      { key: 'environment', label: 'Thời gian lên men', placeholder: 'VD: 24h, 48h' },
    ],
  },
  {
    title: 'Thông số phơi khô',
    fields: [
      { key: 'location', label: 'Độ ẩm đạt được', placeholder: 'VD: 11% - 12%' },
      { key: 'environment', label: 'Thời gian phơi', placeholder: 'VD: 10 ngày' },
    ],
  },
  {
    title: 'Thông số rang xay',
    fields: [
      { key: 'location', label: 'Mức rang', placeholder: 'VD: Medium Roast' },
      { key: 'environment', label: 'Nhiệt độ rang', placeholder: 'VD: 210°C' },
      { key: 'inspector', label: 'Chuyên gia rang', placeholder: 'Tên thợ rang chính' },
    ],
  },
  {
    title: 'Kiểm định chất lượng',
    fields: [
      { key: 'location', label: 'Điểm cupping', placeholder: 'VD: 84 điểm' },
      { key: 'environment', label: 'Hương vị', placeholder: 'VD: Chocolate, Caramel' },
      { key: 'inspector', label: 'Q-Grader', placeholder: 'Người kiểm định' },
    ],
  },
  {
    title: 'Đóng gói & xuất xưởng',
    fields: [
      { key: 'location', label: 'Quy cách đóng gói', placeholder: 'VD: Túi Kraft 250g, van 1 chiều' },
      { key: 'environment', label: 'Hạn sử dụng', placeholder: 'VD: 12 tháng kể từ NSX' },
      { key: 'finalStock', label: 'Số lượng nhập kho', placeholder: 'Số túi/hộp đạt chuẩn', type: 'number' },
    ],
  },
];

const parseStageNote = (note) => {
  try {
    const parsed = JSON.parse(note);
    return typeof parsed === 'object' && parsed !== null ? parsed : { details: note };
  } catch {
    return { details: note };
  }
};

const shortenHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const Admin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [currentHistory, setCurrentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operationStatus, setOperationStatus] = useState('');
  const [walletAccount, setWalletAccount] = useState('');
  const [lastTxHash, setLastTxHash] = useState('');

  const [formData, setFormData] = useState({
    location: '',
    environment: '',
    inspector: '',
    extraNote: '',
    finalStock: '',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.data || []);
      } catch (error) {
        console.error('Lỗi lấy sản phẩm:', error);
        showToast('Không thể tải danh sách sản phẩm.', 'error');
      }
    };

    fetchProducts();
  }, [showToast]);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (!selectedProduct) {
        setCurrentHistory([]);
        return;
      }

      try {
        const { account, contract } = await connectMetaMask();
        setWalletAccount(account);
        const history = await contract.getHistory(selectedProduct);
        setCurrentHistory(
          history.map((item) => ({
            stageName: item.stageName,
            timestamp: Number(item.timestamp) * 1000,
            updatedBy: item.updatedBy,
            note: item.note,
          })),
        );
      } catch (error) {
        console.error('Lỗi lấy lịch sử:', error);
        showToast('Không thể đọc lịch sử blockchain của sản phẩm này.', 'error');
      }
    };

    fetchCurrentStatus();
  }, [selectedProduct, showToast]);

  const nextStepIndex = currentHistory.length;
  const isCompleted = nextStepIndex >= STANDARD_WORKFLOW.length;
  const nextStageName = isCompleted ? 'Đã hoàn tất quy trình' : STANDARD_WORKFLOW[nextStepIndex];
  const currentConfig = FIELD_CONFIG[nextStepIndex];
  const progressPercent = Math.min(100, Math.round((nextStepIndex / STANDARD_WORKFLOW.length) * 100));
  const selectedProductData = products.find((product) => String(product.id) === String(selectedProduct));

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setFormData({
      location: '',
      environment: '',
      inspector: '',
      extraNote: '',
      finalStock: '',
    });
  };

  const buildStructuredData = () => {
    if (nextStepIndex === 0) {
      return {
        'Nông trại': formData.location,
        'Giống': formData.environment,
        'Tỷ lệ chín': `${formData.extraNote}%`,
      };
    }
    if (nextStepIndex === 1) {
      return {
        'Phương pháp': formData.location,
        'Thời gian lên men': formData.environment,
      };
    }
    if (nextStepIndex === 2) {
      return {
        'Độ ẩm': formData.location,
        'Thời gian phơi': formData.environment,
      };
    }
    if (nextStepIndex === 3) {
      return {
        'Mức rang': formData.location,
        'Nhiệt độ': formData.environment,
        'Thợ rang': formData.inspector,
      };
    }
    if (nextStepIndex === 4) {
      return {
        'Điểm Cupping': formData.location,
        'Hương vị': formData.environment,
        'Q-Grader': formData.inspector,
      };
    }
    return {
      'Đóng gói': formData.location,
      'Hạn sử dụng': formData.environment,
      'Lô sản xuất': `${formData.finalStock} sản phẩm`,
    };
  };

  const previewData = isCompleted ? null : buildStructuredData();

  const refreshHistory = async () => {
    if (!selectedProduct) return;
    const { account, contract } = await connectMetaMask();
    setWalletAccount(account);
    const history = await contract.getHistory(selectedProduct);
    setCurrentHistory(
      history.map((item) => ({
        stageName: item.stageName,
        timestamp: Number(item.timestamp) * 1000,
        updatedBy: item.updatedBy,
        note: item.note,
      })),
    );
  };

  const handleAddStage = async (event) => {
    event.preventDefault();
    if (!selectedProduct || isCompleted) return;

    if (nextStepIndex === 5 && (!formData.finalStock || Number(formData.finalStock) < 1)) {
      showToast('Vui lòng nhập số lượng thành phẩm hợp lệ trước khi ký.', 'warning');
      return;
    }

    setIsLoading(true);
    setOperationStatus('Đang mở MetaMask để ký giao dịch...');
    try {
      const { account, contract } = await connectMetaMask();
      setWalletAccount(account);
      const user = JSON.parse(localStorage.getItem('user'));
      const adminName = user?.full_name || 'Admin DNC';

      setOperationStatus('Đang gửi giao dịch lên mạng blockchain...');
      const tx = await contract.addStage(
        selectedProduct,
        nextStageName,
        JSON.stringify(buildStructuredData()),
        adminName,
      );
      setLastTxHash(tx.hash);

      showToast('Giao dịch đã gửi. Đang chờ xác nhận block...', 'info');
      setOperationStatus('Giao dịch đã gửi, đang chờ xác nhận block...');
      await tx.wait();

      if (nextStepIndex === 5) {
        setOperationStatus('Đang kích hoạt sản phẩm trong hệ thống bán hàng...');
        await api.put(`/products/activate/${selectedProduct}`, { stock: formData.finalStock });
        showToast('Sản phẩm đã được kích hoạt và sẵn sàng bán.', 'success');
      } else {
        showToast(`Công đoạn "${nextStageName}" đã được ghi thành công.`, 'success');
      }

      resetForm();
      setOperationStatus('Đang làm mới tiến độ sản phẩm...');
      await refreshHistory();
    } catch (error) {
      console.error('Lỗi ghi dữ liệu:', error);
      showToast('Lỗi khi ghi dữ liệu lên Blockchain.', 'error');
    } finally {
      setIsLoading(false);
      setOperationStatus('');
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Quản trị chuỗi cung ứng</div>
          <h1 className="page-title">Ghi nhận truy xuất Blockchain</h1>
          <p className="page-subtitle">
            Điều phối từng công đoạn sản xuất theo quy trình chuẩn và chỉ mở bán sản phẩm
            sau khi hoàn tất bước đóng gói.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/products')} type="button">
            Sản phẩm
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/orders')} type="button">
            Đơn hàng
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard')} type="button">
            Thống kê
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontWeight: 800, marginBottom: 8 }}>
          Sản phẩm cần quản lý
        </label>
        <select
          className="field"
          value={selectedProduct}
          onChange={(event) => {
            setSelectedProduct(event.target.value);
            setLastTxHash('');
          }}
        >
          <option value="">Chọn một sản phẩm</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              ID: {product.id} - {product.name}
            </option>
          ))}
        </select>

        {selectedProductData && (
          <div className="metric-row">
            <div className="metric">
              <strong>{progressPercent}%</strong>
              <span>Tiến độ quy trình</span>
            </div>
            <div className="metric">
              <strong>{nextStepIndex}/{STANDARD_WORKFLOW.length}</strong>
              <span>Công đoạn đã ghi</span>
            </div>
            <div className="metric">
              <strong>{selectedProductData.stock ?? 0}</strong>
              <span>Tồn kho hiện tại</span>
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="admin-grid">
          <div className="panel">
            <h3 style={{ marginBottom: 18 }}>Tiến độ chuỗi cung ứng</h3>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 14, marginBottom: 8 }}>
                <span>{nextStepIndex} bước hoàn tất</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {STANDARD_WORKFLOW.map((stage, index) => {
                const isDone = index < nextStepIndex;
                const isCurrent = index === nextStepIndex;

                return (
                  <div
                    key={stage}
                    className="card"
                    style={{
                      padding: 14,
                      borderColor: isCurrent ? 'var(--primary)' : 'var(--border)',
                      background: isDone ? 'var(--primary-soft)' : 'var(--surface)',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: isDone || isCurrent ? 'var(--primary)' : 'var(--muted)' }}>
                      {isDone ? 'Hoàn tất' : isCurrent ? 'Đang xử lý' : 'Chưa tới bước'}
                    </div>
                    <div>{stage}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: 8 }}>Khắc dữ liệu lên Blockchain</h3>
            <p style={{ marginBottom: 20 }}>Công đoạn tiếp theo: <strong>{nextStageName}</strong></p>

            {operationStatus && (
              <div className="alert" style={{ color: 'var(--primary)', background: 'var(--primary-soft)', borderColor: '#b7e4d8', marginBottom: 14 }}>
                {operationStatus}
              </div>
            )}

            {walletAccount && (
              <div className="wallet-strip">
                <span>Ví đang kết nối</span>
                <strong>{shortenHash(walletAccount)}</strong>
              </div>
            )}

            {lastTxHash && (
              <div className="tx-strip">
                <span>Giao dịch gần nhất</span>
                <code title={lastTxHash}>{shortenHash(lastTxHash)}</code>
              </div>
            )}

            {isCompleted ? (
              <div className="alert" style={{ color: 'var(--success)', background: 'var(--primary-soft)', borderColor: '#b7e4d8' }}>
                Sản phẩm này đã hoàn tất toàn bộ quy trình cung ứng.
              </div>
            ) : (
              <form onSubmit={handleAddStage} style={{ display: 'grid', gap: 14 }}>
                <div className="card" style={{ padding: 16 }}>
                  <h4 style={{ marginBottom: 14 }}>{currentConfig.title}</h4>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {currentConfig.fields.map((field) => (
                      <label key={field.key} style={{ display: 'grid', gap: 6, fontWeight: 750 }}>
                        {field.label}
                        {field.type === 'select-percent' ? (
                          <select
                            className="field"
                            required
                            value={formData[field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                          >
                            <option value="">Chọn tỷ lệ</option>
                            {Array.from({ length: 101 }, (_, value) => (
                              <option key={value} value={value}>{value}%</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="field"
                            type={field.type || 'text'}
                            min={field.type === 'number' ? '1' : undefined}
                            required
                            placeholder={field.placeholder}
                            value={formData[field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="preview-panel">
                  <div className="preview-panel__header">
                    <h4>Dữ liệu sẽ ghi</h4>
                    <span>Preview JSON</span>
                  </div>
                  <pre>{JSON.stringify(previewData, null, 2)}</pre>
                </div>

                <button className="btn btn-primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang chờ MetaMask xử lý...' : 'Ký duyệt lên Blockchain'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="panel" style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <h3 style={{ marginBottom: 6 }}>Lịch sử blockchain</h3>
              <p style={{ margin: 0 }}>Các công đoạn đã được ghi nhận cho sản phẩm này.</p>
            </div>
            <button className="btn btn-secondary" type="button" onClick={refreshHistory} disabled={isLoading}>
              Làm mới
            </button>
          </div>

          {currentHistory.length === 0 ? (
            <div className="empty-state card">
              Chưa có dữ liệu blockchain cho sản phẩm này.
            </div>
          ) : (
            <div className="history-list">
              {currentHistory.map((item, index) => {
                const detail = parseStageNote(item.note);

                return (
                  <article className="history-item" key={`${item.stageName}-${item.timestamp}`}>
                    <div className="history-item__marker">{index + 1}</div>
                    <div className="history-item__content">
                      <div className="history-item__top">
                        <h4>{item.stageName}</h4>
                        <span>{new Date(item.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="history-detail-grid">
                        {Object.entries(detail).map(([key, value]) => (
                          <div key={key}>
                            <span>{key}</span>
                            <strong>{String(value)}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="history-signer">
                        Ghi bởi: <strong>{item.updatedBy}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Admin;
