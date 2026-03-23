import React from 'react';
import './MentalLetterModal.css';

const MentalLetterModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="mental-letter-overlay">
            <div className="mental-letter-container">
                <button className="mental-letter-close" onClick={onClose} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="mental-letter-content">
                    <div className="mental-letter-header">
                        <div className="dev-emoji">😴</div>
                        <h2>Tâm Thư Từ Dev Thiếu Ngủ</h2>
                        <div className="version-badge">v1.0.0 - "Lỏ" Edition</div>
                    </div>

                    <div className="mental-letter-body">
                        <p>
                            Đcm xin giới thiệu kiệt tác công nghệ đến từ một thằng dev thiếu ngủ:
                            <strong> Web Version 1.0.0</strong> – nơi mọi thứ có thể sai đều sai.
                        </p>

                        <div className="bug-list">
                            <div className="bug-item">
                                <span className="bug-icon">🚀</span>
                                <div>
                                    <strong>Chat:</strong> Gửi xong như ném tin nhắn vào vũ trụ,
                                    không biết nó tới chưa hay đang lạc trôi cùng <em>"Lạc Trôi"</em>.
                                </div>
                            </div>
                            <div className="bug-item">
                                <span className="bug-icon">💬</span>
                                <div>
                                    <strong>Bình luận:</strong> Cmt xong biến mất như chưa từng tồn tại,
                                    chắc server nó đọc xong thấy xàm quá nên tự xoá hộ.
                                </div>
                            </div>
                            <div className="bug-item">
                                <span className="bug-icon">🔔</span>
                                <div>
                                    <strong>Thông báo:</strong> Lag như mạng thời Yahoo Messenger năm 2005,
                                    lúc cần thì mất tích, lúc không cần thì hiện lên như ma hiện hồn.
                                </div>
                            </div>
                            <div className="bug-item">
                                <span className="bug-icon">⏳</span>
                                <div>
                                    <strong>Load trang:</strong> Lúc nhanh lúc chậm, tùy theo tâm trạng server
                                    hôm đó có muốn đi làm hay không.
                                </div>
                            </div>
                            <div className="bug-item">
                                <span className="bug-icon">🎨</span>
                                <div>
                                    <strong>UI:</strong> Nhìn phát biết dev code trong trạng thái <em>“để mai fix”</em>,
                                    mà cái “mai” đó chắc rơi vào năm sau.
                                </div>
                            </div>
                        </div>

                        <p className="senior-dream">
                            Bug thì nhiều đến mức nếu fix hết chắc tao thành senior luôn. 📈
                        </p>

                        <div className="mental-letter-footer">
                            <p>
                                Nhưng mà thôi, web lỏ thì cũng là con mình đẻ ra.
                                Tao hứa sẽ fix dần, nghe feedback, tối ưu lại cho nó đỡ mang tiếng
                                <strong> "phế vật online"</strong>.
                            </p>
                            <p className="warning-text">
                                Hiện tại thì anh em cứ dùng tạm, gặp lỗi thì report nhẹ nhàng,
                                đừng chửi ác quá tao tự ái rồi tao…
                                <span className="threat">fix chậm lại đó</span>.
                            </p>
                            <p className="no-manual">
                                Đến đây đọc xong không có hướng dẫn sử dụng đâu nhé! Tự mò đi vì nó lỏ vãi ò!
                            </p>
                        </div>
                    </div>

                    <div className="mental-letter-action">
                        <button className="got-it-btn" onClick={onClose}>
                            Đã hiểu (và không chửi)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentalLetterModal;
