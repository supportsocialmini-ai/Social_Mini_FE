import React from 'react';
import { useTranslation } from 'react-i18next';
import './MentalLetterModal.css';

const MentalLetterModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="win95-overlay">
            <div className="win95-window">
                <div className="win95-title-bar">
                    <div className="win95-title-text">
                        <span className="win95-icon-small">📄</span> 
                        {t('mentalLetter.title')}
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
                            {t('mentalLetter.intro')}
                        </p>
                        
                        <div className="retro-bug-list">
                            <div className="retro-bug-item">
                                <span className="retro-icon">🛸</span>
                                <div>
                                    <strong>{t('mentalLetter.chatTitle')}</strong> {t('mentalLetter.chatDesc')}
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">👻</span>
                                <div>
                                    <strong>{t('mentalLetter.commentTitle')}</strong> {t('mentalLetter.commentDesc')}
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">📟</span>
                                <div>
                                    <strong>{t('mentalLetter.notifTitle')}</strong> {t('mentalLetter.notifDesc')}
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">⌛</span>
                                <div>
                                    <strong>{t('mentalLetter.loadTitle')}</strong> {t('mentalLetter.loadDesc')}
                                </div>
                            </div>
                            <div className="retro-bug-item">
                                <span className="retro-icon">🖍️</span>
                                <div>
                                    <strong>{t('mentalLetter.uiTitle')}</strong> {t('mentalLetter.uiDesc')}
                                </div>
                            </div>
                        </div>

                        <p className="senior-dream retro">
                            {t('mentalLetter.seniorDream')}
                        </p>

                        <div className="win95-hr"></div>

                        <div className="mental-letter-footer-retro">
                            <p>
                                {t('mentalLetter.footer')}
                            </p>
                            <div className="warning-box-retro">
                                <span className="warning-icon-retro">⚠️</span>
                                <div>
                                    {t('mentalLetter.warning')}
                                </div>
                            </div>
                            <p className="no-manual-retro">
                                {t('mentalLetter.fatalError')}
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
                        {t('mentalLetter.okBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MentalLetterModal;
