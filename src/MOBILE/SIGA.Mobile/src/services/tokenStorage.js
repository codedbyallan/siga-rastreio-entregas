import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@siga_mobile_token";
const USER_KEY = "@siga_mobile_user";

export async function saveToken(token) {
  if (!token) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }

  await AsyncStorage.setItem(TOKEN_KEY, String(token));
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveUser(user) {
  if (!user) {
    await AsyncStorage.removeItem(USER_KEY);
    return;
  }

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser() {
  const user = await AsyncStorage.getItem(USER_KEY);

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    await AsyncStorage.removeItem(USER_KEY);
    return null;
  }
}

export async function clearAuthStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}