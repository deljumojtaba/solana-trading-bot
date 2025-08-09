# 🤖 Solana Trading Bot

A sophisticated trading bot for Solana tokens with a secure web dashboard interface. Generate natural trading activity with configurable strategies and real-time monitoring.

**Default Token**: CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E

## ✨ Features

- **🔐 Secure Web Dashboard**: User isolation with automatic data cleanup
- **🤖 Multi-Bot Support**: Run up to 3 bots simultaneously with different strategies
- **📊 Real-Time Monitoring**: Live logs and status updates
- **🎛️ Configurable Strategies**: Balanced, Aggressive, and Conservative trading modes
- **🛡️ Privacy First**: No permanent data storage, automatic cleanup on logout
- **📱 Responsive UI**: Beautiful dark theme with comprehensive tooltips
- **🔑 Flexible Key Formats**: Support for both Base58 and byte array private keys
- 📊 Random trade amounts within specified ranges
- ⏰ Random intervals between trades
- 🛡️ Safety checks and error handling
- 📝 Comprehensive trade logging
- 🌊 Jupiter aggregator integration for best prices
- ⚙️ Configurable via environment variables
- 🎛️ **Beautiful Web Dashboard** for real-time monitoring
- 🔄 Multi-bot support with different strategies
- 📱 Responsive design with dark theme

## Project Structure

```
src/
├── index.js          # Main entry point
├── bot.js            # Core trading bot logic
├── dashboard.js      # Web dashboard server
├── constants.js      # Configuration constants
├── services/
│   └── jupiter.js    # Jupiter API integration
└── utils/
    ├── helpers.js    # Utility functions
    └── logger.js     # Logging system

views/
└── dashboard.ejs     # Dashboard HTML template

public/
├── css/
│   └── dashboard.css # Dashboard styling
└── js/
    └── dashboard.js  # Dashboard client-side logic

scripts/
└── bots.sh          # Multi-bot management script
```

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Web Dashboard:**

   **For Personal Use:**

   ```bash
   npm run dashboard
   ```

   **For Public Hosting (Secure):**

   ```bash
   npm run dashboard:secure
   ```

   Then open http://localhost:3000 in your browser

4. **Or run individual bots:**

   ```bash
   # Single bot
   npm start

   # Multiple bots with different strategies
   npm run bot1  # Balanced strategy (60/40)
   npm run bot2  # Aggressive strategy (75/25)
   npm run bot3  # Conservative strategy (55/45)
   ```

## 🔒 Security for Public Hosting

⚠️ **Important**: If you're hosting this publicly, use the secure version!

### Two Dashboard Modes:

#### 🏠 **Personal Dashboard** (`npm run dashboard`)

- Single user mode
- All visitors see same bots and logs
- **Use for**: Personal trading, local development

#### 🛡️ **Secure Dashboard** (`npm run dashboard:secure`)

- Multi-user isolation
- Each user gets private bot instances
- Session-based user separation
- **Use for**: Public websites, multiple users

### Security Features:

- 🔐 **User Isolation**: Each visitor gets unique session
- 📁 **Private Data**: Separate config files per user
- 🚫 **No Cross-Access**: Users can't see each other's activity
- 🧹 **Auto-Cleanup**: Sessions expire after 24 hours

**For more details, see [SECURITY.md](SECURITY.md)**## Web Dashboard

The bot includes a beautiful web dashboard with:

- 🎛️ **Real-time bot control** - Start/stop individual or all bots
- 📊 **Live monitoring** - See bot status and activity in real-time
- 📝 **Live logs** - Color-coded logs from all bots
- 📱 **Responsive design** - Works on desktop and mobile
- 🌙 **Dark theme** - Easy on the eyes for long monitoring sessions

Access the dashboard at: **http://localhost:3000**

### Dashboard Commands

```bash
npm run dashboard      # Start dashboard server
npm run dev:dashboard  # Start with auto-restart
```

## Multi-Bot Configuration

Run multiple bots simultaneously with different strategies:

- **Bot 1** (.env): Balanced strategy - 60% buy, 40% sell
- **Bot 2** (.env.bot2): Aggressive strategy - 75% buy, 25% sell
- **Bot 3** (.env.bot3): Conservative strategy - 55% buy, 45% sell

Each bot can use different:

- Private keys (wallets)
- Trading ranges
- Time intervals
- Buy/sell ratios

## Configuration Options

All configuration is done via `.env` files:

| Variable             | Description                                    | Default                                      | Required |
| -------------------- | ---------------------------------------------- | -------------------------------------------- | -------- |
| `PRIVATE_KEY`        | Wallet private key (comma-separated or Base58) | -                                            | ✅       |
| `TOKEN_ADDRESS`      | Token address to trade                         | CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E | ❌       |
| `RPC_URL`            | Solana RPC endpoint                            | mainnet-beta                                 | ❌       |
| `SOL_AMOUNT_MIN`     | Minimum SOL per trade                          | 0.001                                        | ❌       |
| `SOL_AMOUNT_MAX`     | Maximum SOL per trade                          | 0.01                                         | ❌       |
| `TRADE_INTERVAL_MIN` | Min seconds between trades                     | 30                                           | ❌       |
| `TRADE_INTERVAL_MAX` | Max seconds between trades                     | 300                                          | ❌       |
| `BUY_PERCENTAGE`     | Percentage of buy vs sell orders               | 80                                           | ❌       |
| `MAX_SLIPPAGE`       | Maximum slippage tolerance                     | 0.05                                         | ❌       |
| `MIN_SOL_BALANCE`    | Minimum SOL to maintain                        | 0.1                                          | ❌       |

### Private Key Formats

The bot supports two private key formats:

1. **Comma-separated bytes**: `[123,45,67,...]`
2. **Base58 encoded**: `2zQ8v...` (Phantom wallet format)

## Available Commands

```bash
# Individual bots
npm start              # Start main bot (.env)
npm run bot1           # Start bot 1 (.env)
npm run bot2           # Start bot 2 (.env.bot2)
npm run bot3           # Start bot 3 (.env.bot3)

# Multiple bots
npm run start-all      # Start all 3 bots
npm run stop-all       # Stop all bots
npm run status         # Check bot status
npm run logs           # View logs

# Web Dashboard
npm run dashboard      # Start web dashboard
npm run dev:dashboard  # Dashboard with auto-restart

# Development
npm run dev            # Development mode with watch
```

## Safety Guidelines

- ⚠️ **Always test on devnet first**
- 💰 **Start with small amounts**
- 📊 **Monitor your SOL balance regularly**
- 🔐 **Keep private keys secure**
- 🚫 **Never commit `.env` files**

## How It Works

1. **Trading Strategy**: Configurable buy/sell ratios (default 80% buy, 20% sell)
2. **Multi-Bot Support**: Run up to 3 bots with different strategies simultaneously
3. **Random Timing**: Intervals between 30-300 seconds (configurable)
4. **Random Amounts**: Variable trade sizes within your specified range
5. **Jupiter Integration**: Uses Jupiter aggregator for optimal swap routes
6. **Balance Monitoring**: Automatically pauses if SOL balance is too low
7. **Web Dashboard**: Real-time monitoring and control via beautiful web interface
8. **Private Key Flexibility**: Supports both comma-separated and Base58 formats

### Multi-Bot Strategies

- **Balanced Bot**: 60% buy, 40% sell - steady activity
- **Aggressive Bot**: 75% buy, 25% sell - strong buying pressure
- **Conservative Bot**: 55% buy, 45% sell - minimal price impact

## Screenshots

### Web Dashboard

The dashboard provides real-time monitoring with:

- Bot status indicators (running/stopped)
- Live log streaming with color coding
- One-click start/stop controls
- Beautiful dark theme interface
- Responsive design for all devices

Access at: **http://localhost:3000** when dashboard is running

## Disclaimer

This bot is for educational purposes. Trading cryptocurrencies involves risk. Always:

- Understand the code before running
- Test thoroughly on devnet
- Use only funds you can afford to lose
- Comply with local regulations

## Open Source Support

This project is developed and maintained by the **AntCoders** team and provided free as open source software. If this trading bot has helped you succeed in the crypto market, please consider supporting our continued development.

### 💝 Support Development

Your contributions help us:

- 🔧 Add new features and improvements
- 🐛 Fix bugs and enhance performance
- 📚 Maintain comprehensive documentation
- 🛡️ Keep security measures up to date
- 🌟 Support the open source community

**Solana Donation Address:**

```
66SZQA9sMcjB6am9jvUkUyCwCv6UXCZWdthDN5M7CDXm
```

### 🌟 Ways to Support

1. **⭐ Star this repository** on GitHub
2. **🐛 Report issues** and suggest improvements
3. **💰 Donate SOL** to support development
4. **📢 Share** with other traders
5. **🤝 Contribute** code improvements

### 🏆 About AntCoders

AntCoders is dedicated to building powerful, secure, and user-friendly trading tools for the Solana ecosystem. Our mission is to democratize access to professional-grade trading automation while maintaining the highest security standards.

**🌐 Visit us:** [https://antcoders.dev/](https://antcoders.dev/)

**Made with ❤️ by AntCoders Team**

---

**Happy Trading! 🚀**
