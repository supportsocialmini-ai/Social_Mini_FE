import React from 'react';
import './MentalLetterModal.css';

const MentalLetterModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="win95-overlay">
            <div className="win95-window">
                <div className="win95-title-bar">
                    <div className="win95-title-text">
                        <span className="win95-icon-small">📄</span> 
                        Tâm Thư Từ Thằng Dev Thiếu Ngủ - Notebook
                    </div>
                    <div className="win95-title-controls">
                        <button className="win95-btn-title">_</button>
                        <button className="win95-btn-title">□</button>
                        <button className="win95-btn-title close" onClick={onClose}>X</button>
                    </div>
                </div>
                
                <div className="win95-menu-bar">
                    <span><u>F</u>ile</span>
                    <span><u>E</u>dit</span>
                    <span><u>S</u>earch</span>
                    <span><u>H</u>elp</span>
                </div>

                <div className="win95-content">
                    <div className="win95-body text-area">
                        <p className="typewriter">
                            Đcm xin giới thiệu kiệt tác công nghệ đến từ một thằng dev thiếu ngủ: 
                            <strong> Web Version 1.0.0</strong> – nơi mọi thứ có thể sai đều sai.
                        </p>
                        
                        <div className="retro-bug-list">
                            <div className="retro-bug-item">
                                <span className="retro-icon">🛸</span>
                                <div>
                                    <strong>Chat:</strong> Gửi xong như ném tin nhắn vào vũ trụ, 
                                    không biết nó tới chưa hay đang lạc trôi cùng <em>"Lạc Trôi"</em>.
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">👻</span>
                                <div>
                                    <strong>Bình luận:</strong> Cmt xong biến mất như chưa từng tồn tại, 
                                    chắc server nó đọc xong thấy xàm quá nên tự xoá hộ.
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">📟</span>
                                <div>
                                    <strong>Thông báo:</strong> Lag như mạng thời Yahoo Messenger năm 2005, 
                                    lúc cần thì mất tích, lúc không cần thì hiện lên như ma hiện hồn.
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">⌛</span>
                                <div>
                                    <strong>Load trang:</strong> Lúc nhanh lúc chậm, tùy theo tâm trạng server 
                                    hôm đó có muốn đi làm hay không.
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">🖍️</span>
                                <div>
                                    <strong>UI:</strong> Nhìn phát biết dev code trong trạng thái <em>“để mai fix”</em>, 
                                    mà cái “mai” đó chắc rơi vào năm sau.
                                </div>
                            </div>
                        </div>

                        <p className="senior-dream retro">
                            Bug thì nhiều đến mức nếu fix hết chắc tao thành senior luôn... 🤡
                        </p>

                        <div className="win95-hr"></div>

                        <div className="mental-letter-footer-retro">
                            <p>
                                Nhưng mà thôi, web lỏ thì cũng là con mình đẻ ra. 
                                Tao hứa sẽ fix dần, nghe feedback, tối ưu lại cho nó đỡ mang tiếng 
                                <strong> "phế vật online"</strong>. 
                            </p>
                            <div className="warning-box-retro">
                                <span className="warning-icon-retro">⚠️</span>
                                <div>
                                    Hiện tại thì anh em cứ dùng tạm, gặp lỗi thì report nhẹ nhàng, 
                                    đừng chửi ác quá tao tự ái rồi tao… 
                                    <strong> fix chậm lại đó</strong>.
                                </div>
                            </div>
                            <p className="no-manual-retro">
                                [FATAL ERROR]: Không có hướng dẫn sử dụng! Tự mò đi vì nó lỏ vãi ò!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="win95-status-bar">
                    <div className="status-field">For Help, press F1</div>
                    <div className="status-field">NUM</div>
                </div>

                <div className="win95-actions">
                    <button className="win95-btn-ok" onClick={onClose}>
                        OK (Đừng chửi)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MentalLetterModal;
