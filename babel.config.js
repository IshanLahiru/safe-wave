module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      require.resolve('expo-router/babel'),
      // React Native Reanimated plugin (must be listed last)
      'react-native-reanimated/plugin',
    ],
  };
};
