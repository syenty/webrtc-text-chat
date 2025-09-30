# WebRTC 기반 실시간 텍스트 채팅

WebRTC(Web Real-Time Communication) 기술을 활용하여 구현한 P2P(Peer-to-Peer) 텍스트 채팅 애플리케이션입니다. 중앙 서버를 거치지 않고 브라우저 간에 직접 데이터를 주고받아 빠르고 지연 없는 실시간 통신을 경험할 수 있습니다.

## ✨ 주요 기능

- **실시간 P2P 채팅**: WebRTC 데이터 채널을 통해 사용자 간에 직접 텍스트 메시지를 교환합니다.
- **간단한 UI**: 직관적인 사용자 인터페이스를 통해 누구나 쉽게 채팅을 시작할 수 있습니다.
- **시그널링 서버**: Node.js와 WebSocket을 사용하여 WebRTC 연결 설정을 위한 최소한의 시그널링 과정을 처리합니다.

## 🛠️ 기술 스택

- **Frontend (Client)**: Vue.js
- **Backend (Server)**: Node.js, Express, WebSocket (`ws` 라이브러리)
- **Core**: WebRTC

## 📂 프로젝트 구조

```
webrtc-text-chat/
├── client/      # Vue.js 기반 프론트엔드 애플리케이션
└── server/      # Node.js 기반 시그널링 서버
```

- **client**: 사용자가 채팅 메시지를 입력하고 보는 화면을 담당합니다.
- **server**: WebRTC 연결을 설정하는 데 필요한 정보(SDP, ICE Candidate 등)를 교환하는 시그널링 서버 역할을 합니다.

## 🚀 시작하기

### 1. 사전 준비

- Node.js (v16 이상 권장)
- npm 또는 yarn

### 2. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트를 클론합니다.
git clone https://github.com/syenty/webrtc-text-chat.git
cd webrtc-text-chat

# 서버 의존성을 설치합니다.
cd server
npm install

# 클라이언트 의존성을 설치합니다.
cd ../client
npm install
```

### 3. 애플리케이션 실행

두 개의 터미널 창을 열고 각각 다음 명령어를 실행하세요.

```bash
# 터미널 1: 서버 실행
cd server
npm start
```

```bash
# 터미널 2: 클라이언트 실행
cd client
npm run serve
```

### 4. 채팅 테스트

1.  클라이언트가 실행되면 터미널에 표시된 주소(예: `http://localhost:5173`)를 웹 브라우저에서 엽니다.
2.  **같은 주소**를 다른 브라우저 탭이나 창에서 하나 더 엽니다.
3.  이제 두 브라우저 창은 P2P로 연결되었으며, 한쪽에서 메시지를 입력하면 다른 쪽에 실시간으로 표시됩니다.
