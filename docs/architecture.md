# Smart Crop Advisory System architecture

The Expo client sends authenticated REST requests to the Express API. Express stores farmer records and history through a Firebase adapter, proxies recommendation and leaf-analysis work to FastAPI, and fetches OpenWeather data. The FastAPI service applies explainable rules plus a lightweight scikit-learn-compatible ranking layer and TensorFlow image inference when a model is installed.
