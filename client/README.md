# WebRTC 텍스트 채팅 - 클라이언트

Vue.js를 기반으로 구축된 WebRTC 텍스트 채팅 애플리케이션의 클라이언트 파트입니다. 사용자가 메시지를 주고받는 UI를 제공하고, WebRTC 연결의 복잡한 과정을 `simple-peer` 라이브러리를 통해 관리합니다.

## ✨ 주요 기능

- **직관적인 채팅 UI**: Vue.js로 구현된 반응형 사용자 인터페이스
- **WebRTC 연결 관리**: `simple-peer`를 활용하여 WebRTC 연결 설정 및 데이터 채널 관리 간소화
- **실시간 시그널링**: `socket.io-client`를 사용하여 시그널링 서버와 통신하며 P2P 연결을 위한 메타데이터 교환

## 🛠️ 기술 스택

- **Framework**: Vue.js
- **WebRTC Library**: simple-peer
- **Signaling Client**: socket.io-client
- **Build Tool**: Vite

## ⚙️ 동작 방식

클라이언트는 시그널링 서버와 통신하여 다른 피어(peer)와 P2P 연결을 설정합니다.

1.  **서버 접속**: 애플리케이션 시작 시 WebSocket을 통해 시그널링 서버에 접속합니다.
2.  **피어 생성**: `simple-peer`를 사용하여 새로운 WebRTC 피어 인스턴스를 생성합니다.
3.  **시그널링**: 생성된 피어는 연결에 필요한 정보(Offer, Answer, ICE Candidate 등)를 `signal` 이벤트로 발생시킵니다. 이 정보는 WebSocket을 통해 시그널링 서버로 전송되고, 서버는 이를 다른 피어에게 중계합니다.
4.  **P2P 연결**: 상대방 피어로부터 시그널링 데이터를 수신하면 `peer.signal()` 메서드를 호출하여 연결 설정을 완료합니다.
5.  **데이터 교환**: P2P 연결이 성공적으로 수립되면(`connect` 이벤트 발생), `peer.send()`와 `data` 이벤트를 통해 중앙 서버를 거치지 않고 피어 간에 직접 메시지를 주고받습니다.

## 🚀 시작하기

### 1. 사전 준비

- Node.js (v16 이상 권장)
- npm 또는 yarn

### 2. 의존성 설치

프로젝트 루트의 `client` 디렉터리로 이동하여 필요한 패키지를 설치합니다.

```bash
cd client
npm install
```

### 3. 개발 서버 실행

다음 명령어를 실행하여 Vite 개발 서버를 시작합니다.

```bash
# client/package.json의 "dev" 스크립트 실행
npm run dev
```

서버가 실행되면 터미널에 표시된 주소(예: `http://localhost:5173`)로 접속할 수 있습니다.

> **참고**: 채팅 기능을 테스트하려면 **시그널링 서버**가 먼저 실행되어 있어야 합니다. 프로젝트 루트의 `server` 디렉터리에서 `npm start`를 실행하세요.

## 📂 주요 파일 구조

```
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   └── App.vue       # 메인 애플리케이션 컴포넌트 (UI 및 WebRTC 로직)
│   └── main.js       # Vue 앱 진입점
├── index.html
├── package.json      # 프로젝트 의존성 및 스크립트
└── vite.config.js    # Vite 설정 파일
```
