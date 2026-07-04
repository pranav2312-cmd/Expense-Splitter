
# 💸 FairShare Expense Splitter

FairShare Expense Splitter is a modern, responsive web application that helps groups easily manage shared expenses, calculate equal bill splits, and keep a complete expense history.

The application stores all data locally in the browser using **LocalStorage**, so no backend or database is required.

---

## ✨ Features

### 👥 Member Management
- Add unlimited group members
- Prevent duplicate member names
- Member badges with avatars
- Dynamic payer selection

### 🧾 Expense Tracking
- Add expense description
- Enter expense amount
- Select payer
- Record expense location
- Save expense date
- Automatically stores expenses locally

### 💰 Bill Splitting
Two splitting modes:

- **Total Split**
  - Splits all recorded expenses equally.

- **Custom Split**
  - Split any custom amount regardless of total expenses.

Shows:

- Total amount
- Equal share per member
- Total paid by each member
- Amount owed or to receive
- Settled status

---

### 📊 Bill History

Includes a complete expense history with:

- Search by description
- Search by location
- Filter by payer
- Filter by date range
- Running filtered total
- Delete individual expenses

---

### 📤 Export

Export filtered expense history as a CSV file.

Generated CSV includes:

- Date
- Description
- Amount
- Paid By
- Location
- Total

---

### 🔔 Toast Notifications

Beautiful animated notifications for:

- Success
- Errors
- Information

---

### 💾 Local Storage

The application automatically saves:

- Members
- Expenses

Even after refreshing the browser.

---

### 🔄 Reset

Reset button clears:

- Members
- Expenses
- History
- Filters
- LocalStorage

---

## 🛠 Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla ES6)
- LocalStorage API

No external libraries or frameworks are required.

---

## 📁 Project Structure

```
FairShare/
│
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
https://github.com/pranav2312-cmd/Expense-Splitter
```

### 2. Open the project

Simply open:

```
index.html
```

in your favorite web browser.

No installation required.

---

## 📖 How to Use

### Step 1

Add all group members.

---

### Step 2

Log every expense by entering:

- Description
- Amount
- Payer
- Location (optional)
- Date

---

### Step 3

Click **Calculate Split**

The application calculates:

- Total expense
- Equal share
- Individual balances

---

### Step 4

Use Bill History to:

- Search expenses
- Filter records
- Delete entries
- Export CSV

---

## 🎨 UI Highlights

- Glassmorphism design
- Responsive layout
- Mobile friendly
- Animated cards
- Smooth transitions
- Toast notifications
- Dark theme
- Modern dashboard

---

## 🔒 Data Storage

All application data is stored locally inside your browser using:

```
localStorage
```

Keys used:

```
fairshare_members
fairshare_expenses
```

No data is sent to any server.

---

## 📱 Responsive Design

Optimized for:

- Desktop
- Laptop
- Tablet
- Mobile

---

## 🔮 Future Improvements

Potential enhancements include:

- Expense editing
- Multiple currencies
- Individual split percentages
- Receipt image upload
- PDF export
- User authentication
- Cloud synchronization
- Dark/Light mode switch
- Settlement suggestions
- Charts and analytics
- Offline PWA support

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Developed with ❤️ using HTML, CSS, and JavaScript.

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.
