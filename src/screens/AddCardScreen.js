import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { encryptData } from "../utils/encryption";
import { LinearGradient } from "expo-linear-gradient";

export default function AddCardScreen({ navigation }) {
    const [cardHolder, setCardHolder] = useState("");
    const [cardName, setCardName] = useState("");
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");

    const formatExpiry = (value) => {
        let cleaned = value.replace(/\D/g, "");

        // Handle first digit
        if (cleaned.length === 1) {
            if (parseInt(cleaned) > 1) {
                // Auto prepend 0 (e.g., 3 -> 03)
                cleaned = "0" + cleaned;
            }
        }

        // Validate month when 2 digits entered
        if (cleaned.length >= 2) {
            let month = cleaned.substring(0, 2);

            if (month === "00") {
                month = "01";
            } else if (parseInt(month) > 12) {
                month = "12";
            }

            cleaned = month + cleaned.substring(2);
        }

        if (cleaned.length <= 2) return cleaned;

        return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);
    };

    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\D/g, ""); // remove non-digits
        const formatted = cleaned
            .match(/.{1,4}/g)
            ?.join(" ")
            .substring(0, 19) || "";
        return formatted;
    };

    const saveCard = async () => {
        const newCard = {
            id: Date.now().toString(),
            cardHolder: encryptData(cardHolder),
            cardName: encryptData(cardName),
            number: encryptData(number),
            expiry: encryptData(expiry),
            cvv: encryptData(cvv),
        };

        const existing = await SecureStore.getItemAsync("cards");
        const cards = existing ? JSON.parse(existing) : [];

        cards.push(newCard);

        await SecureStore.setItemAsync("cards", JSON.stringify(cards));

        navigation.goBack();
    };

    return (
        <LinearGradient
            colors={["#f9fafc", "#eaeef5"]}
            style={{ flex: 1, padding: 20 }}
        >

            <View style={styles.container}>
                <TextInput placeholder="Card Holder Name"
                    placeholderTextColor="#888"
                    style={styles.input}
                    onChangeText={setCardHolder} />

                <TextInput placeholder="Card Name"
                    placeholderTextColor="#888"
                    style={styles.input}
                    onChangeText={setCardName} />

                <TextInput placeholder="Card Number"
                    placeholderTextColor="#888"
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={19}
                    onChangeText={(text) => setNumber(formatCardNumber(text))}
                    value={number} />

                <TextInput placeholder="Expiry (MM/YY)"
                    placeholderTextColor="#888"
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={5}
                    onChangeText={(text) => setExpiry(formatExpiry(text))}
                    value={expiry} />

                <TextInput placeholder="CVV"
                    placeholderTextColor="#888"
                    secureTextEntry style={styles.input}
                    keyboardType="number-pad"
                    maxLength={4}
                    onChangeText={(text) => setCvv(text.replace(/\D/g, ""))}
                    value={cvv} />

                <Button title="Save Card" onPress={saveCard} />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    input: {
        backgroundColor: "#fff",
        color: "#000",
        borderRadius: 14,
        padding: 15,
        marginBottom: 18,
        fontSize: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },

});
