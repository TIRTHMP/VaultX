import { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Vibration, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    verifyMasterPIN, saveMasterPIN, authenticateWithBiometrics
} from '../../lib/auth';
import { Colors, Spacing, Radius } from '../../constants/theme';

const PIN_LENGTH = 6;

type Step = 'verify' | 'new' | 'confirm';

export default function ResetPINScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('verify');
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Vibration.vibrate(400);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const getActivePin = () => {
        if (step === 'verify') return currentPin;
        if (step === 'new') return newPin;
        return confirmPin;
    };

    const getStepLabel = () => {
        if (step === 'verify') return 'Enter your current PIN';
        if (step === 'new') return 'Enter new PIN';
        return 'Confirm new PIN';
    };

    const handleDigit = async (digit: string) => {
        setError('');

        if (step === 'verify') {
            const updated = currentPin + digit;
            setCurrentPin(updated);
            if (updated.length === PIN_LENGTH) {
                const valid = await verifyMasterPIN(updated);
                if (valid) {
                    setTimeout(() => { setStep('new'); setCurrentPin(''); }, 150);
                } else {
                    shake();
                    setError('Incorrect PIN. Try again.');
                    setTimeout(() => setCurrentPin(''), 800);
                }
            }

        } else if (step === 'new') {
            const updated = newPin + digit;
            setNewPin(updated);
            if (updated.length === PIN_LENGTH) {
                setTimeout(() => setStep('confirm'), 150);
            }

        } else {
            const updated = confirmPin + digit;
            setConfirmPin(updated);
            if (updated.length === PIN_LENGTH) {
                if (updated === newPin) {
                    await saveMasterPIN(newPin);
                    Alert.alert(
                        '✓ PIN Updated',
                        'Your Master PIN has been changed successfully.',
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                } else {
                    shake();
                    setError('PINs do not match. Try again.');
                    setTimeout(() => {
                        setConfirmPin('');
                        setNewPin('');
                        setStep('new');
                        setError('');
                    }, 1000);
                }
            }
        }
    };

    const handleDelete = () => {
        if (step === 'verify') setCurrentPin(p => p.slice(0, -1));
        else if (step === 'new') setNewPin(p => p.slice(0, -1));
        else setConfirmPin(p => p.slice(0, -1));
    };

    const handleBiometric = async () => {
        if (step !== 'verify') return;
        const ok = await authenticateWithBiometrics('Verify identity to reset PIN');
        if (ok) {
            setTimeout(() => { setStep('new'); setCurrentPin(''); }, 150);
        } else {
            setError('Biometric failed. Enter current PIN.');
        }
    };

    // Step indicator
    const steps: Step[] = ['verify', 'new', 'confirm'];
    const stepLabels = ['Verify', 'New PIN', 'Confirm'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Reset Master PIN</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Step indicators */}
            <View style={styles.stepsRow}>
                {steps.map((s, i) => (
                    <View key={s} style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            step === s && styles.stepCircleActive,
                            steps.indexOf(step) > i && styles.stepCircleDone,
                        ]}>
                            {steps.indexOf(step) > i ? (
                                <Text style={styles.stepDoneText}>✓</Text>
                            ) : (
                                <Text style={[
                                    styles.stepNumber,
                                    step === s && styles.stepNumberActive
                                ]}>{i + 1}</Text>
                            )}
                        </View>
                        <Text style={[
                            styles.stepLabel,
                            step === s && styles.stepLabelActive
                        ]}>{stepLabels[i]}</Text>
                        {i < steps.length - 1 && (
                            <View style={[
                                styles.stepLine,
                                steps.indexOf(step) > i && styles.stepLineDone
                            ]} />
                        )}
                    </View>
                ))}
            </View>

            {/* PIN dots */}
            <View style={styles.pinSection}>
                <Text style={styles.stepText}>{getStepLabel()}</Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Animated.View style={[
                    styles.dotsContainer,
                    { transform: [{ translateX: shakeAnim }] }
                ]}>
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                        <View key={i} style={[
                            styles.dot,
                            i < getActivePin().length ? styles.dotFilled : styles.dotEmpty
                        ]} />
                    ))}
                </Animated.View>
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
                {[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['biometric', '0', 'delete'],
                ].map((row, ri) => (
                    <View key={ri} style={styles.keypadRow}>
                        {row.map(key => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.key,
                                    (key === 'biometric' || key === 'delete') && styles.keySpecial
                                ]}
                                onPress={() => {
                                    if (key === 'delete') handleDelete();
                                    else if (key === 'biometric') handleBiometric();
                                    else handleDigit(key);
                                }}
                                activeOpacity={0.65}
                            >
                                {key === 'delete' ? (
                                    <Text style={styles.keySpecialText}>⌫</Text>
                                ) : key === 'biometric' ? (
                                    <Text style={styles.biometricIcon}>⊙</Text>
                                ) : (
                                    <Text style={styles.keyText}>{key}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>

            <Text style={styles.hint}>
                {step === 'verify'
                    ? 'Use biometric ⊙ to skip current PIN verification'
                    : 'Choose a PIN you will remember'}
            </Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', paddingHorizontal: Spacing.lg, paddingVertical: 12,
    },
    backBtn: { color: Colors.primary, fontSize: 22 },
    title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },

    // Step indicators
    stepsRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', marginTop: 16, marginBottom: 8,
        gap: 0,
    },
    stepItem: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.surface2,
        borderWidth: 1, borderColor: Colors.border,
        justifyContent: 'center', alignItems: 'center',
    },
    stepCircleActive: {
        backgroundColor: Colors.primaryGlow,
        borderColor: Colors.primary,
    },
    stepCircleDone: {
        backgroundColor: Colors.accentGreen + '22',
        borderColor: Colors.accentGreen,
    },
    stepNumber: { color: Colors.textTertiary, fontSize: 13, fontWeight: '600' },
    stepNumberActive: { color: Colors.primary },
    stepDoneText: { color: Colors.accentGreen, fontSize: 13, fontWeight: '700' },
    stepLabel: {
        color: Colors.textTertiary, fontSize: 11,
        marginHorizontal: 6, fontWeight: '500',
    },
    stepLabelActive: { color: Colors.primary },
    stepLine: {
        width: 28, height: 1,
        backgroundColor: Colors.border,
    },
    stepLineDone: { backgroundColor: Colors.accentGreen },

    // PIN
    pinSection: { alignItems: 'center', marginTop: 28, marginBottom: 36 },
    stepText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 20 },
    errorText: { color: Colors.error, fontSize: 13, marginBottom: 12 },
    dotsContainer: { flexDirection: 'row', gap: 16 },
    dot: { width: 16, height: 16, borderRadius: 8 },
    dotEmpty: { backgroundColor: Colors.surface3, borderWidth: 1, borderColor: Colors.border },
    dotFilled: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
    },

    // Keypad
    keypad: { width: '100%', paddingHorizontal: Spacing.xl, gap: 12 },
    keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    key: {
        width: 88, height: 88, borderRadius: 22,
        backgroundColor: Colors.surface2,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    keySpecial: { backgroundColor: 'transparent', borderColor: 'transparent' },
    keyText: { color: Colors.textPrimary, fontSize: 26, fontWeight: '300' },
    keySpecialText: { color: Colors.primary, fontSize: 26 },
    biometricIcon: { color: Colors.primary, fontSize: 36 },

    hint: {
        color: Colors.textTertiary, fontSize: 12,
        textAlign: 'center', marginTop: 24,
        paddingHorizontal: Spacing.xl,
    },
});