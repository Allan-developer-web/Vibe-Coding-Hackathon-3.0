🚭 Breathe Better — Quit Smoking Companion

Breathe Better is a lightweight, motivational web application designed to support people who want to quit smoking. It provides progress tracking, cravings logging, practical tools, and an empathetic AI coach. The app is built with JavaScript, HTML, CSS (Tailwind) and communicates with a simple backend (e.g., Node/Express) for storing user data and managing donations.

🌟 Features
📊 Dashboard

Track your smoke-free streak (days since quit date).

Estimate money saved and cigarettes avoided.

View upcoming milestones (1, 3, 7, 30, 90 days).

💬 AI Coach

Chat with an empathetic AI coach powered by your own AI provider (e.g., OpenAI-compatible API).

Offline mode fallback: provides motivational messages and practical steps without internet access.

Settings to connect your own API key, URL, and model.

📝 Craving Log

Record cravings with:

Intensity (1–10)

Trigger (e.g., stress, after meal, morning coffee)

Mood (stressed, tired, calm, happy, etc.)

Notes for reflection

Review recent cravings and see simple trend summaries.

🛠️ Tools

Urge Timer (5-min): Distracts and guides you through cravings.

4-7-8 Breathing Exercise: Guided breathing with voice prompts.

⚙️ Settings

Store personal details:

Quit date

Cigarettes per day

Pack price

Cigarettes per pack

Enable browser notifications for gentle reminders.

💖 Support / Donations

Visitors can donate to support ongoing development.

The app integrates with IntaSend Payment Links
 (or your own backend) to process tips/donations.

A simple donation form is included for custom amounts.

The ☕ Support button can be configured to point to a fixed IntaSend payment link.

🏗️ Tech Stack

Frontend:

HTML5, CSS3 (Tailwind + custom animations in style.css)

Vanilla JavaScript (app.js)

Backend (required for full features):

REST API (expected at http://localhost:5000/)

Endpoints:

POST /profile – Save user profile

GET /profile – Fetch profile

POST /plans – Add quit strategies

GET /plans – Get strategies

POST /cravings – Log craving

GET /cravings – List cravings

POST /donate – Start donation (returns checkout_url)

GET /triggers – List craving triggers

🚀 Getting Started
1. Clone the Repository
git clone https://github.com/yourusername/breathe-better.git
cd breathe-better

2. Install Dependencies (backend only)

If you’re running a backend, set it up with Node.js + Express:

npm install

3. Configure Backend

Ensure your backend provides the endpoints listed above.

For donations:

Option 1: Use IntaSend Payment Links (static link, no backend required).

Option 2: Implement /donate endpoint in your backend to call IntaSend API and return { checkout_url }.

Example response expected from /donate:

{
  "checkout_url": "https://payment.intasend.com/pay/YOUR-LINK-ID"
}

4. Run Locally

Open index.html in your browser (no build step required).

If using backend, ensure it’s running on:

http://localhost:5000

🧑‍⚕️ Disclaimer

This app is a health support tool only.
It provides general educational guidance, motivational tips, and habit-tracking tools to assist with smoking cessation.

⚠️ It is not a substitute for medical advice.
If you are struggling with your health or feel unsafe, please consult a qualified healthcare provider or call local emergency services.

🙌 Contributing

Contributions are welcome! Ideas include:

Expanding AI coaching prompts

Adding analytics for cravings

Improving donation flow with multiple payment providers

UI/UX improvements

📜 License

This project is licensed under the MIT License.