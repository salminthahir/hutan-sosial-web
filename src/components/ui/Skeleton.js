import styles from './Skeleton.module.css';

export default function Skeleton({ className, width, height, borderRadius, style }) {
    return (
        <div 
            className={`${styles.skeleton} ${className || ''}`}
            style={{ 
                width: width || '100%', 
                height: height || '20px', 
                borderRadius: borderRadius,
                ...style 
            }}
        />
    );
}
