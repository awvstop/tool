const WebSocket = require('ws');

// SOCKS5 常量
const SOCKS_VERSION = 0x05;
const AUTH_METHODS = {
  NO_AUTH: 0x00,
  USERNAME_PASSWORD: 0x02,
  NO_ACCEPTABLE: 0xFF
};

const COMMANDS = {
  CONNECT: 0x01,
  BIND: 0x02,
  UDP_ASSOCIATE: 0x03
};

const ADDRESS_TYPES = {
  IPV4: 0x01,
  DOMAIN: 0x03,
  IPV6: 0x04
};

const REPLY_CODES = {
  SUCCESS: 0x00,
  GENERAL_FAILURE: 0x01,
  CONNECTION_NOT_ALLOWED: 0x02,
  NETWORK_UNREACHABLE: 0x03,
  HOST_UNREACHABLE: 0x04,
  CONNECTION_REFUSED: 0x05,
  TTL_EXPIRED: 0x06,
  COMMAND_NOT_SUPPORTED: 0x07,
  ADDRESS_TYPE_NOT_SUPPORTED: 0x08
};

class Socks5Proxy {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  start(port = process.env.PORT || 3000) {
    this.wss = new WebSocket.Server({ 
      port: port,
      path: '/api/socks5'
    });

    console.log(`SOCKS5 proxy server starting on port ${port}`);

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection from:', req.socket.remoteAddress);
      
      const clientId = Date.now() + Math.random();
      this.clients.set(clientId, ws);
      
      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });
      
      ws.on('close', () => {
        console.log('Client disconnected:', clientId);
        this.clients.delete(clientId);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  async handleMessage(clientId, data) {
    try {
      const ws = this.clients.get(clientId);
      if (!ws) return;

      const buffer = Buffer.from(data);
      let offset = 0;

      // 解析SOCKS5握手
      if (buffer[0] === SOCKS_VERSION) {
        const version = buffer[offset++];
        const methodCount = buffer[offset++];
        const methods = [];
        
        for (let i = 0; i < methodCount; i++) {
          methods.push(buffer[offset++]);
        }

        // 选择认证方法（这里选择无认证）
        const selectedMethod = AUTH_METHODS.NO_AUTH;
        
        // 发送认证响应
        const authResponse = Buffer.from([SOCKS_VERSION, selectedMethod]);
        ws.send(authResponse);

        // 等待请求
        return;
      }

      // 解析SOCKS5请求
      const version = buffer[offset++];
      const command = buffer[offset++];
      const reserved = buffer[offset++];
      const addressType = buffer[offset++];

      let targetHost, targetPort;

      switch (addressType) {
        case ADDRESS_TYPES.IPV4:
          targetHost = [
            buffer[offset++],
            buffer[offset++],
            buffer[offset++],
            buffer[offset++]
          ].join('.');
          break;
        case ADDRESS_TYPES.DOMAIN:
          const domainLength = buffer[offset++];
          targetHost = buffer.slice(offset, offset + domainLength).toString();
          offset += domainLength;
          break;
        case ADDRESS_TYPES.IPV6:
          targetHost = '::1'; // 简化的IPv6处理
          offset += 16;
          break;
        default:
          this.sendReply(ws, REPLY_CODES.ADDRESS_TYPE_NOT_SUPPORTED);
          return;
      }

      targetPort = buffer.readUInt16BE(offset);

      console.log(`SOCKS5 request: ${command} ${targetHost}:${targetPort}`);

      if (command === COMMANDS.CONNECT) {
        await this.handleConnect(ws, targetHost, targetPort);
      } else {
        this.sendReply(ws, REPLY_CODES.COMMAND_NOT_SUPPORTED);
      }

    } catch (error) {
      console.error('Error handling SOCKS5 message:', error);
      const ws = this.clients.get(clientId);
      if (ws) {
        this.sendReply(ws, REPLY_CODES.GENERAL_FAILURE);
      }
    }
  }

  async handleConnect(ws, targetHost, targetPort) {
    try {
      const net = require('net');
      
      const socket = new net.Socket();
      
      socket.connect(targetPort, targetHost, () => {
        console.log(`Connected to ${targetHost}:${targetPort}`);
        
        // 发送成功响应
        const bindAddress = socket.address();
        const response = Buffer.alloc(10);
        response[0] = SOCKS_VERSION;
        response[1] = REPLY_CODES.SUCCESS;
        response[2] = 0x00; // Reserved
        response[3] = ADDRESS_TYPES.IPV4;
        
        // 写入绑定地址
        const parts = bindAddress.address.split('.');
        response[4] = parseInt(parts[0]);
        response[5] = parseInt(parts[1]);
        response[6] = parseInt(parts[2]);
        response[7] = parseInt(parts[3]);
        
        // 写入端口
        response.writeUInt16BE(bindAddress.port, 8);
        
        ws.send(response);
      });

      socket.on('data', (data) => {
        ws.send(data);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.sendReply(ws, REPLY_CODES.CONNECTION_REFUSED);
      });

      socket.on('close', () => {
        console.log('Socket closed');
      });

      // 处理来自WebSocket的数据
      ws.on('message', (data) => {
        if (socket.writable) {
          socket.write(data);
        }
      });

    } catch (error) {
      console.error('Error in handleConnect:', error);
      this.sendReply(ws, REPLY_CODES.GENERAL_FAILURE);
    }
  }

  sendReply(ws, replyCode) {
    const response = Buffer.from([
      SOCKS_VERSION,
      replyCode,
      0x00, // Reserved
      ADDRESS_TYPES.IPV4,
      0x00, 0x00, 0x00, 0x00, // IP address (0.0.0.0)
      0x00, 0x00  // Port (0)
    ]);
    ws.send(response);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const proxy = new Socks5Proxy();
  proxy.start();
}

// 导出供Vercel使用
module.exports = (req, res) => {
  // 这是一个WebSocket端点，Vercel会自动处理WebSocket升级
  res.status(200).json({ message: 'SOCKS5 proxy server is running' });
};
