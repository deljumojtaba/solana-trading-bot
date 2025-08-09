#!/bin/bash

# Multi-Bot Management Script

case "$1" in
  start)
    echo "🚀 Starting all 3 trading bots..."
    npm run bot1 > bot1.log 2>&1 &
    echo "✅ Bot 1 (Balanced) started - PID: $!"
    
    npm run bot2 > bot2.log 2>&1 &
    echo "✅ Bot 2 (Aggressive) started - PID: $!"
    
    npm run bot3 > bot3.log 2>&1 &
    echo "✅ Bot 3 (Conservative) started - PID: $!"
    
    echo "📊 All bots are now running!"
    ;;
    
  stop)
    echo "🛑 Stopping all trading bots..."
    pkill -f "node src/index.js"
    echo "✅ All bots stopped"
    ;;
    
  status)
    echo "📊 Bot Status:"
    echo "=============="
    PROCESSES=$(ps aux | grep "node src/index.js" | grep -v grep | wc -l)
    echo "Running bots: $PROCESSES"
    
    if [ $PROCESSES -gt 0 ]; then
      ps aux | grep "node src/index.js" | grep -v grep | while read line; do
        echo "🤖 $line"
      done
    else
      echo "❌ No bots currently running"
    fi
    ;;
    
  logs)
    echo "📝 Recent Bot Activity:"
    echo "======================"
    
    if [ -f bot1.log ]; then
      echo "--- Bot 1 (Balanced) ---"
      tail -n 3 bot1.log
      echo ""
    fi
    
    if [ -f bot2.log ]; then
      echo "--- Bot 2 (Aggressive) ---"
      tail -n 3 bot2.log
      echo ""
    fi
    
    if [ -f bot3.log ]; then
      echo "--- Bot 3 (Conservative) ---"
      tail -n 3 bot3.log
      echo ""
    fi
    ;;
    
  watch)
    echo "👁️  Watching all bot logs (Press Ctrl+C to stop)..."
    tail -f bot1.log bot2.log bot3.log
    ;;
    
  *)
    echo "🤖 Multi-Bot Manager"
    echo "Usage: $0 {start|stop|status|logs|watch}"
    echo ""
    echo "Commands:"
    echo "  start  - Start all 3 bots"
    echo "  stop   - Stop all bots"  
    echo "  status - Show running bots"
    echo "  logs   - Show recent activity"
    echo "  watch  - Watch live logs"
    ;;
esac
