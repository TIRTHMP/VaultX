import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity, TextInput, } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { decryptData } from "../utils/encryption";
import { Swipeable } from "react-native-gesture-handler";
import { Keyboard } from "react-native";
import * as ScreenCapture from 'expo-screen-capture';

export default function CardItem({ card, onDelete }) {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState({});
    const [cardType, setCardType] = useState("unknown");
    const [notes, setNotes] = useState(card.notes || "");
    const [isFlipped, setIsFlipped] = useState(false);

    const flipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        ScreenCapture.preventScreenCaptureAsync();
    }, []);

    useEffect(() => {
        try {
            const number = decryptData(card.number);
            if (number.startsWith("4")) setCardType("visa");
            else if (/^5[1-5]/.test(number)) setCardType("mastercard");
        } catch { }
    }, []);

    useEffect(() => {
        const saveNotes = async () => {
            const stored = await SecureStore.getItemAsync("cards");
            const cards = stored ? JSON.parse(stored) : [];

            const updated = cards.map((c) =>
                c.id === card.id ? { ...c, notes } : c
            );

            await SecureStore.setItemAsync("cards", JSON.stringify(updated));
        };

        saveNotes();
    }, [notes]);

    const unlockCard = async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Authenticate to unlock card",
        });

        if (result.success) {
            setData({
                cardName: decryptData(card.cardName),
                number: decryptData(card.number),
                expiry: decryptData(card.expiry),
                cvv: decryptData(card.cvv),
            });
            setVisible(true);
            setTimeout(() => setVisible(false), 30000);
        }
    };

    const deleteCard = async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Authenticate to delete card",
        });

        if (result.success) onDelete(card.id);
    };

    const flipCard = async () => {
        // If currently FRONT → require biometric to go BACK
        if (!isFlipped) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Authenticate to view notes",
            });

            if (!result.success) return;
        }

        // If currently BACK → no biometric needed
        Keyboard.dismiss();

        Animated.timing(flipAnim, {
            toValue: isFlipped ? 0 : 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        setIsFlipped(!isFlipped);
    };

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["180deg", "360deg"],
    });

    const frontStyle = {
        transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
    };

    const backStyle = {
        transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
    };

    const gradientColors =
        cardType === "visa" || cardType === "mastercard"
            ? ["#0f0f0f", "#1c1c1c", "#2a2a2a", "#0f0f0f"] // Metallic Black
            : ["#6b6b6b", "#8a8a8a", "#a3a3a3", "#6b6b6b"]; // Metallic Gray

    return (
        <View style={styles.cardWrapper}>
            <Swipeable
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={() => (
                    <View style={styles.unlockSwipe}>
                        <Text style={{ color: "#fff" }}>Unlock</Text>
                    </View>
                )}
                renderRightActions={() => (
                    <View style={styles.deleteSwipe}>
                        <Text style={{ color: "#fff" }}>Delete</Text>
                    </View>
                )}
                onSwipeableLeftOpen={() => {
                    Keyboard.dismiss();
                    unlockCard();
                }}

                onSwipeableRightOpen={() => {
                    Keyboard.dismiss();
                    deleteCard();
                }}
            >

                <View style={styles.flipContainer}>
                    {/* FRONT */}
                    <Animated.View
                        pointerEvents={isFlipped ? "none" : "auto"}
                        style={[styles.card, frontStyle]}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={{ flex: 1 }}
                            onPress={flipCard}
                        >

                            <LinearGradient colors={gradientColors} style={styles.frontContent}>
                                <View style={styles.shineOverlay} />

                                <Text style={styles.bank}>
                                    {decryptData(card.cardName)}
                                </Text>

                                <Text style={styles.bank}>
                                    {decryptData(card.cardName)}
                                </Text>

                                <Image
                                    source={require("../../assets/chip.png")}
                                    style={styles.chip}
                                />

                                <Text style={styles.number}>
                                    {visible ? data.number : "**** **** **** ****"}
                                </Text>

                                <View style={styles.bottomRow}>
                                    <View>
                                        <Text style={styles.label}>VALID THRU</Text>
                                        <Text style={styles.value}>
                                            {visible ? data.expiry : "**/**"}
                                        </Text>
                                    </View>

                                    <View>
                                        <Text style={styles.label}>CVV</Text>
                                        <Text style={styles.value}>
                                            {visible ? data.cvv : "***"}
                                        </Text>
                                    </View>

                                    {cardType !== "unknown" && (
                                        <Image
                                            source={
                                                cardType === "visa"
                                                    ? require("../../assets/visa.png")
                                                    : require("../../assets/mastercard.png")
                                            }
                                            style={styles.logo}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* BACK */}
                    <Animated.View
                        pointerEvents={isFlipped ? "auto" : "none"}
                        style={[styles.card, styles.cardBack, backStyle]}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={{ flex: 1 }}
                            onPress={flipCard}
                        >
                            <Text style={styles.backTitle}>Private Notes</Text>

                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add notes..."
                                placeholderTextColor="#aaa"
                                style={styles.notesInput}
                                multiline
                                onFocus={(e) => e.stopPropagation()} // prevent flip when typing
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Swipeable>
        </View>
    );
}

const styles = StyleSheet.create({
    flipContainer: {
        width: "100%",
        aspectRatio: 1.58,
    },

    card: {
        borderRadius: 22,
        width: "100%",
        height: "100%",
        position: "absolute",
        backfaceVisibility: "hidden",
        overflow: "hidden",
    },

    bank: {
        color: "#e5e5e5",
        letterSpacing: 1,
        fontSize: 18,
        fontWeight: "600",
    },

    cardBack: {
        backgroundColor: "#1e1e2f",
        padding: 20,
        justifyContent: "center",
    },

    backTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 15,
    },

    notesInput: {
        backgroundColor: "#2c2c3a",
        color: "#fff",
        borderRadius: 12,
        padding: 15,
        minHeight: 100,
    },

    deleteSwipe: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ff3b30",
        width: 100,
        borderRadius: 20,
        marginVertical: 15,
    },

    unlockSwipe: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2ecc71",
        width: 100,
        borderRadius: 20,
        marginVertical: 15,
    },
    frontContent: {
        flex: 1,
        padding: 20,
        justifyContent: "space-between",
    },

    chip: {
        width: 65,
        height: 48,
        resizeMode: "cover",
        marginTop: 12,
    },

    number: {
        color: "#f5f5f5",
        textShadowColor: "rgba(255,255,255,0.2)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        fontSize: 22,
        letterSpacing: 3,
        marginVertical: 15,
    },

    bottomRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    label: {
        color: "#b5b5b5",
        fontSize: 10,
    },

    value: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },

    logo: {
        width: 80,
        height: 40,
        opacity: 0.95,
    },

    cardWrapper: {
        marginVertical: 15,
    },

    lockContainer: {
        flex: 1,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
    },

    lockIcon: {
        fontSize: 50,
        marginBottom: 20,
    },

    lockTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "600",
    },

    lockSubtitle: {
        color: "#aaa",
        marginTop: 10,
    },

    shineOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
});