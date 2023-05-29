import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, BackHandler } from 'react-native';
import { db, auth } from '../firebase';
import { AuthContext } from './context/AuthContext';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    setDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc,
    arrayUnion,
    Timestamp,
    FieldValue,
    onSnapshot,
    writeBatch,
    commitBatch,
} from "firebase/firestore";

export default function Chat({ route, navigation }) {
    const { chat } = route.params;
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');


    const flatListRef = useRef(null);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleExitChat();
            navigation.navigate('Home');
            return true;
        });

        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Text>Back</Text>
                </TouchableOpacity>
            ),
        });

        const chatDocRef = doc(db, 'chats', chat.id);

        const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const chatData = docSnapshot.data();
                const chatMessages = chatData.messages || [];

                setMessages(chatMessages);
            } else {
                navigation.navigate('Home'); // Перенаправление на домашний экран, если чат отсутствует
            }
        });

        return () => {
            backHandler.remove();
            unsubscribe();
        };
    }, []);

    const isChatCreator = chat.uid_creator === auth.currentUser.uid;

    const handleSendMessage = async () => {
        if (inputText.trim() !== '') {
            const newMessage = {
                id: `${moment().valueOf()}-${auth.currentUser.uid}`,
                text: inputText,
                isUserMessage: true,
                username: auth.currentUser.displayName,
                uid_owner: auth.currentUser.uid,
            };

            try {
                const chatDocRef = doc(db, 'chats', chat.id);
                await updateDoc(chatDocRef, {
                    messages: arrayUnion(newMessage),
                });

                setInputText('');

                if (flatListRef.current && messages.length > 0) {
                    setTimeout(() => {
                        flatListRef.current.scrollToEnd();
                    }, 100);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleDeleteChat = async () => {
        try {
            await deleteDoc(doc(db, "chats", chat.id));

            const userChatsDocRef = doc(db, "userChats", auth.currentUser.uid);
            const userChatsDocSnapshot = await getDoc(userChatsDocRef);

            if (userChatsDocSnapshot.exists()) {
                const existingChats = userChatsDocSnapshot.data().chats;

                const updatedChats = existingChats.filter((chatId) => chatId !== chat.id);

                await updateDoc(userChatsDocRef, {
                    chats: updatedChats,
                });
            }

            navigation.navigate("Home");
        } catch (error) {
            console.log("Error deleting chat:", error);
        }
    };



    const handleExitChat = async () => {

        const exitMessage = {
            id: `${moment().valueOf()}-${auth.currentUser.uid}`,
            text: `${auth.currentUser.displayName} has left the chat`,
            isUserMessage: false,
            username: auth.currentUser.displayName,
            uid_owner: auth.currentUser.uid,
        };

        try {
            const chatDocRef = doc(db, 'chats', chat.id);
            await updateDoc(chatDocRef, {
                messages: arrayUnion(exitMessage),
            });

        } catch (error) {
            console.error('Error exiting chat:', error);
        }
    };

    const renderMessageItem = ({ item }) => {
        if (item.isUserMessage) {
            return (
                <View style={item.uid_owner === auth.currentUser.uid ? styles.userMessageContainer : styles.otherMessageContainer}>
                    <Text style={item.uid_owner === auth.currentUser.uid ? styles.userMessageText : styles.otherMessageText}>{item.text}</Text>
                    <Text style={styles.usernameText}>{item.username}</Text>
                </View>);
        } else {
            return (
                <View style={styles.chatTextContainer}>
                    <Text style={styles.chatText}>{item.text}</Text>
                </View>
            );
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.chatTitle}>{chat.displayName}</Text>
                {isChatCreator && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteChat}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                )}
            </View>

            {messages.length > 0 && (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    contentContainerStyle={styles.messagesContainer}
                    onContentSizeChange={() => flatListRef.current.scrollToEnd()}
                    onLayout={() => flatListRef.current.scrollToEnd()}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    //шапка
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: '#2E2E2E',
        height: 50,
    },
    chatTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginHorizontal: 10,
    },
    deleteButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'gray',
        borderRadius: 5,
        marginHorizontal: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },

    //сообщения
    messagesContainer: {
        flexGrow: 1,
        padding: 16,
    },
    messageItemContainer: {
        marginBottom: 10,
        alignSelf: 'flex-end',
    },
    userMessageContainer: {
        maxWidth: '80%',
        backgroundColor: '#e0e0e0',
        margin: 3,
        borderTopStartRadius: 10,
        borderTopEndRadius: 10,
        borderBottomStartRadius: 10,
        padding: 8,
        alignSelf: 'flex-end',
    },
    otherMessageContainer: {
        maxWidth: '80%',
        backgroundColor: '#050505',
        margin: 3,
        borderTopStartRadius: 10,
        borderTopEndRadius: 10,
        borderBottomEndRadius: 10,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 8,
        alignSelf: 'flex-start',
    },
    userMessageText: {
        color: '#000',
    },
    otherMessageText: {
        color: '#fff',
    },
    usernameText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    chatTextContainer: {
        alignSelf: 'center',
        margin: 5,
    },
    chatText: {
        color: '#888',
        fontSize: 12,
    },

    //ввод сообщений 
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginRight: 10,
        color: '#fff',
    },
    sendButton: {
        backgroundColor: 'gray',
        borderRadius: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});