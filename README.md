🧭 Yatri Kavach
A Smart Tourist Safety Application

Yatri Kavach is a React Native mobile application built with Expo, designed to enhance the safety of tourists by providing real-time safety alerts, SOS assistance, and live location tracking using OpenStreetMap. The app helps travelers stay aware and connected during their journeys.

🚀 Features

🗺️ Live Location Tracking – Track your real-time location using OpenStreetMap.

🚨 SOS Assistance – Instantly alert emergency contacts in case of danger.

⚠️ Safety Alerts – Receive updates about nearby unsafe areas or incidents.

📍 Smart Navigation – Find safe routes and nearby emergency facilities.

🧠 Tech Stack
Layer	Technologies Used
Frontend	React Native, Expo
Backend	Node.js, Express.js
Database	MongoDB
Maps & Geo	OpenStreetMap API, Leaflet.js
Others	REST APIs, Geolocation Services
🏗️ Architecture Overview
Frontend (React Native + Expo)
        |
        |-- REST API Calls
        |
Backend (Node.js + Express)
        |
        |-- MongoDB (for user data, alerts, and history)
        |
    OpenStreetMap API (for map and location data)

⚙️ Installation & Setup
🖥️ Backend Setup

Clone the repository:

git clone https://github.com/Gagankhurana-12/yatri-kavach.git
cd yatri-kavach/backend


Install dependencies:

npm install


Create a .env file and add your environment variables:

PORT=5000
MONGO_URI=your_mongodb_connection_string


Start the backend server:

npm start

📱 Frontend Setup

Navigate to the frontend folder:

cd ../frontend


Install dependencies:

npm install


Start the Expo development server:

npx expo start


Scan the QR code using the Expo Go app on your mobile device to view the app.

📸 Screenshots

(Add your app screenshots here once available)
Example:

Home Screen	SOS Screen	Map View

	
	
💡 Future Enhancements

🧠 AI-powered safety predictions based on real-time data.

🌍 Multi-language support for international travelers.

📊 Safety trend analytics and visualization.

🔔 Push notifications for nearby alerts.

🧑‍💻 Author

Gagan
🚀 Full-Stack Developer | Passionate about AI & Safety Tech
🔗 GitHub Profile

🛡️ License

This project is licensed under the MIT License – see the LICENSE
 file for details.
