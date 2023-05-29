import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
    collection,
    query,
    where,
    getDocs,
    setDoc,
    doc,
    updateDoc,
    serverTimestamp,
    getDoc,
    arrayUnion,
    Timestamp,
    FieldValue,
    onSnapshot
} from "firebase/firestore";


export default function Register_Screen({ navigation }) {
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')

    const onLoginPress = () => {
        navigation.navigate('Login_Screen');
    }

    const validateLoginAndPassword = () => {
        // Проверка логина
        const loginRegex = /^[a-zA-Z0-9]+$/; // Регулярное выражение для проверки допустимых символов
        if (login.trim().length < 3 || login.trim().length > 12 || !loginRegex.test(login)) {
            Alert.alert('Error', 'Invalid login. Login must be 3-12 characters long and contain only alphanumeric characters.');
            return false;
        }

        // Проверка пароля
        if (password.trim().length < 6 || password.trim().length > 12 || !loginRegex.test(password)) {
            Alert.alert('Error', 'Invalid password. Password must be at least 6-12 characters long and contain only alphanumeric characters.');
            return false;
        }

        return true;
    }

    const onEnterPress = async () => {
        if (!validateLoginAndPassword()) {
            return;
        }

        const res = await createUserWithEmailAndPassword(auth, email, password)
            .then(async (res) => {
                updateProfile(res.user, {
                    displayName: login
                });

                await setDoc(doc(db, "users", res.user.uid), {
                    uid: res.user.uid,
                    displayName: login,
                    password,
                    email,
                })
                    .then(() => {
                        console.log("Users document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing users document: ", error);
                    });

                await setDoc(doc(db, "userChats", res.user.uid), {
                    chats: [],
                })
                    .then(() => {
                        console.log("UserChats document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing userChats document: ", error);
                    });

                const user = res.user;
                navigation.navigate('Home');

            })
            .catch(error => {
                Alert.alert('Error', error.message)
            })
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={Styles.body}
        >
            <ScrollView
                contentContainerStyle={Styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={Styles.body}>
                    <Image
                        style={Styles.logo}
                        source={require('../assets/White_Selty.png')}
                    />
                    <Text style={Styles.header_text}>
                        Register
                    </Text>
                    <TextInput
                        style={Styles.input}
                        onChangeText={(login) => setLogin(login)}
                        placeholder="login"
                        placeholderTextColor='#726e6f'
                    />
                    <TextInput
                        style={Styles.input}
                        onChangeText={(pass) => setPassword(pass)}
                        placeholder="password"
                        placeholderTextColor='#726e6f'
                        secureTextEntry
                    />
                    <TextInput
                        style={Styles.input}
                        onChangeText={(email) => setEmail(email)}
                        placeholder="email"
                        placeholderTextColor='#726e6f'
                    />
                    <TouchableOpacity
                        onPress={onEnterPress}
                        style={Styles.enter}>
                        <Text style={Styles.text}>
                            Enter
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onLoginPress}
                        style={Styles.bottomButton}>
                        <Text style={Styles.register}>
                            or login
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const Styles = StyleSheet.create({
    body: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#000000'
    },
    text: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 18
    },
    header_text: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: 'bold',
        margin: 20
    },
    logo: {
        width: 300,
        height: 300,
        marginTop: 30
    },
    input: {
        width: 300,
        borderWidth: 2,
        borderColor: '#ffffff',
        borderRadius: 15,
        backgroundColor: '#000000',
        textAlign: 'left',
        fontSize: 18,
        margin: 12,
        color: '#ffffff',
        paddingHorizontal: 15,
    },
    enter: {
        width: 150,
        borderWidth: 2,
        borderColor: '#ffffff',
        borderRadius: 15,
        backgroundColor: '#726e6f',
        fontSize: 18,
        margin: 12,
        marginBottom: 40, // Отступ снизу для кнопки "Enter"
    },
    bottomButton: {
        position: 'absolute',
        bottom: 0,
        paddingHorizontal: 16,
        paddingVertical: 8,
        margin: 10
    },
    register: {
        color: '#ffffff',
        textDecorationLine: 'underline'
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20, // Отступ снизу, чтобы контент не прилипал к клавиатуре
    },

})