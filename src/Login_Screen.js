import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, StyleSheet, Text, View, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
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

export default function Login_Screen({ navigation }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const onRegisterPress = () => {
        navigation.navigate('Register_Screen');
    }

    const onEnterPress = async () => {
        try {
            signInWithEmailAndPassword(auth, email, password)
                .then((res) => {
                    // console.log('Signed in!')
                    const user = res.user;
                    // console.log(user)
                    navigation.navigate('Home');
                })
                .catch(error => {
                    // console.log(error)
                    Alert.alert(error.message)
                })
        } catch (error) {
            Alert.alert('Error', error.message)
        }
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
                <StatusBar barStyle="light-content" backgroundColor="#000"/>
                <View style={Styles.body}>
                    <Image
                        style={Styles.logo}
                        source={require('../assets/helmet.png')}
                    />
                    <Text style={Styles.header_text}>
                        Log In
                    </Text>
                    <TextInput
                        style={Styles.input}
                        placeholder="email"
                        onChangeText={(email) => setEmail(email)}
                        placeholderTextColor='#726e6f'
                    />
                    <TextInput
                        style={Styles.input}
                        placeholder="password"
                        onChangeText={(pass) => setPassword(pass)}
                        placeholderTextColor='#726e6f'
                        secureTextEntry
                    />
                    <TouchableOpacity
                        onPress={onEnterPress}
                        style={Styles.enter}>
                        <Text style={Styles.text}>
                            Enter
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onRegisterPress}
                        style={Styles.bottomButton}
                    >
                        <Text style={Styles.register}>
                            or register
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
        backgroundColor: '#000000',
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
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20, // Отступ снизу, чтобы контент не прилипал к клавиатуре
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
        color: '#456eb0',
        textDecorationLine: 'underline'
    }
})