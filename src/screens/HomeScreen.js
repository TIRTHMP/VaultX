import { BlurView } from "expo-blur";
import { Animated } from "react-native";
import { useRef } from "react";
import React, { useEffect, useState } from "react";
import { View, Button, FlatList, Text, TouchableOpacity, AppState, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import CardItem from "../components/CardItem";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen({ navigation }) {
    const [cards, setCards] = useState([]);
    const [isLocked, setIsLocked] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const idleTimer = useRef(null);

    const resetIdleTimer = () => {
        if (idleTimer.current) clearTimeout(idleTimer.current);

        idleTimer.current = setTimeout(() => {
            setIsLocked(true);
        }, 60000); // 60 seconds idle
    };

    useEffect(() => {
        const tryUnlock = async () => {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Unlock Vault",
            });

            if (result.success) {
                setIsLocked(false);
            }
        };

        tryUnlock();

        const sub = AppState.addEventListener("change", (state) => {
            if (state !== "active") {
                setIsLocked(true);
            } else {
                tryUnlock(); // auto prompt when returning
            }
        });

        return () => sub.remove();
    }, []);


    const unlockVault = async () => {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock Vault",
        });

        if (result.success) {
            resetIdleTimer();
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => {
                setIsLocked(false);
                fadeAnim.setValue(1);
            });
        }
    };

    const loadCards = async () => {
        const stored = await SecureStore.getItemAsync("cards");
        if (stored) setCards(JSON.parse(stored));
        else setCards([]);
    };

    const deleteCard = async (id) => {
        const updated = cards.filter((card) => card.id !== id);
        setCards(updated);
        await SecureStore.setItemAsync("cards", JSON.stringify(updated));
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", loadCards);
        return unsubscribe;
    }, [navigation]);

    {
        isLocked && (
            <Animated.View
                style={[
                    styles.blurOverlay,
                    { opacity: fadeAnim },
                ]}
            >
                <BlurView intensity={80} style={styles.absoluteFill}>
                    <View style={styles.lockContent}>
                        <Text style={styles.lockIcon}>🔐</Text>
                        <Text style={styles.lockTitle}>Vault Locked</Text>
                    </View>
                </BlurView>
            </Animated.View>
        )
    }

    return (
        <LinearGradient
            colors={["#f2f3f7", "#e6e8f0"]}
            style={{ flex: 1, padding: 15 }}
            onTouchStart={resetIdleTimer}
        >
            {cards.length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 120 }}>
                    <Text style={{ fontSize: 60 }}>💳</Text>
                    <Text
                        style={{
                            fontSize: 18,
                            color: "#666",
                            marginTop: 15,
                        }}
                    >
                        No cards added yet
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={cards}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    renderItem={({ item }) => (
                        <CardItem card={item} onDelete={deleteCard} />
                    )}
                />
            )}
        </LinearGradient>

    );
}

const styles = StyleSheet.create({
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

    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },

    absoluteFill: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    lockContent: {
        alignItems: "center",
    },

    lockIcon: {
        fontSize: 50,
        marginBottom: 15,
    },

    lockTitle: {
        fontSize: 22,
        color: "#fff",
        fontWeight: "600",
    },
});