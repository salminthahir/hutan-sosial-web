import styles from './TabBar.module.css';

export default function TabBar({ tabs, activeTab, onTabChange }) {
    return (
        <div className={styles.tabBarWrapper}>
            <div className={styles.tabBar}>
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        className={`${styles.tab} ${activeTab === idx ? styles.active : ''}`}
                        onClick={() => onTabChange(idx)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
}
