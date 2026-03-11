import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '../../constants/theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    visible: boolean;
    onHide: () => void;
    duration?: number;
}

const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

const toastColors: Record<ToastType, string> = {
    success: Colors.accentGreen,
    error: Colors.accentRed,
    info: Colors.accentBlue,
    warning: Colors.primary,
};

export function Toast({ message, type = 'info', visible, onHide, duration = 2500 }: ToastProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const color = toastColors[type];

    return (
        <Animated.View style={[
            styles.container,
            { transform: [{ translateY }], opacity, borderLeftColor: color }
        ]}>
            <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
                <Text style={[styles.icon, { color }]}>{icons[type]}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

// Hook for easy usage
import { useState } from 'react';

export function useToast() {
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
        visible: boolean;
    }>({ message: '', type: 'info', visible: false });

    const show = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, visible: true });
    };

    const hide = () => setToast(t => ({ ...t, visible: false }));

    return { toast, show, hide };
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 56,
        left: Spacing.lg,
        right: Spacing.lg,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: 12,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 16,
    },
    iconCircle: {
        width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    icon: { fontSize: 14, fontWeight: '800' },
    message: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
});