import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Alert
} from 'react-native';
import { signOut } from 'firebase/auth';
import moment from 'moment';
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
  serverTimestamp,
  getDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  FieldValue,
  onSnapshot,
} from "firebase/firestore";


const Header = ({ username, onLogout, onCreateChat }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftContainer}>
        <TouchableOpacity onPress={onCreateChat}>
          <Image
            source={require('../assets/Plus.png')}
            style={styles.createChatButton}
          />
        </TouchableOpacity>
        <Text style={styles.username}>{username}</Text>
      </View>
      <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};


const SearchBar = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    onSearch(searchText);
    setSearchText('');
  };

  return (
    <View style={styles.searchBarContainer}>
      <TextInput
        style={styles.input}
        placeholder="Search"
        value={searchText}
        placeholderTextColor="#726e6f"
        onChangeText={setSearchText}
      />
      <TouchableOpacity onPress={handleSearch}>
        <Image
          source={require('../assets/search.png')}
          style={styles.searchButton}
        />
      </TouchableOpacity>
    </View>
  );
};


const ChatList = ({ chats, navigation }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [chatPassword, setChatPassword] = useState('');
  const [chat, setChat] = useState(null);

  const handleChatPress = async (chat) => {
    setChat(chat);
    setIsVisible(true);
  };

  const handleOpenChat = async () => {
    if (!chatPassword) {
      return;
    }


    if (chatPassword === chat.password) {
      const enterMessage = {
        id: `${moment().valueOf()}-${auth.currentUser.uid}`,
        text: `${auth.currentUser.displayName} has entered the chat`,
        isUserMessage: false,
        username: auth.currentUser.displayName,
        uid_owner: auth.currentUser.uid,
      };
  
      try {
        const chatDocRef = doc(db, 'chats', chat.id);
        await updateDoc(chatDocRef, {
          messages: arrayUnion(enterMessage),
        });
  
        // ...
      } catch (error) {
        console.error('Error entering chat:', error);
      }
      
      setChatPassword('');
      setIsVisible(false);
      navigation.navigate('Chat', { chat });
    } else {
      Alert.alert("Wrong password", "Try again!")
    }
    
  }

  const renderChatItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleChatPress(item)}>
      <Text style={styles.chatItem}>{item.displayName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.chatListContainer}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()}
      />
      <Modal
        visible={isVisible}
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
        >
          <View style={styles.modal}>
            <Text style={styles.modalHeaderText}>Write password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Chat Password"
              placeholderTextColor='#726e6f'
              value={chatPassword}
              onChangeText={setChatPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.modalButtonContainer}
              onPress={handleOpenChat}
            >
              <Text style={styles.modalButton}>OK</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};


const CreateChatModal = ({ onCreateChat, setCreateChat, isVisible }) => {
  const [chatName, setChatName] = useState('');
  const [chatPassword, setChatPassword] = useState('');

  const handleCreateChat = async () => {
    onCreateChat();

    if (!chatName || !chatPassword) {
      return;
    }

    try {
      // Создание нового документа в коллекции "chats"
      const chatDocRef = await addDoc(collection(db, 'chats'), {
        displayName: chatName,
        password: chatPassword,
        uid_creator: auth.currentUser.uid,
        messages: [],
      });

      // Добавление созданного чата в коллекцию "userChats"
      const userChatsDocRef = doc(db, 'userChats', auth.currentUser.uid);
      await updateDoc(userChatsDocRef, {
        chats: arrayUnion(chatDocRef.id),
      });

      // Сброс значений полей
      setChatName('');
      setChatPassword('');

      // Закрытие модального окна
      setCreateChat(false);

    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      onRequestClose={() => setCreateChat(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modal}>
          <Text style={styles.modalHeaderText}>Create chat</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Chat Name"
            placeholderTextColor='#726e6f'
            value={chatName}
            onChangeText={setChatName}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Chat Password"
            placeholderTextColor='#726e6f'
            value={chatPassword}
            onChangeText={setChatPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.modalButtonContainer}
            onPress={handleCreateChat}
          >
            <Text style={styles.modalButton}>OK</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


export default function Home({ navigation }) {
  const { currentUser } = useContext(AuthContext);
  console.log(currentUser);

  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const [userChats, setUserChats] = useState([]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleLogout();
        return true; // Возвращаем true, чтобы предотвратить переход на предыдущий экран
      }
    );

    if (currentUser) {
      const unsubscribe = onSnapshot(
        doc(db, 'userChats', currentUser.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const chatIds = snapshot.data().chats;

            Promise.all(
              chatIds.map(async (chatId) => {
                const chatDocRef = doc(db, 'chats', chatId);
                const chatDocSnapshot = await getDoc(chatDocRef);

                // Проверяем, существует ли чат по указанному UID
                if (chatDocSnapshot.exists()) {
                  return { id: chatId, ...chatDocSnapshot.data() };
                } else {
                  // Если чат не существует, удаляем его UID из массива chats
                  const userChatsDocRef = doc(db, 'userChats', currentUser.uid);
                  await updateDoc(userChatsDocRef, {
                    chats: arrayRemove(chatId),
                  });
                  return null;
                }
              })
            )
              .then((chats) => {
                // Удаляем пустые значения из массива chats
                const filteredChats = chats.filter((chat) => chat !== null);
                setUserChats(filteredChats);
              })
              .catch((error) => {
                console.error('Error fetching user chats:', error);
              });
          }
        }
      );

      return () => {
        unsubscribe();
        backHandler.remove();
      };
    } else {
      backHandler.remove();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate('Login_Screen');
  };

  const handleCreateChat = () => {
    setIsCreatingChat(true);
  };

  const handleSearch = async (searchText) => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'chats'), where('displayName', '==', searchText))
      );

      if (!querySnapshot.empty) {
        const chatDocs = querySnapshot.docs;
        const chatPromises = chatDocs.map(async (chatDoc) => {
          const chatId = chatDoc.id;
          const userChatsDocRef = doc(db, 'userChats', currentUser.uid);
          const userChatsDocSnapshot = await getDoc(userChatsDocRef);

          if (userChatsDocSnapshot.exists()) {
            const existingChats = userChatsDocSnapshot.data().chats;
            if (!existingChats.includes(chatId)) {
              await updateDoc(userChatsDocRef, {
                chats: [...existingChats, chatId],
              });
            }
          }
          //  else {
          //   await setDoc(userChatsDocRef, { chats: [chatId] });
          // }

          return { id: chatId, ...chatDoc.data() };
        });

        // const chats = await Promise.all(chatPromises);
        // setUserChats(chats);
      }
    } catch (error) {
      console.error('Error searching chat:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header username={currentUser ? currentUser.displayName : "none"} onLogout={handleLogout} onCreateChat={handleCreateChat} />
      {isCreatingChat && (
        <CreateChatModal onCreateChat={handleCreateChat} setCreateChat={setIsCreatingChat} isVisible={isCreatingChat} />
      )}
      <SearchBar onSearch={handleSearch} />
      <ChatList chats={userChats} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    //alignItems: 'center',
    //justifyContent: 'flex-start',
  },
  text: {
    color: '#e0e0e0'
  },

  // шапка
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#2E2E2E',
    height: 50,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#e0e0e0'
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'gray',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
  },
  createChatButton: {
    width: 24,
    height: 24,
  },

  //поисковая строка
  searchBarContainer: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    textAlign: 'left',
    fontSize: 18,
  },
  input: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    color: '#e0e0e0'
  },
  searchButton: {
    width: 24,
    height: 24,
    tintColor: 'white'
  },

  //список чатов
  chatListContainer: {
    paddingHorizontal: 10,
  },
  chatItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    color: '#e0e0e0'
  },

  //окно создания чатов
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000099',
  },
  modal: {
    justifyContent: 'center',
    width: 350,
    height: 300,
    backgroundColor: '#000',
    borderWidth: 2,
    borderRadius: 25,
    borderColor: '#e0e0e0',
  },
  modalHeaderText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 15,
    alignSelf: 'center'
  },
  modalInput: {
    height: 36,
    paddingHorizontal: 15,
    margin: 15,
    marginHorizontal: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    textAlign: 'left',
    fontSize: 18,
    color: '#e0e0e0',
  },
  modalButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  modalButton: {
    backgroundColor: 'gray',
    width: 80,
    height: 40,
    borderWidth: 0,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 35,
    fontSize: 18,
    color: '#e0e0e0'
  },
});