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
                <TextInput placeholder="Card Holder Name" style={styles.input} onChangeText={setCardHolder} />
                <TextInput placeholder="Card Name" style={styles.input} onChangeText={setCardName} />
                <TextInput placeholder="Card Number" style={styles.input} onChangeText={setNumber} />
                <TextInput placeholder="Expiry (MM/YY)" style={styles.input} onChangeText={setExpiry} />
                <TextInput placeholder="CVV" secureTextEntry style={styles.input} onChangeText={setCvv} />
                <Button title="Save Card" onPress={saveCard} />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    input: {
        backgroundColor: "#fff",
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
