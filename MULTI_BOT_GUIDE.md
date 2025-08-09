# Running Multiple Trading Bots

## Available Bot Configurations

### Bot 1 (Default - Balanced)

- **Config File**: `.env`
- **Strategy**: 60% buy, 40% sell
- **Trade Range**: 0.0001 - 0.001 SOL
- **Intervals**: 60-180 seconds
- **Style**: Balanced trading

### Bot 2 (Aggressive)

- **Config File**: `.env.bot2`
- **Strategy**: 75% buy, 25% sell
- **Trade Range**: 0.0002 - 0.002 SOL
- **Intervals**: 30-120 seconds
- **Style**: More frequent, larger trades

### Bot 3 (Conservative)

- **Config File**: `.env.bot3`
- **Strategy**: 55% buy, 45% sell
- **Trade Range**: 0.00005 - 0.0005 SOL
- **Intervals**: 120-300 seconds
- **Style**: Slower, smaller trades

## How to Run Multiple Bots

### Method 1: Different Terminal Windows

```bash
# Terminal 1 - Default bot
npm run bot1

# Terminal 2 - Aggressive bot
npm run bot2

# Terminal 3 - Conservative bot
npm run bot3
```

### Method 2: Background Processes (Linux/Mac)

```bash
# Start multiple bots in background
npm run bot1 &
npm run bot2 &
npm run bot3 &

# Check running processes
ps aux | grep node

# Stop all bots
pkill -f "node src/index.js"
```

### Method 3: PM2 Process Manager (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start bots with PM2
pm2 start "npm run bot1" --name "trading-bot-1"
pm2 start "npm run bot2" --name "trading-bot-2"
pm2 start "npm run bot3" --name "trading-bot-3"

# Monitor all bots
pm2 monit

# Check status
pm2 status

# Stop specific bot
pm2 stop trading-bot-1

# Stop all bots
pm2 stop all

# View logs
pm2 logs trading-bot-1
```

## Customizing Bot Configurations

### Create Your Own Bot Configuration

1. Copy an existing config file:

   ```bash
   cp .env.bot2 .env.mybot
   ```

2. Edit the new file with your settings:

   ```bash
   nano .env.mybot
   ```

3. Add script to package.json:

   ```json
   "mybot": "node src/index.js .env.mybot"
   ```

4. Run your custom bot:
   ```bash
   npm run mybot
   ```

## Important Notes

⚠️ **Wallet Balance**: All bots use the same wallet, so make sure you have enough SOL for all running bots.

⚠️ **Rate Limiting**: Running too many bots simultaneously might hit RPC rate limits. Consider using different RPC endpoints.

⚠️ **Monitoring**: Always monitor your bots to ensure they're working as expected.

## Example Multi-Bot Setup

For a complete trading strategy, you might run:

- **Bot 1**: Small frequent trades for volume
- **Bot 2**: Larger trades for price impact
- **Bot 3**: Conservative trades for sustainability

This creates a diversified trading pattern that looks more natural.
