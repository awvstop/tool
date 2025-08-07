const WebSocket = require('ws');
const net = require('net');

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

class Socks5WebSocketProxy {
  constructor() {
    this.connections = new Map();
  }

  handleWebSocket(ws, req) {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);
    
    const connectionId = Date.now() + Math.random();
    this.connections.set(connectionId, { ws, socket: null });
    
    ws.on('message', (data) => {
      this.handleSocks5Message(connectionId, data);
    });
    
    ws.on('close', () => {
      console.log('WebSocket closed:', connectionId);
      this.cleanupConnection(connectionId);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.cleanupConnection(connectionId);
    });
  }

  async handleSocks5Message(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { ws } = connection;
    const buffer = Buffer.from(data);
    let offset = 0;

    try {
      // 处理 SOCKS5 握手
      if (buffer[0] === SOCKS_VERSION && !connection.handshakeComplete) {
        const version = buffer[offset++];
        const methodCount = buffer[offset++];
        const methods = [];
        
        for (let i = 0; i < methodCount; i++) {
          methods.push(buffer[offset++]);
        }

        // 选择无认证方法
        const selectedMethod = AUTH_METHODS.NO_AUTH;
        
        // 发送认证响应
        const authResponse = Buffer.from([SOCKS_VERSION, selectedMethod]);
        ws.send(authResponse);
        
        connection.handshakeComplete = true;
        return;
      }

      // 处理 SOCKS5 请求
      if (connection.handshakeComplete && !connection.requestProcessed) {
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
          await this.handleConnect(connectionId, targetHost, targetPort);
        } else {
          this.sendReply(ws, REPLY_CODES.COMMAND_NOT_SUPPORTED);
        }
        
        connection.requestProcessed = true;
      }

      // 处理数据转发
      if (connection.socket && connection.requestProcessed) {
        connection.socket.write(buffer);
      }

    } catch (error) {
      console.error('Error handling SOCKS5 message:', error);
      this.sendReply(ws, REPLY_CODES.GENERAL_FAILURE);
    }
  }

  async handleConnect(connectionId, targetHost, targetPort) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { ws } = connection;

    try {
      const socket = new net.Socket();
      connection.socket = socket;

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

      // 从目标服务器接收数据，转发给客户端
      socket.on('data', (data) => {
        ws.send(data);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.sendReply(ws, REPLY_CODES.CONNECTION_REFUSED);
      });

      socket.on('close', () => {
        console.log('Socket closed for connection:', connectionId);
        this.cleanupConnection(connectionId);
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

  cleanupConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      if (connection.socket) {
        connection.socket.destroy();
      }
      if (connection.ws) {
        connection.ws.close();
      }
      this.connections.delete(connectionId);
    }
  }
}

// 创建代理实例
const proxy = new Socks5WebSocketProxy();

// 导出供 Vercel 使用
module.exports = (req, res) => {
  // 检查是否是 WebSocket 升级请求
  if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
    // 这里需要 Vercel 支持 WebSocket
    res.status(426).json({ 
      error: 'WebSocket upgrade not supported in this environment',
      message: 'This endpoint requires WebSocket support'
    });
  } else {
    res.status(200).json({ 
      message: 'SOCKS5 WebSocket proxy server',
      note: 'This endpoint requires WebSocket client connection'
    });
  }
};
