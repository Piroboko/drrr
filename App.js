import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Login_Screen from './src/Login_Screen';
import Register_Screen from './src/Register_Screen';
import Home from './src/Home';
import Chat from './src/Chat';
import { AuthContext, AuthContextProvider } from './src/context/AuthContext';
import { useContext } from 'react';

const Stack = createStackNavigator();



export default function App() {
  
  return (
    <AuthContextProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Login_Screen"
            component={Login_Screen}
            options={{
              header: () => null
            }}
          />
          <Stack.Screen
            name="Register_Screen"
            component={Register_Screen}
            options={{
              header: () => null
            }}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{
              header: () => null
            }}
          />
          <Stack.Screen
            name="Chat"
            component={Chat}
            options={{
              header: () => null
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
